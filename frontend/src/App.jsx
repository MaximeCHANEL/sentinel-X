import { useEffect, useState } from 'react';

import Dashboard from './components/Dashboard';
import AddWidget from './components/AddWidget';

const API_URL = 'http://localhost:8000/api';

function App() {

    const [widgets, setWidgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    async function loadWidgets() {

        try {

            setError('');

            const response = await fetch(
                `${API_URL}/widgets`
            );

            if (!response.ok) {
                throw new Error(
                    'Impossible de récupérer les widgets.'
                );
            }

            const data = await response.json();

            setWidgets(data);

        } catch (error) {

            console.error(error);

            setError(
                'Impossible de charger le dashboard. ' +
                'Vérifiez que FastAPI est démarré.'
            );

        } finally {

            setLoading(false);
        }
    }

    useEffect(() => {
        loadWidgets();
    }, []);


    async function addWidget(widgetName) {

        const catalog = {
            distance: {
                width: 4,
                height: 3
            },

            temperature: {
                width: 4,
                height: 3
            },

            camera: {
                width: 5,
                height: 4
            },

            buzzer: {
                width: 4,
                height: 3
            },

            ir: {
                width: 4,
                height: 3
            }
        };

        const config = catalog[widgetName];

        if (!config) {
            return;
        }

        const response = await fetch(
            `${API_URL}/widgets`,
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    widget: widgetName,
                    position_x: 0,
                    position_y: 0,
                    width: config.width,
                    height: config.height,
                    visible: true
                })
            }
        );

        if (!response.ok) {

            const data = await response.json();

            alert(
                data.detail ||
                'Impossible d’ajouter le widget.'
            );

            return;
        }

        await loadWidgets();
    }


    async function deleteWidget(id) {

        const response = await fetch(
            `${API_URL}/widgets/${id}`,
            {
                method: 'DELETE'
            }
        );

        if (!response.ok) {

            alert(
                'Impossible de supprimer le widget.'
            );

            return;
        }

        setWidgets(
            current =>
                current.filter(
                    widget => widget.id !== id
                )
        );
    }


    async function saveWidgetPosition(
        id,
        position
    ) {

        const response = await fetch(
            `${API_URL}/widgets/${id}`,
            {
                method: 'PUT',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    position_x: position.x,
                    position_y: position.y,
                    width: position.w,
                    height: position.h
                })
            }
        );

        if (!response.ok) {

            console.error(
                `Impossible de sauvegarder le widget ${id}`
            );
        }
    }


    return (
        <div className="app">

            <header className="header">

                <div>
                    <h1>Sentinel</h1>
                    <p>Dashboard</p>
                </div>

                <AddWidget
                    onAdd={addWidget}
                />

            </header>


            <main className="main">

                {loading && (
                    <p>Chargement...</p>
                )}

                {error && (
                    <p className="error">
                        {error}
                    </p>
                )}

                {!loading && !error && (

                    <Dashboard
                        widgets={widgets}
                        onDelete={deleteWidget}
                        onSavePosition={
                            saveWidgetPosition
                        }
                    />

                )}

            </main>

        </div>
    );
}

export default App;