import { useEffect, useRef, useState } from 'react';
import { createSpikeDetector } from '../utils/spikeDetector'; // NOUVEAU : décommenté

const API_URL =
    `${window.location.protocol}//${window.location.hostname}:8000/api`;

const ALERT_DURATION_MS = 8000;
const TEMPERATURE_MAX = 100;
const MELODY_COOLDOWN_MS = 8000;

const MELODIES = {
    warning: {
        steps: [
            {
                "f": 370,
                "d": 136
            },
            {
                "f": 0,
                "d": 136
            },
            {
                "f": 466,
                "d": 136
            },
            {
                "f": 0,
                "d": 136
            },
            {
                "f": 554,
                "d": 136
            },
            {
                "f": 0,
                "d": 136
            },
            {
                "f": 622,
                "d": 136
            },
            {
                "f": 0,
                "d": 136
            },
            {
                "f": 698,
                "d": 136
            },
            {
                "f": 0,
                "d": 955
            },
            {
                "f": 349,
                "d": 136
            },
            {
                "f": 0,
                "d": 136
            },
            {
                "f": 440,
                "d": 136
            },
            {
                "f": 0,
                "d": 136
            },
            {
                "f": 554,
                "d": 136
            },
            {
                "f": 0,
                "d": 136
            },
            {
                "f": 622,
                "d": 136
            },
            {
                "f": 0,
                "d": 136
            },
            {
                "f": 698,
                "d": 136
            },
            {
                "f": 0,
                "d": 955
            },
            {
                "f": 277,
                "d": 136
            },
            {
                "f": 0,
                "d": 136
            },
            {
                "f": 349,
                "d": 136
            },
            {
                "f": 0,
                "d": 136
            },
            {
                "f": 415,
                "d": 136
            },
            {
                "f": 0,
                "d": 136
            },
            {
                "f": 466,
                "d": 136
            },
            {
                "f": 523,
                "d": 136
            },
            {
                "f": 466,
                "d": 136
            },
            {
                "f": 0,
                "d": 955
            },
            {
                "f": 277,
                "d": 136
            },
            {
                "f": 0,
                "d": 136
            },
            {
                "f": 349,
                "d": 136
            },
            {
                "f": 0,
                "d": 136
            },
            {
                "f": 415,
                "d": 136
            },
            {
                "f": 0,
                "d": 136
            },
            {
                "f": 466,
                "d": 136
            },
            {
                "f": 523,
                "d": 136
            },
            {
                "f": 466,
                "d": 136
            },
            {
                "f": 0,
                "d": 955
            },
            {
                "f": 370,
                "d": 136
            },
            {
                "f": 0,
                "d": 136
            },
            {
                "f": 466,
                "d": 136
            },
            {
                "f": 0,
                "d": 136
            },
            {
                "f": 554,
                "d": 136
            },
            {
                "f": 0,
                "d": 136
            },
            {
                "f": 622,
                "d": 136
            },
            {
                "f": 0,
                "d": 136
            },
            {
                "f": 698,
                "d": 136
            },
            {
                "f": 0,
                "d": 955
            },
            {
                "f": 349,
                "d": 136
            },
            {
                "f": 0,
                "d": 136
            },
            {
                "f": 440,
                "d": 136
            },
            {
                "f": 0,
                "d": 136
            },
            {
                "f": 554,
                "d": 136
            },
            {
                "f": 0,
                "d": 136
            },
            {
                "f": 622,
                "d": 136
            },
            {
                "f": 0,
                "d": 136
            },
            {
                "f": 698,
                "d": 136
            },
            {
                "f": 0,
                "d": 955
            },
            {
                "f": 277,
                "d": 136
            },
            {
                "f": 0,
                "d": 136
            },
            {
                "f": 349,
                "d": 136
            },
            {
                "f": 0,
                "d": 136
            },
            {
                "f": 415,
                "d": 136
            },
            {
                "f": 0,
                "d": 136
            },
            {
                "f": 466,
                "d": 136
            },
            {
                "f": 523,
                "d": 136
            },
            {
                "f": 466,
                "d": 136
            },
            {
                "f": 0,
                "d": 955
            },
            {
                "f": 277,
                "d": 136
            },
            {
                "f": 0,
                "d": 136
            },
            {
                "f": 349,
                "d": 136
            },
            {
                "f": 0,
                "d": 136
            },
            {
                "f": 415,
                "d": 136
            },
            {
                "f": 0,
                "d": 136
            },
            {
                "f": 466,
                "d": 136
            },
            {
                "f": 523,
                "d": 136
            },
            {
                "f": 466,
                "d": 136
            },
            {
                "f": 0,
                "d": 955
            },
            {
                "f": 554,
                "d": 136
            },
            {
                "f": 0,
                "d": 682
            },
            {
                "f": 622,
                "d": 136
            },
            {
                "f": 0,
                "d": 682
            },
            {
                "f": 415,
                "d": 136
            },
            {
                "f": 0,
                "d": 409
            },
            {
                "f": 622,
                "d": 136
            },
            {
                "f": 0,
                "d": 682
            },
            {
                "f": 698,
                "d": 136
            },
            {
                "f": 0,
                "d": 682
            },
            {
                "f": 831,
                "d": 136
            },
            {
                "f": 740,
                "d": 136
            },
            {
                "f": 698,
                "d": 136
            },
            {
                "f": 622,
                "d": 136
            },
            {
                "f": 554,
                "d": 136
            },
            {
                "f": 0,
                "d": 682
            },
            {
                "f": 622,
                "d": 136
            },
            {
                "f": 0,
                "d": 682
            },
            {
                "f": 415,
                "d": 136
            },
            {
                "f": 0,
                "d": 1773
            },
            {
                "f": 415,
                "d": 136
            },
            {
                "f": 415,
                "d": 136
            },
            {
                "f": 466,
                "d": 136
            },
            {
                "f": 554,
                "d": 136
            },
            {
                "f": 466,
                "d": 136
            },
            {
                "f": 554,
                "d": 136
            },
            {
                "f": 554,
                "d": 136
            },
            {
                "f": 0,
                "d": 682
            },
            {
                "f": 622,
                "d": 136
            },
            {
                "f": 0,
                "d": 682
            },
            {
                "f": 415,
                "d": 136
            },
            {
                "f": 0,
                "d": 409
            },
            {
                "f": 622,
                "d": 136
            },
            {
                "f": 0,
                "d": 682
            },
            {
                "f": 698,
                "d": 136
            },
            {
                "f": 0,
                "d": 682
            },
            {
                "f": 831,
                "d": 136
            },
            {
                "f": 740,
                "d": 136
            },
            {
                "f": 698,
                "d": 136
            },
            {
                "f": 622,
                "d": 136
            },
            {
                "f": 554,
                "d": 136
            },
            {
                "f": 0,
                "d": 682
            },
            {
                "f": 622,
                "d": 136
            },
            {
                "f": 0,
                "d": 682
            },
            {
                "f": 415,
                "d": 136
            }
        ],
        repeat: 1
    },
    alert: {
        steps: [
            { "f": 165, "d": 137 }, { "f": 330, "d": 158 }, { "f": 0, "d": 118 }, { "f": 165, "d": 135 }, { "f": 294, "d": 158 }, { "f": 0, "d": 112 }, { "f": 165, "d": 137 }, { "f": 262, "d": 158 }, { "f": 0, "d": 110 }, { "f": 165, "d": 137 }, { "f": 233, "d": 158 }, { "f": 0, "d": 112 }, { "f": 165, "d": 140 }, { "f": 247, "d": 137 }, { "f": 262, "d": 158 }, { "f": 0, "d": 112 }, { "f": 165, "d": 135 }, { "f": 330, "d": 158 }, { "f": 0, "d": 112 }, { "f": 165, "d": 135 }, { "f": 294, "d": 158 }, { "f": 0, "d": 112 }, { "f": 165, "d": 135 }, { "f": 262, "d": 158 }, { "f": 0, "d": 120 }, { "f": 165, "d": 135 }, { "f": 233, "d": 632 }, { "f": 165, "d": 23 }, { "f": 0, "d": 153 }, { "f": 165, "d": 137 }, { "f": 330, "d": 158 }, { "f": 0, "d": 118 }, { "f": 165, "d": 137 }, { "f": 294, "d": 158 }, { "f": 0, "d": 110 }, { "f": 165, "d": 137 }, { "f": 262, "d": 158 }, { "f": 0, "d": 110 }, { "f": 165, "d": 137 }, { "f": 233, "d": 158 }, { "f": 0, "d": 112 }, { "f": 165, "d": 135 }, { "f": 247, "d": 141 }, { "f": 262, "d": 158 }, { "f": 0, "d": 112 }, { "f": 165, "d": 135 }, { "f": 330, "d": 158 }, { "f": 0, "d": 112 }, { "f": 165, "d": 135 }, { "f": 294, "d": 158 }, { "f": 0, "d": 112 }, { "f": 165, "d": 135 }, { "f": 262, "d": 158 }, { "f": 0, "d": 120 }, { "f": 165, "d": 135 }, { "f": 233, "d": 632 }, { "f": 165, "d": 23 }, { "f": 0, "d": 155 }, { "f": 165, "d": 135 }, { "f": 330, "d": 158 }, { "f": 0, "d": 112 }, { "f": 165, "d": 141 }, { "f": 294, "d": 158 }, { "f": 0, "d": 110 }, { "f": 165, "d": 137 }, { "f": 262, "d": 158 }, { "f": 0, "d": 112 }
        ],
        repeat: 1
    }
};

const melodyCooldowns = new Map();

const SPIKE_CONFIG = {
    temperature: { minDelta: 1, label: 'température', unit: '°C' },
    humidity: { minDelta: 5, label: 'humidité', unit: '%' },
    distance: { minDelta: 10, label: 'distance', unit: 'cm' }
};

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

async function playMelody(type, key) {
    const now = Date.now();
    const lastPlayed = melodyCooldowns.get(key) ?? 0;

    if (now - lastPlayed < MELODY_COOLDOWN_MS) {
        return;
    }

    melodyCooldowns.set(key, now);

    try {
        const response = await fetch(`${API_URL}/melody`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(MELODIES[type])
        });

        if (!response.ok) {
            console.error(`Impossible de jouer la mélodie ${type}.`);
        }
    } catch (error) {
        console.error(`Impossible de joindre le buzzer pour ${type}.`, error);
    }
}

const WIDGET_CATALOG = {
    distance: { title: 'Distance', icon: '📡' },
    temperature: { title: 'Température / Humidité', icon: '🌡️' },
    ir: { title: 'Obstacle IR', icon: '🚨' },
    camera: { title: 'Caméra', icon: '📷' },
    buzzer: { title: 'Buzzer', icon: '🔊' }
};


function Widget({ widget, onDelete }) {

    const [wsStatus, setWsStatus] = useState('déconnecté');
    const [esp32Data, setEsp32Data] = useState({});

    const [spikeAlerts, setSpikeAlerts] = useState({});
    const detectors = useRef({});    // un détecteur par ESP32 et par capteur
    const alertTimers = useRef({});  // un timer par ESP32 et par capteur
    const lastIr = useRef({}); // dernier état IR par ESP32
    const criticalStates = useRef({});


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

        function showAlert(key, alert) {
            setSpikeAlerts((previous) => ({ ...previous, [key]: alert }));

            clearTimeout(alertTimers.current[key]);
            alertTimers.current[key] = setTimeout(() => {
                setSpikeAlerts((previous) => {
                    const next = { ...previous };
                    delete next[key];
                    return next;
                });
            }, ALERT_DURATION_MS);
        }

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

                // Pics sur les valeurs numériques
                const spikeConfig = SPIKE_CONFIG[data.name_capteur];

                if (spikeConfig) {
                    const key = `${data.ip_esp32}:${data.name_capteur}`;

                    if (!detectors.current[key]) {
                        detectors.current[key] = createSpikeDetector({
                            minDelta: spikeConfig.minDelta
                        });
                    }

                    const spike = detectors.current[key](data.value);

                    if (spike) {
                        void playMelody(
                            'warning',
                            `${data.ip_esp32}:${data.name_capteur}:warning`
                        );
                        showAlert(key, {
                            ip: data.ip_esp32,
                            sensor: data.name_capteur,
                            value: spike.value,
                            mean: spike.mean,
                            delta: spike.delta
                        });
                    }
                }

                // Changement d'état IR : Libre -> Obstacle
                if (data.name_capteur === 'ir') {
                    const obstacle = Boolean(data.value);
                    const previous = lastIr.current[data.ip_esp32];

                    lastIr.current[data.ip_esp32] = obstacle;

                    if (previous === false && obstacle) {
                        void playMelody(
                            'warning',
                            `${data.ip_esp32}:ir:warning`
                        );
                        showAlert(`${data.ip_esp32}:ir`, {
                            ip: data.ip_esp32,
                            sensor: 'ir'
                        });
                    }
                }

                const criticalKey =
                    `${data.ip_esp32}:${data.name_capteur}:alert`;
                const isCritical =
                    (data.name_capteur === 'temperature' &&
                        data.value > TEMPERATURE_MAX) ||
                    (data.name_capteur === 'camera_intrusion' &&
                        Boolean(data.value));

                if (isCritical && !criticalStates.current[criticalKey]) {
                    void playMelody('alert', criticalKey);
                }
                criticalStates.current[criticalKey] = isCritical;
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
            Object.values(alertTimers.current).forEach(clearTimeout); // NOUVEAU
            if (ws) {
                ws.close();
            }
        };

    }, []);


    if (!config) {
        return null;
    }


    return (

        <div className={`widget-content widget-${widget.widget}`}>

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
                            <p>ESP32 : {ip}</p>
                            <p>Distance : {sensors.distance ?? 'hors portée'} cm</p>

                            {Object.values(spikeAlerts)
                                .filter((alert) => alert.ip === ip && alert.sensor === 'distance')
                                .map((alert) => (
                                    <p key={alert.sensor} className="alert alert-warning">
                                        ⚡ Pic de {SPIKE_CONFIG[alert.sensor].label} :{' '}
                                        {alert.value} {SPIKE_CONFIG[alert.sensor].unit}
                                        {' '}({alert.delta > 0 ? '+' : ''}{alert.delta.toFixed(1)}
                                        {' '}par rapport à la moyenne de {alert.mean.toFixed(1)})
                                    </p>
                                ))
                            }
                        </div>
                    ))}

                    {distances.length === 0 && (
                        <p>En attente des données...</p>
                    )}

                    <p>Connexion : <b>{wsStatus}</b></p>
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
                                <p>ESP32 : {ip}</p>

                                <p>Température : {temperature ?? '--'} °C</p>

                                {sensors.humidity !== undefined && (
                                    <p>Humidité : {sensors.humidity} %</p>
                                )}

                                {surchauffe && (
                                    <p className="alert alert-critical">
                                        🔥 Température critique : {temperature} °C
                                        (seuil : {TEMPERATURE_MAX} °C)
                                    </p>
                                )}

                                {Object.values(spikeAlerts)
                                    .filter((alert) =>
                                        alert.ip === ip &&
                                        ['temperature', 'humidity'].includes(alert.sensor)
                                    )
                                    .map((alert) => (
                                        <p key={alert.sensor} className="alert alert-warning">
                                            ⚡ Pic de {SPIKE_CONFIG[alert.sensor].label} :{' '}
                                            {alert.value} {SPIKE_CONFIG[alert.sensor].unit}
                                            {' '}({alert.delta > 0 ? '+' : ''}{alert.delta.toFixed(1)}
                                            {' '}par rapport à la moyenne de {alert.mean.toFixed(1)})
                                        </p>
                                    ))
                                }
                            </div>
                        );
                    })}

                    {temperatures.length === 0 && (
                        <p>En attente des données...</p>
                    )}

                    <p>Connexion : <b>{wsStatus}</b></p>
                </>
            )}


            {widget.widget === 'ir' && (
                <>
                    {irSensors.map(([ip, sensors]) => (
                        <div key={ip}>
                            <p>ESP32 : {ip}</p>
                            <p>{sensors.ir ? '🚧 Obstacle' : '✅ Libre'}</p>

                            {Object.values(spikeAlerts)
                                .filter((alert) => alert.ip === ip && alert.sensor === 'ir')
                                .map((alert) => (
                                    <p key={alert.sensor} className="alert alert-warning">
                                        🚧 Obstacle détecté
                                    </p>
                                ))
                            }
                        </div>
                    ))}

                    {irSensors.length === 0 && (
                        <p>En attente des données...</p>
                    )}

                    <p>Connexion : <b>{wsStatus}</b></p>
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
                    <div className="camera-preview">
                        <img
                            className="camera-stream"
                            src={cameraStreamUrl}
                            alt="Flux vidéo de la caméra"
                        />
                    </div>

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