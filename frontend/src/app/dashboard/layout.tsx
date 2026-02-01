'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { authService, Admin } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  LogOut, 
  Menu,
  X,
  Home,
  ChevronLeft,
  Sun,
  Moon,
  BarChart3
} from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    authService.getCurrentAdmin().then((adminData) => {
      if (adminData) {
        setAdmin(adminData);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });
  }, [router]);

  const handleLogout = () => {
    authService.logout();
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const { theme, toggleTheme } = useTheme();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <aside className="hidden md:flex w-56 flex-col border-r border-border bg-card/50 p-4">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </aside>
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
        </main>
      </div>
    );
  }

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/dashboard/courses', label: 'Courses', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          x: sidebarOpen ? 0 : -256,
          width: sidebarOpen ? 256 : 0
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed inset-y-0 left-0 z-50 bg-card border-r border-border flex flex-col overflow-hidden"
        style={{ width: 256 }}
      >
        {/* Sidebar Header with Close Button */}
        <div className="p-6 border-b border-border flex items-start justify-between">
          <div>
            <h1 className="text-xl font-light tracking-wide">Meditation Teacher Training</h1>
            <p className="text-sm text-muted-foreground mt-1">Admin Panel</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 -mr-2 -mt-1"
            onClick={toggleSidebar}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="px-4 py-2 text-sm text-muted-foreground">
            {admin?.email}
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.div 
        className="flex-1 flex flex-col min-h-screen"
        animate={{ 
          marginLeft: sidebarOpen ? 256 : 0 
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="flex h-16 items-center gap-4 px-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="flex-shrink-0"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" strokeWidth={1.8} aria-hidden />
              ) : (
                <Moon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
              )}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </motion.div>
    </div>
  );
}
