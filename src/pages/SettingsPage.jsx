import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bell, Building, Mail, Palette, Phone, Save, Shield, UserCircle, Users, Globe, Unlock, CheckSquare, Square } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

const defaultSettings = {
  companyName: 'Jhoraji Tours',
  email: 'info@jhorajitours.com',
  phone: '829-580-8964',
  website: 'https://jhorajitours.com',
  currency: 'USD',
  emailNotif: true,
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
  const defaultPermissions = {
    'Operador de Reservas': { 
      modules: { dashboard: true, bookings: true, tours: false, customers: true, settings: false },
      actions: { create: true, edit: true, delete: false }
    },
    'Agente de Ventas': { 
      modules: { dashboard: true, bookings: true, tours: true, customers: false, settings: false },
      actions: { create: true, edit: false, delete: false }
    },
  };
  const [permissions, setPermissions] = useState(() => {
    const saved = readStoredJson('jhoraji_permissions', null);
    if (!saved || !saved['Operador de Reservas']?.modules) return defaultPermissions;
    return saved;
  });
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
    if (currentUser.role === 'Administrador' || currentUser.role === 'Admin') {
      base.push({ id: 'permissions', name: t('permissions'), icon: <Unlock size={20} /> });
    }
    return base;
  }, [t, currentUser.role]);

  const notificationItems = [
    { key: 'emailNotif', title: t('emailNotifications'), desc: t('emailNotificationsDesc') },
    { key: 'newBookingNotif', title: t('newBookingAlerts'), desc: t('newBookingAlertsDesc') },
    { key: 'paymentNotif', title: t('paymentAlerts'), desc: t('paymentAlertsDesc') },
    { key: 'pushNotif', title: t('pushNotifications'), desc: t('pushNotificationsDesc') },
  ];

  const persistSettings = (nextSettings) => {
    setSettings(nextSettings);
    localStorage.setItem('jhoraji_settings', JSON.stringify(nextSettings));
  };

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveGeneral = (e) => {
    e.preventDefault();
    localStorage.setItem('jhoraji_settings', JSON.stringify(settings));
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
    const nextPerms = {
      ...permissions,
      [role]: { 
        ...permissions[role], 
        [category]: { ...permissions[role][category], [item]: checked } 
      }
    };
    setPermissions(nextPerms);
    localStorage.setItem('jhoraji_permissions', JSON.stringify(nextPerms));
    addToast(t('preferenceUpdated'), 'success');
  };

  return (
    <div>
      <div className="mb-4">
        <h2>{t('settings')}</h2>
        <p className="text-muted">{t('systemPreferences')}</p>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="settings-container">
          <div style={{ width: '250px', borderRight: '1px solid var(--border-color)', padding: '20px' }} className="d-none d-md-block">
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setSearchParams(section.id === 'general' ? {} : { section: section.id })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    padding: '12px 20px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: activeSection === section.id ? 'var(--bg-color)' : 'transparent',
                    color: activeSection === section.id ? 'var(--primary-color)' : 'var(--text-dark)',
                    fontWeight: activeSection === section.id ? '600' : '500',
                    textAlign: 'left',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {section.icon}
                  {section.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="d-md-none" style={{ padding: '15px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '10px', overflowX: 'auto' }}>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setSearchParams(section.id === 'general' ? {} : { section: section.id })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: activeSection === section.id ? 'var(--primary-color)' : 'transparent',
                  color: activeSection === section.id ? 'white' : 'var(--text-dark)',
                  border: activeSection === section.id ? 'none' : '1px solid var(--border-color)',
                  whiteSpace: 'nowrap',
                }}
              >
                {section.icon}
                {section.name}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, padding: '30px', maxWidth: '850px' }}>
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
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.7rem', fontWeight: 700 }}>
                    {currentUser.name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0' }}>{currentUser.name}</h4>
                    <p className="text-muted" style={{ margin: 0 }}>{currentUser.email}</p>
                    <span className="badge badge-primary" style={{ marginTop: '8px' }}>{currentUser.role}</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
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
                      <p className="text-muted" style={{ margin: '0 0 8px 0' }}>{label}</p>
                      <div className="d-flex align-items-center gap-2" style={{ fontWeight: 600 }}>
                        <span style={{ color: 'var(--primary-color)', flexShrink: 0 }}>{icon}</span>
                        <span style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{value}</span>
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
                      <h4 style={{ margin: 0, fontSize: '1rem' }}>{theme === 'dark' ? t('darkMode') : t('lightMode')}</h4>
                      <p className="text-muted" style={{ margin: 0 }}>{t('darkModeDesc')}</p>
                    </div>
                    <ToggleSwitch checked={theme === 'dark'} onChange={toggleTheme} activeColor="#f59e0b" label={t('systemTheme')} />
                  </div>
                </div>

                <div className="mb-4">
                  <label style={{ display: 'block', marginBottom: '10px', fontWeight: 500 }}>{t('panelLanguage')}</label>
                  <div className="d-flex align-items-center justify-content-between" style={settingCardStyle}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem' }}>{language === 'es' ? t('spanish') : t('english')}</h4>
                      <p className="text-muted" style={{ margin: 0 }}>{t('panelLanguageDesc')}</p>
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
                        <h4 style={{ margin: 0, fontSize: '1rem' }}>{item.title}</h4>
                        <p className="text-muted" style={{ margin: 0 }}>{item.desc}</p>
                      </div>
                      <ToggleSwitch checked={Boolean(settings[item.key])} onChange={(checked) => handleNotificationChange(item.key, checked)} label={item.title} />
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
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>{t('activeSessions')}</h4>
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

            {activeSection === 'permissions' && (currentUser.role === 'Administrador' || currentUser.role === 'Admin') && (
              <div>
                <h3 className="mb-4">{t('permissions')}</h3>
                <p className="text-muted mb-4">{t('permissionsDesc')}</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {Object.entries(permissions).map(([role, roleData]) => (
                    <div key={role} className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                      <h4 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: 'var(--primary-color)' }}>{t(role === 'Operador de Reservas' ? 'roleOperator' : 'roleAgent')}</h4>
                      
                      <div style={{ marginBottom: '10px', fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.95rem' }}>{t('moduleAccess')}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                        {Object.entries(roleData.modules).map(([module, isGranted]) => (
                          <div key={module} className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }} onClick={() => handlePermissionChange(role, 'modules', module, !isGranted)}>
                            {isGranted ? <CheckSquare size={18} color="var(--primary-color)" /> : <Square size={18} color="var(--text-light)" />}
                            <span style={{ fontWeight: 500, color: isGranted ? 'var(--text-dark)' : 'var(--text-light)' }}>
                              {t('module' + module.charAt(0).toUpperCase() + module.slice(1))}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div style={{ marginBottom: '10px', fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.95rem' }}>{t('actionPermissions')}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                        {Object.entries(roleData.actions).map(([action, isGranted]) => (
                          <div key={action} className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }} onClick={() => handlePermissionChange(role, 'actions', action, !isGranted)}>
                            {isGranted ? <CheckSquare size={18} color="var(--primary-color)" /> : <Square size={18} color="var(--text-light)" />}
                            <span style={{ fontWeight: 500, color: isGranted ? 'var(--text-dark)' : 'var(--text-light)' }}>
                              {t('action' + action.charAt(0).toUpperCase() + action.slice(1))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
