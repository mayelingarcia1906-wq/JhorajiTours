import { useMemo, useState } from 'react';
import { Building2, Edit3, Mail, Phone, Plus, Search, StickyNote, Trash2, X, Eraser } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Pagination } from '../components/Pagination';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const STORAGE_KEY = 'jhoraji_providers';
const AUDIT_KEY = 'jhoraji_audit';

const read = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const logAudit = (action, detail) => {
  const logs = read(AUDIT_KEY, []);
  logs.unshift({ id: Date.now(), module: 'Proveedores', action, detail, user: 'Administrador', timestamp: new Date().toISOString() });
  write(AUDIT_KEY, logs.slice(0, 200));
};

const emptyProvider = { name: '', phone: '', email: '', notes: '' };

const ProvidersPage = () => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [providers, setProviders] = useState(() => read(STORAGE_KEY, []));
  const [editing, setEditing] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  const filtered = useMemo(() => {
    const term = applied.toLowerCase();
    return providers.filter((p) =>
      [p.name, p.email, p.phone, p.notes].some((v) => String(v || '').toLowerCase().includes(term))
    );
  }, [providers, applied]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const persist = (next) => { setProviders(next); write(STORAGE_KEY, next); };

  const handleSave = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const submitted = {
      id: editing.id || Date.now(),
      name: fd.get('name').trim(),
      phone: fd.get('phone').trim(),
      email: fd.get('email').trim(),
      notes: fd.get('notes').trim(),
    };
    const next = editing.id ? providers.map((p) => (p.id === editing.id ? submitted : p)) : [submitted, ...providers];
    persist(next);
    logAudit(editing.id ? 'Editó proveedor' : 'Creó proveedor', submitted.name);
    setEditing(null);
    addToast(editing.id ? 'Proveedor actualizado' : 'Proveedor creado', 'success');
  };

  const handleDelete = () => {
    const p = providers.find((x) => x.id === showDelete);
    persist(providers.filter((x) => x.id !== showDelete));
    logAudit('Eliminó proveedor', p?.name || '');
    addToast('Proveedor eliminado', 'success');
    setShowDelete(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{t('providersTitle')}</h2>
          <p className="page-subtitle">{t('providersSubtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({ ...emptyProvider })}>
          <Plus size={16} /> {t('newProvider')}
        </button>
      </div>

      <div className="card mb-4">
        <div className="page-toolbar">
          <div className="search-integrated">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder={t('searchProvider')}
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
                <th>{t('providerName')}</th>
                <th>{t('contact')}</th>
                <th>{t('notes')}</th>
                <th style={{ textAlign: 'right' }}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-faint)' }}>
                    <Building2 size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <div>No hay proveedores registrados</div>
                  </td>
                </tr>
              ) : (
                currentItems.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div className="stat-icon" style={{ width: 34, height: 34, flexShrink: 0 }}>
                          <Building2 size={15} />
                        </div>
                        <div className="font-bold">{p.name}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.82rem' }}>
                        {p.phone && (
                          <a href={`tel:${p.phone}`} className="d-flex align-items-center gap-1" style={{ color: 'var(--text-dark)' }}>
                            <Phone size={12} style={{ color: 'var(--primary-color)' }} /> {p.phone}
                          </a>
                        )}
                        {p.email && (
                          <a href={`mailto:${p.email}`} className="d-flex align-items-center gap-1" style={{ color: 'var(--text-dark)' }}>
                            <Mail size={12} style={{ color: 'var(--primary-color)' }} /> {p.email}
                          </a>
                        )}
                        {!p.phone && !p.email && <span style={{ color: 'var(--text-faint)' }}>—</span>}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-light)', maxWidth: 260, fontSize: '0.82rem' }}>
                      {p.notes ? (
                        <span title={p.notes}>
                          <StickyNote size={12} style={{ color: 'var(--warning)', marginRight: 4 }} />
                          {p.notes.length > 60 ? p.notes.slice(0, 60) + '…' : p.notes}
                        </span>
                      ) : <span style={{ color: 'var(--text-faint)' }}>—</span>}
                    </td>
                    <td>
                      <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                        <button className="icon-btn" onClick={() => setEditing({ ...p })} title={t('edit')}>
                          <Edit3 size={15} />
                        </button>
                        <button className="icon-btn danger" onClick={() => setShowDelete(p.id)} title={t('delete')}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={itemsPerPage} onPageChange={setPage} />
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>{editing.id ? t('editProvider') : t('newProvider')}</h3>
              <button className="modal-close" onClick={() => setEditing(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Nombre empresa o persona</label>
                <input name="name" type="text" className="form-control" placeholder="Ej. Buggies Macao" required defaultValue={editing.name} />
              </div>
              <div className="responsive-grid">
                <div className="form-group">
                  <label>Teléfono</label>
                  <input name="phone" type="tel" className="form-control" defaultValue={editing.phone} />
                </div>
                <div className="form-group">
                  <label>Correo</label>
                  <input name="email" type="email" className="form-control" defaultValue={editing.email} />
                </div>
              </div>
              <div className="form-group">
                <label>Notas internas</label>
                <textarea name="notes" className="form-control" rows="3" placeholder="Detalles de contacto, cuentas bancarias…" defaultValue={editing.notes} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">{editing.id ? t('update') : t('create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!showDelete}
        onCancel={() => setShowDelete(null)}
        onConfirm={handleDelete}
        title="¿Eliminar proveedor?"
        message="Esta acción no se puede deshacer."
      />
    </div>
  );
};

export default ProvidersPage;
