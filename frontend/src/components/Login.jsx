import { useState } from 'react';
import { login, register } from '../utils/api';

function Login({ onSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [mode, setMode] = useState('login');   // 'login' | 'register'
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'register') {
                await register(username, password);
            }
            await login(username, password);
            onSuccess();
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login">
            <form className="login-form" onSubmit={handleSubmit}>
                <h1>Sentinel</h1>
                <p>{mode === 'login' ? 'Connexion' : 'Créer un compte'}</p>

                <input
                    type="text"
                    placeholder="Identifiant"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                />

                <input
                    type="password"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    minLength={6}
                    required
                />

                {error && <p className="error">{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? '...' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
                </button>

                <button
                    type="button"
                    className="link-button"
                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                >
                    {mode === 'login' ? 'Pas de compte ? Inscription' : 'Déjà un compte ? Connexion'}
                </button>
            </form>
        </div>
    );
}

export default Login;