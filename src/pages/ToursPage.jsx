import { useMemo, useState, useEffect } from 'react';
import { Clock, DollarSign, Edit3, Eraser, Eye, MapPin, Plus, Search, Star, Trash2, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Pagination } from '../components/Pagination';
import { usePermissions } from '../context/PermissionsContext';
import { useCurrency } from '../context/CurrencyContext';
import { useNotifications } from '../context/NotificationsContext';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const initialTours = [];

const emptyTour = {
  title: '',
  category: 'island',
  price: '$0.00',
  priceChild: '$0.00',
  duration: 'fullDay',
  rating: '4.5',
  description: '',
  includes: '',
  image: 'https://images.unsplash.com/photo-1596484552834-3a58f831d36a?w=500',
  active: true,
};

const logAudit = (action, detail) => {
  try {
    const logs = JSON.parse(localStorage.getItem('jhoraji_audit') || '[]');
    logs.unshift({ id: Date.now(), module: 'Tours', action, detail, user: 'Administrador', timestamp: new Date().toISOString() });
    localStorage.setItem('jhoraji_audit', JSON.stringify(logs.slice(0, 200)));
  } catch (e) {}
};

const readStoredTours = () => {
  const saved = localStorage.getItem('jhoraji_tours');
  if (!saved) return initialTours;

  try {
    return JSON.parse(saved);
  } catch {
    return initialTours;
  }
};

const ToursPage = () => {
  const { addToast } = useToast();
  const { t } = useLanguage();
  const { canPerformAction } = usePermissions();
  const { formatPrice } = useCurrency();
  const { addNotification } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [selectedTour, setSelectedTour] = useState(null);
  const [editingTour, setEditingTour] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [tours, setTours] = useState(readStoredTours);

  // Ensure tours have a valid image
  useEffect(() => {
    let needsUpdate = false;
    const updatedTours = tours.map(tour => {
      if (!tour.image || tour.image.includes('images/tours/saona.png')) {
        needsUpdate = true;
        // Assign a default Unsplash image if it's broken
        return { ...tour, image: 'https://images.unsplash.com/photo-1596484552834-3a58f831d36a?w=500' };
      }
      return tour;
    });
    if (needsUpdate) {
      setTours(updatedTours);
      localStorage.setItem('jhoraji_tours', JSON.stringify(updatedTours));
    }
  }, [tours]);

  const categories = ['all', 'island', 'adventure', 'culture', 'nature'];
  const durations = ['halfDay', 'fullDay'];

  const persistTours = (nextTours) => {
    setTours(nextTours);
    localStorage.setItem('jhoraji_tours', JSON.stringify(nextTours));
  };

  const filteredTours = useMemo(() => {
    return tours.filter((tour) => {
      const matchCategory = categoryFilter === 'all' || tour.category === categoryFilter;
      const matchSearch = (tour.title || '').toLowerCase().includes((appliedSearch || '').toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [tours, categoryFilter, appliedSearch]);

  const totalPages = Math.ceil(filteredTours.length / itemsPerPage);
  const currentItems = filteredTours.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value);
    setCurrentPage(1);
  };

  const toggleActive = (id) => {
    const tour = tours.find(t => t.id === id);
    if (!tour) return;
    const newState = !tour.active;
    const nextTours = tours.map((t) => (t.id === id ? { ...t, active: newState } : t));
    persistTours(nextTours);
    logAudit(newState ? 'Activó tour' : 'Desactivó tour', tour.title);
    addToast(t('tourStatusUpdated'), 'success');
  };

  const handleSaveTour = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submitted = {
      id: editingTour.id || Date.now(),
      title: formData.get('title').trim(),
      category: formData.get('category'),
      duration: formData.get('duration'),
      price: formData.get('price').trim(),
      priceChild: formData.get('priceChild').trim(),
      rating: formData.get('rating').trim(),
      image: formData.get('image').trim(),
      description: formData.get('description').trim(),
      includes: formData.get('includes').trim(),
      active: formData.get('active') === 'true',
    };

    const isNew = !editingTour.id;
    const nextTours = isNew
      ? [submitted, ...tours]
      : tours.map((tour) => (tour.id === editingTour.id ? submitted : tour));

    persistTours(nextTours);
    if (isNew) {
      addNotification(`Nuevo tour creado: ${submitted.title}`);
    }
    setEditingTour(null);
    addToast(t('tourSaved'), 'success');
  };

  const handleDelete = () => {
    persistTours(tours.filter((tour) => tour.id !== showDeleteConfirm));
    addToast(t('tourDeleted'), 'success');
    setShowDeleteConfirm(null);
  };

  const openEditTour = (tour) => setEditingTour({ ...tour });

  const renderTourFields = (tour) => (
    <div className="responsive-grid">
      <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>{t('title')}</label><input name="title" type="text" className="form-control" required defaultValue={tour.title} /></div>
      <div className="form-group"><label>{t('category')}</label><select name="category" className="form-control" defaultValue={tour.category}>{categories.filter((category) => category !== 'all').map((category) => <option key={category} value={category}>{t(category)}</option>)}</select></div>
      <div className="form-group"><label>{t('duration')}</label><select name="duration" className="form-control" defaultValue={tour.duration}>{durations.map((duration) => <option key={duration} value={duration}>{t(duration)}</option>)}</select></div>
      <div className="form-group"><label>{t('adultPrice')}</label><input name="price" type="text" className="form-control" required defaultValue={tour.price} /></div>
      <div className="form-group"><label>{t('childPrice')}</label><input name="priceChild" type="text" className="form-control" required defaultValue={tour.priceChild} /></div>
      <div className="form-group"><label>{t('rating')}</label><input name="rating" type="number" step="0.1" min="0" max="5" className="form-control" required defaultValue={tour.rating} /></div>
      <div className="form-group"><label>{t('status')}</label><select name="active" className="form-control" defaultValue={String(tour.active)}><option value="true">{t('active')}</option><option value="false">{t('inactive')}</option></select></div>
      <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>{t('imageUrl')}</label><input name="image" type="url" className="form-control" required defaultValue={tour.image} /></div>
      <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>{t('description')}</label><textarea name="description" className="form-control" rows="3" required defaultValue={tour.description} /></div>
      <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>{t('includes')}</label><textarea name="includes" className="form-control" rows="2" required defaultValue={tour.includes} /></div>
    </div>
  );

  return (
    <div>
      <div className="page-header mb-4">
        <div>
          <h2>{t('toursTitle')}</h2>
          <p className="text-muted" style={{ margin: 0 }}>{t('toursSubtitle')}</p>
        </div>
        {canPerformAction('create') && (
          <button className="btn btn-primary" onClick={() => setEditingTour({ ...emptyTour })}>
            <Plus size={18} /> {t('newTour')}
          </button>
        )}
      </div>

      <div className="card mb-4">
        <div className="page-toolbar">
          <div className="d-flex gap-3" style={{ flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
            <div className="search-integrated">
              <Search size={16} className="search-icon" />
              <input type="text" placeholder={t('searchTours')} className="form-control" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleKeyDown} />
              <button className={`search-clear-btn ${searchQuery ? 'visible' : ''}`} onClick={clearSearch} title="Limpiar" type="button"><Eraser size={15} /></button>
              <button className="search-btn-inner" onClick={handleSearch} type="button"><Search size={13} /> {t('search')}</button>
            </div>
          </div>
          <select className="form-control" style={{ width: 'min(100%, 220px)', height: '36px', padding: '0 12px', fontSize: '0.85rem', borderRadius: 'var(--radius-full)' }} value={categoryFilter} onChange={handleCategoryChange}>
            {categories.map((category) => <option key={category} value={category}>{t(category)}</option>)}
          </select>
        </div>
      </div>

      <div className="tours-grid">
        {currentItems.map((tour) => (
          <div key={tour.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: '180px', position: 'relative' }}>
              <img src={tour.image || 'images/tour_saona.png'} alt={tour.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {canPerformAction('edit') && (
                <button className={`badge ${tour.active ? 'badge-success' : 'badge-danger'}`} style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: tour.active ? '#22c55e' : '#ef4444', color: 'white', cursor: 'pointer', border: 'none' }} onClick={() => toggleActive(tour.id)}>
                  {tour.active ? t('active') : t('inactive')}
                </button>
              )}
              {!canPerformAction('edit') && (
                <span className={`badge ${tour.active ? 'badge-success' : 'badge-danger'}`} style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: tour.active ? '#22c55e' : '#ef4444', color: 'white' }}>
                  {tour.active ? t('active') : t('inactive')}
                </span>
              )}
            </div>
            <div style={{ padding: '15px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="d-flex justify-content-between align-items-center mb-2" style={{ gap: '8px' }}>
                <h3 style={{ fontSize: '0.95rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={tour.title}>{tour.title}</h3>
                <span style={{ fontWeight: 700, color: 'var(--primary-color)', whiteSpace: 'nowrap', fontSize: '0.9rem', flexShrink: 0 }}>{formatPrice(tour.price)}</span>
              </div>
              <div className="d-flex justify-content-between text-muted mb-3" style={{ fontSize: '0.8rem', overflow: 'hidden' }}>
                <div className="d-flex align-items-center gap-1" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '5px' }} title={t(tour.category)}><MapPin size={13} style={{ flexShrink: 0 }} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t(tour.category)}</span></div>
                <div className="d-flex align-items-center gap-1" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '5px' }} title={t(tour.duration)}><Clock size={13} style={{ flexShrink: 0 }} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t(tour.duration)}</span></div>
                <div className="d-flex align-items-center gap-1" style={{ color: 'var(--warning)', whiteSpace: 'nowrap', flexShrink: 0 }}><Star size={13} fill="currentColor" /> {tour.rating}</div>
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', flexWrap: 'wrap' }}>
                <button className="btn btn-outline" style={{ flex: '1 1 0', minWidth: '70px', height: '32px', padding: '0 8px', fontSize: '0.8rem' }} onClick={() => setSelectedTour(tour)}><Eye size={14} /> {t('view')}</button>
                {canPerformAction('edit') && (
                  <button className="btn btn-outline" style={{ flex: '1 1 0', minWidth: '70px', height: '32px', padding: '0 8px', fontSize: '0.8rem' }} onClick={() => openEditTour(tour)}><Edit3 size={14} /> {t('edit')}</button>
                )}
                {canPerformAction('delete') && (
                  <button className="btn btn-outline" style={{ flex: '1 1 0', minWidth: '70px', height: '32px', padding: '0 8px', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => setShowDeleteConfirm(tour.id)}><Trash2 size={14} /> {t('delete')}</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '0 1rem', paddingBottom: '1rem' }}>
        <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredTours.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
      </div>

      {selectedTour && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(event) => event.stopPropagation()} style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: '240px', position: 'relative', flexShrink: 0, borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <img src={selectedTour.image || 'images/tour_saona.png'} alt={selectedTour.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button onClick={() => setSelectedTour(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '50%', padding: '5px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={24} /></button>
            </div>
            <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
              <div className="d-flex justify-content-between align-items-center mb-3" style={{ gap: '12px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0 }}>{selectedTour.title}</h2>
                <span className={`badge ${selectedTour.active ? 'badge-success' : 'badge-danger'}`}>{selectedTour.active ? t('active') : t('inactive')}</span>
              </div>
              <p className="text-muted mb-4">{selectedTour.description}</p>
              <div className="responsive-grid">
                <div><p className="text-muted mb-1">{t('adultPrice')}</p><div className="font-bold d-flex align-items-center gap-1"><DollarSign size={16} color="var(--primary-color)"/>{formatPrice(selectedTour.price)}</div></div>
                <div><p className="text-muted mb-1">{t('childPrice')}</p><div className="font-bold d-flex align-items-center gap-1"><DollarSign size={16} color="var(--primary-color)"/>{formatPrice(selectedTour.priceChild)}</div></div>
                <div><p className="text-muted mb-1">{t('category')}</p><div className="d-flex align-items-center gap-2"><MapPin size={16}/>{t(selectedTour.category)}</div></div>
                <div><p className="text-muted mb-1">{t('duration')}</p><div className="d-flex align-items-center gap-2"><Clock size={16}/>{t(selectedTour.duration)}</div></div>
                <div><p className="text-muted mb-1">{t('rating')}</p><div className="d-flex align-items-center gap-2" style={{ color: 'var(--warning)' }}><Star size={16} fill="currentColor"/>{selectedTour.rating}</div></div>
                <div style={{ gridColumn: '1 / -1' }}><p className="text-muted mb-1">{t('includes')}</p><div style={{ padding: '10px', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>{selectedTour.includes}</div></div>
              </div>
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setSelectedTour(null)}>{t('close')}</button>
                {canPerformAction('edit') && (
                  <button className="btn btn-primary" onClick={() => { setSelectedTour(null); openEditTour(selectedTour); }}>{t('editTour')}</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {editingTour && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 style={{ margin: 0 }}>{editingTour.id ? t('editTour') : t('newTour')}</h3>
              <button onClick={() => setEditingTour(null)} style={{ background: 'none', color: 'var(--text-light)' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveTour}>
              {renderTourFields(editingTour)}
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setEditingTour(null)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(null)}
        onConfirm={handleDelete}
        title={t('deleteTourTitle')}
        message={t('deleteTourText')}
      />
    </div>
  );
};

export default ToursPage;
