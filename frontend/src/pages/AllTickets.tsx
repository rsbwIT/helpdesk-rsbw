import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminService, ticketService } from '../services/api';
import type { DashboardStats, Ticket } from '../services/api';
import '../index.css';

const AllTickets = () => {
    const { user, logout, isAdmin } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState('semua');
    const [uploadingId, setUploadingId] = useState<number | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isAdmin) {
            loadData();
        }
    }, [isAdmin]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [statsData, ticketsData] = await Promise.all([
                adminService.getAdminStats(),
                adminService.getAllTickets(),
            ]);
            setStats(statsData);
            setTickets(ticketsData);
        } catch (err) {
            setError('Gagal memuat data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (ticketId: number, status: string) => {
        try {
            setError(null);
            await adminService.updateTicket(ticketId, status);
            setSelectedTicket(null);
            loadData();
        } catch (err: any) {
            const message = err.response?.data?.error || 'Gagal update status';
            setError(message);
            console.error('Error updating ticket:', err);
        }
    };

    const handleUploadClick = (ticketId: number) => {
        setUploadingId(ticketId);
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !uploadingId) return;

        try {
            setError(null);
            await ticketService.uploadBuktiSelesai(uploadingId, file);
            await adminService.updateTicket(uploadingId, 'selesai');
            setSelectedTicket(null);
            loadData();
        } catch (err: any) {
            const message = err.response?.data?.error || 'Gagal upload bukti';
            setError(message);
            console.error('Error uploading:', err);
        } finally {
            setUploadingId(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
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

    const filteredTickets = tickets.filter(t => {
        if (filter === 'semua') return true;
        return t.status === filter;
    });

    if (!isAdmin) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <p>Akses ditolak. Halaman ini hanya untuk Admin.</p>
            </div>
        );
    }

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
                <h1>🎫 Helpdesk Admin</h1>
                <div className="user-menu">
                    <span className="user-name">Halo, {user?.nama}</span>
                    <button onClick={logout} className="btn-logout">Logout</button>
                </div>
            </header>

            <nav className="app-nav">
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/tickets">Tiket Saya</Link>
                <Link to="/tickets/create">Buat Tiket</Link>
                <Link to="/admin/tickets" className="active">Semua Tiket</Link>
            </nav>

            <main className="app-main">
                {error && <div className="alert alert-error">{error}</div>}

                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleFileChange}
                />

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
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Semua Tiket</span>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="form-select"
                            style={{ width: 'auto' }}
                        >
                            <option value="semua">Semua Status</option>
                            <option value="baru">Baru</option>
                            <option value="dikerjakan">Dikerjakan</option>
                            <option value="selesai">Selesai</option>
                            <option value="ditutup">Ditutup</option>
                        </select>
                    </div>
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
                            {filteredTickets.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="empty-state">
                                        Tidak ada tiket
                                    </td>
                                </tr>
                            ) : (
                                filteredTickets.map((ticket) => (
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
                                                style={{ marginRight: '8px' }}
                                            >
                                                Detail
                                            </button>
                                            {ticket.status === 'baru' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(ticket.id, 'dikerjakan')}
                                                    className="btn btn-primary btn-sm"
                                                >
                                                    Kerjakan
                                                </button>
                                            )}
                                            {ticket.status === 'dikerjakan' && (
                                                <button
                                                    onClick={() => handleUploadClick(ticket.id)}
                                                    className="btn btn-primary btn-sm"
                                                    disabled={uploadingId === ticket.id}
                                                >
                                                    {uploadingId === ticket.id ? 'Uploading...' : 'Selesai'}
                                                </button>
                                            )}
                                            {ticket.status === 'selesai' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(ticket.id, 'ditutup')}
                                                    className="btn btn-secondary btn-sm"
                                                >
                                                    Tutup
                                                </button>
                                            )}
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

                            <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                                {selectedTicket.status === 'baru' && (
                                    <button
                                        onClick={() => handleUpdateStatus(selectedTicket.id, 'dikerjakan')}
                                        className="btn btn-primary"
                                    >
                                        Kerjakan Tiket
                                    </button>
                                )}
                                {selectedTicket.status === 'dikerjakan' && (
                                    <button
                                        onClick={() => handleUploadClick(selectedTicket.id)}
                                        className="btn btn-primary"
                                        disabled={uploadingId === selectedTicket.id}
                                    >
                                        {uploadingId === selectedTicket.id ? 'Uploading...' : 'Upload Bukti & Selesaikan'}
                                    </button>
                                )}
                                {selectedTicket.status === 'selesai' && (
                                    <button
                                        onClick={() => handleUpdateStatus(selectedTicket.id, 'ditutup')}
                                        className="btn btn-secondary"
                                    >
                                        Tutup Tiket
                                    </button>
                                )}
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

export default AllTickets;
