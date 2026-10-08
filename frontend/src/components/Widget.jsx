import { useEffect, useRef, useState } from 'react';
import { createSpikeDetector } from '../utils/spikeDetector'; // NOUVEAU : décommenté

const API_URL = 'http://localhost:8000/api';

const ALERT_DURATION_MS = 8000;
const TEMPERATURE_MAX = 100;

const SPIKE_CONFIG = {
    temperature: { minDelta: 1,  label: 'température', unit: '°C' },
    humidity:    { minDelta: 5,  label: 'humidité',    unit: '%'  },
    distance:    { minDelta: 10, label: 'distance',    unit: 'cm' }
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

const WIDGET_CATALOG = {
    distance:    { title: 'Distance',               icon: '📡' },
    temperature: { title: 'Température / Humidité', icon: '🌡️' },
    ir:          { title: 'Obstacle IR',            icon: '🚨' },
    camera:      { title: 'Caméra',                 icon: '📷' },
    buzzer:      { title: 'Buzzer',                 icon: '🔊' }
};


function Widget({ widget, onDelete }) {

    const [wsStatus, setWsStatus] = useState('déconnecté');
    const [esp32Data, setEsp32Data] = useState({});

    const [spikeAlerts, setSpikeAlerts] = useState({});
    const detectors = useRef({});    // un détecteur par ESP32 et par capteur
    const alertTimers = useRef({});  // un timer par ESP32 et par capteur
    const lastIr = useRef({}); // dernier état IR par ESP32


    const config = WIDGET_CATALOG[widget.widget];

    const distances = Object.entries(esp32Data)
        .filter(([, sensors]) => sensors.distance !== undefined);

    const temperatures = Object.entries(esp32Data)
        .filter(([, sensors]) => sensors.temperature !== undefined);

    const irSensors = Object.entries(esp32Data)
        .filter(([, sensors]) => sensors.ir !== undefined);


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
                        showAlert(`${data.ip_esp32}:ir`, {
                            ip: data.ip_esp32,
                            sensor: 'ir'
                        });
                    }
                }
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
                <p>📷 Caméra disponible prochainement</p>
            )}

        </div>
    );
}


export default Widget;