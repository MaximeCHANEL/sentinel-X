import asyncio
import os
import time
from threading import Lock

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from ..database import get_db
from ..schemas import ReadingCreate
from .readings import save_and_broadcast


router = APIRouter(prefix="/api/camera", tags=["Camera"])

INTRUSION_SENSOR = "camera_intrusion"
DB_MIN_INTERVAL = 1.0


class Camera:
    def __init__(self):
        self._lock = Lock()
        self._picam2 = None
        self._model = None

    def _initialize(self):
        # These imports are deliberately lazy: the API can still start on a
        # development machine without Raspberry Pi camera libraries installed.
        try:
            import cv2
            from picamera2 import Picamera2
            from ultralytics import YOLO
        except ImportError as exc:
            raise RuntimeError(
                "Camera support requires opencv-python, picamera2 and ultralytics"
            ) from exc

        picam2 = Picamera2()
        picam2.configure(
            picam2.create_preview_configuration(
                main={
                    "format": "RGB888",
                    "size": (
                        int(os.getenv("CAMERA_WIDTH", "1640")),
                        int(os.getenv("CAMERA_HEIGHT", "1232")),
                    ),
                }
            )
        )
        picam2.start()

        self._picam2 = picam2
        self._model = YOLO(
            os.getenv("YOLO_MODEL_PATH", "yolo11n_ncnn_model"),
            task="detect",
        )
        self._cv2 = cv2

    def ensure_initialized(self):
        with self._lock:
            if self._picam2 is None:
                self._initialize()

    def capture(self):
        self.ensure_initialized()
        frame = self._picam2.capture_array()
        result = self._model(
            frame,
            imgsz=int(os.getenv("YOLO_IMAGE_SIZE", "320")),
            classes=[0],
            conf=float(os.getenv("YOLO_CONFIDENCE", "0.4")),
            verbose=False,
        )[0]

        detected = False
        max_confidence = 0.0
        for box in result.boxes:
            detected = True
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            confidence = float(box.conf[0])
            max_confidence = max(max_confidence, confidence)
            self._cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
            self._cv2.putText(
                frame,
                f"intru {confidence:.2f}",
                (x1, max(y1 - 8, 15)),
                self._cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 0, 255),
                2,
            )

        encoded, jpg = self._cv2.imencode(
            ".jpg",
            frame,
            [self._cv2.IMWRITE_JPEG_QUALITY, 70],
        )
        if not encoded:
            raise RuntimeError("Unable to encode camera frame as JPEG")
        return jpg.tobytes(), detected, max_confidence


camera = Camera()


async def _save_intrusion(detected: bool):
    db = next(get_db())
    try:
        await save_and_broadcast(
            [
                ReadingCreate(
                    name_capteur=INTRUSION_SENSOR,
                    value=1.0 if detected else 0.0,
                )
            ],
            "camera",
            db,
        )
    finally:
        db.close()


@router.get("/stream")
async def stream():
    try:
        camera.ensure_initialized()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    async def frames():
        last_saved = 0.0
        while True:
            jpg, detected, _ = await asyncio.to_thread(camera.capture)
            now = time.monotonic()
            if now - last_saved >= DB_MIN_INTERVAL:
                await _save_intrusion(detected)
                last_saved = now
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n"
                + jpg
                + b"\r\n"
            )

    return StreamingResponse(
        frames(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )