import { useState, useEffect } from 'react';
import { notificationApi } from '../../api/notification';
import type { Notification } from '../../api/notification';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Bell, BellOff, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import PaginationControls from '../../components/PaginationControls';

const ITEMS_PER_PAGE = 10;

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await notificationApi.getAll({ page: 1, limit: 100 });
      setNotifications(res.data);
    } catch {
      toast.error('Failed to load notifications.');
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      toast.success('Notification marked as read.');
      fetchNotifications();
    } catch {
      toast.error('Failed to update notification.');
    }
  };

  // Pagination
  const totalPages = Math.ceil(notifications.length / ITEMS_PER_PAGE);
  const paginatedNotifs = notifications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" /> Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stay updated with real-time extinguisher alerts and scheduling details.
          </p>
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 bg-card border border-border rounded-md">
          <p className="text-sm text-muted-foreground">Loading notifications...</p>
        </div>
      ) : (
        <Card className="divide-y divide-border border-border bg-card shadow-sm rounded-md overflow-hidden">
          {paginatedNotifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center space-y-2">
              <BellOff className="h-10 w-10 text-muted-foreground/55" />
              <p className="text-sm">No notifications found.</p>
            </div>
          ) : (
            paginatedNotifs.map((item) => (
              <div
                key={item.id}
                className={`p-4 flex items-start justify-between gap-4 transition-colors duration-200 ${
                  item.isRead ? 'hover:bg-muted/10' : 'bg-primary/5 hover:bg-primary/10 border-l-2 border-primary'
                }`}
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {!item.isRead && (
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                    <p className={`text-sm text-foreground ${item.isRead ? 'text-muted-foreground' : 'font-medium'}`}>
                      {item.message}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {!item.isRead && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border text-foreground hover:bg-muted rounded-md h-8 px-2 flex items-center gap-1.5 shrink-0"
                    onClick={() => handleMarkAsRead(item.id)}
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline text-xs">Mark as read</span>
                  </Button>
                )}
              </div>
            ))
          )}
          <PaginationControls
            page={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </Card>
      )}
    </div>
  );
}
