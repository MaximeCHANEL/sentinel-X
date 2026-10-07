import time
from typing import Literal, Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from ..database import get_db
from ..schemas import ReadingCreate
from .readings import save_and_broadcast

router = APIRouter(prefix="/api", tags=["ESP32"])

state = {"buzzer": "off", "freq": 2000, "melody": None, "melody_id": 0}
sensors: dict = {}
esp_clients: set[WebSocket] = set()

DB_MIN_INTERVAL = 1.0                     # seconds between two DB writes per sensor
_last_saved: dict[str, float] = {}


class BuzzerCommand(BaseModel):
    state: Literal["on", "off"]
    freq: Optional[int] = None


class Step(BaseModel):
    f: int
    d: int


class Melody(BaseModel):
    steps: list[Step]
    repeat: int = 1


async def push_state():
    """Send the current state to every connected ESP32."""
    for ws in list(esp_clients):
        try:
            await ws.send_json(state)
        except Exception:
            esp_clients.discard(ws)


@router.post("/buzzer")
async def set_buzzer(cmd: BuzzerCommand):
    state["buzzer"] = cmd.state
    if cmd.freq:
        state["freq"] = cmd.freq
    if cmd.state == "off":
        state["melody"] = None
    await push_state()
    return state


@router.post("/melody")
async def set_melody(m: Melody):
    state["melody"] = m.model_dump()
    state["melody_id"] += 1
    state["buzzer"] = "off"
    await push_state()
    return state


@router.get("/esp32/commands")      # kept as a fallback
def get_commands():
    return state


@router.get("/sensors")
def get_sensors():
    return sensors


def to_readings(msg: dict) -> list[ReadingCreate]:
    """Convert an ESP32 message into ReadingCreate items.

    {"dist": 12.3} | {"dht": {"temp": 22.5, "hum": 40}} | {"ir": {"obstacle": true}}
    """
    out: list[ReadingCreate] = []

    if isinstance(msg.get("dist"), (int, float)):
        out.append(ReadingCreate(name_capteur="distance", value=float(msg["dist"])))

    dht = msg.get("dht")
    if isinstance(dht, dict):
        if isinstance(dht.get("temp"), (int, float)):
            out.append(ReadingCreate(name_capteur="temperature", value=float(dht["temp"])))
        if isinstance(dht.get("hum"), (int, float)):
            out.append(ReadingCreate(name_capteur="humidity", value=float(dht["hum"])))

    ir = msg.get("ir")
    if isinstance(ir, dict) and "obstacle" in ir:
        out.append(ReadingCreate(name_capteur="ir", value=1.0 if ir["obstacle"] else 0.0))

    return out


def throttle(readings: list[ReadingCreate]) -> list[ReadingCreate]:
    """Keep at most one reading per sensor every DB_MIN_INTERVAL seconds."""
    now = time.monotonic()
    kept = []
    for r in readings:
        if now - _last_saved.get(r.name_capteur, 0.0) >= DB_MIN_INTERVAL:
            _last_saved[r.name_capteur] = now
            kept.append(r)
    return kept


@router.websocket("/ws/esp32")
async def esp32_ws(ws: WebSocket):
    await ws.accept()
    esp_clients.add(ws)
    await ws.send_json(state)            # sync on connect
    ip = ws.client.host if ws.client else "unknown"
    try:
        while True:
            data = await ws.receive_json()
            if not isinstance(data, dict):
                continue
            sensors.update(data)

            readings = throttle(to_readings(data))
            if readings:
                db = next(get_db())      # works with a standard get_db() generator
                try:
                    await save_and_broadcast(readings, ip, db)
                finally:
                    db.close()
    except WebSocketDisconnect:
        pass
    finally:
        esp_clients.discard(ws)