import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const NotificationsContext = createContext();

export const useNotifications = () => useContext(NotificationsContext);

const generateSeedNotifications = () => {
  const now = Date.now();
  const mins = (m) => new Date(now - m * 60000).toLocaleString();
  return [
    { id: now - 1, key: 'notifWelcome', args: {}, time: mins(1), read: false, type: 'system', link: '/dashboard' },
    { id: now - 2, key: 'notifFinance', args: {}, time: mins(15), read: false, type: 'finance', link: '/finances' },
    { id: now - 3, key: 'notifSchedule', args: { count: 3 }, time: mins(30), read: false, type: 'booking', link: '/schedule' },
    { id: now - 4, key: 'notifDriver', args: { name: 'Carlos Méndez' }, time: mins(45), read: false, type: 'driver', link: '/drivers' },
    { id: now - 5, key: 'notifCustomer', args: { name: 'María González' }, time: mins(60), read: true, type: 'customer', link: '/customers' },
    { id: now - 6, key: 'notifPaymentDone', args: { ref: 'RES-001' }, time: mins(120), read: true, type: 'payment', link: '/bookings' },
    { id: now - 7, key: 'notifTour', args: { name: 'Isla Saona VIP' }, time: mins(180), read: true, type: 'tour', link: '/activities' },
  ];
};

const NOTIF_TYPE_ICONS = {
  system: '⚙️',
  booking: '📅',
  customer: '👤',
  payment: '💳',
  tour: '🏝️',
  driver: '🚗',
  finance: '📊',
  order: '📦',
};

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('jhoraji_header_notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only use saved if it's using the new key format
        if (parsed.length > 0 && parsed[0].key !== undefined) return parsed;
      } catch (e) {
        // fall through to seed
      }
    }
    // Seed initial notifications so the dropdown is never empty on first load
    const seed = generateSeedNotifications();
    localStorage.setItem('jhoraji_header_notifications', JSON.stringify(seed));
    return seed;
  });

  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('jhoraji_notif_muted') === 'true');

  useEffect(() => {
    localStorage.setItem('jhoraji_header_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('jhoraji_notif_muted', isMuted);
  }, [isMuted]);

  const addNotification = useCallback((key, args = {}, type = 'system', link = '/') => {
    setNotifications(prev => {
      // Evitar que se repita exactamente la misma notificación si aún no ha sido leída
      if (prev.some(n => !n.read && n.key === key && JSON.stringify(n.args) === JSON.stringify(args))) {
        return prev;
      }

      const newNotif = {
        id: Date.now(),
        key,
        args,
        time: new Date().toLocaleString(),
        read: false,
        type,
        link,
      };
      return [newNotif, ...prev].slice(0, 50);
    });
  }, []);

  const [notifSettings, setNotifSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('jhoraji_settings') || '{}');
    } catch { return {}; }
  });

  useEffect(() => {
    const handleUpdate = () => {
      try {
        setNotifSettings(JSON.parse(localStorage.getItem('jhoraji_settings') || '{}'));
      } catch {}
    };
    window.addEventListener('settings_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('settings_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Generate a periodic "live" notification
  useEffect(() => {
    if (isMuted) return;
    if (notifSettings.pushNotif === false) return; // If disabled, don't generate live notifications

    const freq = notifSettings.pushNotifFreq || 'instant';
    let intervalMs = 3 * 60 * 1000; // 3 minutes for 'instant' demo
    if (freq === 'hourly') intervalMs = 60 * 60 * 1000;
    else if (freq === 'daily') intervalMs = 24 * 60 * 60 * 1000;
    else if (freq === 'weekly') intervalMs = 7 * 24 * 60 * 60 * 1000;

    const liveMessages = [
      () => {
        const bookings = JSON.parse(localStorage.getItem('jhoraji_bookings') || '[]');
        const pending = bookings.filter(b => b.status === 'pending').length;
        if (pending > 0) return { key: 'notifPendingPayments', args: { count: pending }, type: 'payment', link: '/bookings' };
        return null;
      },
      () => {
        const bookings = JSON.parse(localStorage.getItem('jhoraji_bookings') || '[]');
        const today = new Date().toISOString().split('T')[0];
        const todayBookings = bookings.filter(b => b.date === today && b.status !== 'canceled').length;
        if (todayBookings > 0) return { key: 'notifScheduleItems', args: { count: todayBookings }, type: 'booking', link: '/schedule' };
        return null;
      },
      () => {
        const customers = JSON.parse(localStorage.getItem('jhoraji_customers') || '[]');
        if (customers.length > 0) return { key: 'notifCustomerBase', args: { count: customers.length }, type: 'customer', link: '/customers' };
        return null;
      },
    ];

    const interval = setInterval(() => {
      const msgFn = liveMessages[Math.floor(Math.random() * liveMessages.length)];
      const msg = msgFn();
      if (msg) addNotification(msg.key, msg.args, msg.type, msg.link);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isMuted, notifSettings.pushNotif, notifSettings.pushNotifFreq, addNotification]);

  const markNotificationRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount,
      isMuted,
      setIsMuted,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      clearAllNotifications
    }}>
      {children}
    </NotificationsContext.Provider>
  );
};
