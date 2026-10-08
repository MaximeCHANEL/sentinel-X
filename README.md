# Sentinel-X Dashboard

Dashboard de supervision IoT développé avec **React**, **FastAPI**, **SQLAlchemy**, **MySQL 8** et **Docker Compose**.

Le projet permet de gérer un dashboard personnalisable avec des widgets et de recevoir en temps réel les données provenant de plusieurs ESP32.

## Architecture

```text
ESP32 #1 ──┐
           │
ESP32 #2 ──┼──> FastAPI ──> MySQL
           │       │
           │       └──> WebSocket
           │
           └──────────────> React Dashboard
```

### Technologies

* **Frontend** : React
* **Backend** : Python / FastAPI
* **Base de données** : MySQL 8
* **ORM** : SQLAlchemy
* **Conteneurisation** : Docker / Docker Compose
* **Communication temps réel** : WebSocket
* **Capteurs** : ESP32

## Lancer le projet

Depuis la racine du projet :

```powershell
docker compose up -d --build
```

Vérifier que les conteneurs sont démarrés :

```powershell
docker compose ps
```

### Accès

API :

http://localhost:8000

Documentation Swagger :

http://localhost:8000/docs

OpenAPI :

http://localhost:8000/openapi.json

## Arrêter le projet

```powershell
docker compose down
```

## Réinitialiser complètement la base de données

⚠️ Cette commande supprime le volume MySQL et donc les données présentes dans la base.

```powershell
docker compose down -v
docker compose up -d --build
```

# API

L'API est organisée en trois parties principales :

* **Widgets** : gestion des widgets du dashboard
* **Data** : réception et consultation des données des capteurs
* **ESP32** : communication avec les ESP32 et gestion du buzzer

## Widgets

### Récupérer les widgets

```http
GET /api/widgets
```

Récupère les widgets actuellement enregistrés dans le dashboard.

### Créer un widget

```http
POST /api/widgets
```

Permet d'ajouter un widget au dashboard.

### Modifier un widget

```http
PUT /api/widgets/{widget_id}
```

Permet de modifier un widget existant.

### Supprimer un widget

```http
DELETE /api/widgets/{widget_id}
```

Permet de supprimer un widget.

## Données des capteurs

### Envoyer des données

```http
POST /api/data
```

Les ESP32 utilisent cet endpoint pour envoyer leurs mesures au backend.

Les données reçues sont enregistrées dans MySQL puis transmises aux clients connectés au WebSocket.

Chaque ESP32 est identifié automatiquement par son adresse IP lors de la réception des données.

### Consulter l'historique

```http
GET /api/data?name_capteur={name_capteur}&limit={limit}
```

Exemple :

```http
GET /api/data?name_capteur=temperature&limit=100
```

Permet de récupérer les dernières mesures d'un capteur donné.

### Récupérer les dernières mesures

```http
GET /api/data/latest
```

Retourne la dernière mesure enregistrée pour chaque type de capteur.

### WebSocket temps réel

```text
WS /api/data/ws
```

Le dashboard React utilise ce WebSocket pour recevoir les nouvelles mesures en temps réel.

Les données transmises contiennent notamment :

```json
{
  "name_capteur": "temperature",
  "value": 24.5,
  "ip_esp32": "192.168.1.101"
}
```

L'adresse IP permet au frontend de différencier les données provenant de plusieurs ESP32.

## ESP32

### Contrôler le buzzer

```http
POST /api/buzzer
```

Permet d'activer ou de désactiver le buzzer d'un ESP32.

Exemple :

```json
{
  "state": "on"
}
```

Pour désactiver le buzzer :

```json
{
  "state": "off"
}
```

### Récupérer les commandes ESP32

```http
GET /api/esp32/commands
```

Permet de récupérer les commandes destinées aux ESP32.

# Widgets disponibles

Le dashboard contient actuellement les widgets suivants :

| Widget                     | Fonction                                                  |
| -------------------------- | --------------------------------------------------------- |
| 📡 Distance                | Affichage des mesures du capteur ultrason                 |
| 🌡️ Température / Humidité | Affichage de la température et de l'humidité              |
| 🚨 Obstacle IR             | Détection d'un obstacle avec le capteur infrarouge        |
| 🔊 Buzzer                  | Activation et désactivation du buzzer                     |
| 📷 Caméra                  | Flux vidéo et détection des intrusions humaines           |

Les widgets peuvent être ajoutés, supprimés et organisés depuis le dashboard.

## Caméra

Le flux MJPEG est disponible sur `GET /api/camera/stream`. La caméra Raspberry Pi
et le modèle YOLO sont initialisés à la première connexion. Chaque image produit
une mesure `camera_intrusion` dans `capteur_data` (`1` si une personne est
détectée, sinon `0`) et la mesure est également diffusée sur `WS /api/data/ws`.

Les dépendances matérielles `picamera2` doivent être installées par le système
Raspberry Pi. Le modèle peut être configuré avec `YOLO_MODEL_PATH`; les
paramètres `CAMERA_WIDTH`, `CAMERA_HEIGHT`, `YOLO_IMAGE_SIZE` et
`YOLO_CONFIDENCE` sont également disponibles.

La caméra et YOLO sont exécutés dans le service séparé `camera-service`, sur le
Raspberry Pi qui possède le matériel. Le backend Docker ne dépend donc pas de
`picamera2`, PyTorch ou Ultralytics. Installer les dépendances du service
caméra dans le venv du Raspberry Pi :

```bash
sudo apt install -y python3-picamera2
python3 -m venv --system-site-packages .venv
source .venv/bin/activate
python -m pip install -r camera-service/requirements.txt
cd camera-service
uvicorn app:app --host 0.0.0.0 --port 9000
```

Le fichier de dépendances utilise les wheels CPU de PyTorch via
`https://download.pytorch.org/whl/cpu`, ce qui évite l'installation des paquets
NVIDIA CUDA.

Le service caméra publie :

* `GET /stream` : flux MJPEG traité par YOLO ;
* `GET /health` : état de la caméra ;
* les changements d'état d'intrusion vers `POST /api/camera/events` du backend.

Le backend expose le flux pour le frontend via `GET /api/camera/stream` et
enregistre chaque changement dans `capteur_data` sous `camera_intrusion`.
Depuis Docker, `CAMERA_SERVICE_URL` vaut par défaut
`http://host.docker.internal:9000`. Si le backend est exécuté directement sur
la machine hôte, définir `CAMERA_SERVICE_URL=http://127.0.0.1:9000`.

## Gestion des alertes

Le dashboard utilise différents niveaux d'alerte.

### Alerte normale

Les alertes classiques utilisent la classe CSS :

```css
.alert
```

et sont affichées en orange.

### Alerte critique

Les alertes critiques utilisent :

```css
.alert.alert-critical
```

et sont affichées en rouge foncé.

Une température dépassant le seuil configuré déclenche par exemple une alerte critique.

# Documentation API

La documentation interactive complète est disponible avec Swagger :

http://localhost:8000/docs

Elle permet notamment de tester directement les endpoints :

* Widgets
* Données des capteurs
* ESP32
* Buzzer

# Structure du projet

```text
sentinel-X/
│
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── database.py
│   │   └── main.py
│   │
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── utils/
│   │   └── ...
│   │
│   ├── Dockerfile
│   └── package.json
│
├── database/
│
├── compose.yaml
├── .dockerignore
└── README.md
```

# Développement

Le backend est accessible sur :

```text
http://localhost:8000
```

La documentation Swagger est disponible sur :

```text
http://localhost:8000/docs
```

Pour reconstruire les services après une modification :

```powershell
docker compose up -d --build
```

Pour consulter les logs :

```powershell
docker compose logs -f
```

Pour consulter uniquement les logs du backend :

```powershell
docker compose logs -f backend
```

# Version

```text
0.1.0
```

Projet **Sentinel-X** — Dashboard de supervision IoT.