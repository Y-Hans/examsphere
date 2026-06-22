'use client';

import { useState, useEffect } from 'react';
import { getUnreadNotificationsAction, markAllNotificationsAsReadAction } from '@/modules/notification';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Notification {
  id: string;
  title: string;
  body: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    const res = await getUnreadNotificationsAction();
    if (res.success && res.data) {
      setNotifications(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Fetch on mount
    fetchNotifications();
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsReadAction();
    setNotifications([]);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {notifications.length}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200">
          <div className="py-2 px-4 bg-gray-50 border-b flex justify-between items-center">
            <span className="font-semibold text-sm text-gray-700">Notifications</span>
            {notifications.length > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-indigo-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">You're all caught up!</div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className="p-4 hover:bg-gray-50">
                  <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                  {notif.body && <p className="text-xs text-gray-500 mt-1">{notif.body}</p>}
                  <p className="text-xs text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}