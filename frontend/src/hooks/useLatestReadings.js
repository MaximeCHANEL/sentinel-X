import { useEffect, useState } from 'react';

const API_URL =
    `${window.location.protocol}//${window.location.hostname}:8000/api`;

export function useLatestReadings(intervalMs = 2000) {
    const [readings, setReadings] = useState({});

    useEffect(() => {
        let active = true;

        async function load() {
            try {
                const response = await fetch(`${API_URL}/data/latest`);
                if (!response.ok) return;
                const data = await response.json();
                console.log('readings reçues :', data);
                if (active) {
                    setReadings(
                        Object.fromEntries(
                            data.map(r => [r.name_capteur ?? r.sensor, r])
                        )
                    );
                }
            } catch (error) {
                console.error(error);
            }
        }

        load();
        const timer = setInterval(load, intervalMs);
        return () => {
            active = false;
            clearInterval(timer);
        };
    }, [intervalMs]);

    return readings;
}