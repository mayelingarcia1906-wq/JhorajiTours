import { useMemo, useState } from 'react';
import { Calendar, DollarSign, Edit3, Eraser, Eye, MapPin, Plus, Search, Trash2, User, Users, X, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

const emptyBooking = {
  type: 'ACTIVIDAD',
  date: '',
  time: '',
  provider: '',
  tour: '',
  customer: '',
  hotel: '',
  phone: '',
  language: 'Español',
  pax: 1,
  children: 0,
  units: 1,
  providerCost: 0,
  clientPrice: 0,
  platform: 'Directo / sin plataforma',
  platformPercent: 0,
  agency: 'Sin agencia',
  paymentDone: false,
  notes: '',
  status: 'pending',
  amount: '$0.00',
  email: '',
  driver: '',
  pickupLocation: '',
  dropoffLocation: '',
  flightNumber: '',
  isRoundTrip: false
};

const readStoredData = (key, fallback) => {
  const saved = localStorage.getItem(key);
  if (!saved) return fallback;
  try { return JSON.parse(saved); } catch { return fallback; }
};

const statusBadge = { paid: 'success', pending: 'warning', canceled: 'danger' };

const BookingsPage = () => {
  const { addToast } = useToast();
  const { t } = useLanguage();
  
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  const [bookings, setBookings] = useState(() => readStoredData('jhoraji_bookings', []));
  const providers = readStoredData('jhoraji_providers', []);
  const toursList = readStoredData('jhoraji_tours', []);
  const agencies = readStoredData('jhoraji_agencies', []);
  const drivers = readStoredData('jhoraji_drivers', []);

  const statusTabs = ['all', 'paid', 'pending', 'canceled'];

  const persistBookings = (nextBookings) => {
    setBookings(nextBookings);
    localStorage.setItem('jhoraji_bookings', JSON.stringify(nextBookings));
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesStatus = activeTab === 'all' || b.status === activeTab;
      const term = appliedSearch.toLowerCase();
      const matchesSearch = [b.customer, b.id, b.email, b.tour, b.hotel]
        .some((val) => (val || '').toLowerCase().includes(term));
      return matchesStatus && matchesSearch;
    });
  }, [bookings, activeTab, appliedSearch]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const currentItems = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearch = () => { setAppliedSearch(searchQuery); setCurrentPage(1); };
  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };
  const clearSearch = () => { setSearchQuery(''); setAppliedSearch(''); setCurrentPage(1); };
  const handleTabChange = (tab) => { setActiveTab(tab); setCurrentPage(1); };

  const handleSaveBooking = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const clientPrice = Number(formData.get('clientPrice') || 0);
    const isPaid = formData.get('paymentDone') === 'on';
    
    const type = formData.get('type');

    const submitted = {
      id: editingBooking.id || `#RES-${String(bookings.length + 1).padStart(3, '0')}`,
      type: type,
      date: formData.get('date'),
      time: formData.get('time') || '',
      provider: formData.get('provider') || '',
      tour: type === 'ACTIVIDAD' ? (formData.get('tour') || '') : (formData.get('pickupLocation') ? `Traslado: ${formData.get('pickupLocation')}` : 'Traslado'),
      customer: formData.get('customer').trim(),
      hotel: formData.get('hotel') ? formData.get('hotel').trim() : '',
      phone: formData.get('phone') ? formData.get('phone').trim() : '',
      language: formData.get('language'),
      pax: Number(formData.get('pax')),
      children: Number(formData.get('children') || 0),
      units: Number(formData.get('units') || 1),
      providerCost: Number(formData.get('providerCost') || 0),
      clientPrice: clientPrice,
      platform: formData.get('platform') || '',
      platformPercent: Number(formData.get('platformPercent') || 0),
      agency: formData.get('agency') || '',
      paymentDone: isPaid,
      notes: formData.get('notes') ? formData.get('notes').trim() : '',
      status: isPaid ? 'paid' : 'pending',
      amount: `$${clientPrice.toFixed(2)}`,
      email: editingBooking.email || '',
      // Traslado specific
      driver: formData.get('driver') || '',
      pickupLocation: formData.get('pickupLocation') ? formData.get('pickupLocation').trim() : '',
      dropoffLocation: formData.get('dropoffLocation') ? formData.get('dropoffLocation').trim() : '',
      flightNumber: formData.get('flightNumber') ? formData.get('flightNumber').trim() : '',
      isRoundTrip: formData.get('isRoundTrip') === 'on',
      returnDate: formData.get('isRoundTrip') === 'on' ? (formData.get('returnDate') || '') : '',
      returnTime: formData.get('isRoundTrip') === 'on' ? (formData.get('returnTime') || '') : ''
    };

    const nextBookings = editingBooking.id
      ? bookings.map((b) => (b.id === editingBooking.id ? submitted : b))
      : [submitted, ...bookings];

    persistBookings(nextBookings);
    setEditingBooking(null);
    addToast(t('bookingSaved'), 'success');
  };

  const handleDelete = () => {
    persistBookings(bookings.filter((b) => b.id !== showDeleteConfirm));
    addToast(t('bookingDeleted'), 'success');
    setShowDeleteConfirm(null);
  };

  if (editingBooking) {
    return <BookingForm editingBooking={editingBooking} handleSaveBooking={handleSaveBooking} setEditingBooking={setEditingBooking} providers={providers} toursList={toursList} agencies={agencies} drivers={drivers} />;
  }

  return (
    <div>
      <div className="page-header mb-4">
        <div>
          <h2>{t('bookingsTitle')}</h2>
          <p className="text-muted" style={{ margin: 0 }}>{t('bookingsSubtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditingBooking({ ...emptyBooking })}>
          <Plus size={18} /> {t('newBooking')}
        </button>
      </div>

      <div className="card">
        <div className="page-toolbar mb-4">
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px', maxWidth: '100%' }}>
            {statusTabs.map((tab) => (
              <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => handleTabChange(tab)}>
                {t(tab)}
              </button>
            ))}
          </div>
          <div>
            <div className="search-integrated">
              <Search size={16} className="search-icon" />
              <input type="text" placeholder={t('searchBookings')} className="form-control" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleKeyDown} />
              <button className={`search-clear-btn ${searchQuery ? 'visible' : ''}`} onClick={clearSearch} title="Limpiar" type="button"><Eraser size={15} /></button>
              <button className="search-btn-inner" onClick={handleSearch} type="button"><Search size={13} /> {t('search')}</button>
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>{t('bookingId')}</th>
                <th>{t('customer')}</th>
                <th>{t('tour')}</th>
                <th>{t('date')}</th>
                <th>{t('pax')}</th>
                <th>{t('hotel')}</th>
                <th>{t('status')}</th>
                <th>{t('amount')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((booking) => (
                <tr key={booking.id}>
                  <td className="font-bold">{booking.id}</td>
                  <td><div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontWeight: 500 }}>{booking.customer}</span><span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{booking.email}</span></div></td>
                  <td>{booking.type === 'TRASLADO' ? `Traslado: ${booking.pickupLocation || ''}` : booking.tour}</td>
                  <td>{booking.date}</td>
                  <td>{booking.pax}</td>
                  <td>{booking.type === 'TRASLADO' ? booking.dropoffLocation : booking.hotel}</td>
                  <td><span className={`badge badge-${statusBadge[booking.status]}`}>{t(booking.status)}</span></td>
                  <td className="font-bold">{booking.amount}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="icon-btn" onClick={() => setSelectedBooking(booking)} title={t('view')}><Eye size={18} /></button>
                      <button className="icon-btn" onClick={() => setEditingBooking(booking)} title={t('edit')}><Edit3 size={18} /></button>
                      <button className="icon-btn" onClick={() => setShowDeleteConfirm(booking.id)} title={t('delete')} style={{ color: 'var(--danger)' }}><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-4" style={{ padding: '0 1rem' }}>
            <span className="text-muted">{t('showing')} {((currentPage - 1) * itemsPerPage) + 1} {t('to')} {Math.min(currentPage * itemsPerPage, filteredBookings.length)} {t('of')} {filteredBookings.length}</span>
            <div className="d-flex gap-2">
              <button className="btn btn-outline" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>{t('previous')}</button>
              <button className="btn btn-outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}>{t('next')}</button>
            </div>
          </div>
        )}
      </div>

      {selectedBooking && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 style={{ margin: 0 }}>{t('bookingDetail')} {selectedBooking.id}</h3>
              <button onClick={() => setSelectedBooking(null)} style={{ background: 'none', color: 'var(--text-light)' }}><X size={24} /></button>
            </div>
            <div className="responsive-grid">
              <div><p className="text-muted mb-1">{t('customer')}</p><div className="d-flex align-items-center gap-2"><User size={16}/>{selectedBooking.customer}</div></div>
              <div><p className="text-muted mb-1">Teléfono</p><div className="font-bold">{selectedBooking.phone}</div></div>
              <div><p className="text-muted mb-1">{t('tour')}</p><div className="d-flex align-items-center gap-2"><MapPin size={16}/>{selectedBooking.type === 'TRASLADO' ? 'Traslado' : selectedBooking.tour}</div></div>
              <div><p className="text-muted mb-1">{t('date')}</p><div className="d-flex align-items-center gap-2"><Calendar size={16}/>{selectedBooking.date}</div></div>
              <div><p className="text-muted mb-1">{t('people')}</p><div className="d-flex align-items-center gap-2"><Users size={16}/>{selectedBooking.pax}</div></div>
              <div><p className="text-muted mb-1">{t('status')}</p><span className={`badge badge-${statusBadge[selectedBooking.status]}`}>{t(selectedBooking.status)}</span></div>
              <div><p className="text-muted mb-1">{t('totalAmount')}</p><div className="d-flex align-items-center gap-1 font-bold"><DollarSign size={16} color="var(--primary-color)"/>{selectedBooking.amount}</div></div>
              <div style={{ gridColumn: '1 / -1' }}><p className="text-muted mb-1">{t('notes')}</p><div style={{ padding: '10px', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', minHeight: '60px' }}>{selectedBooking.notes || t('noNotes')}</div></div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setSelectedBooking(null)}>{t('close')}</button>
              <button className="btn btn-primary" onClick={() => { setEditingBooking(selectedBooking); setSelectedBooking(null); }}>{t('editBooking')}</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay" style={{ zIndex: 300 }}>
          <div className="card" style={{ maxWidth: '420px', width: '90%', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '15px' }}>{t('deleteBookingTitle')}</h3>
            <p className="text-muted mb-4">{t('deleteBookingText')} {showDeleteConfirm}?</p>
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

const BookingForm = ({ editingBooking, handleSaveBooking, setEditingBooking, providers, toursList, agencies, drivers }) => {
  const [bookingType, setBookingType] = useState(editingBooking.type || 'ACTIVIDAD');
  const [isRoundTrip, setIsRoundTrip] = useState(!!editingBooking.isRoundTrip);

  return (
    <div style={{ backgroundColor: 'var(--bg-color)', minHeight: '100%' }}>
      <div className="page-header mb-4" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <button className="btn btn-outline" onClick={() => setEditingBooking(null)} style={{ padding: '8px' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 style={{ margin: 0 }}>{editingBooking.id ? 'Editar reserva' : 'Nueva reserva'}</h2>
          <p className="text-muted" style={{ margin: 0 }}>Panel de administración</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', fontWeight: 600 }}>
          <Calendar size={18} /> {new Date().toLocaleDateString('es-ES')}
        </div>
      </div>

      <div className="card" style={{ padding: '30px' }}>
        <h3 style={{ color: 'var(--primary-color)', fontSize: '1.1rem', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          Datos de la reserva
        </h3>

        <form onSubmit={handleSaveBooking}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px', backgroundColor: 'var(--bg-color)', padding: '8px 16px', borderRadius: 'var(--radius-full)', width: 'fit-content' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, fontWeight: 500 }}>
              <input type="radio" name="type" value="ACTIVIDAD" checked={bookingType === 'ACTIVIDAD'} onChange={() => setBookingType('ACTIVIDAD')} style={{ accentColor: 'var(--primary-color)', width: '18px', height: '18px' }} />
              ACTIVIDAD
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, fontWeight: 500 }}>
              <input type="radio" name="type" value="TRASLADO" checked={bookingType === 'TRASLADO'} onChange={() => setBookingType('TRASLADO')} style={{ accentColor: 'var(--primary-color)', width: '18px', height: '18px' }} />
              TRASLADO
            </label>
          </div>

          {/* FILA 1 - Común */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group mb-0">
              <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>Fecha actividad / Traslado</label>
              <div style={{ position: 'relative' }}>
                <input name="date" type="date" className="form-control" required defaultValue={editingBooking.date || new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]} min={!editingBooking.id ? new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0] : undefined} />
              </div>
            </div>
            <div className="form-group mb-0">
              <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>Hora recogida</label>
              <div style={{ position: 'relative' }}>
                <input name="time" type="time" className="form-control" defaultValue={editingBooking.time} />
              </div>
            </div>
            {bookingType === 'ACTIVIDAD' && (
              <>
                <div className="form-group mb-0">
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>Proveedor</label>
                  <select name="provider" className="form-control" defaultValue={editingBooking.provider}>
                    <option value="">Seleccionar</option>
                    {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group mb-0">
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>Actividad / Tour</label>
                  <select name="tour" className="form-control" defaultValue={editingBooking.tour}>
                    <option value="">Seleccionar</option>
                    {toursList.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>

          {/* CAJA AZUL - SOLO TRASLADO */}
          {bookingType === 'TRASLADO' && (
            <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div className="form-group mb-0">
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>Seleccionar Chofer</label>
                  <select name="driver" className="form-control" defaultValue={editingBooking.driver}>
                    <option value="">Seleccionar</option>
                    {drivers.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group mb-0">
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>Lugar de Recogida</label>
                  <input name="pickupLocation" type="text" className="form-control" defaultValue={editingBooking.pickupLocation} />
                </div>
                <div className="form-group mb-0">
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>Lugar de Destino</label>
                  <input name="dropoffLocation" type="text" className="form-control" defaultValue={editingBooking.dropoffLocation} />
                </div>
                <div className="form-group mb-0">
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>Número de Vuelo</label>
                  <input name="flightNumber" type="text" className="form-control" defaultValue={editingBooking.flightNumber} />
                </div>
              </div>
              <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-dark)', margin: 0 }}>
                  <input type="checkbox" name="isRoundTrip" checked={isRoundTrip} onChange={e => setIsRoundTrip(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)' }} />
                  ¿Es Round Trip (Ida y Vuelta)?
                </label>
              </div>
              
              {isRoundTrip && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #bae6fd' }}>
                  <div className="form-group mb-0">
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>Fecha Recogida (Regreso)</label>
                    <input name="returnDate" type="date" className="form-control" required defaultValue={editingBooking.returnDate} min={!editingBooking.id ? new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0] : undefined} />
                  </div>
                  <div className="form-group mb-0">
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>Hora Recogida (Regreso)</label>
                    <input name="returnTime" type="time" className="form-control" defaultValue={editingBooking.returnTime} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FILA 2+ - Común */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group mb-0">
              <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>Nombre cliente</label>
              <input name="customer" type="text" className="form-control" required defaultValue={editingBooking.customer} />
            </div>
            {bookingType === 'ACTIVIDAD' && (
              <div className="form-group mb-0">
                <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>Hotel</label>
                <input name="hotel" type="text" className="form-control" required defaultValue={editingBooking.hotel} />
              </div>
            )}
            <div className="form-group mb-0">
              <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>Teléfono</label>
              <input name="phone" type="tel" className="form-control" defaultValue={editingBooking.phone} />
            </div>
            <div className="form-group mb-0">
              <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>Idioma</label>
              <select name="language" className="form-control" defaultValue={editingBooking.language || 'Español'}>
                <option>Español</option>
                <option>Inglés</option>
                <option>Francés</option>
                <option>Alemán</option>
                <option>Portugués</option>
              </select>
            </div>

            <div className="form-group mb-0">
              <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>Adultos (PAX)</label>
              <input name="pax" type="number" min="1" className="form-control" required defaultValue={editingBooking.pax || 1} />
            </div>
            <div className="form-group mb-0">
              <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>Niños</label>
              <input name="children" type="number" min="0" className="form-control" defaultValue={editingBooking.children || 0} />
            </div>
            <div className="form-group mb-0">
              <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>Equipos/Unidades</label>
              <input name="units" type="number" min="1" className="form-control" defaultValue={editingBooking.units || 1} />
            </div>
            <div className="form-group mb-0">
              <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>Costo del Traslado / Proveedor</label>
              <input name="providerCost" type="number" step="0.01" min="0" className="form-control" defaultValue={editingBooking.providerCost || 0} />
            </div>

            <div className="form-group mb-0">
              <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>Precio del Traslado / Cliente</label>
              <input name="clientPrice" type="number" step="0.01" min="0" className="form-control" required defaultValue={editingBooking.clientPrice || 0} />
            </div>
            
            {bookingType === 'ACTIVIDAD' && (
              <>
                <div className="form-group mb-0">
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>Plataforma</label>
                  <select name="platform" className="form-control" defaultValue={editingBooking.platform || 'Directo / sin plataforma'}>
                    <option>Directo / sin plataforma</option>
                    <option>Tripadvisor</option>
                    <option>Expedia</option>
                    <option>GetYourGuide</option>
                    <option>Viator</option>
                  </select>
                </div>
                <div className="form-group mb-0">
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>% Plataforma</label>
                  <input name="platformPercent" type="number" step="0.01" min="0" className="form-control" defaultValue={editingBooking.platformPercent || 0} />
                </div>
              </>
            )}

            <div className="form-group mb-0">
              <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>Agencia</label>
              <select name="agency" className="form-control" defaultValue={editingBooking.agency || 'Sin agencia'}>
                <option>Sin agencia</option>
                {agencies.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                <input type="checkbox" name="paymentDone" defaultChecked={editingBooking.paymentDone || editingBooking.status === 'paid'} style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)' }} />
                Pago realizado
              </label>
            </div>

            <div className="form-group mb-0" style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>Notas</label>
              <textarea name="notes" className="form-control" rows="3" defaultValue={editingBooking.notes}></textarea>
            </div>
          </div>

          <div style={{ marginTop: '30px' }}>
            <button type="submit" className="btn" style={{ backgroundColor: '#14b8a6', color: 'white', padding: '10px 24px', borderRadius: 'var(--radius-full)', fontWeight: 600, border: 'none' }}>
              Guardar reserva
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingsPage;
