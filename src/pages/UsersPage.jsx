import { useMemo, useState } from 'react';
import { Edit3, Eraser, Plus, Search, Shield, User, X, Eye, EyeOff, AlertTriangle, CheckCircle2, Mail } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Pagination } from '../components/Pagination';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import usersData from '../data/users.json';

const STORAGE_KEY = 'jhoraji_users_list_v3';
const AUDIT_KEY = 'jhoraji_audit';

const read = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const logAudit = (action, detail) => {
  const logs = read(AUDIT_KEY, []);
  logs.unshift({ id: Date.now(), module: 'Usuarios', action, detail, user: 'Administrador', timestamp: new Date().toISOString() });
  write(AUDIT_KEY, logs.slice(0, 200));
};

const initialUsers = usersData.map((u, i) => ({
  id: Date.now() + i,
  name: u.name,
  email: u.email,
  role: u.role === 'Administrador' ? 'Admin' : 'Operaciones',
  active: u.status === 'Activo',
}));

const emptyUser = { name: '', email: '', role: 'Operaciones', password: '', active: true };

const UsersPage = () => {
  const { t, language } = useLanguage();
  const { addToast } = useToast();
  const [users, setUsers] = useState(() => read(STORAGE_KEY, initialUsers));
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;
  const [editing, setEditing] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const filtered = useMemo(() => {
    const term = applied.toLowerCase();
    return users.filter((u) => u.name?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term) || u.role?.toLowerCase().includes(term));
  }, [users, applied]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const persist = (next) => { setUsers(next); write(STORAGE_KEY, next); };

  const toggleActive = (id) => {
    const user = users.find((u) => u.id === id);
    const newState = !user.active;
    persist(users.map((u) => (u.id === id ? { ...u, active: newState } : u)));
    logAudit(newState ? t('statusUpdated') : t('statusUpdated'), user.name);
    addToast(t('statusUpdated'), 'success');
  };

  const handleSave = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = fd.get('password');
    const confirm = fd.get('confirmPassword');
    if (!editing.id || password) {
      if (password !== confirm) return addToast(t('passwordsDontMatch'), 'error');
    }
    const submitted = {
      id: editing.id || Date.now(),
      name: fd.get('name').trim(),
      email: fd.get('email').trim(),
      role: fd.get('role'),
      active: editing.id ? editing.active : true,
    };
    persist(editing.id ? users.map((u) => (u.id === editing.id ? { ...u, ...submitted } : u)) : [submitted, ...users]);
    setEditing(null);
    setShowPwd(false); setShowConfirmPwd(false);
    addToast(t('userSaved'), 'success');
  };

  const handleDelete = () => {
    persist(users.filter((u) => u.id !== showDelete));
    addToast(t('userDeleted'), 'success');
    setShowDelete(null);
  };

  const total = users.length;
  const admins = users.filter((u) => u.role === 'Admin').length;
  const ops = users.filter((u) => u.role === 'Operaciones').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{t('moduleUsers') || 'Gestión de Usuarios'}</h2>
          <p className="page-subtitle">{t('usersSubtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({ ...emptyUser })}>
          <Plus size={16} /> {t('newUser') || 'Nuevo Usuario'}
        </button>
      </div>

      <div className="stats-grid mb-4">
        <div className="stat-card tone-primary">
          <div className="stat-header">
            <span className="stat-label">{t('totalUsers')}</span>
            <div className="stat-icon"><User size={18} /></div>
          </div>
          <div className="stat-value">{total}</div>
        </div>
        <div className="stat-card tone-danger">
          <div className="stat-header">
            <span className="stat-label">{t('admins')}</span>
            <div className="stat-icon"><Shield size={18} /></div>
          </div>
          <div className="stat-value">{admins}</div>
        </div>
        <div className="stat-card tone-success">
          <div className="stat-header">
            <span className="stat-label">{t('ops')}</span>
            <div className="stat-icon"><User size={18} /></div>
          </div>
          <div className="stat-value">{ops}</div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="page-toolbar">
          <div className="search-integrated">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder={t('searchUsersPlaceholder')}
              className="form-control"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (setApplied(search), setPage(1))}
            />
            {search && (
              <button className="search-clear-btn visible" onClick={() => { setSearch(''); setApplied(''); setPage(1); }} type="button">
                <Eraser size={14} />
              </button>
            )}
            <button className="search-btn-inner" onClick={() => { setApplied(search); setPage(1); }} type="button">
              <Search size={12} /> {t('search')}
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper" style={{ borderRadius: 0, border: 'none' }}>
          <table className="table compact-table">
            <thead>
              <tr>
                <th>{t('user')}</th>
                <th>{t('role')}</th>
                <th>{t('status')}</th>
                <th style={{ textAlign: 'right' }}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-faint)' }}>
                    <User size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <div>{t('noUsers')}</div>
                  </td>
                </tr>
              ) : currentItems.map((u) => {
                const initials = u.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.78rem', flexShrink: 0 }}>{initials}</div>
                        <div>
                          <div className="font-bold">{u.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Mail size={11} /> {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.role === 'Admin' ? 'badge-danger' : 'badge-primary'}`}>
                        <Shield size={11} /> {u.role}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`badge ${u.active ? 'badge-success' : 'badge-neutral'}`}
                        style={{ border: 'none', cursor: 'pointer' }}
                        onClick={() => toggleActive(u.id)}
                      >
                        <span className="status-dot" style={{ background: u.active ? 'var(--success)' : 'var(--text-faint)' }} />
                        {u.active ? t('active') : t('inactive')}
                      </button>
                    </td>
                    <td>
                      <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                        <button className="icon-btn" onClick={() => setEditing({ ...u })} title={t('edit')}><Edit3 size={15} /></button>
                        <button className="icon-btn danger" onClick={() => setShowDelete(u.id)} title={t('delete')}><X size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={itemsPerPage} onPageChange={setPage} />
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>{editing.id ? t('editUser') : t('newUser')}</h3>
              <button className="modal-close" onClick={() => setEditing(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>{t('name')}</label>
                <input name="name" type="text" className="form-control" required defaultValue={editing.name} />
              </div>
              <div className="form-group">
                <label>{t('email')}</label>
                <input name="email" type="email" className="form-control" required defaultValue={editing.email} />
              </div>
              <div className="form-group">
                <label>{t('role')}</label>
                <select name="role" className="form-control" defaultValue={editing.role}>
                  <option value="Operaciones">{t('ops')}</option>
                  <option value="Admin">{t('admins')}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{editing.id ? t('passwordOptional') : t('password')}</label>
                <div className="input-with-icon" style={{ display: 'block' }}>
                  <input
                    name="password"
                    type={showPwd ? 'text' : 'password'}
                    className="form-control"
                    placeholder={editing.id ? t('leaveBlank') : t('passwordRequired')}
                    required={!editing.id}
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button type="button" className="toggle-eye" onClick={() => setShowPwd(!showPwd)}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>{t('confirmPassword')}</label>
                <div className="input-with-icon" style={{ display: 'block' }}>
                  <input
                    name="confirmPassword"
                    type={showConfirmPwd ? 'text' : 'password'}
                    className="form-control"
                    placeholder={editing.id ? t('leaveBlank') : t('passwordRequired')}
                    required={!editing.id}
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button type="button" className="toggle-eye" onClick={() => setShowConfirmPwd(!showConfirmPwd)}>
                    {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">{editing.id ? t('update') : t('create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal isOpen={!!showDelete} onCancel={() => setShowDelete(null)} onConfirm={handleDelete} title={t('deleteUserTitle')} message={t('deleteUserMessage')} />
    </div>
  );
};

export default UsersPage;
