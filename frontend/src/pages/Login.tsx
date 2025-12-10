import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../index.css';

const Login = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
            return;
        }

        const token = searchParams.get('token');

        if (token) {
            const success = login(token);
            if (success) {
                navigate('/dashboard');
            } else {
                navigate('/error?message=Token tidak valid atau sudah expired');
            }
        }
    }, [searchParams, login, navigate, isAuthenticated]);

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-logo">🎫</div>
                <h1 className="login-title">Helpdesk</h1>
                <p className="login-subtitle">
                    {searchParams.get('token')
                        ? 'Memproses login...'
                        : 'Sistem Pengaduan & Bantuan IT'}
                </p>
                {!searchParams.get('token') && (
                    <>
                        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
                            Silakan login melalui aplikasi utama untuk mengakses Helpdesk
                        </p>
                        <a href="http://localhost:8000" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                            Ke Aplikasi Utama
                        </a>
                    </>
                )}
            </div>
        </div>
    );
};

export default Login;
