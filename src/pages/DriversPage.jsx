import { useEffect, useMemo, useState } from 'react';
import { Calendar, Truck, User, Edit3, Trash2, X, Plus, Printer } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Pagination } from '../components/Pagination';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const initialDrivers = [];

const emptyDriver = {
  name: '',
  whatsapp: '',
  vehicle: '',
  active: true,
};

const readStoredData = (key, defaultData) => {
  const saved = localStorage.getItem(key);
  if (!saved) return defaultData;
  try {
    return JSON.parse(saved);
  } catch {
    return defaultData;
  }
};

const DriversPage = () => {
  const { addToast } = useToast();
  const { t } = useLanguage();
  
  const [drivers, setDrivers] = useState(() => readStoredData('jhoraji_drivers', initialDrivers));
  const [bookings, setBookings] = useState(() => readStoredData('jhoraji_bookings', []));

  // Tabs state
  const [activeTab, setActiveTab] = useState('assign'); // 'assign', 'directory', 'orders'

  // Forms
  const [editingDriver, setEditingDriver] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [assigningBooking, setAssigningBooking] = useState(null);
  
  // Assignment Filters
  const today = new Date().toISOString().split('T')[0];
  const [assignFilterAct, setAssignFilterAct] = useState('all');
  const [assignFilterDateStart, setAssignFilterDateStart] = useState(today);
  const [assignFilterDateEnd, setAssignFilterDateEnd] = useState(today);

  // Search Order Filters
  const [orderFilterVehicle, setOrderFilterVehicle] = useState('');
  const [orderFilterDateStart, setOrderFilterDateStart] = useState('');
  const [orderFilterDateEnd, setOrderFilterDateEnd] = useState('');

  // Pagination states
  const [currentPageAssign, setCurrentPageAssign] = useState(1);
  const [currentPageDirectory, setCurrentPageDirectory] = useState(1);
  const itemsPerPage = 12;

  // Reset pagination when tabs change
  useEffect(() => {
    setCurrentPageAssign(1);
    setCurrentPageDirectory(1);
  }, [activeTab]);

  const reportBookings = useMemo(() => {
    return bookings.filter(b => {
      const bDriver = b.driverId || b.driver;
      const matchDriver = !orderFilterVehicle || String(bDriver) === String(orderFilterVehicle);
      const matchDate = (!orderFilterDateStart || b.date >= orderFilterDateStart) && 
                        (!orderFilterDateEnd || b.date <= orderFilterDateEnd);
      return bDriver && matchDriver && matchDate && b.status !== 'canceled';
    });
  }, [bookings, orderFilterVehicle, orderFilterDateStart, orderFilterDateEnd]);

  const persistDrivers = (nextDrivers) => {
    setDrivers(nextDrivers);
    localStorage.setItem('jhoraji_drivers', JSON.stringify(nextDrivers));
  };

  const persistBookings = (nextBookings) => {
    setBookings(nextBookings);
    localStorage.setItem('jhoraji_bookings', JSON.stringify(nextBookings));
  };

  const handleSaveDriver = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submitted = {
      id: editingDriver.id || Date.now(),
      name: formData.get('name').trim(),
      whatsapp: formData.get('whatsapp').trim(),
      vehicle: formData.get('vehicle').trim(),
      active: formData.get('active') === 'on',
    };

    const nextDrivers = editingDriver.id
      ? drivers.map((d) => (d.id === editingDriver.id ? submitted : d))
      : [submitted, ...drivers];

    persistDrivers(nextDrivers);
    setEditingDriver(null);
    addToast(editingDriver.id ? 'Chofer actualizado' : 'Chofer creado exitosamente', 'success');
  };

  const handleDelete = () => {
    persistDrivers(drivers.filter((d) => d.id !== showDeleteConfirm));
    addToast('Chofer eliminado', 'success');
    setShowDeleteConfirm(null);
  };

  const handleAssignDriver = (bookingId, driverId, pickupTime, payment) => {
    const nextBookings = bookings.map((b) => {
      if (b.id === bookingId) {
        return { ...b, driverId, driver: driverId, pickupTime, driverPayment: payment };
      }
      return b;
    });
    persistBookings(nextBookings);
    addToast('Asignación guardada', 'success');
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchAct = assignFilterAct === 'all' || b.tour === assignFilterAct;
      const matchDate = (!assignFilterDateStart || b.date >= assignFilterDateStart) && 
                        (!assignFilterDateEnd || b.date <= assignFilterDateEnd);
      return matchAct && matchDate && b.status !== 'canceled';
    });
  }, [bookings, assignFilterAct, assignFilterDateStart, assignFilterDateEnd]);

  useEffect(() => {
    setCurrentPageAssign(1);
  }, [assignFilterAct, assignFilterDateStart, assignFilterDateEnd]);

  const uniqueTours = useMemo(() => {
    const tours = new Set(bookings.map(b => b.tour));
    return Array.from(tours);
  }, [bookings]);

  const totalPagesAssign = Math.ceil(filteredBookings.length / itemsPerPage);
  const currentAssignItems = filteredBookings.slice((currentPageAssign - 1) * itemsPerPage, currentPageAssign * itemsPerPage);

  const totalPagesDirectory = Math.ceil(drivers.length / itemsPerPage);
  const currentDirectoryItems = drivers.slice((currentPageDirectory - 1) * itemsPerPage, currentPageDirectory * itemsPerPage);

  return (
    <div>
      <div className="page-header mb-4">
        <div>
          <h2>{t('driversTitle')}</h2>
          <p className="text-muted" style={{ margin: 0 }}>{t('driversSubtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditingDriver({ ...emptyDriver })}>
          <Plus size={18} /> {t('newDriver')}
        </button>
      </div>

      <div className="card mb-4 no-print" style={{ padding: '0.5rem' }}>
        <div className="d-flex gap-2" style={{ overflowX: 'auto', padding: '0.5rem' }}>
          <button className={`tab-btn ${activeTab === 'assign' ? 'active' : ''}`} onClick={() => setActiveTab('assign')}>
            {t('assignedBookings') || 'Reservas Asignadas'}
          </button>
          <button className={`tab-btn ${activeTab === 'directory' ? 'active' : ''}`} onClick={() => setActiveTab('directory')}>
            {t('driversDirectory') || 'Directorio'}
          </button>
          <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            {t('pickupOrders') || 'Órdenes'}
          </button>
        </div>
      </div>

      {activeTab === 'assign' && (
        <div className="card">
          <div className="page-toolbar mb-4" style={{ alignItems: 'flex-start' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0, marginTop: '8px' }}>{t('assignedBookings') || 'Reservas Asignadas'}</h3>
            <div className="d-flex gap-2 filter-row" style={{ flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
              <select className="form-control" style={{ width: 'auto', height: '36px', fontSize: '0.85rem', padding: '0 12px', borderRadius: 'var(--radius-md)' }} value={assignFilterAct} onChange={e => setAssignFilterAct(e.target.value)}>
                <option value="all">Todas las Actividades</option>
                {uniqueTours.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="search-field" style={{ width: '160px' }}>
                <Calendar size={16} />
                <input type="date" className="form-control" style={{ height: '36px', fontSize: '0.85rem', padding: '0 12px 0 36px', borderRadius: 'var(--radius-md)' }} value={assignFilterDateStart} onChange={e => setAssignFilterDateStart(e.target.value)} />
              </div>
              <div className="search-field" style={{ width: '160px' }}>
                <Calendar size={16} />
                <input type="date" className="form-control" style={{ height: '36px', fontSize: '0.85rem', padding: '0 12px 0 36px', borderRadius: 'var(--radius-md)' }} value={assignFilterDateEnd} onChange={e => setAssignFilterDateEnd(e.target.value)} />
              </div>
              <button className="btn btn-primary">{t('filter') || 'Filtrar'}</button>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="table compact-table" style={{ fontSize: '0.85rem', minWidth: '0', width: '100%', tableLayout: 'auto' }}>
              <thead style={{ fontSize: '0.75rem' }}>
                <tr style={{ color: 'var(--text-light)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ whiteSpace: 'nowrap', padding: '0.6rem 0.5rem' }}>{t('date') || 'Fecha'}</th>
                  <th style={{ padding: '0.6rem 0.5rem' }}>{t('customer') || 'Cliente'}</th>
                  <th style={{ padding: '0.6rem 0.5rem' }}>{t('activity') || 'Actividad'}</th>
                  <th style={{ whiteSpace: 'nowrap', padding: '0.6rem 0.5rem' }}>Hora</th>
                  <th style={{ padding: '0.6rem 0.5rem' }}>Chofer Asignado</th>
                  <th style={{ whiteSpace: 'nowrap', padding: '0.6rem 0.5rem' }}>Pago Chofer</th>
                  <th style={{ textAlign: 'right', padding: '0.6rem 0.5rem' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                      <Calendar size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                      <div>No hay servicios para esta fecha o actividad.</div>
                    </td>
                  </tr>
                ) : (
                  currentAssignItems.map(b => (
                    <tr key={b.id}>
                      <td style={{ whiteSpace: 'nowrap', padding: '0.6rem 0.5rem' }}>
                        <div className="font-bold">{b.date}</div>
                      </td>
                      <td style={{ padding: '0.6rem 0.5rem' }}>
                        <div className="text-muted d-flex align-items-center gap-1" style={{ whiteSpace: 'nowrap' }}>
                          <User size={14} style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.customer} ({b.pax} pax)</span>
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.hotel}</div>
                      </td>
                      <td style={{ padding: '0.6rem 0.5rem' }}>
                        <div className="font-bold" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.tour}</div>
                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>Ref: {b.id}</div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', padding: '0.6rem 0.5rem' }}>
                        <div style={{ fontWeight: 600, color: '#0ea5e9' }}>{b.pickupTime || b.time || '--:--'}</div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', padding: '0.6rem 0.5rem' }}>
                        <div style={{ fontWeight: 500, color: 'var(--text-dark)' }}>
                          {(() => {
                            const dVal = b.driverId || b.driver;
                            if (!dVal) return 'Sin Chofer';
                            const found = drivers.find(d => String(d.id) === String(dVal) || d.name === dVal);
                            return found ? found.name : dVal;
                          })()}
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', padding: '0.6rem 0.5rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>$ {b.driverPayment || '0.00'}</div>
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap', padding: '0.6rem 0.5rem' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => setAssigningBooking(b)} style={{ padding: '4px 12px', fontSize: '0.8rem', borderRadius: '4px' }}>
                          <Edit3 size={14} style={{ marginRight: '4px' }} />
                          Asignar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '0 1rem', paddingBottom: '1rem' }}>
            <Pagination currentPage={currentPageAssign} totalPages={totalPagesAssign} totalItems={filteredBookings.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPageAssign} />
          </div>
        </div>
      )}

      {activeTab === 'directory' && (
        <div className="card">
          <div className="page-toolbar mb-4">
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{t('driversDirectory') || 'Directorio de Choferes Registrados'}</h3>
          </div>
          <div className="table-wrapper">
            <table className="table compact-table" style={{ minWidth: '0', width: '100%', fontSize: '0.85rem' }}>
              <thead style={{ fontSize: '0.75rem' }}>
                <tr style={{ color: 'var(--text-light)', borderBottom: '1px solid var(--border-color)' }}>
                  <th>{t('driverName')}</th>
                  <th>{t('contactWhatsapp') || 'Contacto (WhatsApp)'}</th>
                  <th>{t('vehicle')}</th>
                  <th>{t('status')}</th>
                  <th style={{ textAlign: 'right' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {drivers.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                      <Truck size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                      <div>No hay choferes registrados en el directorio.</div>
                    </td>
                  </tr>
                )}
                {currentDirectoryItems.map(d => (
                  <tr key={d.id}>
                    <td>
                      <div className="font-bold d-flex align-items-center gap-2">
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(14,165,233,0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={16} />
                        </div>
                        {d.name}
                      </div>
                    </td>
                    <td>{d.whatsapp}</td>
                    <td>{d.vehicle}</td>
                    <td>
                      <span className={`badge ${d.active ? 'badge-success' : 'badge-danger'}`}>
                        {d.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                        <button className="icon-btn" onClick={() => setEditingDriver(d)} title="Editar" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: 'var(--warning)' }}>
                          <Edit3 size={16} />
                        </button>
                        <button className="icon-btn" onClick={() => setShowDeleteConfirm(d.id)} title="Eliminar" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '0 1rem', paddingBottom: '1rem' }}>
            <Pagination currentPage={currentPageDirectory} totalPages={totalPagesDirectory} totalItems={drivers.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPageDirectory} />
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="card print-card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div className="no-print" style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--primary-color)', marginBottom: '5px' }}>{t('viewPickupOrder') || 'Ver Orden de Recogida'}</h3>
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>{t('viewPickupSubtitle') || 'Consulta las rutas asignadas a los choferes.'}</p>
          </div>
          
          <div className="responsive-grid mb-4 no-print" style={{ gap: '15px' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem' }}>{t('selectDriver') || 'Seleccionar Chofer'}</label>
              <select className="form-control" style={{ height: '36px', fontSize: '0.85rem', padding: '0 12px', borderRadius: 'var(--radius-md)' }} value={orderFilterVehicle} onChange={e => setOrderFilterVehicle(e.target.value)}>
                <option value="">-- Todos los choferes --</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.vehicle})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem' }}>{t('dateFrom') || 'Fecha Desde'}</label>
              <div className="search-field" style={{ width: '100%' }}>
                <Calendar size={16} />
                <input type="date" className="form-control" style={{ height: '36px', fontSize: '0.85rem', padding: '0 12px 0 36px', borderRadius: 'var(--radius-md)' }} value={orderFilterDateStart} onChange={e => setOrderFilterDateStart(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem' }}>{t('dateTo') || 'Fecha Hasta'}</label>
              <div className="search-field" style={{ width: '100%' }}>
                <Calendar size={16} />
                <input type="date" className="form-control" style={{ height: '36px', fontSize: '0.85rem', padding: '0 12px 0 36px', borderRadius: 'var(--radius-md)' }} value={orderFilterDateEnd} onChange={e => setOrderFilterDateEnd(e.target.value)} />
              </div>
            </div>
          </div>

              <div className="table-wrapper">
              <table className="table compact-table" style={{ minWidth: '0', width: '100%', fontSize: '0.85rem' }}>
                <thead style={{ fontSize: '0.75rem' }}>
                  <tr style={{ color: 'var(--text-light)', borderBottom: '1px solid var(--border-color)' }}>
                    <th>Fecha / Hora</th>
                    <th>Chofer</th>
                    <th>Cliente</th>
                    <th>Hotel / Ruta</th>
                    <th>Servicio</th>
                    <th>PAX</th>
                  </tr>
                </thead>
                <tbody>
                  {reportBookings.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                        No se encontraron reservas asignadas con estos filtros.
                      </td>
                    </tr>
                  ) : (
                    reportBookings.map(b => {
                      const bDriver = b.driverId || b.driver;
                      const d = drivers.find(drv => String(drv.id) === String(bDriver) || drv.name === bDriver);
                      return (
                        <tr key={b.id}>
                          <td>
                            <div className="font-bold">{b.date}</div>
                            <div className="text-muted">{b.pickupTime || b.time || '--:--'}</div>
                          </td>
                          <td>
                            <div className="font-bold">{d ? d.name : (typeof bDriver === 'string' && bDriver ? bDriver : 'Desconocido')}</div>
                            <div className="text-muted" style={{ fontSize: '0.8rem' }}>{d ? d.vehicle : ''}</div>
                          </td>
                          <td>
                            <div className="font-bold">{b.customer}</div>
                            <div className="text-muted" style={{ fontSize: '0.8rem' }}>{b.phone}</div>
                          </td>
                          <td>{b.type === 'TRASLADO' ? `${b.pickupLocation || ''} -> ${b.dropoffLocation || ''}` : b.hotel}</td>
                          <td>{b.type === 'TRASLADO' ? 'Traslado' : b.tour}</td>
                          <td>{b.pax} Ad, {b.children} Ni</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
        </div>
      )}

      {/* Modal Crear/Editar Chofer */}
      {editingDriver && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 style={{ margin: 0 }}>{editingDriver.id ? t('editDriver') : t('newDriver')}</h3>
              <button onClick={() => setEditingDriver(null)} style={{ background: 'none', color: 'var(--text-light)' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveDriver}>
              <div className="form-group">
                <label>{t('driverName')}</label>
                <input name="name" type="text" className="form-control" placeholder="Ej. Carlos Transporte" required defaultValue={editingDriver.name} />
              </div>
              <div className="responsive-grid" style={{ gap: '15px' }}>
                <div className="form-group">
                  <label>WhatsApp / Teléfono</label>
                  <input name="whatsapp" type="tel" className="form-control" placeholder="Ej. 809-555-0101" required defaultValue={editingDriver.whatsapp} />
                </div>
                <div className="form-group">
                  <label>Vehículo Asignado</label>
                  <input name="vehicle" type="text" className="form-control" placeholder="Ej. Minivan Hyundai" required defaultValue={editingDriver.vehicle} />
                </div>
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '15px' }}>
                <input type="checkbox" id="driverActive" name="active" defaultChecked={editingDriver.active} />
                <label htmlFor="driverActive" style={{ margin: 0 }}>{t('driverActive') || 'Chofer Activo (disponible para asignaciones)'}</label>
              </div>
              <div className="modal-actions mt-4">
                <button type="button" className="btn btn-outline" onClick={() => setEditingDriver(null)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">{editingDriver.id ? t('update') : t('create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Asignar Chofer */}
      {assigningBooking && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 style={{ margin: 0 }}>Asignar Chofer</h3>
              <button onClick={() => setAssigningBooking(null)} style={{ background: 'none', color: 'var(--text-light)' }}><X size={24} /></button>
            </div>
            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 'bold' }}>{assigningBooking.tour || 'Traslado'} - {assigningBooking.customer}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{assigningBooking.date} • {assigningBooking.hotel || assigningBooking.pickupLocation}</div>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleAssignDriver(
                assigningBooking.id,
                formData.get('driverId'),
                formData.get('pickupTime'),
                Number(formData.get('payment')) || 0
              );
              setAssigningBooking(null);
            }}>
              <div className="form-group">
                <label>Chofer</label>
                <select name="driverId" className="form-control" required defaultValue={assigningBooking.driverId || assigningBooking.driver || ''}>
                  <option value="">Seleccionar Chofer</option>
                  {drivers.filter(d => d.active).map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.vehicle})</option>
                  ))}
                </select>
              </div>
              <div className="responsive-grid" style={{ gap: '15px' }}>
                <div className="form-group">
                  <label>Hora de Recogida</label>
                  <input name="pickupTime" type="time" className="form-control" required defaultValue={assigningBooking.pickupTime || assigningBooking.time || ''} />
                </div>
                <div className="form-group">
                  <label>Pago al Chofer (US$)</label>
                  <input name="payment" type="number" step="0.01" min="0.01" className="form-control" required defaultValue={assigningBooking.driverPayment || ''} />
                </div>
              </div>
              <div className="modal-actions mt-4">
                <button type="button" className="btn btn-outline" onClick={() => setAssigningBooking(null)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">Guardar Asignación</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(null)}
        onConfirm={handleDelete}
        title={t('deleteDriverTitle') || 'Eliminar Chofer'}
        message={t('deleteDriverWarning') || '¿Estás seguro que deseas eliminar este chofer? Esta acción no se puede deshacer y desvinculará sus asignaciones previas.'}
      />
    </div>
  );
};

export default DriversPage;
