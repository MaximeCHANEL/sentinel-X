from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import widgets, readings, esp32, camera


app = FastAPI(
    title="Sentinel Dashboard API",
    description="API de gestion du dashboard Sentinel",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|[\w.-]+):5173$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(widgets.router)
app.include_router(readings.router)
app.include_router(esp32.router)
app.include_router(camera.router)
