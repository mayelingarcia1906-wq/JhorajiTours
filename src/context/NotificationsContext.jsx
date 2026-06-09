import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const NotificationsContext = createContext();

export const useNotifications = () => useContext(NotificationsContext);

const generateSeedNotifications = () => {
  const now = Date.now();
  const mins = (m) => new Date(now - m * 60000).toLocaleString();
  return [
    { id: now - 1, text: '🎉 Bienvenido a Jhoraji Tours. Tu panel está listo.', time: mins(1), read: false, type: 'system' },
    { id: now - 2, text: '📊 Reporte financiero del mes disponible en Finanzas.', time: mins(15), read: false, type: 'finance' },
    { id: now - 3, text: '📅 Tienes 3 reservas programadas para hoy.', time: mins(30), read: false, type: 'booking' },
    { id: now - 4, text: '🚗 Chofer "Carlos Méndez" asignado a traslado aeropuerto.', time: mins(45), read: false, type: 'driver' },
    { id: now - 5, text: '👤 Nuevo cliente registrado: María González.', time: mins(60), read: true, type: 'customer' },
    { id: now - 6, text: '✅ Reserva #RES-001 marcada como pagada.', time: mins(120), read: true, type: 'payment' },
    { id: now - 7, text: '🏝️ Tour "Isla Saona VIP" activado en la web.', time: mins(180), read: true, type: 'tour' },
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
        if (parsed.length > 0) return parsed;
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

  const addNotification = useCallback((text, type = 'system') => {
    const icon = NOTIF_TYPE_ICONS[type] || '';
    const newNotif = {
      id: Date.now(),
      text: icon ? `${icon} ${text}` : text,
      time: new Date().toLocaleString(),
      read: false,
      type,
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 50));
  }, []);

  // Generate a periodic "live" notification every 3 minutes from bookings data
  useEffect(() => {
    if (isMuted) return;
    const liveMessages = [
      () => {
        const bookings = JSON.parse(localStorage.getItem('jhoraji_bookings') || '[]');
        const pending = bookings.filter(b => b.status === 'pending').length;
        if (pending > 0) return { text: `Tienes ${pending} reservas pendientes de pago.`, type: 'payment' };
        return null;
      },
      () => {
        const bookings = JSON.parse(localStorage.getItem('jhoraji_bookings') || '[]');
        const today = new Date().toISOString().split('T')[0];
        const todayBookings = bookings.filter(b => b.date === today && b.status !== 'canceled').length;
        if (todayBookings > 0) return { text: `${todayBookings} servicio(s) programados para hoy.`, type: 'booking' };
        return null;
      },
      () => {
        const customers = JSON.parse(localStorage.getItem('jhoraji_customers') || '[]');
        if (customers.length > 0) return { text: `Tu base de clientes tiene ${customers.length} registro(s).`, type: 'customer' };
        return null;
      },
    ];

    const interval = setInterval(() => {
      const msgFn = liveMessages[Math.floor(Math.random() * liveMessages.length)];
      const msg = msgFn();
      if (msg) addNotification(msg.text, msg.type);
    }, 3 * 60 * 1000); // Every 3 minutes

    return () => clearInterval(interval);
  }, [isMuted, addNotification]);

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
