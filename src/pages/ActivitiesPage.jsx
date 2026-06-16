import { useMemo, useState } from 'react';
import { Activity, Edit3, Plus, Search, Trash2, X, Eraser, Building2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const read = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const logAudit = (action, detail) => {
  const logs = read('jhoraji_audit', []);
  logs.unshift({ id: Date.now(), module: 'Actividades', action, detail, user: 'Administrador', timestamp: new Date().toISOString() });
  write('jhoraji_audit', logs.slice(0, 200));
};

const empty = {
  id: null, name: '', providerId: '', costBase: '', chargeMode: '',
  active: true, description: '', commissions: {},
};

const COMMISSION_PRESETS = [
  { key: 'getYourGuide', label: 'GetYourGuide', color: '#f97316' },
  { key: 'viator', label: 'Viator', color: '#16a34a' },
  { key: 'civitatis', label: 'Civitatis', color: '#e11d48' },
  { key: 'direct', label: 'Directo', color: 'var(--text-dark)' },
];

const calcPrice = (cost, comm) => ((Number(cost) || 0) * (1 + (Number(comm) || 0) / 100)).toFixed(2);

const CommissionChip = ({ name, percent }) => (
  <div
    style={{
      backgroundColor: 'var(--card-bg)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '4px 8px',
      minWidth: 50,
      boxShadow: 'var(--shadow-xs)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 1,
    }}
  >
    <span style={{ fontSize: '0.6rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{name}</span>
    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)' }}>{percent}%</span>
  </div>
);

const ActivitiesPage = () => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [activities, setActivities] = useState(() => read('jhoraji_act', []));
  const [providers] = useState(() => read('jhoraji_providers', []));
  const [editing, setEditing] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState('');

  const filtered = useMemo(() => {
    const term = applied.toLowerCase();
    return activities.filter((a) => {
      const providerName = providers.find((p) => p.id === a.providerId)?.name || '';
      return a.name?.toLowerCase().includes(term) || providerName.toLowerCase().includes(term);
    });
  }, [activities, applied, providers]);

  const persist = (next) => { setActivities(next); write('jhoraji_act', next); };

  const handleField = (e) => {
    const { name, value, type, checked } = e.target;
    if (COMMISSION_PRESETS.some((p) => p.key === name)) {
      setEditing((prev) => ({ ...prev, commissions: { ...prev.commissions, [name]: value } }));
    } else {
      setEditing((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const toggleCommission = (key, enabled) => {
    setEditing((prev) => {
      const newComm = { ...(prev.commissions || {}) };
      if (enabled) newComm[key] = '';
      else delete newComm[key];
      return { ...prev, commissions: newComm };
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!editing.chargeMode) return addToast('Selecciona un modo de cobro', 'error');
    if (!editing.commissions || Object.keys(editing.commissions).length === 0)
      return addToast('Configura al menos un tipo de comisión', 'error');

    const submitted = {
      ...editing,
      id: editing.id || Date.now(),
      providerId: Number(editing.providerId),
      costBase: Number(editing.costBase),
    };
    const next = editing.id ? activities.map((a) => (a.id === editing.id ? submitted : a)) : [submitted, ...activities];
    persist(next);
    logAudit(editing.id ? 'Editó actividad' : 'Creó actividad', submitted.name);
    setEditing(null);
    addToast(editing.id ? 'Actividad actualizada' : 'Actividad creada', 'success');
  };

  const handleDelete = () => {
    const a = activities.find((x) => x.id === showDelete);
    persist(activities.filter((x) => x.id !== showDelete));
    logAudit('Eliminó actividad', a?.name || '');
    addToast('Actividad eliminada', 'success');
    setShowDelete(null);
  };

  const totalComm = (commissions) => Object.values(commissions || {}).reduce((acc, v) => acc + (Number(v) || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{t('activitiesTitle')}</h2>
          <p className="page-subtitle">{t('activitiesSubtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({ ...empty })}>
          <Plus size={16} /> {t('newActivity')}
        </button>
      </div>

      <div className="card mb-4">
        <div className="page-toolbar">
          <div className="search-integrated">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder={t('searchActivity')}
              className="form-control"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setApplied(search)}
            />
            {search && (
              <button className="search-clear-btn visible" onClick={() => { setSearch(''); setApplied(''); }} type="button">
                <Eraser size={14} />
              </button>
            )}
            <button className="search-btn-inner" onClick={() => setApplied(search)} type="button">
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
                <th>{t('activityName')} / Proveedor</th>
                <th>Costo base</th>
                <th>Modo</th>
                <th>Comisiones</th>
                <th>Precio final</th>
                <th>{t('status')}</th>
                <th style={{ textAlign: 'right' }}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-faint)' }}>
                    <Activity size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <div>No hay actividades registradas</div>
                  </td>
                </tr>
              ) : (
                filtered.map((a) => {
                  const providerName = providers.find((p) => p.id === a.providerId)?.name || '—';
                  return (
                    <tr key={a.id}>
                      <td>
                        <div className="font-bold">{a.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Building2 size={11} /> {providerName}
                        </div>
                      </td>
                      <td className="font-bold" style={{ color: 'var(--text-dark)' }}>${Number(a.costBase).toFixed(2)}</td>
                      <td>
                        <span className="badge badge-neutral">{a.chargeMode === 'PAX' ? 'por persona' : 'por vehículo'}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {COMMISSION_PRESETS.filter((p) => a.commissions?.[p.key] !== undefined).map((p) => (
                            <CommissionChip key={p.key} name={p.key === 'getYourGuide' ? 'GYG' : p.key === 'viator' ? 'VIA' : p.key === 'civitatis' ? 'CIV' : 'OTRO'} percent={a.commissions[p.key]} />
                          ))}
                        </div>
                      </td>
                      <td className="font-bold" style={{ color: 'var(--primary-color)' }}>${calcPrice(a.costBase, totalComm(a.commissions))}</td>
                      <td>
                        <span className={`badge ${a.active ? 'badge-success' : 'badge-neutral'}`}>
                          <span className="status-dot" style={{ background: a.active ? 'var(--success)' : 'var(--text-faint)' }} />
                          {a.active ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                          <button className="icon-btn" onClick={() => setEditing({ ...a })} title={t('edit')}><Edit3 size={15} /></button>
                          <button className="icon-btn danger" onClick={() => setShowDelete(a.id)} title={t('delete')}><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>
            <div className="modal-header">
              <h3>{editing.id ? t('editActivity') : t('newActivity')}</h3>
              <button className="modal-close" onClick={() => setEditing(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="responsive-grid">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>{t('activityName')}</label>
                  <input name="name" type="text" className="form-control" placeholder="Ej. Saona VIP" required value={editing.name} onChange={handleField} />
                </div>
                <div className="form-group">
                  <label>Proveedor</label>
                  <select name="providerId" className="form-control" required value={editing.providerId} onChange={handleField}>
                    <option value="">— Seleccionar —</option>
                    {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Costo base (US$)</label>
                  <input name="costBase" type="number" min="0" step="0.01" className="form-control" required value={editing.costBase} onChange={handleField} />
                </div>
                <div className="form-group">
                  <label>Precio calculado</label>
                  <input type="text" readOnly className="form-control" style={{ background: 'var(--bg-soft)', color: 'var(--primary-color)', fontWeight: 700, fontFamily: 'var(--font-display)' }} value={`$${calcPrice(editing.costBase, totalComm(editing.commissions))}`} />
                </div>
                <div className="form-group">
                  <label>Modo de cobro</label>
                  <select name="chargeMode" className="form-control" required value={editing.chargeMode} onChange={handleField}>
                    <option value="" disabled>— Seleccionar —</option>
                    <option value="PAX">Por persona (pax)</option>
                    <option value="VEHICULO">Por vehículo</option>
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 28 }}>
                  <input type="checkbox" id="actActive" name="active" checked={editing.active} onChange={handleField} />
                  <label htmlFor="actActive" style={{ margin: 0, cursor: 'pointer' }}>Actividad disponible</label>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Descripción</label>
                  <textarea name="description" className="form-control" rows="2" value={editing.description} onChange={handleField} />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: 10, display: 'block' }}>Configuración de comisiones</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, padding: '1rem', backgroundColor: 'var(--bg-soft)', borderRadius: 'var(--radius-lg)' }}>
                  {COMMISSION_PRESETS.map(({ key, label, color }) => {
                    const enabled = editing.commissions?.[key] !== undefined;
                    return (
                      <div
                        key={key}
                        style={{
                          backgroundColor: 'var(--card-bg)',
                          padding: 12,
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-color)',
                          opacity: enabled ? 1 : 0.6,
                          transition: 'var(--transition)',
                        }}
                      >
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, color, fontSize: '0.78rem', fontWeight: 700, marginBottom: 8, cursor: 'pointer' }}>
                          <input type="checkbox" checked={enabled} onChange={(e) => toggleCommission(key, e.target.checked)} />
                          {label}
                        </label>
                        {enabled ? (
                          <div>
                            <label style={{ fontSize: '0.65rem', color: 'var(--text-light)', marginBottom: 4, display: 'block' }}>Comisión (%)</label>
                            <div style={{ position: 'relative' }}>
                              <input
                                name={key} type="number" min="0" step="1"
                                className="form-control"
                                style={{ paddingRight: 24, height: 32, fontSize: '0.85rem' }}
                                value={editing.commissions[key]}
                                onChange={handleField}
                              />
                              <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', fontSize: '0.75rem' }}>%</span>
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', textAlign: 'center', padding: '6px 0' }}>
                            No configurado
                          </div>
                        )}
                      </div>
                    );
                  })}
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

      <DeleteConfirmModal
        isOpen={!!showDelete}
        onCancel={() => setShowDelete(null)}
        onConfirm={handleDelete}
        title="¿Eliminar actividad?"
        message="Esta acción no se puede deshacer."
      />
    </div>
  );
};

export default ActivitiesPage;
