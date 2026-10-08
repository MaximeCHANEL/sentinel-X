import asyncio
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse


BACKEND_EVENTS_URL = os.getenv(
    "BACKEND_EVENTS_URL",
    "http://127.0.0.1:8000/api/camera/events",
)
CAMERA_ID = os.getenv("CAMERA_ID", "front-door")


class CameraWorker:
    def __init__(self):
        self._picam2 = None
        self._model = None
        self._cv2 = None
        self._frame = None
        self._detected = False
        self._confidence = 0.0
        self._lock = asyncio.Lock()

    def initialize(self):
        try:
            import cv2
            from picamera2 import Picamera2
            from ultralytics import YOLO
        except ImportError as exc:
            raise RuntimeError(
                "Install picamera2, opencv, torch, torchvision and ultralytics"
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

    def capture(self):
        frame = self._picam2.capture_array()
        result = self._model(
            frame,
            imgsz=int(os.getenv("YOLO_IMAGE_SIZE", "320")),
            classes=[0],
            conf=float(os.getenv("YOLO_CONFIDENCE", "0.4")),
            verbose=False,
        )[0]

        detected = False
        confidence = 0.0
        for box in result.boxes:
            detected = True
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            box_confidence = float(box.conf[0])
            confidence = max(confidence, box_confidence)
            self._cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
            self._cv2.putText(
                frame,
                f"intru {box_confidence:.2f}",
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
        return jpg.tobytes(), detected, confidence

    async def run(self):
        await asyncio.to_thread(self.initialize)
        previous_detected = None
        while True:
            jpg, detected, confidence = await asyncio.to_thread(self.capture)
            async with self._lock:
                self._frame = jpg
                self._detected = detected
                self._confidence = confidence

            if detected != previous_detected:
                await self.send_event(detected, confidence)
                previous_detected = detected

    async def send_event(self, detected, confidence):
        payload = {
            "detected": detected,
            "confidence": confidence,
            "camera_id": CAMERA_ID,
            "recorded_at": datetime.now(timezone.utc).isoformat(),
        }
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(BACKEND_EVENTS_URL, json=payload)
                response.raise_for_status()
        except httpx.HTTPError as exc:
            print(f"Unable to send camera event: {exc}", flush=True)

    async def frame(self):
        async with self._lock:
            return self._frame


worker = CameraWorker()


@asynccontextmanager
async def lifespan(_app):
    task = asyncio.create_task(worker.run())
    yield
    task.cancel()
    await asyncio.gather(task, return_exceptions=True)


app = FastAPI(title="Sentinel Camera Service", lifespan=lifespan)


@app.get("/health")
async def health():
    if worker._frame is None:
        return {"status": "starting", "camera_id": CAMERA_ID}
    return {
        "status": "ready",
        "camera_id": CAMERA_ID,
        "intrusion": worker._detected,
    }


@app.get("/stream")
async def stream():
    if worker._frame is None:
        raise HTTPException(status_code=503, detail="Camera is starting")

    async def frames():
        while True:
            frame = await worker.frame()
            if frame:
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n"
                    + frame
                    + b"\r\n"
                )
            await asyncio.sleep(0.05)

    return StreamingResponse(
        frames(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )
