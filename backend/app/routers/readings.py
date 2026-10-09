from fastapi import (
    APIRouter,
    Depends,
    Query,
    Request,
    WebSocket,
    WebSocketDisconnect
)

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import CapteurData
from ..schemas import ReadingCreate, ReadingResponse


from datetime import datetime

router = APIRouter(
    prefix="/api/data",
    tags=["Data"]
)


connected_clients = []


async def save_and_broadcast(readings: list[ReadingCreate], ip: str, db: Session):
    now = datetime.utcnow()

    db.add_all([
        CapteurData(
            name_capteur=r.name_capteur,
            value=r.value,
            recorded_at=r.recorded_at or now,
        )
        for r in readings
    ])
    db.commit()

    for r in readings:
        data = {
            "name_capteur": r.name_capteur,
            "value": r.value,
            "recorded_at": (r.recorded_at or now).isoformat(),
            "ip_esp32": ip,
        }
        for websocket in list(connected_clients):
            try:
                await websocket.send_json(data)
            except Exception:
                if websocket in connected_clients:
                    connected_clients.remove(websocket)

@router.post("")
async def create_readings(
    readings: list[ReadingCreate],
    request: Request,
    db: Session = Depends(get_db)
):
    await save_and_broadcast(readings, request.client.host, db)
    return {"inserted": len(readings)}


@router.get(
    "/latest",
    response_model=list[ReadingResponse]
)
def latest_readings(
    db: Session = Depends(get_db)
):
    latest_ids = (
        select(
            func.max(CapteurData.id)
        )
        .group_by(
            CapteurData.name_capteur
        )
    )

    return (
        db.query(CapteurData)
        .filter(
            CapteurData.id.in_(latest_ids)
        )
        .all()
    )


@router.get(
    "",
    response_model=list[ReadingResponse]
)
def history(
    name_capteur: str,
    limit: int = Query(
        default=100,
        ge=1,
        le=1000
    ),
    db: Session = Depends(get_db)
):
    return (
        db.query(CapteurData)
        .filter(
            CapteurData.name_capteur == name_capteur
        )
        .order_by(
            CapteurData.id.desc()
        )
        .limit(limit)
        .all()
    )


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket
):
    await websocket.accept()

    connected_clients.append(websocket)

    try:
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        if websocket in connected_clients:
            connected_clients.remove(websocket)