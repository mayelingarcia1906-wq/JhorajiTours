import { useMemo, useState } from 'react';
import { Edit3, Eraser, Plus, Search, Trash2, Shield, User, X, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Pagination } from '../components/Pagination';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import usersData from '../data/users.json';

const initialUsers = usersData.map((u, i) => ({
  id: Date.now() + i,
  name: u.name,
  email: u.email,
  role: u.role === 'Administrador' ? 'Admin' : 'Operaciones',
  active: u.status === 'Activo',
}));

const emptyUser = {
  name: '',
  email: '',
  role: 'Operaciones',
  password: '',
  active: true,
};

const logAudit = (action, detail) => {
  try {
    const logs = JSON.parse(localStorage.getItem('jhoraji_audit') || '[]');
    logs.unshift({ id: Date.now(), module: 'Usuarios', action, detail, user: 'Administrador', timestamp: new Date().toISOString() });
    localStorage.setItem('jhoraji_audit', JSON.stringify(logs.slice(0, 200)));
  } catch (e) {}
};

const readStoredUsers = () => {
  const saved = localStorage.getItem('jhoraji_users_list');
  if (!saved) return initialUsers;
  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length === 0) return initialUsers;
    return parsed;
  } catch {
    return initialUsers;
  }
};

const UsersPage = () => {
  const { addToast } = useToast();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  const [users, setUsers] = useState(readStoredUsers);
  const [editingUser, setEditingUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const checkCapsLock = (e) => {
    if (e.getModifierState) {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const persistUsers = (nextUsers) => {
    setUsers(nextUsers);
    localStorage.setItem('jhoraji_users_list', JSON.stringify(nextUsers));
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const term = appliedSearch.toLowerCase();
      return (u.name || '').toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term) || (u.role || '').toLowerCase().includes(term);
    });
  }, [users, appliedSearch]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentItems = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearch = () => {
    setAppliedSearch(searchQuery);
    setCurrentPage(1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const clearSearch = () => {
    setSearchQuery('');
    setAppliedSearch('');
    setCurrentPage(1);
  };

  const toggleActive = (id) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    const newState = !user.active;
    const nextUsers = users.map((u) => (u.id === id ? { ...u, active: newState } : u));
    persistUsers(nextUsers);
    logAudit(newState ? 'Activó usuario' : 'Desactivó usuario', user.name);
    addToast(t('preferenceUpdated'), 'success');
  };

  const handleSaveUser = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    if (!editingUser.id || password) {
      if (password !== confirmPassword) {
        addToast('Las contraseñas no coinciden', 'error');
        return;
      }
    }

    const submitted = {
      id: editingUser.id || Date.now(),
      name: formData.get('name').trim(),
      email: formData.get('email').trim(),
      role: formData.get('role'),
      active: editingUser.id ? editingUser.active : true,
    };

    const nextUsers = editingUser.id
      ? users.map((u) => (u.id === editingUser.id ? { ...u, ...submitted } : u))
      : [submitted, ...users];

    persistUsers(nextUsers);
    setEditingUser(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setCapsLockOn(false);
    setFocusedField(null);
    addToast(t('preferenceUpdated'), 'success');
  };

  const handleDelete = () => {
    persistUsers(users.filter((u) => u.id !== showDeleteConfirm));
    addToast(t('preferenceUpdated'), 'success');
    setShowDeleteConfirm(null);
  };

  return (
    <div>
      <div className="page-header mb-4">
        <div>
          <h2>{t('moduleUsers') || 'Gestión de Usuarios'}</h2>
          <p className="text-muted" style={{ margin: 0 }}>{t('usersSubtitle') || 'Administra los accesos al sistema'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditingUser({ ...emptyUser })}>
          <Plus size={18} /> {t('newUser') || 'Nuevo Usuario'}
        </button>
      </div>

      <div className="dashboard-grid-2" style={{ gridTemplateColumns: '1fr', gap: '20px' }}>
        <div className="card">
          <div className="page-toolbar mb-4">
            <div className="search-integrated">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder={t('searchUser') || 'Buscar usuarios...'}
                className="form-control"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className={`search-clear-btn ${searchQuery ? 'visible' : ''}`}
                onClick={clearSearch}
                title="Limpiar búsqueda"
                type="button"
              >
                <Eraser size={15} />
              </button>
              <button className="search-btn-inner" onClick={handleSearch} type="button">
                <Search size={13} /> {t('search') || 'Buscar'}
              </button>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('user') || 'Usuario'}</th>
                  <th>{t('role') || 'Rol'}</th>
                  <th>{t('status') || 'Estado'}</th>
                  <th>{t('actions') || 'Acciones'}</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', flexShrink: 0 }}>
                          <User size={20} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span className="font-bold" style={{ color: 'var(--text-dark)' }}>{u.name}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '2px' }}>{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <Shield size={16} color={u.role === 'Admin' ? 'var(--danger)' : 'var(--primary-color)'} />
                        <span style={{ fontWeight: u.role === 'Admin' ? 600 : 400 }}>{u.role}</span>
                      </div>
                    </td>
                    <td>
                      <button className={`badge ${u.active ? 'badge-success' : 'badge-danger'}`} style={{ border: 'none', cursor: 'pointer' }} onClick={() => toggleActive(u.id)}>
                        {u.active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="icon-btn" onClick={() => setEditingUser(u)} title={t('edit')}><Edit3 size={18} /></button>
                        <button className="icon-btn" onClick={() => setShowDeleteConfirm(u.id)} title={t('delete')} style={{ color: 'var(--danger)' }}><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '0 1rem', paddingBottom: '1rem' }}>
            <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredUsers.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
          </div>
        </div>
      </div>

      {editingUser && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 style={{ margin: 0 }}>{editingUser.id ? (t('editUser') || 'Editar Usuario') : (t('newUser') || 'Nuevo Usuario')}</h3>
              <button onClick={() => setEditingUser(null)} style={{ background: 'none', color: 'var(--text-light)' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveUser}>
              <div className="form-group">
                <label>Nombre</label>
                <input name="name" type="text" className="form-control" required defaultValue={editingUser.name} />
              </div>
              <div className="form-group">
                <label>Correo</label>
                <input name="email" type="email" className="form-control" required defaultValue={editingUser.email} />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select name="role" className="form-control" defaultValue={editingUser.role}>
                  <option value="Operaciones">Operaciones</option>
                  <option value="Admin">Administrador</option>
                </select>
              </div>
              <div className="form-group">
                <label>Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    name="password" 
                    type={showPassword ? "text" : "password"} 
                    className="form-control" 
                    placeholder={editingUser.id ? "(Dejar en blanco para no cambiar)" : "(Requerida)"} 
                    required={!editingUser.id}
                    onKeyUp={checkCapsLock}
                    onKeyDown={checkCapsLock}
                    onClick={checkCapsLock}
                    onFocus={(e) => { setFocusedField('password'); checkCapsLock(e); }}
                    onBlur={() => setFocusedField(null)}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', padding: 0, display: 'flex' }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {capsLockOn && focusedField === 'password' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)', fontSize: '0.85rem', marginTop: '5px' }}>
                    <AlertTriangle size={16} /> Mayúsculas activadas
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Confirmar Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    name="confirmPassword" 
                    type={showConfirmPassword ? "text" : "password"} 
                    className="form-control" 
                    placeholder={editingUser.id ? "(Dejar en blanco para no cambiar)" : "(Requerida)"} 
                    required={!editingUser.id}
                    onKeyUp={checkCapsLock}
                    onKeyDown={checkCapsLock}
                    onClick={checkCapsLock}
                    onFocus={(e) => { setFocusedField('confirmPassword'); checkCapsLock(e); }}
                    onBlur={() => setFocusedField(null)}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', padding: 0, display: 'flex' }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {capsLockOn && focusedField === 'confirmPassword' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)', fontSize: '0.85rem', marginTop: '5px' }}>
                    <AlertTriangle size={16} /> Mayúsculas activadas
                  </div>
                )}
              </div>

              <div className="modal-actions mt-4">
                <button type="button" className="btn btn-outline" onClick={() => { setEditingUser(null); setShowPassword(false); setShowConfirmPassword(false); setCapsLockOn(false); setFocusedField(null); }}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">{editingUser.id ? t('update') : t('create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(null)}
        onConfirm={handleDelete}
        title={t('deleteUserTitle') || 'Eliminar Usuario'}
        message="¿Estás seguro que deseas eliminar este usuario? Esta acción no se puede deshacer."
      />
    </div>
  );
};

export default UsersPage;
