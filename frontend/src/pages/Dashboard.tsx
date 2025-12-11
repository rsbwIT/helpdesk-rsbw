import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketService } from '../services/api';
import type { DashboardStats, Ticket } from '../services/api';
import '../index.css';

const Dashboard = () => {
    const { user, logout, isAdmin } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [statsData, ticketsData] = await Promise.all([
                ticketService.getDashboardStats(),
                ticketService.getRecentTickets(),
            ]);
            setStats(statsData);
            setRecentTickets(ticketsData);
        } catch (err) {
            setError('Gagal memuat data dashboard');
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
                <Link to="/dashboard" className="active">Dashboard</Link>
                <Link to="/tickets">Tiket Saya</Link>
                <Link to="/tickets/create">Buat Tiket</Link>
                {isAdmin && <Link to="/admin/tickets">Semua Tiket</Link>}
            </nav>

            <main className="app-main">
                {error && <div className="alert alert-error">{error}</div>}

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-label">Total Tiket</div>
                        <div className="stat-value">{stats?.total_tickets || 0}</div>
                    </div>
                    <div className="stat-card open">
                        <div className="stat-label">Baru</div>
                        <div className="stat-value">{stats?.open_tickets || 0}</div>
                    </div>
                    <div className="stat-card progress">
                        <div className="stat-label">Dikerjakan</div>
                        <div className="stat-value">{stats?.in_progress_tickets || 0}</div>
                    </div>
                    <div className="stat-card resolved">
                        <div className="stat-label">Selesai</div>
                        <div className="stat-value">{stats?.resolved_tickets || 0}</div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">Tiket Terbaru</div>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>No. Tiket</th>
                                <th>Subject</th>
                                <th>Kategori</th>
                                <th>Status</th>
                                <th>Tanggal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentTickets.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="empty-state">
                                        Belum ada tiket
                                    </td>
                                </tr>
                            ) : (
                                recentTickets.map((ticket) => (
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

export default Dashboard;
