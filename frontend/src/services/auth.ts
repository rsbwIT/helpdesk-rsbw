import { jwtDecode } from 'jwt-decode';

export interface User {
    sub: string;
    nama: string;
    iat: number;
    exp: number;
}

const API_URL = 'http://localhost:8080/api';

export const authService = {
    // Validate token from URL and store it
    loginWithToken: (token: string): User | null => {
        try {
            const decoded = jwtDecode<User>(token);

            // Check if token is expired
            if (decoded.exp * 1000 < Date.now()) {
                console.error('Token expired');
                return null;
            }

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(decoded));
            return decoded;
        } catch (error) {
            console.error('Invalid token:', error);
            return null;
        }
    },

    // Get current user from localStorage
    getUser: (): User | null => {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        return JSON.parse(userStr);
    },

    // Get token from localStorage
    getToken: (): string | null => {
        return localStorage.getItem('token');
    },

    // Check if user is authenticated
    isAuthenticated: (): boolean => {
        const token = localStorage.getItem('token');
        if (!token) return false;

        try {
            const decoded = jwtDecode<User>(token);
            return decoded.exp * 1000 > Date.now();
        } catch {
            return false;
        }
    },

    // Logout
    logout: (): void => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
};

export default authService;
