import os
from datetime import datetime

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from ..database import get_db
from ..schemas import ReadingCreate
from .readings import save_and_broadcast


router = APIRouter(prefix="/api/camera", tags=["Camera"])
CAMERA_SERVICE_URL = os.getenv("CAMERA_SERVICE_URL", "http://host.docker.internal:9000")


class CameraEvent(BaseModel):
    detected: bool
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    camera_id: str = Field(default="front-door", min_length=1, max_length=50)
    recorded_at: datetime | None = None


@router.get("/stream")
async def stream():
    async def frames():
        try:
            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream(
                    "GET",
                    f"{CAMERA_SERVICE_URL.rstrip('/')}/stream",
                ) as response:
                    response.raise_for_status()
                    async for chunk in response.aiter_bytes():
                        yield chunk
        except (httpx.HTTPError, httpx.InvalidURL) as exc:
            raise RuntimeError("Camera service is unavailable") from exc

    return StreamingResponse(
        frames(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


@router.get("/health")
async def health():
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(
                f"{CAMERA_SERVICE_URL.rstrip('/')}/health"
            )
            response.raise_for_status()
            return response.json()
    except (httpx.HTTPError, httpx.InvalidURL) as exc:
        raise HTTPException(
            status_code=503,
            detail="Camera service is unavailable",
        ) from exc


@router.post("/events", include_in_schema=False)
async def receive_event(event: CameraEvent):
    db = next(get_db())
    try:
        await save_and_broadcast(
            [
                ReadingCreate(
                    name_capteur="camera_intrusion",
                    value=1.0 if event.detected else 0.0,
                    recorded_at=event.recorded_at,
                )
            ],
            f"camera:{event.camera_id}",
            db,
        )
    finally:
        db.close()

    return {"accepted": True}
