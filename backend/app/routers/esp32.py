from typing import Literal
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["ESP32"])

state = {"buzzer": "off"}

class BuzzerCommand(BaseModel):
    state: Literal["on", "off"]

@router.post("/buzzer")
def set_buzzer(cmd: BuzzerCommand):
    state["buzzer"] = cmd.state
    return state

@router.get("/esp32/commands")
def get_commands():
    return state