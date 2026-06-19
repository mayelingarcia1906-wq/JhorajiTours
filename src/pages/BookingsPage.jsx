import { useEffect, useMemo, useState } from 'react';
import {
  Calendar, Car, ChevronDown, ChevronUp, DollarSign, Edit3, Eye, Filter, MapPin,
  Plus, Search, Trash2, User, Users, X,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useCurrency } from '../context/CurrencyContext';
import { useNotifications } from '../context/NotificationsContext';
import { usePermissions } from '../context/PermissionsContext';
import { Pagination } from '../components/Pagination';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const STORAGE_KEY = 'jhoraji_bookings';
const ORDERS_KEY = 'jhoraji_orders';
const ACTIVITIES_KEY = 'jhoraji_act';

const read = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
};

const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const emptyBooking = {
  id: null,
  type: 'ACTIVIDAD',
  date: new Date().toISOString().split('T')[0],
  time: '09:00',
  provider: '',
  tour: '',
  customer: '',
  hotel: '',
  phone: '',
  email: '',
  language: 'es',
  pax: 1,
  children: 0,
  units: 1,
  providerCost: '',
  clientPrice: '',
  platform: 'Directo',
  platformPercent: 0,
  agency: '',
  paymentDone: false,
  notes: '',
  status: 'pendiente',
  driver: '',
  driverPayment: '',
  pickupLocation: '',
  dropoffLocation: '',
  flightNumber: '',
  isRoundTrip: false,
  returnDate: '',
  returnTime: '',
  extras: '',
  createdBy: '',
  timestamp: '',
};

const STATUS_TONE = {
  pendiente: 'warning', pending: 'warning',
  confirmado: 'info', confirmed: 'info',
  completado: 'success', completed: 'success',
  cancelado: 'danger', cancelled: 'danger',
  en_curso: 'primary',
};

const FilterChip = ({ active, onClick, icon: Icon, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`tab-btn ${active ? 'active' : ''}`}
    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
  >
    {Icon && <Icon size={13} />}
    {children}
  </button>
);

const BookingsPage = () => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const { formatPrice } = useCurrency();
  const { addNotification } = useNotifications();
  const { canPerformAction } = usePermissions();

  const [bookings, setBookings] = useState(() => read(STORAGE_KEY));
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => { write(STORAGE_KEY, bookings); }, [bookings]);

  const filtered = useMemo(() => {
    const term = appliedSearch.toLowerCase();
    return bookings
      .filter((b) => {
        if (statusFilter !== 'all' && b.status !== statusFilter) return false;
        if (typeFilter !== 'all' && b.type !== typeFilter) return false;
        if (!term) return true;
        return [b.customer, b.tour, b.provider, b.hotel, b.phone, b.email, b.id]
          .some((v) => String(v || '').toLowerCase().includes(term));
      })
      .sort((a, b) => {
        const av = a[sortBy] || '';
        const bv = b[sortBy] || '';
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
  }, [bookings, appliedSearch, statusFilter, typeFilter, sortBy, sortDir]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearch = () => { setAppliedSearch(searchQuery); setCurrentPage(1); };
  const clearSearch = () => { setSearchQuery(''); setAppliedSearch(''); setCurrentPage(1); };
  const handleSort = (col) => {
    if (sortBy === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const submitted = {
      ...editing,
      id: editing.id || Date.now(),
      type: fd.get('type'),
      date: fd.get('date'),
      time: fd.get('time'),
      provider: fd.get('provider')?.trim() || '',
      tour: fd.get('tour')?.trim() || '',
      customer: fd.get('customer')?.trim() || '',
      hotel: fd.get('hotel')?.trim() || '',
      phone: fd.get('phone')?.trim() || '',
      email: fd.get('email')?.trim() || '',
      language: fd.get('language'),
      pax: parseInt(fd.get('pax')) || 1,
      children: parseInt(fd.get('children')) || 0,
      units: parseInt(fd.get('units')) || 1,
      providerCost: fd.get('providerCost')?.trim() || '',
      clientPrice: fd.get('clientPrice')?.trim() || '',
      platform: fd.get('platform'),
      platformPercent: parseFloat(fd.get('platformPercent')) || 0,
      agency: fd.get('agency')?.trim() || '',
      paymentDone: fd.get('paymentDone') === 'on',
      notes: fd.get('notes')?.trim() || '',
      status: fd.get('status'),
      driver: fd.get('driver')?.trim() || '',
      driverPayment: fd.get('driverPayment')?.trim() || '',
      pickupLocation: fd.get('pickupLocation')?.trim() || '',
      dropoffLocation: fd.get('dropoffLocation')?.trim() || '',
      flightNumber: fd.get('flightNumber')?.trim() || '',
      isRoundTrip: fd.get('isRoundTrip') === 'on',
      returnDate: fd.get('returnDate') || '',
      returnTime: fd.get('returnTime') || '',
      extras: fd.get('extras')?.trim() || '',
      timestamp: editing.timestamp || new Date().toISOString(),
    };

    let next;
    if (editing.id) {
      next = bookings.map((b) => (b.id === editing.id ? submitted : b));
    } else {
      next = [submitted, ...bookings];
      addNotification('notifNewBooking', { ref: submitted.customer || submitted.tour || submitted.id }, 'booking', '/bookings');
    }
    setBookings(next);
    setEditing(null);
    addToast(t('bookingSaved'), 'success');

    // Auto-create order in jhoraji_orders
    const orders = read(ORDERS_KEY);
    const orderId = `ORD-${Date.now()}`;
    const order = {
      id: orderId,
      bookingId: submitted.id,
      type: submitted.type,
      date: submitted.date,
      time: submitted.time,
      customer: submitted.customer,
      tour: submitted.tour || submitted.provider,
      driver: submitted.driver,
      status: 'pendiente',
      paymentDone: submitted.paymentDone,
      notes: submitted.notes,
      pickupLocation: submitted.pickupLocation,
      dropoffLocation: submitted.dropoffLocation,
      flightNumber: submitted.flightNumber,
      isRoundTrip: submitted.isRoundTrip,
    };
    orders.unshift(order);
    if (submitted.isRoundTrip && submitted.returnDate) {
      orders.unshift({
        ...order,
        id: `ORD-${Date.now()}-R`,
        date: submitted.returnDate,
        time: submitted.returnTime || submitted.time,
        type: submitted.type + ' (Regreso)',
        pickupLocation: submitted.dropoffLocation,
        dropoffLocation: submitted.pickupLocation,
      });
    }
    write(ORDERS_KEY, orders);
    window.dispatchEvent(new Event('orders_updated'));
  };

  const handleDelete = () => {
    setBookings(bookings.filter((b) => b.id !== showDelete));
    setShowDelete(null);
    addToast(t('bookingDeleted'), 'success');
  };

  const SortHeader = ({ col, children, align = 'left' }) => (
    <th
      onClick={() => handleSort(col)}
      style={{ cursor: 'pointer', userSelect: 'none', textAlign: align }}
    >
      <span className="d-inline-flex align-items-center gap-1">
        {children}
        {sortBy === col && (sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
      </span>
    </th>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{t('reservasTitle')}</h2>
          <p className="page-subtitle">
            {filtered.length} {filtered.length === 1 ? t('bookingSingular') : t('bookingsPlural')}
            {statusFilter !== 'all' || typeFilter !== 'all' ? ` (${t('filtered')})` : ''}
          </p>
        </div>
        {canPerformAction('create') && (
          <button className="btn btn-primary" onClick={() => setEditing({ ...emptyBooking })}>
            <Plus size={16} /> {t('newBooking')}
          </button>
        )}
      </div>

      <div className="card mb-4">
        <div className="page-toolbar">
          <div className="d-flex gap-2 align-items-center" style={{ flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
            <div className="search-integrated" style={{ flex: '1 1 280px', maxWidth: 380 }}>
              <Search size={15} className="search-icon" />
              <input
                type="text"
                placeholder={t('searchBookings')}
                className="form-control"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              {searchQuery && (
                <button className="search-clear-btn visible" onClick={clearSearch} type="button">
                  <X size={14} />
                </button>
              )}
              <button className="search-btn-inner" onClick={handleSearch} type="button">
                <Search size={12} /> {t('search')}
              </button>
            </div>

            <button
              className={`tab-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Filter size={13} /> {t('filtros')}
            </button>
          </div>
        </div>

        {showFilters && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ marginBottom: '0.85rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 12 }}>
                {t('status')}:
              </span>
              <span className="d-inline-flex gap-2" style={{ flexWrap: 'wrap', marginTop: 8 }}>
                <FilterChip active={statusFilter === 'all'} onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}>
                  {t('all')}
                </FilterChip>
                <FilterChip active={statusFilter === 'pendiente'} onClick={() => { setStatusFilter('pendiente'); setCurrentPage(1); }}>
                  {t('pendiente')}
                </FilterChip>
                <FilterChip active={statusFilter === 'confirmado'} onClick={() => { setStatusFilter('confirmado'); setCurrentPage(1); }}>
                  {t('confirmado')}
                </FilterChip>
                <FilterChip active={statusFilter === 'completado'} onClick={() => { setStatusFilter('completado'); setCurrentPage(1); }}>
                  {t('completado')}
                </FilterChip>
                <FilterChip active={statusFilter === 'cancelado'} onClick={() => { setStatusFilter('cancelado'); setCurrentPage(1); }}>
                  {t('cancelado')}
                </FilterChip>
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 12 }}>
                {t('type')}:
              </span>
              <span className="d-inline-flex gap-2" style={{ flexWrap: 'wrap', marginTop: 8 }}>
                <FilterChip active={typeFilter === 'all'} onClick={() => { setTypeFilter('all'); setCurrentPage(1); }}>
                  {t('all')}
                </FilterChip>
                <FilterChip active={typeFilter === 'ACTIVIDAD'} onClick={() => { setTypeFilter('ACTIVIDAD'); setCurrentPage(1); }} icon={MapPin}>
                  {t('actividad')}
                </FilterChip>
                <FilterChip active={typeFilter === 'TRASLADO'} onClick={() => { setTypeFilter('TRASLADO'); setCurrentPage(1); }} icon={Car}>
                  {t('traslado')}
                </FilterChip>
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper" style={{ borderRadius: 0, border: 'none' }}>
          <table className="table compact-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <SortHeader col="date">{t('date')}</SortHeader>
                <th>{t('type')}</th>
                <SortHeader col="customer">{t('customer')}</SortHeader>
                <th>{t('tour')}</th>
                <th>{t('pax')}</th>
                <SortHeader col="clientPrice" align="right">{t('price')}</SortHeader>
                <th>{t('status')}</th>
                <th className="action-col" style={{ textAlign: 'right' }}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-faint)' }}>
                    {t('noBookings')}
                  </td>
                </tr>
              ) : (
                currentItems.map((b, i) => (
                  <tr key={b.id} className="clickable" onClick={() => setSelected(b)}>
                    <td style={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>{(currentPage - 1) * itemsPerPage + i + 1}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{b.date}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>{b.time}</div>
                    </td>
                    <td>
                      <span className="badge badge-neutral" style={{ gap: 4 }}>
                        {b.type === 'TRASLADO' ? <Car size={11} /> : <MapPin size={11} />}
                        {b.type === 'TRASLADO' ? t('traslado') : t('actividad')}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{b.customer || '—'}</div>
                      {b.hotel && <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>{b.hotel}</div>}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-medium)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {b.tour || b.provider || '—'}
                    </td>
                    <td>
                      <span className="d-inline-flex align-items-center gap-1" style={{ fontSize: '0.82rem' }}>
                        <Users size={12} style={{ color: 'var(--text-faint)' }} />
                        {b.pax || 1}
                      </span>
                    </td>
                    <td className="font-bold" style={{ textAlign: 'right', whiteSpace: 'nowrap', color: 'var(--text-dark)' }}>
                      {formatPrice(b.clientPrice)}
                    </td>
                    <td>
                      <span className={`badge badge-${STATUS_TONE[b.status] || 'neutral'}`}>
                        <span className="status-dot pulse" style={{ background: `var(--${STATUS_TONE[b.status] === 'warning' ? 'warning' : STATUS_TONE[b.status] === 'success' ? 'success' : STATUS_TONE[b.status] === 'danger' ? 'danger' : 'info'})` }} />
                        {t(b.status)}
                      </span>
                    </td>
                    <td className="action-col" onClick={(e) => e.stopPropagation()}>
                      <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                        <button className="icon-btn" onClick={() => setSelected(b)} title={t('view')}>
                          <Eye size={15} />
                        </button>
                        {canPerformAction('edit') && (
                          <button className="icon-btn" onClick={() => setEditing({ ...b })} title={t('edit')}>
                            <Edit3 size={15} />
                          </button>
                        )}
                        {canPerformAction('delete') && (
                          <button className="icon-btn danger" onClick={() => setShowDelete(b.id)} title={t('delete')}>
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Detail Drawer/Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="badge badge-neutral">
                    {selected.type === 'TRASLADO' ? <Car size={11} /> : <MapPin size={11} />}
                    {selected.type === 'TRASLADO' ? t('traslado') : t('actividad')}
                  </span>
                  <span className={`badge badge-${STATUS_TONE[selected.status] || 'neutral'}`}>
                    {t(selected.status)}
                  </span>
                </div>
                <h3 style={{ margin: 0 }}>{selected.tour || selected.provider || 'Reserva'}</h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 4 }}>
                  {selected.date} · {selected.time}
                </div>
              </div>
              <button className="modal-close" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>

            <div className="responsive-grid">
              <div>
                <p className="text-muted mb-1" style={{ margin: 0, fontSize: '0.72rem' }}>{t('customer')}</p>
                <div className="d-flex align-items-center gap-2" style={{ fontWeight: 600, marginTop: 4 }}>
                  <User size={15} style={{ color: 'var(--primary-color)' }} /> {selected.customer || '—'}
                </div>
              </div>
              <div>
                <p className="text-muted mb-1" style={{ margin: 0, fontSize: '0.72rem' }}>{t('phone')}</p>
                <div style={{ fontWeight: 500, marginTop: 4 }}>{selected.phone || '—'}</div>
              </div>
              <div>
                <p className="text-muted mb-1" style={{ margin: 0, fontSize: '0.72rem' }}>{t('hotel')}</p>
                <div style={{ fontWeight: 500, marginTop: 4 }}>{selected.hotel || '—'}</div>
              </div>
              <div>
                <p className="text-muted mb-1" style={{ margin: 0, fontSize: '0.72rem' }}>{t('pax')}</p>
                <div className="d-flex align-items-center gap-1" style={{ fontWeight: 500, marginTop: 4 }}>
                  <Users size={14} /> {selected.pax || 1} {selected.children > 0 && `(+${selected.children} ${t('children').toLowerCase()})`}
                </div>
              </div>
              <div>
                <p className="text-muted mb-1" style={{ margin: 0, fontSize: '0.72rem' }}>{t('provider')}</p>
                <div style={{ fontWeight: 500, marginTop: 4 }}>{selected.provider || '—'}</div>
              </div>
              <div>
                <p className="text-muted mb-1" style={{ margin: 0, fontSize: '0.72rem' }}>{t('driver')}</p>
                <div style={{ fontWeight: 500, marginTop: 4 }}>{selected.driver || '—'}</div>
              </div>
              {selected.type === 'TRASLADO' && (
                <>
                  <div>
                    <p className="text-muted mb-1" style={{ margin: 0, fontSize: '0.72rem' }}>{t('pickup')}</p>
                    <div style={{ fontWeight: 500, marginTop: 4 }}>{selected.pickupLocation || '—'}</div>
                  </div>
                  <div>
                    <p className="text-muted mb-1" style={{ margin: 0, fontSize: '0.72rem' }}>{t('dropoff')}</p>
                    <div style={{ fontWeight: 500, marginTop: 4 }}>{selected.dropoffLocation || '—'}</div>
                  </div>
                  {selected.flightNumber && (
                    <div>
                      <p className="text-muted mb-1" style={{ margin: 0, fontSize: '0.72rem' }}>{t('flight')}</p>
                      <div style={{ fontWeight: 500, marginTop: 4, fontFamily: 'var(--font-mono)' }}>{selected.flightNumber}</div>
                    </div>
                  )}
                </>
              )}
              <div>
                <p className="text-muted mb-1" style={{ margin: 0, fontSize: '0.72rem' }}>{t('platform')}</p>
                <div style={{ fontWeight: 500, marginTop: 4 }}>{selected.platform || 'Directo'}</div>
              </div>
              <div>
                <p className="text-muted mb-1" style={{ margin: 0, fontSize: '0.72rem' }}>{t('clientPrice')}</p>
                <div className="d-flex align-items-center gap-1" style={{ fontWeight: 700, color: 'var(--primary-color)', marginTop: 4, fontSize: '0.9375rem', fontFamily: 'var(--font-display)' }}>
                  <DollarSign size={16} /> {formatPrice(selected.clientPrice)}
                </div>
              </div>
            </div>

            {selected.notes && (
              <div style={{ marginTop: '1.25rem', padding: '0.85rem 1rem', background: 'var(--bg-soft)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--text-medium)' }}>
                <strong style={{ color: 'var(--text-dark)' }}>{t('notes')}:</strong> {selected.notes}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setSelected(null)}>{t('close')}</button>
              {canPerformAction('edit') && (
                <button className="btn btn-primary" onClick={() => { setSelected(null); setEditing({ ...selected }); }}>
                  <Edit3 size={15} /> {t('edit')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Modal */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 760 }}>
            <div className="modal-header">
              <h3>{editing.id ? t('editBooking') : t('newBooking')}</h3>
              <button className="modal-close" onClick={() => setEditing(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="responsive-grid">
                <div className="form-group">
                  <label>{t('type')}</label>
                  <select name="type" className="form-control" defaultValue={editing.type}>
                    <option value="ACTIVIDAD">{t('actividad')}</option>
                    <option value="TRASLADO">{t('traslado')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('status')}</label>
                  <select name="status" className="form-control" defaultValue={editing.status}>
                    <option value="pendiente">{t('pendiente')}</option>
                    <option value="confirmado">{t('confirmado')}</option>
                    <option value="completado">{t('completado')}</option>
                    <option value="cancelado">{t('cancelado')}</option>
                  </select>
                </div>
                <div className="form-group"><label>{t('date')}</label><input name="date" type="date" className="form-control" required defaultValue={editing.date} /></div>
                <div className="form-group"><label>{t('time')}</label><input name="time" type="time" className="form-control" defaultValue={editing.time} /></div>
                <div className="form-group"><label>{t('customer')}</label><input name="customer" type="text" className="form-control" required defaultValue={editing.customer} /></div>
                <div className="form-group"><label>{t('phone')}</label><input name="phone" type="tel" className="form-control" defaultValue={editing.phone} /></div>
                <div className="form-group"><label>{t('email')}</label><input name="email" type="email" className="form-control" defaultValue={editing.email} /></div>
                <div className="form-group"><label>{t('hotel')}</label><input name="hotel" type="text" className="form-control" defaultValue={editing.hotel} /></div>
                <div className="form-group">
                  <label>{t('tour')}</label>
                  <input name="tour" type="text" list="tour-options" className="form-control" defaultValue={editing.tour} onChange={(e) => {
                    const act = read('jhoraji_act').find(a => a.name === e.target.value);
                    if (act) {
                      const pCostInput = document.getElementsByName('providerCost')[0];
                      const cPriceInput = document.getElementsByName('clientPrice')[0];
                      const provInput = document.getElementsByName('provider')[0];
                      
                      if (pCostInput) pCostInput.value = act.costBase || 0;
                      if (cPriceInput) {
                        const cp = ((Number(act.costBase) || 0) * (1 + (Object.values(act.commissions || {}).reduce((acc, v) => acc + (Number(v) || 0), 0)) / 100)).toFixed(2);
                        cPriceInput.value = cp;
                      }
                      if (provInput && act.providerId) {
                        const prov = read('jhoraji_providers').find(p => p.id === act.providerId);
                        if (prov) provInput.value = prov.name;
                      }
                    }
                  }} />
                  <datalist id="tour-options">
                    {read('jhoraji_act').map(a => <option key={a.id} value={a.name}>{a.category ? `[${a.category.toUpperCase()}] ` : ''}{a.name}</option>)}
                  </datalist>
                </div>
                <div className="form-group"><label>{t('provider')}</label><input name="provider" type="text" className="form-control" defaultValue={editing.provider} /></div>
                <div className="form-group"><label>{t('pax')}</label><input name="pax" type="number" min="1" className="form-control" defaultValue={editing.pax} /></div>
                <div className="form-group"><label>{t('children')}</label><input name="children" type="number" min="0" className="form-control" defaultValue={editing.children} /></div>
                <div className="form-group"><label>{t('driver')}</label><input name="driver" type="text" className="form-control" defaultValue={editing.driver} /></div>
                <div className="form-group"><label>{t('platform')}</label><input name="platform" type="text" className="form-control" defaultValue={editing.platform} /></div>
                <div className="form-group"><label>{t('platformPercent')}</label><input name="platformPercent" type="number" step="0.1" min="0" className="form-control" defaultValue={editing.platformPercent} /></div>
                <div className="form-group"><label>{t('providerCost')}</label><input name="providerCost" type="text" className="form-control" defaultValue={editing.providerCost} /></div>
                <div className="form-group"><label>{t('clientPrice')}</label><input name="clientPrice" type="text" className="form-control" required defaultValue={editing.clientPrice} /></div>
                <div className="form-group"><label>{t('driverPayment')}</label><input name="driverPayment" type="text" className="form-control" defaultValue={editing.driverPayment} /></div>
                <div className="form-group"><label>{t('pickup')}</label><input name="pickupLocation" type="text" className="form-control" defaultValue={editing.pickupLocation} /></div>
                <div className="form-group"><label>{t('dropoff')}</label><input name="dropoffLocation" type="text" className="form-control" defaultValue={editing.dropoffLocation} /></div>
                <div className="form-group"><label>{t('flight')}</label><input name="flightNumber" type="text" className="form-control" defaultValue={editing.flightNumber} /></div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
                    <input type="checkbox" name="isRoundTrip" defaultChecked={editing.isRoundTrip} />
                    {t('roundTrip')}
                  </label>
                </div>
                {editing.isRoundTrip && (
                  <>
                    <div className="form-group"><label>{t('returnDate')}</label><input name="returnDate" type="date" className="form-control" defaultValue={editing.returnDate} /></div>
                    <div className="form-group"><label>{t('returnTime')}</label><input name="returnTime" type="time" className="form-control" defaultValue={editing.returnTime} /></div>
                  </>
                )}
                <div className="form-group"><label>{t('language')}</label>
                  <select name="language" className="form-control" defaultValue={editing.language}>
                    <option value="es">Español</option>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="pt">Português</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
                    <input type="checkbox" name="paymentDone" defaultChecked={editing.paymentDone} />
                    {t('paymentDone')}
                  </label>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>{t('notes')}</label><textarea name="notes" className="form-control" rows="2" defaultValue={editing.notes} /></div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>{t('extras')}</label><textarea name="extras" className="form-control" rows="2" defaultValue={editing.extras} /></div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!showDelete}
        onCancel={() => setShowDelete(null)}
        onConfirm={handleDelete}
        title={t('deleteBookingTitle')}
        message={t('deleteBookingText')}
      />
    </div>
  );
};

export default BookingsPage;
