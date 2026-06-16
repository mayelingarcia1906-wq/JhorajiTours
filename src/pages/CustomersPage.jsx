import { useMemo, useState } from 'react';
import { Edit3, Eraser, Eye, Globe, Mail, Phone, Plus, Search, Trash2, User, X, Users } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { Pagination } from '../components/Pagination';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { useToast } from '../context/ToastContext';
import { useNotifications } from '../context/NotificationsContext';

const STORAGE_KEY = 'jhoraji_customers';
const read = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const emptyCustomer = {
  name: '', email: '', phone: '', country: '',
  status: 'new', totalBookings: 0, totalSpent: '$0.00',
  lastVisit: new Date().toISOString().split('T')[0],
};

const STATUS_TONE = { new: 'primary', active: 'success', vip: 'warning' };

const CustomersPage = () => {
  const { addToast } = useToast();
  const { t } = useLanguage();
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [customers, setCustomers] = useState(() => read(STORAGE_KEY, []));

  const tabs = ['all', 'new', 'active', 'vip'];

  const filtered = useMemo(() => {
    const term = applied.toLowerCase();
    return customers.filter((c) => {
      if (activeTab !== 'all' && c.status !== activeTab) return false;
      if (!term) return true;
      return [c.name, c.email, c.country, c.phone].some((v) => String(v || '').toLowerCase().includes(term));
    });
  }, [customers, activeTab, applied]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const persist = (next) => { setCustomers(next); write(STORAGE_KEY, next); };

  const handleSave = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const submitted = {
      id: editing.id || Date.now(),
      name: fd.get('name').trim(),
      email: fd.get('email').trim(),
      phone: fd.get('phone').trim(),
      country: fd.get('country'),
      status: fd.get('status'),
      totalBookings: editing.totalBookings || 0,
      totalSpent: editing.totalSpent || '$0.00',
      lastVisit: editing.lastVisit || new Date().toISOString().split('T')[0],
    };
    persist(editing.id ? customers.map((c) => (c.id === editing.id ? submitted : c)) : [submitted, ...customers]);
    if (!editing.id) addNotification(`Nuevo cliente: ${submitted.name}`);
    setEditing(null);
    addToast('Cliente guardado', 'success');
  };

  const handleDelete = () => {
    persist(customers.filter((c) => c.id !== showDelete));
    addToast('Cliente eliminado', 'success');
    setShowDelete(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{t('customersTitle')}</h2>
          <p className="page-subtitle">{t('customersSubtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({ ...emptyCustomer })}>
          <Plus size={16} /> {t('newCustomer')}
        </button>
      </div>

      <div className="card mb-4">
        <div className="page-toolbar">
          <div className="tabs" style={{ paddingBottom: 0 }}>
            {tabs.map((tab) => (
              <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => { setActiveTab(tab); setPage(1); }}>
                {t(tab)}
              </button>
            ))}
          </div>
          <div className="search-integrated">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder={t('searchCustomers')}
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
                <th>{t('customer')}</th>
                <th>{t('contact')}</th>
                <th>{t('country')}</th>
                <th>{t('totalBookings')}</th>
                <th>{t('totalSpent')}</th>
                <th>{t('lastVisit')}</th>
                <th>{t('status')}</th>
                <th style={{ textAlign: 'right' }}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-faint)' }}>
                    <Users size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <div>No hay clientes</div>
                  </td>
                </tr>
              ) : currentItems.map((c) => {
                const initials = c.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.78rem', flexShrink: 0 }}>{initials}</div>
                        <div>
                          <div className="font-bold">{c.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>{c.phone}</td>
                    <td style={{ fontSize: '0.82rem' }}>{c.country}</td>
                    <td>{c.totalBookings}</td>
                    <td className="font-bold">{c.totalSpent}</td>
                    <td style={{ fontSize: '0.82rem' }}>{c.lastVisit}</td>
                    <td>
                      <span className={`badge badge-${STATUS_TONE[c.status] || 'neutral'}`}>
                        {t(c.status)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                        <button className="icon-btn" onClick={() => setSelected(c)} title={t('view')}><Eye size={15} /></button>
                        <button className="icon-btn" onClick={() => setEditing({ ...c })} title={t('edit')}><Edit3 size={15} /></button>
                        <button className="icon-btn danger" onClick={() => setShowDelete(c.id)} title={t('delete')}><Trash2 size={15} /></button>
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

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3>Perfil del cliente</h3>
              <button className="modal-close" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-soft)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.4rem', flexShrink: 0 }}>
                {selected.name.charAt(0)}
              </div>
              <div>
                <h4 style={{ margin: 0, marginBottom: 4 }}>{selected.name}</h4>
                <span className={`badge badge-${STATUS_TONE[selected.status] || 'neutral'}`}>{t(selected.status)}</span>
              </div>
            </div>
            <div className="responsive-grid">
              <div><p className="text-muted mb-1">{t('email')}</p><div className="d-flex align-items-center gap-2"><Mail size={16} />{selected.email}</div></div>
              <div><p className="text-muted mb-1">{t('phone')}</p><div className="d-flex align-items-center gap-2"><Phone size={16} />{selected.phone}</div></div>
              <div><p className="text-muted mb-1">{t('country')}</p><div className="d-flex align-items-center gap-2"><Globe size={16} />{selected.country}</div></div>
              <div><p className="text-muted mb-1">{t('status')}</p><div className="d-flex align-items-center gap-2"><User size={16} />{t(selected.status)}</div></div>
              <div><p className="text-muted mb-1">{t('totalBookings')}</p><div className="font-bold">{selected.totalBookings}</div></div>
              <div><p className="text-muted mb-1">{t('totalSpent')}</p><div className="font-bold">{selected.totalSpent}</div></div>
              <div><p className="text-muted mb-1">{t('lastVisit')}</p><div>{selected.lastVisit}</div></div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Cerrar</button>
              <button className="btn btn-primary" onClick={() => { setSelected(null); setEditing({ ...selected }); }}>Editar</button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing.id ? t('editCustomer') : t('newCustomer')}</h3>
              <button className="modal-close" onClick={() => setEditing(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="responsive-grid">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Nombre completo</label>
                  <input name="name" type="text" className="form-control" required defaultValue={editing.name} onInput={(e) => e.target.value = e.target.value.replace(/[0-9]/g, '')} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input name="email" type="email" className="form-control" required defaultValue={editing.email} />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input name="phone" type="tel" className="form-control" required defaultValue={editing.phone} onInput={(e) => e.target.value = e.target.value.replace(/[^0-9+\-\s()]/g, '')} />
                </div>
                <div className="form-group">
                  <label>País</label>
                  <select name="country" className="form-control" required defaultValue={editing.country || ''}>
                    <option value="" disabled>Seleccionar…</option>
                    <option value="República Dominicana">República Dominicana</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="España">España</option>
                    <option value="México">México</option>
                    <option value="Colombia">Colombia</option>
                    <option value="Argentina">Argentina</option>
                    <option value="Chile">Chile</option>
                    <option value="Perú">Perú</option>
                    <option value="Ecuador">Ecuador</option>
                    <option value="Venezuela">Venezuela</option>
                    <option value="Panamá">Panamá</option>
                    <option value="Puerto Rico">Puerto Rico</option>
                    <option value="Costa Rica">Costa Rica</option>
                    <option value="Brasil">Brasil</option>
                    <option value="Reino Unido">Reino Unido</option>
                    <option value="Francia">Francia</option>
                    <option value="Alemania">Alemania</option>
                    <option value="Italia">Italia</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select name="status" className="form-control" defaultValue={editing.status}>
                    <option value="new">{t('new')}</option>
                    <option value="active">{t('active')}</option>
                    <option value="vip">{t('vip')}</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal isOpen={!!showDelete} onCancel={() => setShowDelete(null)} onConfirm={handleDelete} title="¿Eliminar cliente?" message="Esta acción no se puede deshacer." />
    </div>
  );
};

export default CustomersPage;
