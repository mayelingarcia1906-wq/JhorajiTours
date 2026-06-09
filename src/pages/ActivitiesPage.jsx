import { useState } from 'react';
import { Edit3, Plus, Trash2, X, Search, Eraser } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

const initialActivities = [];

const initialProviders = [];

const emptyActivity = {
  name: '', providerId: '', costBase: '', chargeMode: '',
  active: true, description: '',
  commissions: {}
};

const readStoredData = (key, defaultData) => {
  const saved = localStorage.getItem(key);
  if (!saved) return defaultData;
  try { return JSON.parse(saved); } catch { return defaultData; }
};

const logAudit = (action, detail) => {
  const logs = JSON.parse(localStorage.getItem('jhoraji_audit') || '[]');
  logs.unshift({ id: Date.now(), module: 'Actividades', action, detail, user: 'Administrador', timestamp: new Date().toISOString() });
  localStorage.setItem('jhoraji_audit', JSON.stringify(logs.slice(0, 200)));
};

const ActivitiesPage = () => {
  const { addToast } = useToast();
  const { t } = useLanguage();
  const [activities, setActivities] = useState(() => readStoredData('jhoraji_act', initialActivities));
  const [providers] = useState(() => readStoredData('jhoraji_providers', initialProviders));
  const [editingActivity, setEditingActivity] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const handleSearch = () => {
    setAppliedSearch(searchTerm);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const clearSearch = () => {
    setSearchTerm('');
    setAppliedSearch('');
  };

  const persistActivities = (nextActivities) => {
    setActivities(nextActivities);
    localStorage.setItem('jhoraji_act', JSON.stringify(nextActivities));
  };

  const handleSaveActivity = (event) => {
    event.preventDefault();
    if (!editingActivity.chargeMode) {
      addToast('Debe seleccionar un Modo de Cobro (PAX o Vehículo)', 'error');
      return;
    }
    if (!editingActivity.commissions || Object.keys(editingActivity.commissions).length === 0) {
      addToast('Debe seleccionar y configurar al menos un tipo de comisión', 'error');
      return;
    }
    const isNew = !editingActivity.id;
    const submitted = {
      ...editingActivity,
      id: editingActivity.id || Date.now(),
      name: editingActivity.name.trim(),
      providerId: Number(editingActivity.providerId),
      costBase: Number(editingActivity.costBase),
    };

    const nextActivities = editingActivity.id
      ? activities.map(a => (a.id === editingActivity.id ? submitted : a))
      : [submitted, ...activities];

    persistActivities(nextActivities);
    logAudit(isNew ? 'Creó actividad' : 'Editó actividad', submitted.name);
    setEditingActivity(null);
    addToast(isNew ? 'Actividad creada exitosamente' : 'Actividad actualizada', 'success');
  };

  const handleFieldChange = (e) => {
    let { name, value, type, checked } = e.target;
    if (type === 'number') {
      if (value !== '' && Number(value) < 0) value = '0';
    }
    if (['getYourGuide', 'viator', 'civitatis', 'direct'].includes(name)) {
      setEditingActivity(prev => ({ ...prev, commissions: { ...prev.commissions, [name]: value } }));
    } else {
      setEditingActivity(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const calcPrice = (cost, comm) => {
    const c = Number(cost) || 0;
    const p = Number(comm) || 0;
    return (c + (c * p / 100)).toFixed(2);
  };

  const handleDelete = () => {
    const act = activities.find(a => a.id === showDeleteConfirm);
    persistActivities(activities.filter(a => a.id !== showDeleteConfirm));
    logAudit('Eliminó actividad', act?.name || '');
    addToast('Actividad eliminada', 'success');
    setShowDeleteConfirm(null);
  };

  const getProviderName = (id) => providers.find(p => p.id === id)?.name || 'Desconocido';

  return (
    <div>
      <div className="page-header mb-4">
        <div>
          <h2>{t('activitiesTitle')}</h2>
          <p className="text-muted" style={{ margin: 0 }}>{t('activitiesSubtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditingActivity({ ...emptyActivity })}>
          <Plus size={18} /> {t('newActivity')}
        </button>
      </div>

      <div className="card mb-4">
        <div className="page-toolbar">
          <div className="d-flex gap-3" style={{ flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
            <div className="search-integrated">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder={t('searchActivity')}
                className="form-control"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className={`search-clear-btn ${searchTerm ? 'visible' : ''}`}
                onClick={clearSearch}
                title="Limpiar búsqueda"
                type="button"
              >
                <Eraser size={15} />
              </button>
              <button className="search-btn-inner" onClick={handleSearch} type="button">
                <Search size={13} /> {t('search')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table compact-table">
            <thead>
              <tr>
                <th>{t('activityName').toUpperCase()} / PROVEEDOR</th>
                <th>COSTO</th>
                <th>MODO</th>
                <th>UNIDADES</th>
                <th>COMISIONES</th>
                <th>PRECIO FINAL</th>
                <th>{t('status').toUpperCase()}</th>
                <th style={{ textAlign: 'right' }}>{t('actions').toUpperCase()}</th>
              </tr>
            </thead>
            <tbody>
              {activities.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                    No hay actividades registradas. ¡Agrega la primera!
                  </td>
                </tr>
              )}
              {activities.filter(a => 
                (a.name || '').toLowerCase().includes((appliedSearch || '').toLowerCase()) || 
                (getProviderName(a.providerId) || '').toLowerCase().includes((appliedSearch || '').toLowerCase())
              ).length === 0 && activities.length > 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                    No se encontraron resultados para "{appliedSearch}".
                  </td>
                </tr>
              )}
              {activities.filter(a => 
                (a.name || '').toLowerCase().includes((appliedSearch || '').toLowerCase()) || 
                (getProviderName(a.providerId) || '').toLowerCase().includes((appliedSearch || '').toLowerCase())
              ).map(a => (
                <tr key={a.id}>
                  <td>
                    <div className="font-bold">{a.name.toUpperCase()}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      👤 {getProviderName(a.providerId).toUpperCase()}
                    </div>
                  </td>
                  <td className="font-bold" style={{ color: '#1e3a8a' }}>
                    <div style={{ fontSize: '0.75rem', lineHeight: '1' }}>US$</div>
                    <div style={{ fontSize: '0.95rem', marginTop: '2px' }}>{Number(a.costBase).toFixed(2)}</div>
                  </td>
                  <td>
                    <span className="badge" style={{ backgroundColor: 'transparent', color: 'var(--text-dark)', border: '1px solid var(--border-color)', fontWeight: '500' }}>
                      {a.chargeMode === 'PAX' ? 'PAX' : 'VEHICULO'}
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={{ backgroundColor: '#e2e8f0', color: 'var(--text-dark)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                      1
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap' }}>
                      {a.commissions?.getYourGuide !== undefined && (
                        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', minWidth: '38px', boxShadow: 'var(--shadow-sm)' }}>
                          <span style={{ fontSize: '0.55rem', color: 'var(--text-light)', fontWeight: '700', textTransform: 'uppercase', lineHeight: '1' }}>GYG</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-dark)', lineHeight: '1' }}>{a.commissions.getYourGuide}%</span>
                        </div>
                      )}
                      {a.commissions?.viator !== undefined && (
                        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', minWidth: '38px', boxShadow: 'var(--shadow-sm)' }}>
                          <span style={{ fontSize: '0.55rem', color: 'var(--text-light)', fontWeight: '700', textTransform: 'uppercase', lineHeight: '1' }}>VIA</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-dark)', lineHeight: '1' }}>{a.commissions.viator}%</span>
                        </div>
                      )}
                      {a.commissions?.civitatis !== undefined && (
                        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', minWidth: '38px', boxShadow: 'var(--shadow-sm)' }}>
                          <span style={{ fontSize: '0.55rem', color: 'var(--text-light)', fontWeight: '700', textTransform: 'uppercase', lineHeight: '1' }}>CIV</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-dark)', lineHeight: '1' }}>{a.commissions.civitatis}%</span>
                        </div>
                      )}
                      {a.commissions?.direct !== undefined && (
                        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', minWidth: '38px', boxShadow: 'var(--shadow-sm)' }}>
                          <span style={{ fontSize: '0.55rem', color: 'var(--text-light)', fontWeight: '700', textTransform: 'uppercase', lineHeight: '1' }}>OTRO</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-dark)', lineHeight: '1' }}>{a.commissions.direct}%</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="font-bold" style={{ color: '#1e3a8a' }}>
                    <div style={{ fontSize: '0.75rem', lineHeight: '1' }}>US$</div>
                    <div style={{ fontSize: '0.95rem', marginTop: '2px' }}>
                      {(() => {
                        const totalComm = Object.values(a.commissions || {}).reduce((acc, val) => acc + (Number(val) || 0), 0);
                        return calcPrice(a.costBase, totalComm);
                      })()}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${a.active ? 'badge-success' : 'badge-danger'}`} style={a.active ? { backgroundColor: '#dcfce7', color: '#166534' } : {}}>
                      {a.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                      <button className="icon-btn" onClick={() => setEditingActivity(a)} title="Editar" style={{ color: 'var(--info)' }}>
                        <Edit3 size={18} />
                      </button>
                      <button className="icon-btn" onClick={() => setShowDeleteConfirm(a.id)} title="Eliminar" style={{ color: 'var(--danger)' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear/Editar */}
      {editingActivity && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 style={{ margin: 0 }}>
                {editingActivity.id ? t('editActivity') : t('newActivity')}
              </h3>
              <button onClick={() => setEditingActivity(null)} style={{ background: 'none', color: 'var(--text-light)' }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveActivity}>
              <div className="responsive-grid" style={{ gap: '15px' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>{t('activityName')}</label>
                  <input name="name" type="text" className="form-control" placeholder="Ej. Saona VIP" required value={editingActivity.name} onChange={handleFieldChange} />
                </div>
                <div className="form-group">
                  <label>Proveedor</label>
                  <select name="providerId" className="form-control" required value={editingActivity.providerId} onChange={handleFieldChange}>
                    <option value="">-- Seleccionar --</option>
                    {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Costo Base (US$)</label>
                  <input name="costBase" type="number" min="0" step="0.01" className="form-control" required value={editingActivity.costBase} onChange={handleFieldChange} />
                </div>
                <div className="form-group">
                  <label>Precio Alterado (US$)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', fontSize: '0.9rem' }}>$</span>
                    <input type="text" readOnly className="form-control" style={{ paddingLeft: '25px', backgroundColor: 'var(--bg-color)', color: 'var(--primary)', fontWeight: 'bold' }} value={
                      (() => {
                        const totalComm = Object.values(editingActivity.commissions || {}).reduce((acc, val) => acc + (Number(val) || 0), 0);
                        return calcPrice(editingActivity.costBase, totalComm);
                      })()
                    } />
                  </div>
                </div>
                <div className="form-group">
                  <label>Modo Cobro</label>
                  <select name="chargeMode" className="form-control" required value={editingActivity.chargeMode} onChange={handleFieldChange}>
                    <option value="" disabled>-- Seleccionar --</option>
                    <option value="PAX">por persona (pax)</option>
                    <option value="VEHICULO">Por Vehículo</option>
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '28px' }}>
                  <input type="checkbox" id="actActive" name="active" checked={editingActivity.active} onChange={handleFieldChange} />
                  <label htmlFor="actActive" style={{ margin: 0 }}>Actividad Disponible</label>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Descripción</label>
                  <textarea name="description" className="form-control" rows="2" value={editingActivity.description} onChange={handleFieldChange}></textarea>
                </div>
              </div>

              <div className="form-group mt-4">
                <label style={{ fontSize: '0.9rem', color: 'var(--text-dark)', fontWeight: '600', marginBottom: '12px' }}>Configuración de Comisiones</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-lg)' }}>
                  {[
                    { key: 'getYourGuide', label: 'GetYourGuide', color: '#f97316' },
                    { key: 'viator', label: 'Viator', color: '#16a34a' },
                    { key: 'civitatis', label: 'Civitatis', color: '#e11d48' },
                    { key: 'direct', label: 'Directo', color: 'var(--text-dark)' },
                  ].map(({ key, label, color }) => {
                    const isEnabled = editingActivity.commissions && editingActivity.commissions[key] !== undefined;
                    return (
                    <div key={key} style={{ backgroundColor: 'var(--card-bg)', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', opacity: isEnabled ? 1 : 0.7, transition: 'all 0.2s', boxShadow: isEnabled ? 'var(--shadow-sm)' : 'none' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color, fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={isEnabled} onChange={(e) => {
                          const checked = e.target.checked;
                          setEditingActivity(prev => {
                            const newComm = { ...(prev.commissions || {}) };
                            if (checked) {
                              newComm[key] = '';
                            } else {
                              delete newComm[key];
                            }
                            return { ...prev, commissions: newComm };
                          });
                        }} />
                        {label}
                      </label>
                      {isEnabled ? (
                        <div style={{ marginTop: '4px' }}>
                          <label style={{ fontSize: '0.65rem', color: 'var(--text-light)', marginBottom: '4px', display: 'block' }}>Comisión (%)</label>
                          <div style={{ position: 'relative' }}>
                            <input name={key} type="number" min="0" step="1" className="form-control" style={{ padding: '4px 20px 4px 8px', fontSize: '0.85rem', height: '30px' }} value={editingActivity.commissions[key]} onChange={handleFieldChange} />
                            <span style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', fontSize: '0.75rem' }}>%</span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', padding: '8px 0', textAlign: 'center', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
                          No configurado
                        </div>
                      )}
                    </div>


                  )})}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setEditingActivity(null)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">
                  {editingActivity.id ? t('update') : t('create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {showDeleteConfirm && (
        <div className="modal-overlay" style={{ zIndex: 300 }}>
          <div className="card" style={{ maxWidth: '420px', width: '90%', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '15px' }}>{t('deleteActivityTitle')}</h3>
            <p className="text-muted mb-4">¿Estás seguro que deseas eliminar esta actividad? Esta acción no se puede deshacer.</p>
            <div className="d-flex justify-content-center gap-3" style={{ flexWrap: 'wrap' }}>
              <button className="btn btn-outline" onClick={() => setShowDeleteConfirm(null)}>{t('cancel')}</button>
              <button className="btn btn-danger" onClick={handleDelete}>{t('delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivitiesPage;
