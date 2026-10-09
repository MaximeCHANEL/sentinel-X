from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine, migrate_schema
from .routers import widgets, readings, esp32, auth, camera


app = FastAPI(
    title="Sentinel Dashboard API",
    description="API de gestion du dashboard Sentinel",
)

Base.metadata.create_all(bind=engine)
migrate_schema()

app.include_router(widgets.router)
app.include_router(readings.router)
app.include_router(esp32.router)
app.include_router(auth.router)
app.include_router(camera.router)

# Keep CORS outside FastAPI's exception middleware so error responses include
# the CORS headers required by browser clients.
app = CORSMiddleware(
    app,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
