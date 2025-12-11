import axios from 'axios';
import authService from './auth';

const API_URL = 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to every request
api.interceptors.request.use((config) => {
    const token = authService.getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            authService.logout();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export interface Ticket {
    id: number;
    ticket_number: string;
    user_id: string;
    subject: string;
    description: string;
    status: 'baru' | 'dikerjakan' | 'selesai' | 'ditutup';
    category: string;
    dikerjakan_oleh: string | null;
    bukti_masalah: string | null;
    bukti_selesai: string | null;
    created_at: string;
    updated_at: string;
    resolved_at: string | null;
}

export interface Category {
    id: number;
    name: string;
    description: string;
}

export interface DashboardStats {
    total_tickets: number;
    open_tickets: number;
    in_progress_tickets: number;
    resolved_tickets: number;
    closed_tickets: number;
}

export const ticketService = {
    // Get all tickets for current user
    getTickets: async (): Promise<Ticket[]> => {
        const response = await api.get('/tickets');
        return response.data;
    },

    // Get single ticket
    getTicket: async (id: number): Promise<Ticket> => {
        const response = await api.get(`/tickets/${id}`);
        return response.data;
    },

    // Create new ticket
    createTicket: async (data: { subject: string; description: string; category: string }): Promise<Ticket> => {
        const response = await api.post('/tickets', data);
        return response.data;
    },

    // Update ticket status
    updateStatus: async (id: number, status: string): Promise<Ticket> => {
        const response = await api.patch(`/tickets/${id}/status`, { status });
        return response.data;
    },

    // Upload bukti masalah (by user)
    uploadBuktiMasalah: async (id: number, file: File): Promise<void> => {
        const formData = new FormData();
        formData.append('bukti', file);
        await api.post(`/tickets/${id}/bukti-masalah`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    // Upload bukti selesai (by admin)
    uploadBuktiSelesai: async (id: number, file: File): Promise<void> => {
        const formData = new FormData();
        formData.append('bukti', file);
        await api.post(`/tickets/${id}/bukti-selesai`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    // Get categories
    getCategories: async (): Promise<Category[]> => {
        const response = await api.get('/categories');
        return response.data;
    },

    // Get dashboard stats
    getDashboardStats: async (): Promise<DashboardStats> => {
        const response = await api.get('/dashboard/stats');
        return response.data;
    },

    // Get recent tickets
    getRecentTickets: async (): Promise<Ticket[]> => {
        const response = await api.get('/dashboard/recent');
        return response.data;
    },
};

export interface AuthInfo {
    user_id: string;
    nama: string;
    is_admin: boolean;
}

export const adminService = {
    // Get auth info including admin status
    getAuthInfo: async (): Promise<AuthInfo> => {
        const response = await api.get('/auth/info');
        return response.data;
    },

    // Get all tickets (admin only)
    getAllTickets: async (): Promise<Ticket[]> => {
        const response = await api.get('/admin/tickets');
        return response.data;
    },

    // Get admin dashboard stats
    getAdminStats: async (): Promise<DashboardStats> => {
        const response = await api.get('/admin/dashboard/stats');
        return response.data;
    },

    // Update ticket status (admin)
    updateTicket: async (id: number, status: string): Promise<void> => {
        await api.patch(`/admin/tickets/${id}`, { status });
    },
};

export default api;
