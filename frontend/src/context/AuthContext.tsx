import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import authService from '../services/auth';
import type { User } from '../services/auth';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (token: string) => boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Check if user is already logged in
        const storedUser = authService.getUser();
        if (storedUser && authService.isAuthenticated()) {
            setUser(storedUser);
        }
    }, []);

    const login = (token: string): boolean => {
        const decoded = authService.loginWithToken(token);
        if (decoded) {
            setUser(decoded);
            return true;
        }
        return false;
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
