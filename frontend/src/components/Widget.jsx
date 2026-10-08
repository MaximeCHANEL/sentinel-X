import { useEffect, useState } from 'react';
// import { createSpikeDetector } from '../utils/spikeDetector';

const API_URL = 'http://localhost:8000/api';

const ALERT_DURATION_MS = 8000;
const TEMPERATURE_MAX = 100;

async function buzzer(state) {
    const response = await fetch(`${API_URL}/buzzer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state })
    });

    if (!response.ok) {
        alert('Buzzer injoignable.');
    }
}

const WIDGET_CATALOG = {
    distance:    { title: 'Distance',               icon: '📡' },
    temperature: { title: 'Température / Humidité', icon: '🌡️' },
    ir:          { title: 'Obstacle IR',            icon: '🚨' },
    camera:      { title: 'Caméra',                 icon: '📷' },
    buzzer:      { title: 'Buzzer',                 icon: '🔊' }
};


function Widget({ widget, onDelete }) {

    const [wsStatus, setWsStatus] = useState('déconnecté');

    // const [temperatureAlert, setTemperatureAlert] = useState(null);
    // const [humidityAlert, setHumidityAlert] = useState(null);

    // const [temperatureDetector] = useState(() => createSpikeDetector({ minDelta: 1 }));
    // const [humidityDetector] = useState(() => createSpikeDetector({ minDelta: 5 }));

    const [esp32Data, setEsp32Data] = useState({});


    const config = WIDGET_CATALOG[widget.widget];

    const distances = Object.entries(esp32Data)
        .filter(([, sensors]) => sensors.distance !== undefined);

    const temperatures = Object.entries(esp32Data)
        .filter(([, sensors]) => sensors.temperature !== undefined);

    const irSensors = Object.entries(esp32Data)
        .filter(([, sensors]) => sensors.ir !== undefined);

    const cameraSensors = Object.entries(esp32Data)
        .filter(([, sensors]) => sensors.camera_intrusion !== undefined);

    const cameraStreamUrl =
        `${API_URL}/camera/stream`;


    useEffect(() => {

        let ws;
        let reconnectTimeout;
        let temperatureTimer;
        let humidityTimer;

        function connecter() {

            ws = new WebSocket(
                `ws://${window.location.hostname}:8000/api/data/ws`
            );

            ws.onopen = () => {
                setWsStatus('connecté');
            };

            ws.onmessage = (event) => {
                let data;

                try {
                    data = JSON.parse(event.data);
                } catch {
                    return;
                }

                if (!data.ip_esp32 || !data.name_capteur) {
                    return;
                }

                setEsp32Data((previous) => ({
                    ...previous,

                    [data.ip_esp32]: {
                        ...previous[data.ip_esp32],
                        [data.name_capteur]: data.value
                    }
                }));
            };

            ws.onclose = () => {
                setWsStatus('déconnecté, nouvelle tentative...');
                reconnectTimeout = setTimeout(connecter, 2000);
            };

            ws.onerror = () => {
                ws.close();
            };
        }

        connecter();

        return () => {
            clearTimeout(reconnectTimeout);
            clearTimeout(temperatureTimer);
            clearTimeout(humidityTimer);
            if (ws) {
                ws.close();
            }
        };

    }, []);


    if (!config) {
        return null;
    }


    return (

        <div className="widget-content">

            <button
                className="delete-button"
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                    event.stopPropagation();
                    onDelete(widget.id);
                }}
            >
                ✕
            </button>

            <h2>
                {config.icon} {config.title}
            </h2>


            {widget.widget === 'distance' && (
                <>
                    {distances.map(([ip, sensors]) => (
                        <div key={ip}>
                            <p>
                                ESP32 : {ip}
                            </p>

                            <p>
                                Distance : {sensors.distance ?? 'hors portée'} cm
                            </p>
                        </div>
                    ))}

                    {distances.length === 0 && (
                        <p>En attente des données...</p>
                    )}

                    <p>
                        Connexion : <b>{wsStatus}</b>
                    </p>
                </>
            )}


            {widget.widget === 'temperature' && (
                <>
                    {temperatures.map(([ip, sensors]) => {
                        const temperature = sensors.temperature;

                        const surchauffe =
                            temperature !== null &&
                            temperature > TEMPERATURE_MAX;

                        return (
                            <div key={ip}>
                                <p>
                                    ESP32 : {ip}
                                </p>

                                <p>
                                    Température : {temperature ?? '--'} °C
                                </p>

                                {sensors.humidity !== undefined && (
                                    <p>
                                        Humidité : {sensors.humidity} %
                                    </p>
                                )}

                                {surchauffe && (
                                    <p className="alert alert-critical">
                                        🔥 Température critique : {temperature} °C
                                        (seuil : {TEMPERATURE_MAX} °C)
                                    </p>
                                )}
                            </div>
                        );
                    })}

                    {temperatures.length === 0 && (
                        <p>En attente des données...</p>
                    )}

                    <p>
                        Connexion : <b>{wsStatus}</b>
                    </p>
                </>
            )}


            {widget.widget === 'ir' && (
                <>
                    {irSensors.map(([ip, sensors]) => (
                        <div key={ip}>
                            <p>
                                ESP32 : {ip}
                            </p>

                            <p>
                                {sensors.ir
                                    ? '🚧 Obstacle'
                                    : '✅ Libre'
                                }
                            </p>
                        </div>
                    ))}

                    {irSensors.length === 0 && (
                        <p>En attente des données...</p>
                    )}

                    <p>
                        Connexion : <b>{wsStatus}</b>
                    </p>
                </>
            )}


            {widget.widget === 'buzzer' && (
                <>
                    <button
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            buzzer('on');
                        }}
                    >
                        🔊 Activer
                    </button>

                    <button
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            buzzer('off');
                        }}
                    >
                        🔇 Désactiver
                    </button>
                </>
            )}


            {widget.widget === 'camera' && (
                <>
                    <img
                        className="camera-stream"
                        src={cameraStreamUrl}
                        alt="Flux vidéo de la caméra"
                    />

                    {cameraSensors.map(([source, sensors]) => (
                        <p
                            key={source}
                            className={
                                sensors.camera_intrusion
                                    ? 'alert alert-critical'
                                    : 'alert'
                            }
                        >
                            {sensors.camera_intrusion
                                ? '🚨 Intrus détecté'
                                : '✅ Aucun intrus détecté'}
                        </p>
                    ))}

                    {cameraSensors.length === 0 && (
                        <p>En attente de la détection caméra...</p>
                    )}

                    <p>
                        Connexion : <b>{wsStatus}</b>
                    </p>
                </>
            )}

        </div>
    );
}


export default Widget;