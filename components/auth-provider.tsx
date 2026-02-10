'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
    isAuthenticated: boolean;
    login: () => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    login: () => { },
    logout: () => { },
    isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Check if we are already logged in
        // User Update: "Ensure session resets on refresh (acceptable for MVP)"
        // Okay, strictly following instructions: NO persistence.
        // BUT, that makes the "redirect to login if no session" rule trigger constantly on dev reload.
        // I will stick to React State = Reset on Refresh.

        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (isLoading) return;

        if (!isAuthenticated && pathname !== '/login') {
            router.push('/login');
        } else if (isAuthenticated) {
            const hasCompletedOnboarding = localStorage.getItem('learning_loop_onboarding_completed') === 'true';

            if (pathname === '/login') {
                // If on login page and authenticated, go to dashboard or onboarding
                router.push(hasCompletedOnboarding ? '/' : '/onboarding');
            } else if (pathname === '/onboarding' && hasCompletedOnboarding) {
                // If trying to access onboarding but already done, go to dashboard
                router.push('/');
            } else if (pathname !== '/onboarding' && !hasCompletedOnboarding) {
                // If trying to access app but haven't done onboarding, go to onboarding
                router.push('/onboarding');
            }
        }
    }, [isAuthenticated, isLoading, pathname, router]);

    const login = () => {
        setIsAuthenticated(true);
        router.push('/');
    };

    const logout = () => {
        setIsAuthenticated(false);
        router.push('/login');
    };

    // Show loading state to prevent flash from home to login
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}
