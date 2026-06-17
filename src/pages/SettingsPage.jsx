import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bell, Building, Mail, Palette, Phone, Save, Shield, UserCircle, Users, Globe, Unlock, CheckSquare, Square, Database, Download, Upload, AlertTriangle, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { usePermissions } from '../context/PermissionsContext';

const defaultSettings = {
  companyName: 'Jhoraji Tours',
  email: 'info@jhorajitours.com',
  phone: '829-580-8964',
  website: 'https://jhorajitours.com',
  currency: 'USD',
  emailNotif: true,
  emailNotifFreq: 'daily',
  newBookingNotif: true,
  paymentNotif: true,
  pushNotif: false,
  primaryColor: '#0ea5e9',
};

const defaultSessions = [
  { id: 1, device: 'Windows - Chrome', location: 'Santo Domingo, RD', lastSeen: 'Activa ahora', current: true },
  { id: 2, device: 'iPhone 13 - Safari', location: 'Punta Cana, RD', lastSeen: 'Hace 2 días', current: false },
];

const readStoredJson = (key, fallback) => {
  const saved = localStorage.getItem(key);
  if (!saved) return fallback;

  try {
    return { ...fallback, ...JSON.parse(saved) };
  } catch {
    return fallback;
  }
};

const readStoredArray = (key, fallback) => {
  const saved = localStorage.getItem(key);
  if (!saved) return fallback;

  try {
    return JSON.parse(saved);
  } catch {
    return fallback;
  }
};

const settingCardStyle = {
  border: '1px solid var(--border-color)',
  backgroundColor: 'var(--bg-color)',
  borderRadius: 'var(--radius-md)',
  padding: '1rem',
};

const ToggleSwitch = ({ checked, onChange, activeColor = 'var(--primary-color)', label }) => (
  <label aria-label={label} style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px', flex: '0 0 auto' }}>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
    <span style={{ position: 'absolute', cursor: 'pointer', inset: 0, backgroundColor: checked ? activeColor : '#cbd5e1', transition: '.25s', borderRadius: '34px' }}>
      <span style={{ position: 'absolute', height: '16px', width: '16px', left: checked ? '30px' : '4px', bottom: '4px', backgroundColor: 'white', transition: '.25s', borderRadius: '50%' }} />
    </span>
  </label>
);

const SettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();
  const { language, changeLanguage, t } = useLanguage();
  const activeSection = searchParams.get('section') || 'general';
  const [settings, setSettings] = useState(() => readStoredJson('jhoraji_settings', defaultSettings));
  const [sessions, setSessions] = useState(() => readStoredArray('jhoraji_sessions', defaultSessions));
  const [pendingImport, setPendingImport] = useState(null);
  
  const { permissions, updatePermissions, isAdmin } = usePermissions();
  
  const allModules = [
    'dashboard', 'bookings', 'finances', 'tours', 'customers', 'drivers', 
    'providers', 'agencies', 'activities', 'schedule', 'users', 'audit', 
    'orders', 'settings'
  ];
  
  const allActions = ['create', 'edit', 'delete'];
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentUser] = useState(() => readStoredJson('jhoraji_user', {
    name: 'Administrador',
    email: 'admin@jhorajitours.com',
    role: 'Administrador',
    phone: '829-580-8964',
    department: 'Administración',
    status: 'Activo',
    lastAccess: '2026-06-03 10:45 AM',
  }));

  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
  }, [settings.primaryColor]);

  const sections = useMemo(() => {
    const base = [
      { id: 'general', name: t('general'), icon: <Building size={20} /> },
      { id: 'profile', name: t('myProfile'), icon: <UserCircle size={20} /> },
      { id: 'appearance', name: t('appearance'), icon: <Palette size={20} /> },
      { id: 'notifications', name: t('notifications'), icon: <Bell size={20} /> },
      { id: 'security', name: t('security'), icon: <Shield size={20} /> },
    ];
    if (isAdmin) {
      base.push({ id: 'permissions', name: t('permissions'), icon: <Unlock size={20} /> });
      base.push({ id: 'backup', name: 'Respaldo', icon: <Database size={20} /> });
    }
    return base;
  }, [t, isAdmin]);

  const notificationItems = [
    { key: 'emailNotif', title: t('emailNotifications'), desc: t('emailNotificationsDesc') },
    { key: 'newBookingNotif', title: t('newBookingAlerts'), desc: t('newBookingAlertsDesc') },
    { key: 'paymentNotif', title: t('paymentAlerts'), desc: t('paymentAlertsDesc') },
    { key: 'pushNotif', title: t('pushNotifications'), desc: t('pushNotificationsDesc') },
  ];

  const persistSettings = (nextSettings) => {
    setSettings(nextSettings);
    localStorage.setItem('jhoraji_settings', JSON.stringify(nextSettings));
    window.dispatchEvent(new Event('settings_updated'));
  };

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveGeneral = (e) => {
    e.preventDefault();
    localStorage.setItem('jhoraji_settings', JSON.stringify(settings));
    window.dispatchEvent(new Event('settings_updated'));
    addToast(t('changesSaved'), 'success');
  };

  const handleSaveColor = (color) => {
    const nextSettings = { ...settings, primaryColor: color };
    document.documentElement.style.setProperty('--primary-color', color);
    persistSettings(nextSettings);
    addToast(t('colorUpdated'), 'success');
  };

  const handleNotificationChange = async (field, checked) => {
    if (field === 'pushNotif' && checked) {
      if (!('Notification' in window)) {
        addToast(t('browserPermissionUnsupported'), 'warning');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        addToast(t('browserPermissionDenied'), 'warning');
        return;
      }
      addToast(t('browserPermissionGranted'), 'success');
    } else {
      addToast(t('preferenceUpdated'), 'success');
    }

    persistSettings({ ...settings, [field]: checked });
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!currentPassword.trim()) {
      addToast(t('currentPasswordRequired'), 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast(t('passwordsDontMatch'), 'error');
      return;
    }
    if (newPassword.length < 6) {
      addToast(t('passwordTooShort'), 'error');
      return;
    }

    localStorage.setItem('jhoraji_password_updated_at', new Date().toISOString());
    addToast(t('passwordUpdated'), 'success');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleCloseSession = (sessionId) => {
    const nextSessions = sessions.filter((session) => session.id !== sessionId);
    setSessions(nextSessions);
    localStorage.setItem('jhoraji_sessions', JSON.stringify(nextSessions));
    addToast(t('sessionClosed'), 'info');
  };

  const handlePermissionChange = (role, category, item, checked) => {
    updatePermissions(role, category, item, checked);
    addToast(t('preferenceUpdated'), 'success');
  };

  const handleExportData = () => {
    const safeParse = (key, fallback) => {
      try { return JSON.parse(localStorage.getItem(key)) || fallback; }
      catch { return fallback; }
    };

    const dataToExport = {
      tours: safeParse('jhoraji_tours', []),
      customers: safeParse('jhoraji_customers', []),
      drivers: safeParse('jhoraji_drivers', []),
      agencies: safeParse('jhoraji_agencies', []),
      providers: safeParse('jhoraji_providers', []),
      activities: safeParse('jhoraji_act', []),
      bookings: safeParse('jhoraji_bookings', []),
      orders: safeParse('jhoraji_orders', []),
      expenses: safeParse('jhoraji_expenses', []),
      audit: safeParse('jhoraji_audit', []),
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jhoraji_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Copia de seguridad descargada exitosamente', 'success');
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (!importedData.bookings) throw new Error('Formato inválido');
        setPendingImport(importedData);
      } catch (error) {
        addToast('Error al importar. El archivo no es un respaldo válido.', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = null; // Reset file input
  };

  const executeImport = (mode) => {
    if (!pendingImport) return;
    
    try {
      if (mode === 'overwrite') {
        localStorage.setItem('jhoraji_tours', JSON.stringify(pendingImport.tours || []));
        localStorage.setItem('jhoraji_customers', JSON.stringify(pendingImport.customers || []));
        localStorage.setItem('jhoraji_drivers', JSON.stringify(pendingImport.drivers || []));
        localStorage.setItem('jhoraji_agencies', JSON.stringify(pendingImport.agencies || []));
        localStorage.setItem('jhoraji_providers', JSON.stringify(pendingImport.providers || []));
        localStorage.setItem('jhoraji_act', JSON.stringify(pendingImport.activities || []));
        localStorage.setItem('jhoraji_bookings', JSON.stringify(pendingImport.bookings || []));
        localStorage.setItem('jhoraji_orders', JSON.stringify(pendingImport.orders || []));
        localStorage.setItem('jhoraji_expenses', JSON.stringify(pendingImport.expenses || []));
        localStorage.setItem('jhoraji_audit', JSON.stringify(pendingImport.audit || []));
      } else if (mode === 'merge') {
        const mergeArrays = (key, importArr) => {
          if (!importArr || !importArr.length) return;
          const localArr = JSON.parse(localStorage.getItem(key) || '[]');
          
          if (importArr.length > 0 && typeof importArr[0] === 'string') {
            // Simple arrays (tours, activities)
            const combined = [...new Set([...localArr, ...importArr])];
            localStorage.setItem(key, JSON.stringify(combined));
          } else {
            // Object arrays with ID
            const map = new Map();
            localArr.forEach(item => { if(item.id) map.set(item.id, item) });
            importArr.forEach(item => { if(item.id) map.set(item.id, item) });
            localStorage.setItem(key, JSON.stringify(Array.from(map.values())));
          }
        };

        mergeArrays('jhoraji_tours', pendingImport.tours);
        mergeArrays('jhoraji_customers', pendingImport.customers);
        mergeArrays('jhoraji_drivers', pendingImport.drivers);
        mergeArrays('jhoraji_agencies', pendingImport.agencies);
        mergeArrays('jhoraji_providers', pendingImport.providers);
        mergeArrays('jhoraji_act', pendingImport.activities);
        mergeArrays('jhoraji_bookings', pendingImport.bookings);
        mergeArrays('jhoraji_orders', pendingImport.orders);
        mergeArrays('jhoraji_expenses', pendingImport.expenses);
        mergeArrays('jhoraji_audit', pendingImport.audit);
      }
      
      addToast(mode === 'merge' ? 'Datos fusionados correctamente.' : 'Datos restaurados correctamente.', 'success');
      setPendingImport(null);
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      addToast('Error al procesar los datos.', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{t('settingsTitle') || 'Configuración'}</h2>
          <p className="page-subtitle">Personaliza la plataforma a tu medida</p>
        </div>
      </div>

      <div className="settings-container">
        <nav
          className="card"
          style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 220, height: 'fit-content' }}
        >
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setSearchParams(section.id === 'general' ? {} : { section: section.id })}
                className={`sidebar-nav-link ${activeSection === section.id ? 'active' : ''}`}
              >
                {Icon}
                <span className="nav-label">{section.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="d-md-none" style={{ padding: '0 0 1rem 0' }}>
          <div className="tabs">
            {sections.map((section) => (
              <button
                key={section.id}
                className={`tab-btn ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => setSearchParams(section.id === 'general' ? {} : { section: section.id })}
              >
                {section.icon}
                <span style={{ marginLeft: 4 }}>{section.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, padding: '0', maxWidth: '850px' }}>
      {activeSection === 'general' && (
        <form onSubmit={handleSaveGeneral}>
          <h3 className="mb-4">{t('companyInfo')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>{t('companyName')}</label>
                <input type="text" className="form-control" value={settings.companyName} onChange={(e) => handleChange('companyName', e.target.value)} />
              </div>
              <div className="form-group">
                <label>{t('email')}</label>
                <input type="email" className="form-control" value={settings.email} onChange={(e) => handleChange('email', e.target.value)} />
              </div>
              <div className="form-group">
                <label>{t('phone')}</label>
                <input type="tel" className="form-control" value={settings.phone} onChange={(e) => handleChange('phone', e.target.value)} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>{t('website')}</label>
                <input type="url" className="form-control" value={settings.website} onChange={(e) => handleChange('website', e.target.value)} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>{t('currency')}</label>
                <select className="form-control" value={settings.currency} onChange={(e) => handleChange('currency', e.target.value)}>
                  <option value="USD">{t('usdCurrency')}</option>
                  <option value="EUR">{t('eurCurrency')}</option>
                  <option value="DOP">{t('dopCurrency')}</option>
                </select>
              </div>
            </div>
            <div className="mt-4" style={{ paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
              <button type="submit" className="btn btn-primary"><Save size={18} /> {t('saveChanges')}</button>
            </div>
          </form>
        )}

        {activeSection === 'profile' && (
          <div>
            <h3 className="mb-4">{t('accountData')}</h3>
            <div style={{ ...settingCardStyle, display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', fontWeight: 700 }}>
                {currentUser.name?.charAt(0) || 'A'}
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem' }}>{currentUser.name}</h4>
                <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>{currentUser.email}</p>
                <span className="badge badge-primary" style={{ marginTop: '8px', fontSize: '0.7rem' }}>{currentUser.role}</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
              {[
                [t('fullName'), currentUser.name, <UserCircle size={18} />],
                [t('email'), currentUser.email, <Mail size={18} />],
                [t('phone'), currentUser.phone || '829-580-8964', <Phone size={18} />],
                [t('role'), currentUser.role, <Shield size={18} />],
                [t('department'), currentUser.department || 'Administración', <Users size={18} />],
                [t('status'), currentUser.status || 'Activo', <Globe size={18} />],
                [t('lastAccess'), currentUser.lastAccess || '2026-06-03 10:45 AM', <Bell size={18} />],
                [t('accessLevel'), currentUser.role === 'Administrador' ? 'Full Access' : 'Standard', <Shield size={18} />],
              ].map(([label, value, icon]) => (
                <div key={label} style={settingCardStyle}>
                  <p className="text-muted" style={{ margin: '0 0 4px 0', fontSize: '0.85rem' }}>{label}</p>
                  <div className="d-flex align-items-center gap-2" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--primary-color)', flexShrink: 0 }}>{icon}</span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={value}>{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'appearance' && (
          <div>
            <h3 className="mb-4">{t('visualCustomization')}</h3>
            <div className="mb-4">
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 500 }}>{t('systemTheme')}</label>
              <div className="d-flex align-items-center justify-content-between" style={settingCardStyle}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{theme === 'dark' ? t('darkMode') : t('lightMode')}</h4>
                  <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>{t('darkModeDesc')}</p>
                </div>
                <ToggleSwitch checked={theme === 'dark'} onChange={toggleTheme} activeColor="#f59e0b" label={t('systemTheme')} />
              </div>
            </div>

            <div className="mb-4">
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 500 }}>{t('panelLanguage')}</label>
              <div className="d-flex align-items-center justify-content-between" style={settingCardStyle}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{language === 'es' ? t('spanish') : t('english')}</h4>
                  <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>{t('panelLanguageDesc')}</p>
                </div>
                <select className="form-control" style={{ width: '150px' }} value={language} onChange={(e) => changeLanguage(e.target.value)}>
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 500 }}>{t('primaryColor')}</label>
              <div className="d-flex gap-3 mt-2">
                {['#0ea5e9', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleSaveColor(color)}
                    aria-label={color}
                    style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: color, border: settings.primaryColor === color ? '3px solid white' : 'none', outline: settings.primaryColor === color ? `2px solid ${color}` : 'none' }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'notifications' && (
          <div>
            <h3 className="mb-4">{t('notifPreferences')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {notificationItems.map((item) => (
                <div key={item.key} className="d-flex align-items-center justify-content-between" style={settingCardStyle}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{item.title}</h4>
                    <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>{item.desc}</p>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    {settings[item.key] && (
                      <select 
                        className="form-control" 
                        style={{ height: '32px', padding: '0 10px', fontSize: '0.85rem', width: 'auto', borderRadius: 'var(--radius-md)' }}
                        value={settings[`${item.key}Freq`] || (item.key === 'emailNotif' ? 'daily' : 'instant')}
                        onChange={(e) => {
                          persistSettings({ ...settings, [`${item.key}Freq`]: e.target.value });
                          addToast(t('preferenceUpdated') || 'Preferencia actualizada', 'success');
                        }}
                      >
                        <option value="instant">Inmediato</option>
                        <option value="hourly">Cada hora</option>
                        <option value="daily">Diario</option>
                        <option value="weekly">Semanal</option>
                      </select>
                    )}
                    <ToggleSwitch checked={Boolean(settings[item.key])} onChange={(checked) => handleNotificationChange(item.key, checked)} label={item.title} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'security' && (
          <form onSubmit={handleUpdatePassword}>
            <h3 className="mb-4">{t('accountSecurity')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '520px' }}>
              <div className="form-group mb-0">
                <label>{t('currentPassword')}</label>
                <input type="password" className="form-control" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="form-group mb-0">
                <label>{t('newPassword')}</label>
                <input type="password" className="form-control" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div className="form-group mb-0">
                <label>{t('confirmPassword')}</label>
                <input type="password" className="form-control" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#f59e0b' }}>{t('updatePassword')}</button>
            </div>

            <div className="mt-4">
              <h4 style={{ fontSize: '0.9375rem', marginBottom: '15px' }}>{t('activeSessions')}</h4>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                {sessions.map((session, index) => (
                  <div key={session.id} className="p-3 d-flex justify-content-between align-items-center" style={{ padding: '1rem', borderBottom: index === sessions.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{session.device}</div>
                      <div className="text-muted">{session.location} - {session.lastSeen}</div>
                    </div>
                    {session.current ? (
                      <span className="badge badge-warning">{t('currentSession')}</span>
                    ) : (
                      <button type="button" className="btn btn-outline" onClick={() => handleCloseSession(session.id)}>{t('closeSession')}</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </form>
        )}

        {activeSection === 'permissions' && isAdmin && (
          <div>
            <h3 className="mb-4">{t('permissions')}</h3>
            <p className="text-muted mb-4">{t('permissionsDesc')}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {Object.entries(permissions).map(([role, roleData]) => (
                <div key={role} className="card" style={{ padding: '1.2rem', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ margin: '0 0 15px 0', fontSize: '1.05rem', color: 'var(--primary-color)' }}>{t(role === 'Operador de Reservas' ? 'roleOperator' : 'roleAgent')}</h4>
                  
                  <div style={{ marginBottom: '10px', fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.8125rem' }}>{t('moduleAccess')}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', marginBottom: '20px' }}>
                    {allModules.map((module) => {
                      const isGranted = roleData.modules?.[module] || false;
                      return (
                        <div key={module} className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }} onClick={() => handlePermissionChange(role, 'modules', module, !isGranted)}>
                          {isGranted ? <CheckSquare size={16} color="var(--primary-color)" /> : <Square size={16} color="var(--text-light)" />}
                          <span style={{ fontWeight: 500, fontSize: '0.85rem', color: isGranted ? 'var(--text-dark)' : 'var(--text-light)' }}>
                            {t('module' + module.charAt(0).toUpperCase() + module.slice(1))}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ marginBottom: '10px', fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.8125rem' }}>{t('actionPermissions')}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                    {allActions.map((action) => {
                      const isGranted = roleData.actions?.[action] || false;
                      return (
                        <div key={action} className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }} onClick={() => handlePermissionChange(role, 'actions', action, !isGranted)}>
                          {isGranted ? <CheckSquare size={16} color="var(--primary-color)" /> : <Square size={16} color="var(--text-light)" />}
                          <span style={{ fontWeight: 500, fontSize: '0.85rem', color: isGranted ? 'var(--text-dark)' : 'var(--text-light)' }}>
                            {t('action' + action.charAt(0).toUpperCase() + action.slice(1))}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'backup' && isAdmin && (
          <div>
            <h3 className="mb-4">Respaldo y Recuperación (JSON)</h3>
            <p className="text-muted mb-4">Protege tu información exportando tus datos periódicamente. Si alguna vez pierdes información, puedes restaurarla subiendo el archivo JSON de respaldo.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div className="card" style={{ padding: '1rem', textAlign: 'center', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                <Download size={32} color="var(--primary-color)" style={{ marginBottom: '12px' }} />
                <h4 style={{ marginBottom: '8px', fontSize: '1.05rem' }}>Exportar Datos</h4>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '15px' }}>Descarga un archivo JSON con todas tus reservas, clientes, choferes y configuraciones.</p>
                <button onClick={handleExportData} className="btn btn-primary" style={{ width: '100%', height: '36px', fontSize: '0.85rem' }}>
                  Descargar Copia (JSON)
                </button>
              </div>

              <div className="card" style={{ padding: '1rem', textAlign: 'center', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                <Upload size={32} color="var(--warning)" style={{ marginBottom: '12px' }} />
                <h4 style={{ marginBottom: '8px', fontSize: '1.05rem' }}>Importar / Restaurar</h4>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '15px' }}>Sube tu archivo JSON previamente descargado para restaurar el sistema completo.</p>
                <label className="btn btn-outline" style={{ width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '36px', fontSize: '0.85rem', margin: 0 }}>
                  Subir Archivo JSON
                  <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportData} />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>

  {pendingImport && (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 style={{ margin: 0 }}>Importar Datos</h3>
          <button onClick={() => setPendingImport(null)} style={{ background: 'none', color: 'var(--text-light)', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>
        
        <div className="mb-4">
          <p>Has seleccionado un archivo de respaldo. ¿Cómo deseas proceder con la información?</p>
        </div>

        <div className="d-flex flex-column gap-3">
          <button 
            onClick={() => executeImport('merge')} 
            className="btn btn-primary" 
            style={{ justifyContent: 'center', padding: '15px' }}
          >
            <div style={{ textAlign: 'left', width: '100%' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.05rem', marginBottom: '5px' }}>Fusionar Datos (Seguro)</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 'normal', opacity: 0.9 }}>Agrega la información nueva del archivo sin borrar lo que ya tienes en el sistema.</div>
            </div>
          </button>

          <button 
            onClick={() => executeImport('overwrite')} 
            className="btn btn-outline" 
            style={{ justifyContent: 'center', padding: '15px', borderColor: 'var(--danger)', color: 'var(--danger)' }}
          >
            <div style={{ textAlign: 'left', width: '100%' }}>
              <div className="d-flex align-items-center gap-2" style={{ fontWeight: 'bold', fontSize: '1.05rem', marginBottom: '5px' }}>
                <AlertTriangle size={18} /> Reemplazar Todo (Peligroso)
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-light)' }}>Borra todos tus datos actuales y deja el sistema exactamente como está en el archivo.</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )}
    </div>
  );
};

export default SettingsPage;
