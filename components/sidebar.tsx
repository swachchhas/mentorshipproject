'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import {
    Home,
    Activity,
    GraduationCap,
    LogOut,
    Brain,
    Menu,
    X
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/cockpit', label: 'Cockpit', icon: Activity },
    { href: '/knowledge-base', label: 'Knowledge Base', icon: Brain },
    { href: '/classroom', label: 'Classroom', icon: GraduationCap, disabled: true },
];

export function Sidebar() {
    const pathname = usePathname();
    const { logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    // Don't show on login page or full-screen immersive flows
    const hideOnRoutes = [
        '/login',
        '/onboarding',
        '/add-topic',
    ];

    // Also hide on dynamic quiz/learn routes
    const shouldHide = hideOnRoutes.includes(pathname) ||
        pathname.startsWith('/learn/') ||
        pathname.startsWith('/quiz/');

    if (shouldHide) return null;

    const NavContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-4 border-b border-border/50">
                <Link href="/" className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                        <Brain className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-semibold text-lg">
                        Learning<span className="text-primary">Loop</span>
                    </span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.disabled ? '#' : item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                                item.disabled && "opacity-40 cursor-not-allowed"
                            )}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                            {item.disabled && (
                                <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded">
                                    Soon
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-border/50 space-y-2">
                <div className="flex items-center justify-between px-3 py-1.5">
                    <span className="text-xs text-muted-foreground">Theme</span>
                    <ThemeToggle />
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-3 px-3 text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                        setMobileOpen(false);
                        logout();
                    }}
                >
                    <LogOut className="w-4 h-4" />
                    Logout
                </Button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-background/90 backdrop-blur border shadow-sm"
            >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside className={cn(
                "lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform transition-transform duration-200",
                mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <NavContent />
            </aside>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-56 bg-background border-r border-border/50 h-screen sticky top-0">
                <NavContent />
            </aside>
        </>
    );
}
