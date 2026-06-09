import { useMemo, useState, useEffect } from 'react';
import { Calendar, DollarSign, Edit3, Eraser, Eye, MapPin, Plus, Search, Trash2, User, Users, X, ArrowLeft, FileText, Clock, Plane, Briefcase, CheckCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { usePermissions } from '../context/PermissionsContext';
import { useNotifications } from '../context/NotificationsContext';
import { useCurrency } from '../context/CurrencyContext';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import OrdersPage from './OrdersPage';

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
  const { canPerformAction } = usePermissions();
  const { addNotification } = useNotifications();
  const { formatPrice } = useCurrency();
  
  const [mainTab, setMainTab] = useState('bookings');
  
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editingBooking, setEditingBooking] = useState(() => {
    const saved = sessionStorage.getItem('jhoraji_editing_booking');
    try { return saved ? JSON.parse(saved) : null; } catch { return null; }
  });
  const [viewingBooking, setViewingBooking] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    if (editingBooking) {
      sessionStorage.setItem('jhoraji_editing_booking', JSON.stringify(editingBooking));
    } else {
      sessionStorage.removeItem('jhoraji_editing_booking');
    }
  }, [editingBooking]);
  const [bookings, setBookings] = useState(() => readStoredData('jhoraji_bookings', []));
  const providers = readStoredData('jhoraji_providers', []);
  const toursList = readStoredData('jhoraji_act', []);
  const agencies = readStoredData('jhoraji_agencies', Array.from({ length: 15 }, (_, i) => ({
    id: 1000 + i,
    name: `Agencia ${i + 1} ${['VIP', 'Tours', 'Travel', 'Punta Cana'][i % 4]}`
  })));
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
        .some((val) => String(val || '').toLowerCase().includes(term));
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
      amount: formatPrice(clientPrice),
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

    const isNew = !editingBooking.id;
    const nextBookings = isNew
      ? [submitted, ...bookings]
      : bookings.map((b) => (b.id === editingBooking.id ? submitted : b));

    persistBookings(nextBookings);
    
    // Auto-create order if new
    if (isNew) {
      try {
        const orders = JSON.parse(localStorage.getItem('jhoraji_orders') || '[]');
        const newOrder = {
          id: Date.now(),
          bookingId: submitted.id,
          date: submitted.date,
          time: submitted.time,
          type: submitted.type,
          client: submitted.customer,
          route: submitted.type === 'TRASLADO' ? `${submitted.pickupLocation || ''} - ${submitted.dropoffLocation || ''}` : submitted.hotel,
          service: submitted.type === 'TRASLADO' ? 'Traslado' : submitted.tour,
          adults: submitted.pax,
          children: submitted.children,
          providerPrice: formatPrice(submitted.providerCost),
          provider: submitted.provider,
          driver: submitted.driver,
          paymentDone: submitted.paymentDone
        };
        
        let nextOrders = [newOrder, ...orders];
        
        // Si es Round Trip, crear también la orden de regreso
        if (submitted.isRoundTrip && submitted.returnDate) {
          const returnOrder = {
            id: Date.now() + 1,
            bookingId: submitted.id,
            date: submitted.returnDate,
            time: submitted.returnTime,
            type: submitted.type,
            client: submitted.customer,
            route: `${submitted.dropoffLocation || ''} - ${submitted.pickupLocation || ''}`, // invertido
            service: 'Traslado (Regreso)',
            adults: submitted.pax,
            children: submitted.children,
            providerPrice: formatPrice(submitted.providerCost),
            provider: submitted.provider,
            driver: submitted.driver,
            paymentDone: submitted.paymentDone
          };
          nextOrders = [returnOrder, ...nextOrders];
        }
        
        localStorage.setItem('jhoraji_orders', JSON.stringify(nextOrders));
        window.dispatchEvent(new Event('orders_updated'));
      } catch (e) {
        console.error("Error auto-creating order", e);
      }
    } else {
      try {
        const orders = JSON.parse(localStorage.getItem('jhoraji_orders') || '[]');
        const nextOrders = orders.map(o => {
          if (o.bookingId === submitted.id || (!o.bookingId && o.client === submitted.customer && o.date === submitted.date)) {
            return {
              ...o,
              date: submitted.date,
              time: submitted.time,
              type: submitted.type,
              client: submitted.customer,
              route: submitted.type === 'TRASLADO' ? `${submitted.pickupLocation || ''} - ${submitted.dropoffLocation || ''}` : submitted.hotel,
              service: submitted.type === 'TRASLADO' ? 'Traslado' : submitted.tour,
              adults: submitted.pax,
              children: submitted.children,
              providerPrice: formatPrice(submitted.providerCost),
              provider: submitted.provider,
              driver: submitted.driver,
              paymentDone: submitted.paymentDone
            };
          }
          return o;
        });
        localStorage.setItem('jhoraji_orders', JSON.stringify(nextOrders));
        window.dispatchEvent(new Event('orders_updated'));
      } catch (e) {
        console.error("Error updating order", e);
      }
    }

    setEditingBooking(null);
    addToast(t('bookingSaved'), 'success');
    
    if (isNew) {
      addNotification(`Nueva reserva creada para ${submitted.customer}`);
    }
  };

  const handleDelete = () => {
    persistBookings(bookings.filter((b) => b.id !== showDeleteConfirm));
    addToast(t('bookingDeleted'), 'success');
    setShowDeleteConfirm(null);
  };

  const handleEditOrder = (order) => {
    const booking = bookings.find(b => b.id === order.bookingId) || 
      bookings.find(b => b.customer === order.client && b.date === order.date && b.type === order.type);
    
    if (booking) {
      setEditingBooking(booking);
    } else {
      addToast('Reserva original no encontrada, abriendo como nueva', 'warning');
      setEditingBooking({
        ...emptyBooking,
        type: order.type,
        date: order.date,
        time: order.time,
        customer: order.client,
        providerCost: parseFloat((order.providerPrice||'0').replace(/[^0-9.]/g, '') || 0),
        provider: order.provider,
        driver: order.driver,
        tour: order.type === 'ACTIVIDAD' ? order.service : '',
        pickupLocation: order.type === 'TRASLADO' ? order.route.split(' - ')[0] : '',
        dropoffLocation: order.type === 'TRASLADO' ? order.route.split(' - ')[1] : '',
      });
    }
  };

  const handleViewOrder = (order) => {
    const booking = bookings.find(b => b.id === order.bookingId) || 
      bookings.find(b => b.customer === order.client && b.date === order.date && b.type === order.type);
    
    if (booking) {
      setViewingBooking(booking);
    } else {
      addToast('Reserva original no encontrada, mostrando datos de la orden', 'warning');
      setViewingBooking({
        id: order.id,
        type: order.type,
        date: order.date,
        time: order.time,
        customer: order.client,
        providerCost: parseFloat((order.providerPrice||'0').replace(/[^0-9.]/g, '') || 0),
        clientPrice: '---',
        provider: order.provider,
        driver: order.driver,
        tour: order.type === 'ACTIVIDAD' ? order.service : '',
        pickupLocation: order.type === 'TRASLADO' ? order.route.split(' - ')[0] : '',
        dropoffLocation: order.type === 'TRASLADO' ? order.route.split(' - ')[1] : '',
        pax: order.adults || 1,
        children: order.children || 0,
        paymentDone: order.paymentDone || false,
        notes: 'Datos obtenidos de la orden antigua.'
      });
    }
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
        {canPerformAction('create') && (
          <button className="btn btn-primary" onClick={() => setEditingBooking({ ...emptyBooking })}>
            <Plus size={18} /> {t('newBooking')}
          </button>
        )}
      </div>

      <OrdersPage hideHeader={true} onEditOrder={handleEditOrder} onViewOrder={handleViewOrder} />

      {viewingBooking && (
        <div className="modal-overlay" style={{ padding: '20px' }}>
          <div className="modal-content" style={{ maxWidth: '650px', width: '100%', borderRadius: 'var(--radius-lg)', padding: 0, overflow: 'hidden' }}>
            <div style={{ backgroundColor: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)', padding: '20px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ backgroundColor: viewingBooking.type === 'ACTIVIDAD' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(14, 165, 233, 0.15)', color: viewingBooking.type === 'ACTIVIDAD' ? '#16a34a' : '#0ea5e9', padding: '8px', borderRadius: '10px' }}>
                  {viewingBooking.type === 'ACTIVIDAD' ? <MapPin size={22} /> : <Plane size={22} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-dark)', fontSize: '1.2rem', fontWeight: 600 }}>
                    {viewingBooking.type === 'ACTIVIDAD' ? 'Detalles de la Reserva' : 'Detalles del Traslado'}
                  </h3>
                  <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.85rem' }}>
                    {viewingBooking.id ? (String(viewingBooking.id).startsWith('#') ? viewingBooking.id : `#${viewingBooking.id}`) : '#RES-000'}
                  </p>
                </div>
              </div>
              <button className="btn" style={{ padding: '6px', backgroundColor: '#f1f5f9', borderRadius: '50%', color: 'var(--text-light)', border: 'none' }} onClick={() => setViewingBooking(null)}>
                <X size={20}/>
              </button>
            </div>
            
            <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '25px', maxHeight: '75vh', overflowY: 'auto' }}>
              
              {/* Información General */}
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={16} /> Información del Cliente
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: 'var(--radius-md)', border: '1px solid #f1f5f9' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '4px' }}>Cliente</label>
                    <span style={{ fontSize: '0.95rem', color: 'var(--text-dark)', fontWeight: 500 }}>{viewingBooking.customer}</span>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '4px' }}>Fecha y Hora</label>
                    <span style={{ fontSize: '0.95rem', color: 'var(--text-dark)', fontWeight: 500 }}>{viewingBooking.date} {viewingBooking.time ? `• ${viewingBooking.time}` : ''}</span>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '4px' }}>Pasajeros (PAX)</label>
                    <span style={{ fontSize: '0.95rem', color: 'var(--text-dark)', fontWeight: 500 }}>{viewingBooking.pax} Adultos {viewingBooking.children > 0 ? `, ${viewingBooking.children} Niños` : ''}</span>
                  </div>
                  {viewingBooking.language && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '4px' }}>Idioma</label>
                      <span style={{ fontSize: '0.95rem', color: 'var(--text-dark)', fontWeight: 500 }}>{viewingBooking.language}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Detalles del Servicio */}
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={16} /> Detalles del Servicio
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', backgroundColor: '#f0f9ff', padding: '15px', borderRadius: 'var(--radius-md)', border: '1px solid #e0f2fe' }}>
                  {viewingBooking.type === 'ACTIVIDAD' ? (
                    <>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#0369a1', marginBottom: '4px' }}>Tour / Actividad</label>
                        <span style={{ fontSize: '1.05rem', color: '#0c4a6e', fontWeight: 600 }}>{viewingBooking.tour || 'N/A'}</span>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#0369a1', marginBottom: '4px' }}>Proveedor</label>
                        <span style={{ fontSize: '0.95rem', color: '#0c4a6e', fontWeight: 500 }}>{viewingBooking.provider || 'N/A'}</span>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#0369a1', marginBottom: '4px' }}>Hotel / Recogida</label>
                        <span style={{ fontSize: '0.95rem', color: '#0c4a6e', fontWeight: 500 }}>{viewingBooking.hotel || 'N/A'}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#0369a1', marginBottom: '4px' }}>Chofer Asignado</label>
                        <span style={{ fontSize: '0.95rem', color: '#0c4a6e', fontWeight: 500 }}>{viewingBooking.driver || 'N/A'}</span>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#0369a1', marginBottom: '4px' }}>Número de Vuelo</label>
                        <span style={{ fontSize: '0.95rem', color: '#0c4a6e', fontWeight: 500 }}>{viewingBooking.flightNumber || 'N/A'}</span>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#0369a1', marginBottom: '4px' }}>Ruta del Traslado</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.95rem', color: '#0c4a6e', fontWeight: 500, flex: 1, backgroundColor: 'white', padding: '6px 12px', borderRadius: '4px', border: '1px solid #bae6fd' }}>{viewingBooking.pickupLocation || 'N/A'}</span>
                          <span style={{ color: '#0284c7' }}>→</span>
                          <span style={{ fontSize: '0.95rem', color: '#0c4a6e', fontWeight: 500, flex: 1, backgroundColor: 'white', padding: '6px 12px', borderRadius: '4px', border: '1px solid #bae6fd' }}>{viewingBooking.dropoffLocation || 'N/A'}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Extras y Notas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarSign size={16} /> Costos
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-color)', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Costo Proveedor:</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{formatPrice(viewingBooking.providerCost || 0)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
                        <span style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Precio Cliente:</span>
                        <span style={{ fontWeight: 700, color: '#10b981', fontSize: '1.1rem' }}>{formatPrice(viewingBooking.clientPrice || 0)}</span>
                      </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', paddingLeft: '10px' }}>
                      {viewingBooking.paymentDone ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ecfdf5', color: '#059669', padding: '10px 18px', borderRadius: '12px', border: '1px solid #a7f3d0', boxShadow: '0 2px 10px rgba(16, 185, 129, 0.1)', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.5px' }}>
                          <CheckCircle size={18} strokeWidth={2.5} />
                          PAGO REALIZADO
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fffbeb', color: '#d97706', padding: '10px 18px', borderRadius: '12px', border: '1px solid #fde68a', boxShadow: '0 2px 10px rgba(245, 158, 11, 0.1)', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.5px' }}>
                          <AlertCircle size={18} strokeWidth={2.5} />
                          PAGO PENDIENTE
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} /> Notas Adicionales
                  </h4>
                  <div style={{ backgroundColor: '#fcfdfd', padding: '15px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', minHeight: '80px', color: viewingBooking.notes ? 'var(--text-dark)' : 'var(--text-light)', fontSize: '0.9rem', fontStyle: viewingBooking.notes ? 'normal' : 'italic' }}>
                    {viewingBooking.notes || 'Ninguna nota registrada.'}
                  </div>
                </div>
              </div>

            </div>
            
            <div style={{ padding: '15px 25px', borderTop: '1px solid var(--border-color)', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn" style={{ backgroundColor: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '8px 24px', borderRadius: 'var(--radius-full)', fontWeight: 600 }} onClick={() => setViewingBooking(null)}>
                {t('close') || 'Cerrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const BookingForm = ({ editingBooking, handleSaveBooking, setEditingBooking, providers, toursList, agencies, drivers }) => {
  const { t } = useLanguage();
  const [bookingType, setBookingType] = useState(editingBooking.type || 'ACTIVIDAD');
  const [isRoundTrip, setIsRoundTrip] = useState(!!editingBooking.isRoundTrip);
  const [selectedProvider, setSelectedProvider] = useState(editingBooking.provider || '');

  const activeProvider = providers.find(p => p.name === selectedProvider);
  const activeProviderId = activeProvider ? String(activeProvider.id) : null;
  const availableTours = activeProviderId ? toursList.filter(t => String(t.providerId) === activeProviderId) : [];

  return (
    <div style={{ backgroundColor: 'var(--bg-color)', minHeight: '100%' }}>
      <div className="page-header mb-4" style={{ display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'flex-start' }}>
        <button className="btn btn-outline" onClick={() => setEditingBooking(null)} style={{ padding: '8px' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 style={{ margin: 0 }}>{editingBooking.id ? (t('editBooking') || 'Editar reserva') : (t('newBooking') || 'Nueva reserva')}</h2>
          <p className="text-muted" style={{ margin: 0 }}>{t('adminPanel') || 'Panel de administración'}</p>
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
                <input name="time" type="time" className="form-control" required defaultValue={editingBooking.time} />
              </div>
            </div>
            {bookingType === 'ACTIVIDAD' && (
              <>
                <div className="form-group mb-0">
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>Proveedor</label>
                  <select name="provider" className="form-control" required value={selectedProvider} onChange={(e) => setSelectedProvider(e.target.value)}>
                    <option value="">Seleccionar</option>
                    {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group mb-0">
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>Actividad / Tour</label>
                  <select name="tour" className="form-control" required defaultValue={editingBooking.tour}>
                    <option value="">Seleccionar</option>
                    {availableTours.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
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
                  <select name="driver" className="form-control" required defaultValue={editingBooking.driver}>
                    <option value="">Seleccionar</option>
                    {drivers.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group mb-0">
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>Lugar de Recogida</label>
                  <input name="pickupLocation" type="text" className="form-control" required defaultValue={editingBooking.pickupLocation} />
                </div>
                <div className="form-group mb-0">
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>Lugar de Destino</label>
                  <input name="dropoffLocation" type="text" className="form-control" required defaultValue={editingBooking.dropoffLocation} />
                </div>
                <div className="form-group mb-0">
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>Número de Vuelo</label>
                  <input name="flightNumber" type="text" className="form-control" required defaultValue={editingBooking.flightNumber} />
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
                    <input name="returnTime" type="time" className="form-control" required defaultValue={editingBooking.returnTime} />
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
              <input name="phone" type="tel" className="form-control" required defaultValue={editingBooking.phone} />
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
              <input name="children" type="number" min="0" className="form-control" required defaultValue={editingBooking.children || 0} />
            </div>
            <div className="form-group mb-0">
              <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>Equipos/Unidades</label>
              <input name="units" type="number" min="1" className="form-control" required defaultValue={editingBooking.units || 1} />
            </div>
            <div className="form-group mb-0">
              <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>Costo del Traslado / Proveedor</label>
              <input name="providerCost" type="number" step="0.01" min="0" className="form-control" required defaultValue={editingBooking.providerCost || 0} />
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
                    <option>Civitatis</option>
                    <option>GetYourGuide</option>
                    <option>Viator</option>
                    <option>Otros</option>
                  </select>
                </div>
                <div className="form-group mb-0">
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '5px' }}>% Plataforma</label>
                  <input name="platformPercent" type="number" step="0.01" min="0" className="form-control" required defaultValue={editingBooking.platformPercent || 0} />
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
              {t('save') || 'Guardar reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingsPage;
