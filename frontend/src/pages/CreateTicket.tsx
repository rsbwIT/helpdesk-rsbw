import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketService } from '../services/api';
import type { Category } from '../services/api';
import '../index.css';

const CreateTicket = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        category: '',
    });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await ticketService.getCategories();
            setCategories(data);
            if (data.length > 0) {
                setFormData((prev) => ({ ...prev, category: data[0].name }));
            }
        } catch (err) {
            console.error('Error loading categories:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.subject.trim() || !formData.description.trim()) {
            setError('Subject dan deskripsi wajib diisi');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            await ticketService.createTicket(formData);
            navigate('/tickets');
        } catch (err) {
            setError('Gagal membuat tiket');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--gray-50)' }}>
            <header className="app-header">
                <h1>🎫 Helpdesk</h1>
                <div className="user-menu">
                    <span className="user-name">Halo, {user?.nama}</span>
                    <button onClick={logout} className="btn-logout">Logout</button>
                </div>
            </header>

            <nav className="app-nav">
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/tickets">Tiket Saya</Link>
                <Link to="/tickets/create" className="active">Buat Tiket</Link>
            </nav>

            <main className="app-main" style={{ maxWidth: '700px' }}>
                <h2 className="page-title" style={{ marginBottom: '24px' }}>Buat Tiket Baru</h2>

                {error && <div className="alert alert-error">{error}</div>}

                <div className="card">
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Kategori</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="form-select"
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Subject *</label>
                                <input
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder="Judul singkat masalah Anda"
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Deskripsi *</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Jelaskan masalah Anda secara detail..."
                                    rows={6}
                                    className="form-textarea"
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="submit" disabled={loading} className="btn btn-primary">
                                    {loading ? 'Menyimpan...' : 'Buat Tiket'}
                                </button>
                                <Link to="/tickets" className="btn btn-secondary">Batal</Link>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CreateTicket;
