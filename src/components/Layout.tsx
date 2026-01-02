// Layout Component - Main app layout with sidebar navigation
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, User, PenSquare, LogOut, Twitter } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Feed' },
    { path: '/profile', icon: User, label: 'Perfil' },
    { path: '/create', icon: PenSquare, label: 'Nova Postagem' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r border-border min-h-screen p-4 hidden md:block sticky top-0">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-8 px-2">
              <Twitter className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">Clone Twitter</span>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-full transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Info and Logout */}
            {user && (
              <div className="border-t border-border pt-4 mt-4">
                <div className="flex items-center gap-3 px-2 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.profile_picture} alt={user.username} />
                    <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">@{user.username}</p>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  Sair
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
          <div className="flex justify-around py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center gap-1 p-2 ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs">{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex flex-col items-center gap-1 p-2 text-muted-foreground"
            >
              <LogOut className="h-6 w-6" />
              <span className="text-xs">Sair</span>
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 min-h-screen border-r border-border pb-16 md:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
