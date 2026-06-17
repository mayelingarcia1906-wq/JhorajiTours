import { useEffect, useMemo, useState } from 'react';
import { Clock, DollarSign, Edit3, Eraser, Eye, MapPin, Plus, Search, Star, Trash2, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Pagination } from '../components/Pagination';
import { usePermissions } from '../context/PermissionsContext';
import { useCurrency } from '../context/CurrencyContext';
import { useNotifications } from '../context/NotificationsContext';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const STORAGE_KEY = 'jhoraji_tours';
const AUDIT_KEY = 'jhoraji_audit';

const read = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const logAudit = (action, detail) => {
  const logs = read(AUDIT_KEY, []);
  logs.unshift({ id: Date.now(), module: 'Tours', action, detail, user: 'Administrador', timestamp: new Date().toISOString() });
  write(AUDIT_KEY, logs.slice(0, 200));
};

const emptyTour = {
  title: '', category: 'island', price: '$0.00', priceChild: '$0.00',
  duration: 'fullDay', rating: '4.5', description: '', includes: '',
  image: 'https://images.unsplash.com/photo-1596484552834-3a58f831d36a?w=500',
  active: true,
};

const ToursPage = () => {
  const { addToast } = useToast();
  const { t } = useLanguage();
  const { canPerformAction } = usePermissions();
  const { formatPrice } = useCurrency();
  const { addNotification } = useNotifications();
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [tours, setTours] = useState(() => read(STORAGE_KEY, []));

  useEffect(() => {
    let needsUpdate = false;
    const updated = tours.map((tour) => {
      if (!tour.image || tour.image.includes('images/tours/saona.png')) {
        needsUpdate = true;
        return { ...tour, image: 'https://images.unsplash.com/photo-1596484552834-3a58f831d36a?w=500' };
      }
      return tour;
    });
    if (needsUpdate) {
      setTours(updated);
      write(STORAGE_KEY, updated);
    }
  }, []);

  const categories = ['all', 'island', 'adventure', 'culture', 'nature'];
  const durations = ['halfDay', 'fullDay'];

  const persist = (next) => { setTours(next); write(STORAGE_KEY, next); };

  const filtered = useMemo(() => {
    const term = applied.toLowerCase();
    return tours.filter((tour) => {
      const matchCat = categoryFilter === 'all' || tour.category === categoryFilter;
      const matchSearch = (tour.title || '').toLowerCase().includes(term);
      return matchCat && matchSearch;
    });
  }, [tours, categoryFilter, applied]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const toggleActive = (id) => {
    const tour = tours.find((t) => t.id === id);
    if (!tour) return;
    const newState = !tour.active;
    persist(tours.map((t) => (t.id === id ? { ...t, active: newState } : t)));
    logAudit(newState ? 'Activó tour' : 'Desactivó tour', tour.title);
    addToast('Estado actualizado', 'success');
  };

  const handleSave = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const submitted = {
      id: editing.id || Date.now(),
      title: fd.get('title').trim(),
      category: fd.get('category'),
      duration: fd.get('duration'),
      price: fd.get('price').trim(),
      priceChild: fd.get('priceChild').trim(),
      rating: fd.get('rating').trim(),
      image: fd.get('image').trim(),
      description: fd.get('description').trim(),
      includes: fd.get('includes').trim(),
      active: fd.get('active') === 'true',
    };
    const isNew = !editing.id;
    persist(isNew ? [submitted, ...tours] : tours.map((t) => (t.id === editing.id ? submitted : t)));
    if (isNew) addNotification(`Nuevo tour: ${submitted.title}`);
    setEditing(null);
    addToast('Tour guardado', 'success');
  };

  const handleDelete = () => {
    persist(tours.filter((t) => t.id !== showDelete));
    addToast('Tour eliminado', 'success');
    setShowDelete(null);
  };

  const fields = (tour) => (
    <div className="responsive-grid">
      <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>{t('title')}</label><input name="title" type="text" className="form-control" required defaultValue={tour.title} /></div>
      <div className="form-group"><label>{t('category')}</label><select name="category" className="form-control" defaultValue={tour.category}>{categories.filter((c) => c !== 'all').map((c) => <option key={c} value={c}>{t(c)}</option>)}</select></div>
      <div className="form-group"><label>{t('duration')}</label><select name="duration" className="form-control" defaultValue={tour.duration}>{durations.map((d) => <option key={d} value={d}>{t(d)}</option>)}</select></div>
      <div className="form-group"><label>{t('adultPrice')}</label><input name="price" type="text" className="form-control" required defaultValue={tour.price} /></div>
      <div className="form-group"><label>{t('childPrice')}</label><input name="priceChild" type="text" className="form-control" required defaultValue={tour.priceChild} /></div>
      <div className="form-group"><label>{t('rating')}</label><input name="rating" type="number" step="0.1" min="0" max="5" className="form-control" required defaultValue={tour.rating} /></div>
      <div className="form-group"><label>{t('status')}</label><select name="active" className="form-control" defaultValue={String(tour.active)}><option value="true">{t('active')}</option><option value="false">{t('inactive')}</option></select></div>
      <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>URL de imagen</label><input name="image" type="url" className="form-control" required defaultValue={tour.image} /></div>
      <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>{t('description')}</label><textarea name="description" className="form-control" rows="3" required defaultValue={tour.description} /></div>
      <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>{t('includes')}</label><textarea name="includes" className="form-control" rows="2" required defaultValue={tour.includes} /></div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{t('toursTitle')}</h2>
          <p className="page-subtitle">{t('toursSubtitle')}</p>
        </div>
        {canPerformAction('create') && (
          <button className="btn btn-primary" onClick={() => setEditing({ ...emptyTour })}>
            <Plus size={16} /> {t('newTour')}
          </button>
        )}
      </div>

      <div className="card mb-4">
        <div className="page-toolbar">
          <div className="search-integrated">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder={t('searchTours')}
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
          <select className="form-control" style={{ width: 200 }} value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
            {categories.map((c) => <option key={c} value={c}>{t(c)}</option>)}
          </select>
        </div>
      </div>

      <div className="tours-grid">
        {currentItems.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
            <MapPin size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
            <div style={{ color: 'var(--text-faint)' }}>No hay tours</div>
          </div>
        ) : currentItems.map((tour) => (
          <div key={tour.id} className="card card-hover" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 180, position: 'relative' }}>
              <img src={tour.image} alt={tour.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {canPerformAction('edit') ? (
                <button
                  className={`badge ${tour.active ? 'badge-success' : 'badge-danger'}`}
                  style={{ position: 'absolute', top: 10, right: 10, border: 'none', cursor: 'pointer' }}
                  onClick={() => toggleActive(tour.id)}
                >
                  {tour.active ? t('active') : t('inactive')}
                </button>
              ) : (
                <span className={`badge ${tour.active ? 'badge-success' : 'badge-danger'}`} style={{ position: 'absolute', top: 10, right: 10 }}>
                  {tour.active ? t('active') : t('inactive')}
                </span>
              )}
            </div>
            <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="d-flex justify-content-between align-items-center" style={{ gap: 8, marginBottom: 8 }}>
                <h3 style={{ fontSize: '0.95rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={tour.title}>{tour.title}</h3>
                <span style={{ fontWeight: 700, color: 'var(--primary-color)', whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>{formatPrice(tour.price)}</span>
              </div>
              <div className="d-flex justify-content-between" style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginBottom: 12 }}>
                <span className="d-flex align-items-center gap-1"><MapPin size={12} /> {t(tour.category)}</span>
                <span className="d-flex align-items-center gap-1"><Clock size={12} /> {t(tour.duration)}</span>
                <span className="d-flex align-items-center gap-1" style={{ color: 'var(--warning)' }}><Star size={12} fill="currentColor" /> {tour.rating}</span>
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', gap: 8, borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => setSelected(tour)}><Eye size={13} /> {t('view')}</button>
                {canPerformAction('edit') && (
                  <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => setEditing({ ...tour })}><Edit3 size={13} /> {t('edit')}</button>
                )}
                {canPerformAction('delete') && (
                  <button className="btn btn-outline btn-sm" style={{ flex: 1, color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => setShowDelete(tour.id)}><Trash2 size={13} /> {t('delete')}</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1.25rem' }}>
        <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={itemsPerPage} onPageChange={setPage} />
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ height: 220, position: 'relative' }}>
              <img src={selected.image} alt={selected.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button onClick={() => setSelected(null)} className="modal-close" style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.5)', color: 'white' }}><X size={18} /></button>
            </div>
            <div style={{ padding: '1rem' }}>
              <div className="d-flex justify-content-between align-items-center mb-3" style={{ gap: 12, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0 }}>{selected.title}</h2>
                <span className={`badge ${selected.active ? 'badge-success' : 'badge-danger'}`}>{selected.active ? t('active') : t('inactive')}</span>
              </div>
              <p style={{ color: 'var(--text-light)', marginBottom: '1.25rem' }}>{selected.description}</p>
              <div className="responsive-grid">
                <div><p className="text-muted mb-1">{t('adultPrice')}</p><div className="font-bold d-flex align-items-center gap-1"><DollarSign size={16} color="var(--primary-color)" />{formatPrice(selected.price)}</div></div>
                <div><p className="text-muted mb-1">{t('childPrice')}</p><div className="font-bold d-flex align-items-center gap-1"><DollarSign size={16} color="var(--primary-color)" />{formatPrice(selected.priceChild)}</div></div>
                <div><p className="text-muted mb-1">{t('category')}</p><div className="d-flex align-items-center gap-2"><MapPin size={16} />{t(selected.category)}</div></div>
                <div><p className="text-muted mb-1">{t('duration')}</p><div className="d-flex align-items-center gap-2"><Clock size={16} />{t(selected.duration)}</div></div>
                <div><p className="text-muted mb-1">{t('rating')}</p><div className="d-flex align-items-center gap-2" style={{ color: 'var(--warning)' }}><Star size={16} fill="currentColor" />{selected.rating}</div></div>
                <div style={{ gridColumn: '1 / -1' }}><p className="text-muted mb-1">{t('includes')}</p><div style={{ padding: '0.75rem 0.85rem', backgroundColor: 'var(--bg-soft)', borderRadius: 'var(--radius-md)' }}>{selected.includes}</div></div>
              </div>
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setSelected(null)}>Cerrar</button>
                {canPerformAction('edit') && (
                  <button className="btn btn-primary" onClick={() => { setSelected(null); setEditing({ ...selected }); }}>Editar</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing.id ? t('editTour') : t('newTour')}</h3>
              <button className="modal-close" onClick={() => setEditing(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              {fields(editing)}
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal isOpen={!!showDelete} onCancel={() => setShowDelete(null)} onConfirm={handleDelete} title="¿Eliminar tour?" message="Esta acción no se puede deshacer." />
    </div>
  );
};

export default ToursPage;
