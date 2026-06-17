import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Activity, BarChart3, Bell, Building2, Calendar, Car, ChevronLeft,
  ChevronRight, ClipboardList, Globe, LayoutDashboard, LogOut, Map,
  Menu, Moon, Search, Settings, Shield, Sun, Truck, UserCog, Users, Wallet, X,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { usePermissions } from '../context/PermissionsContext';
import { useNotifications } from '../context/NotificationsContext';

const buildNavItems = (t, canAccessModule) => [
  {
    title: t('modulos'),
    items: [
      { to: '/', label: t('dashboard'), icon: LayoutDashboard, module: 'dashboard' },
      { to: '/bookings', label: t('reservas'), icon: ClipboardList, module: 'bookings' },
      { to: '/orders', label: t('ordenes'), icon: Truck, module: 'orders' },
      { to: '/schedule', label: t('horario'), icon: Calendar, module: 'schedule' },
    ].filter((i) => canAccessModule(i.module)),
  },
  {
    title: t('gestion'),
    items: [
      { to: '/tours', label: t('tours'), icon: Map, module: 'tours' },
      { to: '/activities', label: t('actividades'), icon: Activity, module: 'activities' },
      { to: '/customers', label: t('clientes'), icon: Users, module: 'customers' },
      { to: '/drivers', label: t('choferes'), icon: Car, module: 'drivers' },
      { to: '/providers', label: t('proveedores'), icon: Building2, module: 'providers' },
      { to: '/agencies', label: t('agencias'), icon: Globe, module: 'agencies' },
    ].filter((i) => canAccessModule(i.module)),
  },
  {
    title: t('administracion'),
    items: [
      { to: '/finances', label: t('finanzas'), icon: Wallet, module: 'finances' },
      { to: '/audit', label: t('auditoria'), icon: BarChart3, module: 'audit' },
      { to: '/users', label: t('usuarios'), icon: UserCog, module: 'users' },
      { to: '/settings', label: t('configuracion'), icon: Settings, module: 'settings' },
    ].filter((i) => canAccessModule(i.module)),
  },
];

const HeaderBell = ({ onLogout }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllRead, clearAll, isMuted, toggleMute } = useNotifications();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!e.target.closest('.notif-wrapper')) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  return (
    <div className="notif-wrapper" style={{ position: 'relative' }}>
      <button
        className="icon-btn"
        onClick={() => setOpen(!open)}
        aria-label="Notificaciones"
        style={{ position: 'relative' }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute', top: 2, right: 2,
              minWidth: 14, height: 14, padding: '0 3px',
              borderRadius: 999, background: 'var(--danger)', color: 'white',
              fontSize: 9, fontWeight: 700, lineHeight: '14px', textAlign: 'center',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown notif-dropdown-mobile">
          <div className="notif-dropdown-header">
            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{t('notificaciones')}</h4>
            <div className="d-flex gap-2">
              {notifications.length > 0 && (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={markAllRead}>
                    {t('marcarLeidas')}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={clearAll} style={{ color: 'var(--danger)' }}>
                    {t('limpiar')}
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="notif-dropdown-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <Bell size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <div>{t('sinNotificaciones')}</div>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.read ? 'unread' : ''}`}
                  onClick={() => { navigate(n.link || '/'); setOpen(false); }}
                >
                  <div
                    className="notif-icon"
                    style={{
                      background: n.read ? 'var(--bg-soft)' : 'var(--primary-50)',
                      color: n.read ? 'var(--text-light)' : 'var(--primary-color)',
                    }}
                  >
                    <Bell size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: n.read ? 500 : 600, color: 'var(--text-dark)' }}>
                      {n.title || n.message}
                    </div>
                    {n.title && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>{n.message}</div>
                    )}
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: 2 }}>
                      {new Date(n.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const UserMenu = ({ user, onLogout }) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!e.target.closest('.user-menu-wrapper')) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  if (!user) return null;
  const initials = (user.name || 'U').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="user-menu-wrapper" style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        className="d-flex align-items-center gap-2"
        style={{
          padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-full)',
          background: 'transparent', color: 'var(--text-dark)',
        }}
      >
        <div className="sidebar-avatar" style={{ width: 26, height: 26, fontSize: '0.6875rem' }}>{initials}</div>
        <div className="desktop-user-info" style={{ textAlign: 'left', lineHeight: 1.2 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 500 }}>{user.name}</div>
          <div style={{ fontSize: '0.625rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {user.role}
          </div>
        </div>
      </button>

      {open && (
        <div
          className="card"
          style={{
            position: 'absolute', top: 'calc(100% + 0.375rem)', right: 0,
            minWidth: 200, padding: '0.375rem', zIndex: 60,
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div style={{ padding: '0.5rem 0.625rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.25rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{user.name}</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-light)' }}>{user.email}</div>
          </div>
          <Link
            to="/settings"
            onClick={() => setOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.4375rem 0.625rem', borderRadius: 'var(--radius-sm)',
              fontSize: '0.8125rem', color: 'var(--text-dark)',
            }}
          >
            <Settings size={14} /> {t('configuracion')}
          </Link>
          <button
            onClick={onLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem', width: '100%',
              padding: '0.4375rem 0.625rem', borderRadius: 'var(--radius-sm)',
              fontSize: '0.8125rem', color: 'var(--danger)', background: 'transparent',
            }}
          >
            <LogOut size={14} /> {t('cerrarSesion')}
          </button>
        </div>
      )}
    </div>
  );
};

const DashboardLayout = () => {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { canAccessModule } = usePermissions();
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jhoraji_user')); } catch { return null; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  useEffect(() => {
    const sync = () => {
      try { setUser(JSON.parse(localStorage.getItem('jhoraji_user'))); } catch { setUser(null); }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('jhoraji_user');
    setUser(null);
    navigate('/login', { replace: true });
  };

  const navSections = buildNavItems(t, canAccessModule);
  const initials = (user?.name || 'J').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="dashboard-layout">
      <div
        className={`sidebar-overlay ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`dashboard-sidebar ${mobileOpen ? 'mobile-open' : ''} ${desktopCollapsed ? 'desktop-collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-header-content">
            <div className="sidebar-logo">J</div>
            <div className="sidebar-text">
              <span className="brand">Jhoraji Tours</span>
              <span className="brand-tag">Operations</span>
            </div>
          </div>
          <button
            className="sidebar-toggle d-none d-md-block"
            onClick={() => setDesktopCollapsed(!desktopCollapsed)}
            aria-label="Colapsar sidebar"
            style={{ display: window.innerWidth >= 1024 ? 'flex' : 'none' }}
          >
            {desktopCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <button
            className="sidebar-toggle d-md-none"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar sidebar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="sidebar-body">
          {navSections.map((section) => (
            <div key={section.title} className="sidebar-section">
              <div className="sidebar-section-title">{section.title}</div>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                    title={desktopCollapsed ? item.label : undefined}
                  >
                    <Icon size={15} />
                    <span className="nav-label">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-text" style={{ minWidth: 0 }}>
              <div className="sidebar-user-name">{user?.name || 'Usuario'}</div>
              <div className="sidebar-user-role">{user?.role || '—'}</div>
            </div>
          </div>
        </div>
      </aside>

      <div className={`dashboard-main ${desktopCollapsed ? 'desktop-collapsed' : ''}`}>
        <header className="dashboard-header">
          <div className="d-flex align-items-center gap-3">
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>
            <div className="desktop-search" style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
              <input
                className="form-control"
                placeholder="Buscar reservas, tours, clientes…"
                style={{ paddingLeft: '2rem', height: 32, borderRadius: 'var(--radius-full)', width: 280, fontSize: '0.8125rem' }}
              />
            </div>
          </div>

          <div className="dashboard-header-actions">
            <button
              className="icon-btn"
              onClick={toggleTheme}
              aria-label="Cambiar tema"
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <HeaderBell onLogout={handleLogout} />
            <UserMenu user={user} onLogout={handleLogout} />
          </div>
        </header>

        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
