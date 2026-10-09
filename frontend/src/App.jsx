import { useEffect, useState } from 'react';

import Dashboard from './components/Dashboard';
import AddWidget from './components/AddWidget';
import Login from './components/Login';
import { apiFetch, getToken, clearToken } from './utils/api';

const API_URL =
    `${window.location.protocol}//${window.location.hostname}:8000/api`;

function App() {
    const [user, setUser] = useState(null);
    const [checkingAuth, setCheckingAuth] = useState(true);

    const [widgets, setWidgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Vérifie le token au démarrage
    useEffect(() => {
        async function checkAuth() {
            if (!getToken()) {
                setCheckingAuth(false);
                return;
            }
            try {
                const response = await apiFetch('/auth/me');
                if (response.ok) {
                    setUser(await response.json());
                }
            } finally {
                setCheckingAuth(false);
            }
        }
        checkAuth();
    }, []);

    async function loadWidgets() {
        try {
            setError('');
            const response = await apiFetch('/widgets');
            if (!response.ok) throw new Error('Impossible de récupérer les widgets.');
            setWidgets(await response.json());
        } catch (e) {
            console.error(e);
            setError('Impossible de charger le dashboard. Vérifiez que FastAPI est démarré.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (user) loadWidgets();
    }, [user]);

    async function handleLoginSuccess() {
        const response = await apiFetch('/auth/me');
        if (response.ok) setUser(await response.json());
    }

    function logout() {
        clearToken();
        setUser(null);
        setWidgets([]);
        setLoading(true);
    }

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
            },

            history: {
                width: 6,
                height: 5
            }
        };
        const config = catalog[widgetName];
        if (!config) return;

        const response = await apiFetch('/widgets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                widget: widgetName,
                position_x: 0,
                position_y: 0,
                width: config.width,
                height: config.height,
                visible: true
            })
        });

        if (!response.ok) {
            const data = await response.json();
            alert(data.detail || 'Impossible d’ajouter le widget.');
            return;
        }
        await loadWidgets();
    }

    async function deleteWidget(id) {
        const response = await apiFetch(`/widgets/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            alert('Impossible de supprimer le widget.');
            return;
        }
        setWidgets(current => current.filter(w => w.id !== id));
    }

    async function saveWidgetPosition(id, position) {
        const response = await apiFetch(`/widgets/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                position_x: position.x,
                position_y: position.y,
                width: position.w,
                height: position.h
            })
        });
        if (!response.ok) console.error(`Impossible de sauvegarder le widget ${id}`);
    }

    if (checkingAuth) return <p>Chargement...</p>;
    if (!user) return <Login onSuccess={handleLoginSuccess} />;

    return (
        <div className="app">
            <header className="header">
                <div>
                    <h1>Sentinel</h1>
                    <p>Dashboard — {user.username}</p>
                </div>
                <div>
                    <AddWidget onAdd={addWidget} />
                    <button className="add-button" onClick={logout}>Déconnexion</button>
                </div>
            </header>

            <main className="main">
                {loading && <p>Chargement...</p>}
                {error && <p className="error">{error}</p>}
                {!loading && !error && (
                    <Dashboard
                        widgets={widgets}
                        onDelete={deleteWidget}
                        onSavePosition={saveWidgetPosition}
                    />
                )}
            </main>
        </div>
    );
}

export default App;