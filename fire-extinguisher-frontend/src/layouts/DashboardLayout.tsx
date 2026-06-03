import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  Flame,
  ClipboardCheck,
  Wrench,
  Bell,
  FileText,
  LogOut,
  Menu,
  User as UserIcon
} from 'lucide-react';
import api from '../api/axios';

const roleNames = {
  ROLE_ADMIN: 'Admin',
  ROLE_INSPECTOR: 'Inspector',
  ROLE_USER: 'User',
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Map route path to page titles
  const getPageTitle = (path: string) => {
    const p = path.split('/')[1];
    switch (p) {
      case 'dashboard':
        return 'Dashboard Overview';
      case 'extinguishers':
        return 'Extinguisher Inventory';
      case 'inspections':
        return 'Inspections Schedule';
      case 'maintenance':
        return 'Maintenance History';
      case 'notifications':
        return 'My Notifications';
      case 'reports':
        return 'System Reports & Analytics';
      default:
        return 'Fire Extinguisher Management';
    }
  };

  // Sidebar Links definition
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ROLE_ADMIN', 'ROLE_INSPECTOR', 'ROLE_USER'] },
    { name: 'Extinguishers', path: '/extinguishers', icon: Flame, roles: ['ROLE_ADMIN', 'ROLE_INSPECTOR', 'ROLE_USER'] },
    { name: 'Inspections', path: '/inspections', icon: ClipboardCheck, roles: ['ROLE_ADMIN', 'ROLE_INSPECTOR', 'ROLE_USER'] },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench, roles: ['ROLE_ADMIN', 'ROLE_INSPECTOR', 'ROLE_USER'] },
    { name: 'Notifications', path: '/notifications', icon: Bell, roles: ['ROLE_ADMIN', 'ROLE_INSPECTOR', 'ROLE_USER'], badge: true },
    { name: 'Reports', path: '/reports', icon: FileText, roles: ['ROLE_ADMIN'] },
  ];

  const filteredMenuItems = menuItems.filter(item => user && item.roles.includes(user.role));

  // Fetch notifications to get unread count
  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      // Temporarily call endpoint if authenticated; swallow error if not loaded yet
      const res = await api.get('/notifications?limit=100');
      if (res.data && Array.isArray(res.data.data)) {
        const unread = res.data.data.filter((n: any) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch {
      // Mock fallback or backend not ready yet
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Refresh unread count every 30s
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [location.pathname, user]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card text-card-foreground border-r border-border">
      {/* Sidebar Header Logo */}
      <div className="flex items-center gap-2 p-6 border-b border-border">
        <span className="text-2xl" role="img" aria-label="fire">🔥</span>
        <span className="text-xl font-bold tracking-tight text-foreground">TZW LTD</span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {filteredMenuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center justify-between px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </div>
              {item.badge && unreadCount > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isActive ? 'bg-primary-foreground text-primary' : 'bg-destructive text-primary-foreground animate-pulse'}`}>
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer User Box */}
      {user && (
        <div className="p-4 border-t border-border bg-muted/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground font-semibold">
              <UserIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.firstName} {user.lastName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded-full font-medium">
                  {roleNames[user.role] || user.role}
                </Badge>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 gap-2"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar (static) */}
      <aside className="hidden lg:block w-64 flex-shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-card text-card-foreground flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Mobile Nav Trigger */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-foreground">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <SidebarContent />
              </SheetContent>
            </Sheet>

            <h2 className="text-lg font-semibold text-foreground">
              {getPageTitle(location.pathname)}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Topbar Notification Bell */}
            <div className="relative cursor-pointer p-2 hover:bg-muted rounded-full transition-colors" onClick={() => navigate('/notifications')}>
              <Bell className="h-5 w-5 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-destructive border border-card animate-pulse" />
              )}
            </div>
          </div>
        </header>

        {/* Inner Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
