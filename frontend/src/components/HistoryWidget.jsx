import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../utils/api';

const WINDOW_MINUTES = 15;
const REFRESH_MS = 5000;
const MAX_CHART_POINTS = 300;
const MAX_TABLE_ROWS = 200;

// Libellé, unité et nature de chaque capteur (binaire = valeur 0 / 1)
const SENSORS = {
    distance:         { label: 'Distance',    unit: 'cm' },
    temperature:      { label: 'Température', unit: '°C' },
    humidity:         { label: 'Humidité',    unit: '%'  },
    ir:               { label: 'Obstacle IR', binary: ['Libre', 'Obstacle'] },
    camera_intrusion: { label: 'Caméra',      binary: ['Aucun intrus', 'Intrus détecté'] }
};

function sensorInfo(name) {
    return SENSORS[name] ?? { label: name, unit: '' };
}

// recorded_at est stocké en UTC mais renvoyé sans fuseau ("2026-10-09T08:40:00") :
// on force l'interprétation en UTC pour éviter un décalage d'heure.
function parseUtc(value) {
    const text = String(value);
    const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(text);
    return new Date(hasZone ? text : `${text}Z`);
}

function formatTime(date) {
    return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function formatValue(name, value) {
    const info = sensorInfo(name);

    if (info.binary) {
        return info.binary[value ? 1 : 0];
    }

    const rounded = Math.round(value * 10) / 10;
    return `${rounded} ${info.unit}`.trim();
}

// Réduit le nombre de points tracés (moyenne par paquet) pour garder un SVG léger
function downsample(points, maxPoints) {
    if (points.length <= maxPoints) {
        return points;
    }

    const size = Math.ceil(points.length / maxPoints);
    const result = [];

    for (let i = 0; i < points.length; i += size) {
        const bucket = points.slice(i, i + size);
        result.push({
            time: bucket[Math.floor(bucket.length / 2)].time,
            value: bucket.reduce((sum, p) => sum + p.value, 0) / bucket.length
        });
    }

    return result;
}

function Chart({ points, binary, windowStart, windowEnd }) {
    const width = 400;
    const height = 110;
    const pad = { left: 38, right: 8, top: 8, bottom: 18 };

    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    if (points.length === 0) {
        return <p className="history-empty">Aucune mesure sur les {WINDOW_MINUTES} dernières minutes.</p>;
    }

    const span = windowEnd - windowStart;
    const x = (time) => pad.left + ((time - windowStart) / span) * plotW;

    let min = binary ? 0 : Math.min(...points.map((p) => p.value));
    let max = binary ? 1 : Math.max(...points.map((p) => p.value));

    if (!binary && min === max) {
        min -= 1;
        max += 1;
    }

    const y = (value) => pad.top + (1 - (value - min) / (max - min)) * plotH;

    // Binaire : courbe en escalier ; sinon : courbe directe
    let path = '';
    points.forEach((p, i) => {
        const px = x(p.time).toFixed(1);
        const py = y(p.value).toFixed(1);

        if (i === 0) {
            path = `M${px},${py}`;
        } else if (binary) {
            path += ` H${px} V${py}`;
        } else {
            path += ` L${px},${py}`;
        }
    });

    const labels = [
        { time: windowStart, text: `-${WINDOW_MINUTES} min` },
        { time: windowStart + span / 2, text: `-${Math.round(WINDOW_MINUTES / 2)} min` },
        { time: windowEnd, text: 'maintenant' }
    ];

    return (
        <svg
            className="history-chart"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            role="img"
            aria-label="Évolution des mesures"
        >
            <line x1={pad.left} x2={width - pad.right} y1={y(min)} y2={y(min)} className="history-grid" />
            <line x1={pad.left} x2={width - pad.right} y1={y(max)} y2={y(max)} className="history-grid" />

            <text x={pad.left - 4} y={y(max) + 4} textAnchor="end" className="history-axis">
                {binary ? '1' : Math.round(max * 10) / 10}
            </text>
            <text x={pad.left - 4} y={y(min) + 4} textAnchor="end" className="history-axis">
                {binary ? '0' : Math.round(min * 10) / 10}
            </text>

            {labels.map((label, i) => (
                <text
                    key={label.text}
                    x={x(label.time)}
                    y={height - 4}
                    textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}
                    className="history-axis"
                >
                    {label.text}
                </text>
            ))}

            <path d={path} className="history-line" />
        </svg>
    );
}

function HistoryWidget() {
    const [readings, setReadings] = useState([]);
    const [selected, setSelected] = useState('');
    const [error, setError] = useState('');
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        let active = true;

        async function load() {
            try {
                const response = await apiFetch(`/data/recent?minutes=${WINDOW_MINUTES}`);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                if (active) {
                    setReadings(data);
                    setNow(Date.now());
                    setError('');
                }
            } catch (e) {
                console.error('Historique indisponible :', e);

                if (active) {
                    setError("Impossible de charger l'historique.");
                }
            }
        }

        load();
        const timer = setInterval(load, REFRESH_MS);

        return () => {
            active = false;
            clearInterval(timer);
        };
    }, []);

    // Regroupe les mesures par capteur : { temperature: [{time, value}, ...] }
    const bySensor = useMemo(() => {
        const groups = {};

        readings.forEach((r) => {
            (groups[r.name_capteur] ??= []).push({
                time: parseUtc(r.recorded_at).getTime(),
                value: r.value
            });
        });

        return groups;
    }, [readings]);

    const sensorNames = Object.keys(bySensor).sort();
    const current = sensorNames.includes(selected) ? selected : sensorNames[0];

    const points = current ? bySensor[current] : [];
    const info = current ? sensorInfo(current) : null;

    const values = points.map((p) => p.value);
    const stats = values.length && !info.binary
        ? {
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((a, b) => a + b, 0) / values.length
        }
        : null;

    // Du plus récent au plus ancien pour le tableau
    const tableRows = [...points].reverse().slice(0, MAX_TABLE_ROWS);

    const stop = (event) => event.stopPropagation();

    return (
        <div className="history" onMouseDown={stop}>
            {error && <p className="alert alert-critical">{error}</p>}

            {!error && sensorNames.length === 0 && (
                <p className="history-empty">
                    Aucune mesure enregistrée sur les {WINDOW_MINUTES} dernières minutes.
                </p>
            )}

            {sensorNames.length > 0 && (
                <>
                    <div className="history-toolbar">
                        <select
                            value={current}
                            onChange={(event) => setSelected(event.target.value)}
                            aria-label="Capteur"
                        >
                            {sensorNames.map((name) => (
                                <option key={name} value={name}>
                                    {sensorInfo(name).label}
                                </option>
                            ))}
                        </select>

                        <span className="history-count">
                            {points.length} mesure{points.length > 1 ? 's' : ''} sur {WINDOW_MINUTES} min
                        </span>
                    </div>

                    {stats && (
                        <p className="history-stats">
                            Min <b>{formatValue(current, stats.min)}</b>
                            {' · '}Moy <b>{formatValue(current, stats.avg)}</b>
                            {' · '}Max <b>{formatValue(current, stats.max)}</b>
                        </p>
                    )}

                    <Chart
                        points={downsample(points, MAX_CHART_POINTS)}
                        binary={Boolean(info.binary)}
                        windowStart={now - WINDOW_MINUTES * 60 * 1000}
                        windowEnd={now}
                    />

                    <div className="history-table-wrapper">
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>Heure</th>
                                    <th>Valeur</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableRows.map((p, i) => (
                                    <tr key={`${p.time}-${i}`}>
                                        <td>{formatTime(new Date(p.time))}</td>
                                        <td>{formatValue(current, p.value)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}

export default HistoryWidget;