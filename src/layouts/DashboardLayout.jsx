import { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
  LayoutDashboard, CalendarDays, Map, Users, Settings, Menu, X, Bell,
  UserCircle, LogOut, Sun, Moon, ChevronDown, CheckCheck, Trash2,
  Truck, Briefcase, Shield, ShieldCheck, CalendarClock, Zap, Building, ClipboardList, DollarSign, BellOff
} from 'lucide-react';

const DashboardLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentUser] = useState(() => {
    const savedUser = localStorage.getItem('jhoraji_user');
    return savedUser
      ? { name: 'Administrador', email: 'admin@jhorajitours.com', role: 'Administrador', phone: '829-580-8964', department: 'Administración', status: 'Activo', ...JSON.parse(savedUser) }
      : { name: 'Administrador', email: 'admin@jhorajitours.com', role: 'Administrador', phone: '829-580-8964', department: 'Administración', status: 'Activo' };
  });
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('jhoraji_notif_muted') === 'true');
  
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('jhoraji_header_notifications');
    if (saved) return JSON.parse(saved);
    
    // Generar notificaciones iniciales usando reservas reales del sistema
    const bookingsData = localStorage.getItem('jhoraji_bookings');
    if (bookingsData) {
      try {
        const bookings = JSON.parse(bookingsData).slice(0, 5);
        return bookings.map((b, i) => ({
          id: b.id || Date.now() + i,
          text: `Nueva reserva de ${b.customer}`,
          time: b.date,
          read: false
        }));
      } catch (e) {}
    }
    return [];
  });
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Determinar rol del usuario ─────────────────────────────────
  const isAdmin = currentUser.role === 'Administrador' || currentUser.role === 'Admin';
  const isOperaciones = !isAdmin;

  // ── Ítems de navegación con control de acceso por rol ──────────
  const navSections = [
    // ---- Sección compartida ----
    {
      label: null,
      items: [
        { name: t('dashboard'), path: '/dashboard', icon: <LayoutDashboard size={20} />, roles: ['all'] },
      ]
    },
    // ---- Módulos operativos (Admin + Operaciones los ven) ----
    {
      label: 'Módulos',
      items: [
        { name: t('bookings'), path: '/bookings', icon: <CalendarDays size={20} />, roles: ['all'] },
        { name: 'Gastos & Liquidación', path: '/finances', icon: <DollarSign size={20} />, roles: ['Admin', 'Operaciones'] },
        { name: t('tours'), path: '/tours', icon: <Map size={20} />, roles: ['all'] },
        { name: t('customers'), path: '/customers', icon: <Users size={20} />, roles: ['all'] },
        { name: t('moduleDrivers') || 'Choferes', path: '/drivers', icon: <Truck size={20} />, roles: ['all'] },
        { name: 'Proveedores', path: '/providers', icon: <Briefcase size={20} />, roles: ['all'] },
        { name: 'Agencias', path: '/agencies', icon: <Building size={20} />, roles: ['all'] },
        { name: 'Actividades', path: '/activities', icon: <Zap size={20} />, roles: ['all'] },
        { name: 'Horario', path: '/schedule', icon: <CalendarClock size={20} />, roles: ['Operaciones'] },
      ]
    },
    // ---- Sección Administración (solo Admin) ----
    {
      label: 'Administración',
      items: [
        { name: t('moduleUsers') || 'Usuarios', path: '/users', icon: <Shield size={20} />, roles: ['Admin'] },
        { name: 'Auditoría', path: '/audit', icon: <ShieldCheck size={20} />, roles: ['Admin'] },
      ]
    },
    // ---- Configuración (todos) ----
    {
      label: null,
      items: [
        { name: t('settings'), path: '/settings', icon: <Settings size={20} />, roles: ['all'] },
      ]
    },
  ];

  const roleKey = isAdmin ? 'Admin' : 'Operaciones';
  const filteredSections = navSections.map(section => ({
    ...section,
    items: section.items.filter(item => item.roles.includes('all') || item.roles.includes(roleKey))
  })).filter(section => section.items.length > 0);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const persistNotifications = (nextNotifications) => {
    setNotifications(nextNotifications);
    localStorage.setItem('jhoraji_header_notifications', JSON.stringify(nextNotifications));
  };

  const markNotificationRead = (id) => {
    persistNotifications(notifications.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
    persistNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    persistNotifications(notifications.filter((n) => n.id !== id));
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Overlay for mobile */}
      <div
        className={`sidebar-overlay ${mobileSidebarOpen ? 'open' : ''}`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''} ${!desktopSidebarOpen ? 'desktop-collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="d-flex align-items-center gap-2 sidebar-header-content">
            <div className="sidebar-logo-box" style={{ width: '40px', height: '40px', minWidth: '40px', backgroundColor: 'var(--primary-color)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '20px' }}>
              JT
            </div>
            <div className="sidebar-text-container">
              <h2 className="sidebar-text" style={{ fontSize: '1.2rem', margin: 0, color: 'var(--primary-color)', whiteSpace: 'nowrap' }}>Jhoraji Tours</h2>
              <span className="sidebar-text" style={{ fontSize: '0.8rem', color: 'var(--text-light)', whiteSpace: 'nowrap' }}>{t('adminPanel')}</span>
            </div>
          </div>
          <button className="mobile-menu-btn d-lg-none" onClick={() => setMobileSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, overflowY: 'auto' }}>
          {filteredSections.map((section, si) => (
            <div key={si} style={{ marginBottom: '8px' }}>
              {section.label && desktopSidebarOpen && (
                <div style={{ padding: '6px 20px 4px', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7 }}>
                  {section.label}
                </div>
              )}
              {section.label && !desktopSidebarOpen && (
                <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '6px 8px' }} />
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileSidebarOpen(false)}
                  className="sidebar-nav-link"
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-md)',
                    color: isActive ? 'var(--primary-color)' : 'var(--text-light)',
                    backgroundColor: isActive ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
                    fontWeight: isActive ? '600' : '500',
                    transition: 'all 0.2s',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    marginBottom: '1px',
                  })}
                >
                  <div style={{ minWidth: '20px', display: 'flex', justifyContent: 'center' }}>{item.icon}</div>
                  <span className="sidebar-text">{item.name}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <button
            onClick={() => { localStorage.removeItem('jhoraji_user'); navigate('/login', { replace: true }); }}
            className="sidebar-logout-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 20px', color: 'var(--danger)', background: 'none', width: '100%', borderRadius: 'var(--radius-md)', fontWeight: '500', transition: 'all 0.2s', overflow: 'hidden', whiteSpace: 'nowrap', border: 'none', cursor: 'pointer' }}>
            <div style={{ minWidth: '20px', display: 'flex', justifyContent: 'center' }}><LogOut size={20} /></div>
            <span className="sidebar-text">{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`dashboard-main ${!desktopSidebarOpen ? 'desktop-collapsed' : ''}`}>
        {/* Header */}
        <header className="dashboard-header">
          <div className="d-flex align-items-center gap-3">
            <button className="mobile-menu-btn d-lg-none" onClick={() => setMobileSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <button className="mobile-menu-btn d-none d-lg-block" onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}>
              <Menu size={24} />
            </button>
          </div>

          <div className="d-flex align-items-center gap-4 dashboard-header-actions">

            {/* Theme Toggle */}
            <button onClick={toggleTheme} style={{ background: 'none', color: 'var(--text-light)' }}>
              {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
            </button>

            {/* Notifications */}
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button onClick={() => setNotifOpen(!notifOpen)} style={{ background: 'none', position: 'relative', color: 'var(--text-light)' }}>
                {isMuted ? <BellOff size={22} /> : <Bell size={22} />}
                {!isMuted && unreadCount > 0 && <span style={{ position: 'absolute', top: '-4px', right: '-5px', minWidth: '16px', height: '16px', padding: '0 4px', backgroundColor: 'var(--danger)', borderRadius: '999px', color: '#fff', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{unreadCount}</span>}
              </button>
              {notifOpen && (
                <div style={{ position: 'absolute', top: '100%', right: '0', marginTop: '10px', width: '340px', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)', zIndex: 60, overflow: 'hidden' }}>
                  <div className="d-flex justify-content-between align-items-center" style={{ padding: '15px', borderBottom: '1px solid var(--border-color)', fontWeight: '600' }}>
                    <span>{t('notifications')}</span>
                    <div className="d-flex gap-2">
                      <button 
                        type="button" 
                        title={isMuted ? "Activar notificaciones" : "Silenciar notificaciones"} 
                        onClick={() => {
                          const nextState = !isMuted;
                          setIsMuted(nextState);
                          localStorage.setItem('jhoraji_notif_muted', nextState);
                        }} 
                        style={{ background: isMuted ? 'rgba(239,68,68,0.1)' : 'var(--bg-color)', color: isMuted ? 'var(--danger)' : 'var(--text-light)', borderRadius: 'var(--radius-md)', padding: '6px', display: 'flex' }}
                      >
                        {isMuted ? <BellOff size={16} /> : <Bell size={16} />}
                      </button>
                      <button type="button" title="Marcar todas" onClick={markAllNotificationsRead} style={{ background: 'var(--bg-color)', color: 'var(--primary-color)', borderRadius: 'var(--radius-md)', padding: '6px', display: 'flex' }}>
                        <CheckCheck size={16} />
                      </button>
                    </div>
                  </div>
                  <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {notifications.length === 0 && <div className="text-muted" style={{ padding: '16px', textAlign: 'center' }}>{t('notifications')}</div>}
                    {notifications.map(n => (
                      <div key={n.id} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: n.read ? 'var(--card-bg)' : 'var(--bg-color)', fontSize: '0.9rem' }}>
                        <div className="d-flex justify-content-between gap-2">
                          <div>
                            <div style={{ color: 'var(--text-dark)', marginBottom: '5px', fontWeight: n.read ? 500 : 700 }}>{n.text}</div>
                            <div style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>{n.time}</div>
                          </div>
                          <div className="d-flex gap-1">
                            {!n.read && (
                              <button type="button" title="Leída" onClick={() => markNotificationRead(n.id)} style={{ background: 'transparent', color: 'var(--primary-color)', padding: '2px' }}>
                                <CheckCheck size={16} />
                              </button>
                            )}
                            <button type="button" title="Eliminar" onClick={() => deleteNotification(n.id)} style={{ background: 'transparent', color: 'var(--danger)', padding: '2px' }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '10px', textAlign: 'center' }}>
                    <button type="button" className="btn btn-primary" onClick={() => { setNotifOpen(false); navigate('/settings?section=notifications'); }} style={{ width: '100%', padding: '10px', fontSize: '0.9rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', borderRadius: 'var(--radius-md)' }}><Settings size={18} /> Configurar alertas</button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div style={{ position: 'relative' }} ref={profileRef}>
              <button onClick={() => setProfileOpen(!profileOpen)} className="d-flex align-items-center gap-2" style={{ background: 'none', border: 'none' }}>
                <UserCircle size={32} color="var(--primary-color)" />
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }} className="desktop-user-info">
                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-dark)' }}>{currentUser.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{currentUser.role}</span>
                </div>
                <ChevronDown size={16} color="var(--text-light)" />
              </button>
              {profileOpen && (
                <div style={{ position: 'absolute', top: '100%', right: '0', marginTop: '10px', width: '270px', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)', zIndex: 60, padding: '10px 0' }}>
                  <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-color)', marginBottom: '6px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{currentUser.name}</div>
                    <div className="text-muted" style={{ marginTop: '2px' }}>{currentUser.email}</div>
                    <div className="d-flex gap-2" style={{ marginTop: '8px', flexWrap: 'wrap' }}>
                      <span className={`badge ${isAdmin ? 'badge-danger' : 'badge-primary'}`}>{currentUser.role}</span>
                      <span className="badge badge-success">{currentUser.status || 'Activo'}</span>
                    </div>
                    <div className="text-muted" style={{ marginTop: '8px', fontSize: '0.82rem' }}>{currentUser.department || 'Administración'} · {currentUser.phone || '829-580-8964'}</div>
                  </div>
                  <button className="dropdown-item" style={{ width: '100%', padding: '10px 20px', textAlign: 'left', background: 'none', color: 'var(--text-dark)' }} onClick={() => { setProfileOpen(false); navigate('/settings?section=profile'); }}>{t('myProfile')}</button>
                  <button className="dropdown-item" style={{ width: '100%', padding: '10px 20px', textAlign: 'left', background: 'none', color: 'var(--text-dark)' }} onClick={() => { setProfileOpen(false); navigate('/settings'); }}>{t('settings')}</button>
                  <div style={{ borderTop: '1px solid var(--border-color)', margin: '5px 0' }}></div>
                  <button className="dropdown-item" style={{ width: '100%', padding: '10px 20px', textAlign: 'left', background: 'none', color: 'var(--danger)' }} onClick={() => { localStorage.removeItem('jhoraji_user'); navigate('/login', { replace: true }); }}>{t('logout')}</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="dashboard-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
