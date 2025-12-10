import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketService } from '../services/api';
import type { Ticket } from '../services/api';
import '../index.css';

const TicketDetail = () => {
    const { id } = useParams<{ id: string }>();
    const { user, logout } = useAuth();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            loadTicket(parseInt(id));
        }
    }, [id]);

    const loadTicket = async (ticketId: number) => {
        try {
            setLoading(true);
            const data = await ticketService.getTicket(ticketId);
            setTicket(data);
        } catch (err) {
            setError('Gagal memuat tiket');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusClass = (status: string) => {
        const classes: Record<string, string> = {
            baru: 'badge-open',
            dikerjakan: 'badge-progress',
            selesai: 'badge-resolved',
            ditutup: 'badge-closed',
        };
        return classes[status] || '';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            baru: 'Baru',
            dikerjakan: 'Proses',
            selesai: 'Selesai',
            ditutup: 'Ditutup',
        };
        return labels[status] || status;
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <p>Loading...</p>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <p>Tiket tidak ditemukan</p>
            </div>
        );
    }

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
                <Link to="/tickets" className="active">Tiket Saya</Link>
                <Link to="/tickets/create">Buat Tiket</Link>
            </nav>

            <main className="app-main" style={{ maxWidth: '800px' }}>
                <Link to="/tickets" className="back-link">← Kembali ke Daftar Tiket</Link>

                {error && <div className="alert alert-error">{error}</div>}

                <div className="card">
                    <div className="ticket-header">
                        <div>
                            <p className="ticket-number">{ticket.ticket_number}</p>
                            <h2 className="ticket-title">{ticket.subject}</h2>
                        </div>
                        <span className={`badge ${getStatusClass(ticket.status)}`} style={{ padding: '8px 16px', fontSize: '13px' }}>
                            {getStatusLabel(ticket.status)}
                        </span>
                    </div>

                    <div className="ticket-info">
                        <div>
                            <p className="info-label">Kategori</p>
                            <p className="info-value">{ticket.category}</p>
                        </div>
                        <div>
                            <p className="info-label">Tanggal Dibuat</p>
                            <p className="info-value">{new Date(ticket.created_at).toLocaleString('id-ID')}</p>
                        </div>
                        <div>
                            <p className="info-label">Dikerjakan Oleh</p>
                            <p className="info-value">{ticket.dikerjakan_oleh || '-'}</p>
                        </div>
                        <div>
                            <p className="info-label">Tanggal Selesai</p>
                            <p className="info-value">{ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleString('id-ID') : '-'}</p>
                        </div>
                    </div>

                    <div className="ticket-description">
                        <p className="info-label" style={{ marginBottom: '8px' }}>Deskripsi</p>
                        <p>{ticket.description}</p>
                    </div>

                    {ticket.bukti_foto && (
                        <div style={{ padding: '20px', borderTop: '1px solid var(--gray-200)' }}>
                            <p className="info-label" style={{ marginBottom: '12px' }}>Bukti Pengerjaan</p>
                            <img
                                src={`http://localhost:8080/uploads/${ticket.bukti_foto}`}
                                alt="Bukti pengerjaan"
                                style={{ maxWidth: '100%', borderRadius: '8px' }}
                            />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default TicketDetail;
