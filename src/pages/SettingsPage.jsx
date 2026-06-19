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
    addToast(t('backupDownloaded'), 'success');
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
        addToast(t('importError'), 'error');
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
      
      addToast(mode === 'merge' ? t('dataMerged') : t('dataRestored'), 'success');
      setPendingImport(null);
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      addToast(t('processError'), 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{t('settingsTitle') || 'Configuración'}</h2>
          <p className="page-subtitle">{t('settingsSubtitle')}</p>
        </div>
      </div>

      {/* ── HORIZONTAL TABS ── */}
      <nav className="settings-tabs-bar">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setSearchParams(section.id === 'general' ? {} : { section: section.id })}
            className={`settings-tab ${activeSection === section.id ? 'active' : ''}`}
          >
            <span className="settings-tab-icon">{section.icon}</span>
            <span className="settings-tab-label">{section.name}</span>
          </button>
        ))}
      </nav>

      {/* ── CONTENT PANEL ── */}
      <div className="settings-content">

          {/* ━━━ GENERAL ━━━ */}
          {activeSection === 'general' && (
            <div className="card settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon"><Building size={20} /></div>
                <div>
                  <h3 className="settings-card-title">{t('companyInfo')}</h3>
                  <p className="settings-card-desc">{t('companyInfoDesc')}</p>
                </div>
              </div>
              <div className="settings-card-divider" />
              <form onSubmit={handleSaveGeneral}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                  <div className="form-group mb-0" style={{ gridColumn: '1 / -1' }}>
                    <label>{t('companyName')}</label>
                    <input type="text" className="form-control" value={settings.companyName} onChange={(e) => handleChange('companyName', e.target.value)} />
                  </div>
                  <div className="form-group mb-0">
                    <label>{t('email')}</label>
                    <input type="email" className="form-control" value={settings.email} onChange={(e) => handleChange('email', e.target.value)} />
                  </div>
                  <div className="form-group mb-0">
                    <label>{t('phone')}</label>
                    <input type="tel" className="form-control" value={settings.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                  </div>
                  <div className="form-group mb-0">
                    <label>{t('website')}</label>
                    <input type="url" className="form-control" value={settings.website} onChange={(e) => handleChange('website', e.target.value)} />
                  </div>
                  <div className="form-group mb-0">
                    <label>{t('currency')}</label>
                    <select className="form-control" value={settings.currency} onChange={(e) => handleChange('currency', e.target.value)}>
                      <option value="USD">{t('usdCurrency')}</option>
                      <option value="EUR">{t('eurCurrency')}</option>
                      <option value="DOP">{t('dopCurrency')}</option>
                    </select>
                  </div>
                </div>
                <div className="settings-card-divider" style={{ margin: '1.5rem 0 1rem' }} />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary"><Save size={16} /> {t('saveChanges')}</button>
                </div>
              </form>
            </div>
          )}

          {/* ━━━ PROFILE ━━━ */}
          {activeSection === 'profile' && (
            <>
              <div className="card settings-card">
                <div className="settings-card-header">
                  <div className="settings-card-icon" style={{ background: 'var(--primary-color)', color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>
                    {currentUser.name?.charAt(0) || 'A'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 className="settings-card-title">{currentUser.name}</h3>
                    <p className="settings-card-desc">{currentUser.email}</p>
                  </div>
                  <span className="badge badge-primary" style={{ fontSize: '0.7rem', alignSelf: 'center' }}>{currentUser.role}</span>
                </div>
              </div>
              <div className="card settings-card" style={{ marginTop: '1rem' }}>
                <div className="settings-card-header">
                  <div className="settings-card-icon"><UserCircle size={20} /></div>
                  <div>
                    <h3 className="settings-card-title">{t('accountData')}</h3>
                    <p className="settings-card-desc">{t('accountDataDesc')}</p>
                  </div>
                </div>
                <div className="settings-card-divider" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  {[
                    [t('fullName'), currentUser.name, <UserCircle size={16} key="n" />],
                    [t('email'), currentUser.email, <Mail size={16} key="e" />],
                    [t('phone'), currentUser.phone || '829-580-8964', <Phone size={16} key="p" />],
                    [t('role'), currentUser.role, <Shield size={16} key="r" />],
                    [t('department'), currentUser.department || 'Administración', <Users size={16} key="d" />],
                    [t('status'), currentUser.status || 'Activo', <Globe size={16} key="s" />],
                    [t('lastAccess'), currentUser.lastAccess || '2026-06-03 10:45 AM', <Bell size={16} key="l" />],
                    [t('accessLevel'), currentUser.role === 'Administrador' ? 'Full Access' : 'Standard', <Shield size={16} key="a" />],
                  ].map(([label, value, icon]) => (
                    <div key={label} className="settings-info-item">
                      <span className="settings-info-icon">{icon}</span>
                      <div>
                        <div className="settings-info-label">{label}</div>
                        <div className="settings-info-value">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ━━━ APPEARANCE ━━━ */}
          {activeSection === 'appearance' && (
            <div className="card settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon"><Palette size={20} /></div>
                <div>
                  <h3 className="settings-card-title">{t('visualCustomization')}</h3>
                  <p className="settings-card-desc">{t('appearanceDesc')}</p>
                </div>
              </div>
              <div className="settings-card-divider" />

              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <h4>{t('systemTheme')}</h4>
                  <p>{theme === 'dark' ? t('darkMode') : t('lightMode')} — {t('darkModeDesc')}</p>
                </div>
                <ToggleSwitch checked={theme === 'dark'} onChange={toggleTheme} activeColor="#f59e0b" label={t('systemTheme')} />
              </div>

              <div className="settings-card-divider" />

              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <h4>{t('panelLanguage')}</h4>
                  <p>{language === 'es' ? t('spanish') : t('english')} — {t('panelLanguageDesc')}</p>
                </div>
                <select className="form-control" style={{ width: '150px' }} value={language} onChange={(e) => changeLanguage(e.target.value)}>
                  <option value="es">{t('spanish')}</option>
                  <option value="en">{t('english')}</option>
                </select>
              </div>

              <div className="settings-card-divider" />

              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>{t('primaryColor')}</h4>
                <div className="d-flex gap-3">
                  {['#0ea5e9', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleSaveColor(color)}
                      aria-label={color}
                      className="settings-color-btn"
                      style={{
                        backgroundColor: color,
                        boxShadow: settings.primaryColor === color ? `0 0 0 3px var(--card-bg), 0 0 0 5px ${color}` : 'none',
                        transform: settings.primaryColor === color ? 'scale(1.15)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ━━━ NOTIFICATIONS ━━━ */}
          {activeSection === 'notifications' && (
            <div className="card settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon"><Bell size={20} /></div>
                <div>
                  <h3 className="settings-card-title">{t('notifPreferences')}</h3>
                  <p className="settings-card-desc">{t('notifDesc')}</p>
                </div>
              </div>
              <div className="settings-card-divider" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {notificationItems.map((item, idx) => (
                  <div key={item.key}>
                    <div className="settings-toggle-row">
                      <div className="settings-toggle-info">
                        <h4>{item.title}</h4>
                        <p>{item.desc}</p>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        {settings[item.key] && (
                          <select
                            className="form-control"
                            style={{ height: '32px', padding: '0 10px', fontSize: '0.8rem', width: 'auto', borderRadius: 'var(--radius-md)' }}
                            value={settings[`${item.key}Freq`] || (item.key === 'emailNotif' ? 'daily' : 'instant')}
                            onChange={(e) => {
                              persistSettings({ ...settings, [`${item.key}Freq`]: e.target.value });
                              addToast(t('preferenceUpdated') || 'Preferencia actualizada', 'success');
                            }}
                          >
                            <option value="instant">{t('instant')}</option>
                            <option value="hourly">{t('hourly')}</option>
                            <option value="daily">{t('daily')}</option>
                            <option value="weekly">{t('weekly')}</option>
                          </select>
                        )}
                        <ToggleSwitch checked={Boolean(settings[item.key])} onChange={(checked) => handleNotificationChange(item.key, checked)} label={item.title} />
                      </div>
                    </div>
                    {idx < notificationItems.length - 1 && <div className="settings-card-divider" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ━━━ SECURITY ━━━ */}
          {activeSection === 'security' && (
            <>
              <div className="card settings-card">
                <div className="settings-card-header">
                  <div className="settings-card-icon"><Shield size={20} /></div>
                  <div>
                    <h3 className="settings-card-title">{t('accountSecurity')}</h3>
                    <p className="settings-card-desc">{t('securityDesc')}</p>
                  </div>
                </div>
                <div className="settings-card-divider" />
                <form onSubmit={handleUpdatePassword}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
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
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                    <button type="submit" className="btn btn-warning">{t('updatePassword')}</button>
                  </div>
                </form>
              </div>

              <div className="card settings-card" style={{ marginTop: '1rem' }}>
                <div className="settings-card-header">
                  <div className="settings-card-icon"><Globe size={20} /></div>
                  <div>
                    <h3 className="settings-card-title">{t('activeSessions')}</h3>
                    <p className="settings-card-desc">{t('activeSessionsDesc')}</p>
                  </div>
                </div>
                <div className="settings-card-divider" />
                {sessions.map((session, index) => (
                  <div key={session.id}>
                    <div className="settings-toggle-row">
                      <div className="settings-toggle-info">
                        <h4>{session.device}</h4>
                        <p>{session.location} — {session.lastSeen}</p>
                      </div>
                      {session.current ? (
                        <span className="badge badge-warning">{t('currentSession')}</span>
                      ) : (
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => handleCloseSession(session.id)}>{t('closeSession')}</button>
                      )}
                    </div>
                    {index < sessions.length - 1 && <div className="settings-card-divider" />}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ━━━ PERMISSIONS ━━━ */}
          {activeSection === 'permissions' && isAdmin && (
            <div className="card settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon"><Unlock size={20} /></div>
                <div>
                  <h3 className="settings-card-title">{t('permissions')}</h3>
                  <p className="settings-card-desc">{t('permissionsDesc')}</p>
                </div>
              </div>
              <div className="settings-card-divider" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {Object.entries(permissions).map(([role, roleData]) => (
                  <div key={role} style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', background: 'var(--bg-color)' }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--primary-color)', fontWeight: 700 }}>
                      {t(role === 'Operador de Reservas' ? 'roleOperator' : 'roleAgent')}
                    </h4>

                    <div style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('moduleAccess')}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem', marginBottom: '1.25rem' }}>
                      {allModules.map((module) => {
                        const isGranted = roleData.modules?.[module] || false;
                        return (
                          <div key={module} className="d-flex align-items-center gap-2" style={{ cursor: 'pointer', padding: '0.35rem 0' }} onClick={() => handlePermissionChange(role, 'modules', module, !isGranted)}>
                            {isGranted ? <CheckSquare size={16} color="var(--primary-color)" /> : <Square size={16} color="var(--text-light)" />}
                            <span style={{ fontWeight: 500, fontSize: '0.85rem', color: isGranted ? 'var(--text-dark)' : 'var(--text-light)' }}>
                              {t('module' + module.charAt(0).toUpperCase() + module.slice(1))}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('actionPermissions')}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem' }}>
                      {allActions.map((action) => {
                        const isGranted = roleData.actions?.[action] || false;
                        return (
                          <div key={action} className="d-flex align-items-center gap-2" style={{ cursor: 'pointer', padding: '0.35rem 0' }} onClick={() => handlePermissionChange(role, 'actions', action, !isGranted)}>
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

          {/* ━━━ BACKUP ━━━ */}
          {activeSection === 'backup' && isAdmin && (
            <div className="card settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon"><Database size={20} /></div>
                <div>
                  <h3 className="settings-card-title">{t('backupRecovery')}</h3>
                  <p className="settings-card-desc">{t('backupRecoveryDesc')}</p>
                </div>
              </div>
              <div className="settings-card-divider" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', background: 'var(--bg-color)', textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <Download size={22} color="var(--primary-color)" />
                  </div>
                  <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>{t('exportData')}</h4>
                  <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1rem', lineHeight: 1.5 }}>{t('exportDataDesc')}</p>
                  <button onClick={handleExportData} className="btn btn-primary" style={{ width: '100%', fontSize: '0.85rem' }}>
                    <Download size={15} /> {t('downloadCopy')}
                  </button>
                </div>
                <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', background: 'var(--bg-color)', textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'hsl(38, 92%, 95%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <Upload size={22} color="var(--warning)" />
                  </div>
                  <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>{t('importRestore')}</h4>
                  <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1rem', lineHeight: 1.5 }}>{t('importRestoreDesc')}</p>
                  <label className="btn btn-outline" style={{ width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', margin: 0 }}>
                    <Upload size={15} /> {t('uploadJson')}
                    <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportData} />
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>

      {/* ── IMPORT MODAL ── */}
      {pendingImport && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 style={{ margin: 0 }}>{t('importData')}</h3>
              <button onClick={() => setPendingImport(null)} style={{ background: 'none', color: 'var(--text-light)', border: 'none', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            <div className="mb-4">
              <p>{t('importDataPrompt')}</p>
            </div>
            <div className="d-flex flex-column gap-3">
              <button onClick={() => executeImport('merge')} className="btn btn-primary" style={{ justifyContent: 'center', padding: '15px' }}>
                <div style={{ textAlign: 'left', width: '100%' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.05rem', marginBottom: '5px' }}>{t('mergeData')}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'normal', opacity: 0.9 }}>{t('mergeDataDesc')}</div>
                </div>
              </button>
              <button onClick={() => executeImport('overwrite')} className="btn btn-outline" style={{ justifyContent: 'center', padding: '15px', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                <div style={{ textAlign: 'left', width: '100%' }}>
                  <div className="d-flex align-items-center gap-2" style={{ fontWeight: 'bold', fontSize: '1.05rem', marginBottom: '5px' }}>
                    <AlertTriangle size={18} /> {t('replaceData')}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-light)' }}>{t('replaceDataDesc')}</div>
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
