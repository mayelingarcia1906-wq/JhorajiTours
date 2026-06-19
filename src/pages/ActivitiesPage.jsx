import { useMemo, useState, useEffect } from 'react';
import { Activity, Edit3, Plus, Search, Trash2, X, Eraser, Building2, LayoutGrid, List, Clock, MapPin } from 'lucide-react';
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
  category: 'actividad', duration: '', adultPrice: '', childPrice: '', imageUrl: ''
};

const COMMISSION_PRESETS = [
  { key: 'getYourGuide', label: 'GetYourGuide', color: '#f97316' },
  { key: 'viator', label: 'Viator', color: '#16a34a' },
  { key: 'civitatis', label: 'Civitatis', color: '#e11d48' },
  { key: 'driver', label: 'Conductor', color: '#8b5cf6' },
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

const getDefaultImage = (name) => {
  const lower = (name || '').toLowerCase();
  if (lower.includes('saona') || lower.includes('isla')) return 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&q=80&w=800';
  if (lower.includes('buggy') || lower.includes('safari') || lower.includes('polaris')) return 'https://images.unsplash.com/photo-1533560904424-a0c61dc306fc?auto=format&fit=crop&q=80&w=800';
  if (lower.includes('coco') || lower.includes('bongo') || lower.includes('party') || lower.includes('disco')) return 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800';
  if (lower.includes('buceo') || lower.includes('scuba') || lower.includes('catalina')) return 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=800';
  if (lower.includes('caballo') || lower.includes('horse')) return 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80&w=800';
  if (lower.includes('scape') || lower.includes('parque') || lower.includes('cenote')) return 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=800';
  if (lower.includes('ciudad') || lower.includes('domingo') || lower.includes('city')) return 'https://images.unsplash.com/photo-1583037305953-b097b6cd23b2?auto=format&fit=crop&q=80&w=800';
  return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800'; // Default tropical beach
};

const ActivitiesPage = () => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [activities, setActivities] = useState(() => {
    const data = read('jhoraji_act', []);
    const valid = data.filter(a => a.name && a.name.trim() !== '');
    if (valid.length !== data.length) write('jhoraji_act', valid);
    return valid;
  });
  const [providers] = useState(() => read('jhoraji_providers', []));
  const [editing, setEditing] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState('');
  const [viewMode, setViewMode] = useState('table');

  // ── MIGRATION: Migrate old Tours to new unified Activities ──
  useEffect(() => {
    try {
      const oldToursStr = localStorage.getItem('jhoraji_tours');
      if (oldToursStr) {
        const oldTours = JSON.parse(oldToursStr);
        if (Array.isArray(oldTours) && oldTours.length > 0) {
          const migratedTours = oldTours.map(t => ({
            ...t,
            id: t.id || Date.now() + Math.random(),
            category: 'excursion',
            chargeMode: 'PAX', // Default charge mode for tours
            costBase: t.costBase || t.adultPrice ? (Number(t.adultPrice) * 0.7).toFixed(2) : 0, // Fallback if no costBase
            commissions: t.commissions || {},
          }));
          
          setActivities(prev => {
            const next = [...prev, ...migratedTours];
            write('jhoraji_act', next);
            return next;
          });
        }
        localStorage.removeItem('jhoraji_tours'); // Clean up after migration
      }
    } catch (e) {
      console.error('Error migrating tours:', e);
    }
  }, []);

  // ── AUTO-INSERT MOCK DATA IF EMPTY ──
  useEffect(() => {
    if (activities.length === 0) {
      const mocks = [
        { id: 1, name: 'Isla Saona Vip', category: 'excursion', costBase: 40, adultPrice: 74.80, commissions: { getYourGuide: 27, viator: 30, civitatis: 30 }, active: true, imageUrl: 'https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&q=80&w=800', description: 'Visita la paradisíaca Isla Saona en un tour VIP con catamarán, bebidas premium y almuerzo en la playa.', duration: 'Día completo' },
        { id: 2, name: 'Safari Buggies', category: 'actividad', costBase: 25, adultPrice: 44.50, commissions: { getYourGuide: 25, viator: 28, civitatis: 25 }, active: true, imageUrl: 'https://images.unsplash.com/photo-1551887196-72e32cbafa0d?auto=format&fit=crop&q=80&w=800', description: 'Aventura extrema manejando buggies a través de la selva y playas de Punta Cana.', duration: '4 horas' },
        { id: 3, name: 'Coco Bongo', category: 'actividad', costBase: 50, adultPrice: 72.50, commissions: { getYourGuide: 20, civitatis: 25 }, active: true, imageUrl: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&q=80&w=800', description: 'La mejor vida nocturna. Espectáculo increíble, bebidas ilimitadas y fiesta sin fin.', duration: '5 horas' },
      ];
      setActivities(mocks);
      write('jhoraji_act', mocks);
    }
  }, [activities.length]);

  const filtered = useMemo(() => {
    const term = applied.toLowerCase();
    return activities.filter((a) => {
      const providerName = providers.find((p) => p.id === a.providerId)?.name || '';
      const cat = a.category || '';
      const name = a.name || '';
      return name.toLowerCase().includes(term) || providerName.toLowerCase().includes(term) || cat.toLowerCase().includes(term);
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
    
    if (!editing.name || editing.name.trim() === '') {
      return addToast('El nombre del servicio es obligatorio', 'error');
    }

    if (!editing.commissions || Object.keys(editing.commissions).length === 0)
      return addToast('Configura al menos un tipo de comisión', 'error');

    const submitted = {
      ...editing,
      id: editing.id || Date.now(),
      chargeMode: editing.chargeMode || 'PAX',
      providerId: Number(editing.providerId),
      costBase: Number(editing.costBase),
      adultPrice: editing.adultPrice ? Number(editing.adultPrice) : null,
      childPrice: editing.childPrice ? Number(editing.childPrice) : null,
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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {activities.length === 0 && (
            <button className="btn btn-outline" onClick={() => {
              const mocks = [
                { id: 1, name: 'Isla Saona Vip', category: 'excursion', costBase: 40, adultPrice: 74.80, commissions: { getYourGuide: 27, viator: 30, civitatis: 30 }, active: true, imageUrl: 'https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&q=80&w=800' },
                { id: 2, name: 'Safari Buggies', category: 'actividad', costBase: 25, adultPrice: 44.50, commissions: { getYourGuide: 25, viator: 28, civitatis: 25 }, active: true, imageUrl: 'https://images.unsplash.com/photo-1551887196-72e32cbafa0d?auto=format&fit=crop&q=80&w=800' },
                { id: 3, name: 'Coco Bongo', category: 'actividad', costBase: 50, adultPrice: 72.50, commissions: { getYourGuide: 20, civitatis: 25 }, active: true, imageUrl: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&q=80&w=800' },
              ];
              persist(mocks);
              addToast('Datos de prueba restaurados', 'success');
            }}>
              Restaurar Datos
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setEditing({ ...empty })}>
            <Plus size={16} /> {t('newService')}
          </button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="page-toolbar d-flex align-items-center justify-content-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div className="search-integrated" style={{ flex: '1 1 300px', maxWidth: '400px' }}>
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder={t('searchService')}
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
          
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-color)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <button
              className="icon-btn"
              style={{ background: viewMode === 'table' ? 'white' : 'transparent', color: viewMode === 'table' ? 'var(--primary-color)' : 'var(--text-light)', boxShadow: viewMode === 'table' ? 'var(--shadow-sm)' : 'none', borderRadius: 'var(--radius-sm)' }}
              onClick={() => setViewMode('table')}
              title={t('adminView')}
            >
              <List size={16} />
            </button>
            <button
              className="icon-btn"
              style={{ background: viewMode === 'grid' ? 'white' : 'transparent', color: viewMode === 'grid' ? 'var(--primary-color)' : 'var(--text-light)', boxShadow: viewMode === 'grid' ? 'var(--shadow-sm)' : 'none', borderRadius: 'var(--radius-sm)' }}
              onClick={() => setViewMode('grid')}
              title={t('clientView')}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper" style={{ borderRadius: 0, border: 'none' }}>
            <table className="table compact-table">
              <thead>
                <tr>
                  <th>{t('serviceProvider')}</th>
                  <th>{t('category')}</th>
                  <th>{t('baseCost')}</th>
                  <th>{t('commissions')}</th>
                  <th>{t('finalPrice')}</th>
                  <th>{t('status')}</th>
                  <th style={{ textAlign: 'right' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-faint)' }}>
                      <Activity size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                      <div>{t('noServices')}</div>
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
                        <td>
                          <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>{a.category || 'actividad'}</span>
                        </td>
                        <td className="font-bold" style={{ color: 'var(--text-dark)' }}>${Number(a.costBase).toFixed(2)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {COMMISSION_PRESETS.filter((p) => a.commissions?.[p.key] !== undefined).map((p) => (
                              <CommissionChip 
                                key={p.key} 
                                name={
                                  p.key === 'getYourGuide' ? 'GYG' : 
                                  p.key === 'viator' ? 'VIA' : 
                                  p.key === 'civitatis' ? 'CIV' : 
                                  p.key === 'driver' ? 'COND' : 
                                  'OTRO'
                                } 
                                percent={a.commissions[p.key]} 
                              />
                            ))}
                          </div>
                        </td>
                        <td className="font-bold" style={{ color: 'var(--primary-color)' }}>
                          ${calcPrice(a.costBase, totalComm(a.commissions))}
                        </td>
                        <td>
                          <span className={`badge ${a.active ? 'badge-success' : 'badge-neutral'}`}>
                            <span className="status-dot" style={{ background: a.active ? 'var(--success)' : 'var(--text-faint)' }} />
                            {a.active ? t('active') : t('inactive')}
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
      ) : (
        <div className="catalog-grid">
          {filtered.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-faint)', background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)' }}>
              <Activity size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
              <h3 style={{ margin: 0, color: 'var(--text-medium)' }}>{t('noResults')}</h3>
              <p>{t('tryOtherTerms')}</p>
            </div>
          ) : (
            filtered.map((a) => {
              const providerName = providers.find((p) => p.id === a.providerId)?.name || 'Sin proveedor';
              const finalPrice = calcPrice(a.costBase, totalComm(a.commissions));
              return (
                <div key={a.id} className="catalog-card">
                  <div className="catalog-admin-actions">
                    <button className="catalog-admin-btn" onClick={() => setEditing({ ...a })} title={t('edit')}><Edit3 size={14} /></button>
                    <button className="catalog-admin-btn danger" onClick={() => setShowDelete(a.id)} title={t('delete')}><Trash2 size={14} /></button>
                  </div>
                  <div className="catalog-image-wrap">
                    <span className="catalog-badge-overlay">{a.category || 'Actividad'}</span>
                    {(() => {
                      const finalImg = (!a.imageUrl || a.imageUrl.includes('1548574505-') || a.imageUrl.includes('1551887196-')) ? getDefaultImage(a.name) : a.imageUrl;
                      return <img src={finalImg} alt={a.name} className="catalog-image" loading="lazy" onError={(e) => { e.target.src = getDefaultImage('default'); }} />;
                    })()}
                  </div>
                  <div className="catalog-card-body">
                    <h3 className="catalog-title">{a.name}</h3>
                    <div className="catalog-meta">
                      <span className="d-flex align-items-center gap-1"><Building2 size={12} /> {providerName}</span>
                      {a.duration && <span className="d-flex align-items-center gap-1"><Clock size={12} /> {a.duration}</span>}
                    </div>
                    <p className="catalog-desc">{a.description || 'Sin descripción disponible para esta actividad.'}</p>
                    <div style={{ flex: 1 }} />
                    <div className="catalog-footer">
                      <div className="catalog-price">
                        ${finalPrice} <span>/ adulto</span>
                      </div>
                      {a.childPrice && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-medium)', fontWeight: 600 }}>
                          Niño: ${a.childPrice}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>{editing.id ? t('editService') : t('newService')}</h3>
              <button className="modal-close" onClick={() => setEditing(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="responsive-grid">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>{t('serviceName')}</label>
                  <input name="name" type="text" className="form-control" placeholder="Ej. Saona VIP" required value={editing.name} onChange={handleField} />
                </div>
                <div className="form-group">
                  <label>{t('category')}</label>
                  <select name="category" className="form-control" value={editing.category || 'actividad'} onChange={handleField}>
                    <option value="actividad">{t('categoryActivity')}</option>
                    <option value="excursion">{t('categoryExcursion')}</option>
                    <option value="traslado">{t('categoryTransfer')}</option>
                    <option value="parque">{t('categoryPark')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('providerResponsible')}</label>
                  <select name="providerId" className="form-control" required value={editing.providerId} onChange={handleField}>
                    <option value="">— {t('selectCountry').replace('país', 'proveedor').replace('country', 'provider')} —</option>
                    {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>{t('baseCostUsd')}</label>
                  <input name="costBase" type="number" min="0" step="0.01" className="form-control" required value={editing.costBase} onChange={handleField} />
                </div>
                <div className="form-group">
                  <label>{t('chargeMode')}</label>
                  <select name="chargeMode" className="form-control" required value={editing.chargeMode} onChange={handleField}>
                    <option value="" disabled>— {t('selectCountry').replace('país', 'opción').replace('country', 'option')} —</option>
                    <option value="PAX">{t('perPerson')}</option>
                    <option value="VEHICULO">{t('perVehicle')}</option>
                  </select>
                </div>

                {/* Campos Específicos para Excursión */}
                {editing.category === 'excursion' && (
                  <>
                    <div className="form-group">
                      <label>{t('duration')}</label>
                      <input name="duration" type="text" className="form-control" placeholder="Ej. Medio Día, Día Completo, 4 horas..." value={editing.duration || ''} onChange={handleField} />
                    </div>
                  </>
                )}

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>{t('imageUrlOpt')}</label>
                  <input name="imageUrl" type="url" className="form-control" placeholder="https://..." value={editing.imageUrl || ''} onChange={handleField} />
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, gridColumn: '1 / -1' }}>
                  <input type="checkbox" id="actActive" name="active" checked={editing.active} onChange={handleField} />
                  <label htmlFor="actActive" style={{ margin: 0, cursor: 'pointer', fontWeight: 600 }}>{t('serviceActive')}</label>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>{t('descDetails')}</label>
                  <textarea name="description" className="form-control" rows="3" placeholder="..." value={editing.description} onChange={handleField} />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: 10, display: 'block' }}>{t('otaCommissionsTitle')}</label>
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
                            <label style={{ fontSize: '0.65rem', color: 'var(--text-light)', marginBottom: 4, display: 'block' }}>{t('commissionPercent')}</label>
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
                            {t('notConfigured')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {editing.category !== 'excursion' && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                    {t('dynamicPrice')} ${calcPrice(editing.costBase, totalComm(editing.commissions))} {t('dynamicPriceDesc')}
                  </p>
                )}
              </div>

              <div className="modal-actions" style={{ marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">{editing.id ? t('saveChanges') : t('createService')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!showDelete}
        onCancel={() => setShowDelete(null)}
        onConfirm={handleDelete}
        title={t('deleteServiceTitle')}
        message={t('deleteServiceText')}
      />
    </div>
  );
};

export default ActivitiesPage;
