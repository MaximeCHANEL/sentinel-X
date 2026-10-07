# Sentinel Dashboard

Dashboard avec frontend HTML/CSS/JavaScript, backend Python FastAPI, SQLAlchemy, MySQL 8 et Docker Compose.

## Lancer

```powershell
docker compose up -d --build
```

API : http://localhost:8000
Swagger : http://localhost:8000/docs

## Arrêter

```powershell
docker compose down
```

## Réinitialiser complètement la base

Attention : supprime le volume MySQL.

```powershell
docker compose down -v
docker compose up -d --build
```

## API

- GET /api/widgets
- POST /api/widgets
- PUT /api/widgets/{widget_id}
- DELETE /api/widgets/{widget_id}
