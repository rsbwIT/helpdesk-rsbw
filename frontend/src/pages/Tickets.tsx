import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketService } from '../services/api';
import type { Ticket } from '../services/api';
import '../index.css';

const Tickets = () => {
    const { user, logout, isAdmin } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

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
                {isAdmin && <Link to="/dashboard">Dashboard</Link>}
                <Link to="/tickets" className="active">Tiket Saya</Link>
                <Link to="/tickets/create">Buat Tiket</Link>
                {isAdmin && <Link to="/admin/tickets">Semua Tiket</Link>}
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
                                <th>Aksi</th>
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
                                            <button
                                                onClick={() => setSelectedTicket(ticket)}
                                                className="link"
                                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                            >
                                                {ticket.ticket_number}
                                            </button>
                                        </td>
                                        <td>{ticket.subject}</td>
                                        <td>{ticket.category || '-'}</td>
                                        <td>
                                            <span className={`badge ${getStatusClass(ticket.status)}`}>
                                                {getStatusLabel(ticket.status)}
                                            </span>
                                        </td>
                                        <td>{ticket.dikerjakan_oleh || '-'}</td>
                                        <td>
                                            <button
                                                onClick={() => setSelectedTicket(ticket)}
                                                className="btn btn-secondary btn-sm"
                                            >
                                                Detail
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Detail Modal */}
            {selectedTicket && (
                <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Detail Tiket - {selectedTicket.ticket_number}</h3>
                            <button className="modal-close" onClick={() => setSelectedTicket(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-row">
                                <span className="detail-label">Subject</span>
                                <span className="detail-value">{selectedTicket.subject}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Kategori</span>
                                <span className="detail-value">{selectedTicket.category || '-'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Status</span>
                                <span className="detail-value">
                                    <span className={`badge ${getStatusClass(selectedTicket.status)}`}>
                                        {getStatusLabel(selectedTicket.status)}
                                    </span>
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Dikerjakan Oleh</span>
                                <span className="detail-value">{selectedTicket.dikerjakan_oleh || '-'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Tanggal Dibuat</span>
                                <span className="detail-value">
                                    {new Date(selectedTicket.created_at).toLocaleString('id-ID')}
                                </span>
                            </div>
                            {selectedTicket.resolved_at && (
                                <div className="detail-row">
                                    <span className="detail-label">Tanggal Selesai</span>
                                    <span className="detail-value">
                                        {new Date(selectedTicket.resolved_at).toLocaleString('id-ID')}
                                    </span>
                                </div>
                            )}
                            <div className="detail-row">
                                <span className="detail-label">Deskripsi</span>
                                <span className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>
                                    {selectedTicket.description}
                                </span>
                            </div>

                            {selectedTicket.bukti_masalah && (
                                <div className="detail-row">
                                    <span className="detail-label">Bukti Masalah</span>
                                    <span className="detail-value">
                                        <img
                                            src={`http://localhost:8080/uploads/${selectedTicket.bukti_masalah}`}
                                            alt="Bukti Masalah"
                                            className="bukti-image"
                                        />
                                    </span>
                                </div>
                            )}

                            {selectedTicket.bukti_selesai && (
                                <div className="detail-row">
                                    <span className="detail-label">Bukti Selesai</span>
                                    <span className="detail-value">
                                        <img
                                            src={`http://localhost:8080/uploads/${selectedTicket.bukti_selesai}`}
                                            alt="Bukti Selesai"
                                            className="bukti-image"
                                        />
                                    </span>
                                </div>
                            )}

                            <div style={{ marginTop: '20px' }}>
                                <button
                                    onClick={() => setSelectedTicket(null)}
                                    className="btn btn-secondary"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tickets;
