import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketService } from '../services/api';
import type { Ticket } from '../services/api';
import '../index.css';

const Tickets = () => {
    const { user, logout } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        try {
            setLoading(true);
            const data = await ticketService.getTickets();
            setTickets(data);
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

            <main className="app-main">
                <div className="page-header">
                    <h2 className="page-title">Tiket Saya</h2>
                    <Link to="/tickets/create" className="btn btn-primary">+ Buat Tiket Baru</Link>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <div className="card">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>No. Tiket</th>
                                <th>Subject</th>
                                <th>Kategori</th>
                                <th>Status</th>
                                <th>Dikerjakan Oleh</th>
                                <th>Tanggal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="empty-state">
                                        Belum ada tiket. <Link to="/tickets/create" className="link">Buat tiket pertama</Link>
                                    </td>
                                </tr>
                            ) : (
                                tickets.map((ticket) => (
                                    <tr key={ticket.id}>
                                        <td>
                                            <Link to={`/tickets/${ticket.id}`} className="link">{ticket.ticket_number}</Link>
                                        </td>
                                        <td>{ticket.subject}</td>
                                        <td>{ticket.category}</td>
                                        <td>
                                            <span className={`badge ${getStatusClass(ticket.status)}`}>
                                                {getStatusLabel(ticket.status)}
                                            </span>
                                        </td>
                                        <td>{ticket.dikerjakan_oleh || '-'}</td>
                                        <td>{new Date(ticket.created_at).toLocaleDateString('id-ID')}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default Tickets;
