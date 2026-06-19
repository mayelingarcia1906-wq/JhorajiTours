import { useMemo, useState } from 'react';
import { Edit3, Globe, MessageCircle, Plus, Search, Trash2, X, Eraser } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Pagination } from '../components/Pagination';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const read = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const logAudit = (action, detail) => {
  const logs = read('jhoraji_audit', []);
  logs.unshift({ id: Date.now(), module: 'Agencias', action, detail, user: 'Administrador', timestamp: new Date().toISOString() });
  write('jhoraji_audit', logs.slice(0, 200));
};

const emptyAgency = { name: '', whatsapp: '' };

const AgenciesPage = () => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [agencies, setAgencies] = useState(() => read('jhoraji_agencies', []));
  const [editing, setEditing] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  const filtered = useMemo(() => {
    const term = applied.toLowerCase();
    return agencies.filter((a) => a.name?.toLowerCase().includes(term) || a.whatsapp?.toLowerCase().includes(term));
  }, [agencies, applied]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const persist = (next) => { setAgencies(next); write('jhoraji_agencies', next); };

  const handleSave = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const submitted = {
      id: editing.id || Date.now(),
      name: fd.get('name').trim(),
      whatsapp: fd.get('whatsapp').trim(),
    };
    persist(editing.id ? agencies.map((a) => (a.id === editing.id ? submitted : a)) : [submitted, ...agencies]);
    logAudit(editing.id ? 'Editó agencia' : 'Creó agencia', submitted.name);
    setEditing(null);
    addToast(editing.id ? 'Agencia actualizada' : 'Agencia creada', 'success');
  };

  const handleDelete = () => {
    const a = agencies.find((x) => x.id === showDelete);
    persist(agencies.filter((x) => x.id !== showDelete));
    logAudit('Eliminó agencia', a?.name || '');
    addToast('Agencia eliminada', 'success');
    setShowDelete(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{t('agenciesTitle')}</h2>
          <p className="page-subtitle">{t('agenciesSubtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({ ...emptyAgency })}>
          <Plus size={16} /> {t('newAgency')}
        </button>
      </div>

      <div className="card mb-4">
        <div className="page-toolbar">
          <div className="search-integrated">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder={t('searchAgency')}
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
                <th>{t('agencyName')}</th>
                <th>WhatsApp</th>
                <th style={{ textAlign: 'right' }}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-faint)' }}>
                    <Globe size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <div>{t('noAgencies')}</div>
                  </td>
                </tr>
              ) : currentItems.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="d-flex align-items-center gap-3">
                      <div className="stat-icon tone-info" style={{ width: 34, height: 34, flexShrink: 0 }}>
                        <Globe size={15} />
                      </div>
                      <span className="font-bold">{a.name}</span>
                    </div>
                  </td>
                  <td>
                    {a.whatsapp ? (
                      <a href={`https://wa.me/${a.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="d-flex align-items-center gap-1" style={{ color: 'var(--success)' }}>
                        <MessageCircle size={13} /> {a.whatsapp}
                      </a>
                    ) : <span style={{ color: 'var(--text-faint)' }}>—</span>}
                  </td>
                  <td>
                    <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                      <button className="icon-btn" onClick={() => setEditing({ ...a })} title={t('edit')}><Edit3 size={15} /></button>
                      <button className="icon-btn danger" onClick={() => setShowDelete(a.id)} title={t('delete')}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={itemsPerPage} onPageChange={setPage} />
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>{editing.id ? t('editAgency') : t('newAgency')}</h3>
              <button className="modal-close" onClick={() => setEditing(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>{t('name')}</label>
                <input name="name" type="text" className="form-control" required defaultValue={editing.name} />
              </div>
              <div className="form-group">
                <label>WhatsApp</label>
                <input name="whatsapp" type="text" className="form-control" defaultValue={editing.whatsapp} placeholder="+1 809-555-0101" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">{editing.id ? t('update') : t('create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal isOpen={!!showDelete} onCancel={() => setShowDelete(null)} onConfirm={handleDelete} title={t('deleteAgencyTitle')} message={t('deleteAgencyText')} />
    </div>
  );
};

export default AgenciesPage;
