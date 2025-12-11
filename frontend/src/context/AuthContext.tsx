import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import authService from '../services/auth';
import type { User } from '../services/auth';
import { adminService } from '../services/api';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (token: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        // Check if user is already logged in
        const storedUser = authService.getUser();
        if (storedUser && authService.isAuthenticated()) {
            setUser(storedUser);
            // Check admin status
            checkAdminStatus();
        }
    }, []);

    const checkAdminStatus = async () => {
        try {
            const authInfo = await adminService.getAuthInfo();
            setIsAdmin(authInfo.is_admin);
        } catch {
            setIsAdmin(false);
        }
    };

    const login = async (token: string): Promise<boolean> => {
        const decoded = authService.loginWithToken(token);
        if (decoded) {
            setUser(decoded);
            await checkAdminStatus();
            return true;
        }
        return false;
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        setIsAdmin(false);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isAdmin, login, logout }}>
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
