import { useEffect, useMemo, useState } from 'react';
import { Calendar, Car, Edit3, Phone, Plus, Printer, Truck, User, Users, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Pagination } from '../components/Pagination';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const read = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const today = () => new Date().toISOString().split('T')[0];

const emptyDriver = { name: '', whatsapp: '', vehicle: '', active: true };

const Tab = ({ active, onClick, children }) => (
  <button className={`tab-btn ${active ? 'active' : ''}`} onClick={onClick}>{children}</button>
);

const DriversPage = () => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [drivers, setDrivers] = useState(() => read('jhoraji_drivers', []));
  const [bookings, setBookings] = useState(() => read('jhoraji_bookings', []));
  const [activeTab, setActiveTab] = useState('assign');

  const [editing, setEditing] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [assigning, setAssigning] = useState(null);

  const [filterAct, setFilterAct] = useState('all');
  const [filterDateStart, setFilterDateStart] = useState(today());
  const [filterDateEnd, setFilterDateEnd] = useState(today());

  const [orderFilterDriver, setOrderFilterDriver] = useState('');
  const [orderDateStart, setOrderDateStart] = useState('');
  const [orderDateEnd, setOrderDateEnd] = useState('');

  const [pageAssign, setPageAssign] = useState(1);
  const [pageDirectory, setPageDirectory] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => { setPageAssign(1); setPageDirectory(1); }, [activeTab]);
  useEffect(() => { setPageAssign(1); }, [filterAct, filterDateStart, filterDateEnd]);

  const persistDrivers = (next) => { setDrivers(next); write('jhoraji_drivers', next); };
  const persistBookings = (next) => { setBookings(next); write('jhoraji_bookings', next); };

  const uniqueTours = useMemo(() => Array.from(new Set(bookings.map((b) => b.tour).filter(Boolean))), [bookings]);

  const filteredBookings = useMemo(() => bookings.filter((b) => {
    const matchAct = filterAct === 'all' || b.tour === filterAct;
    const matchDate = (!filterDateStart || b.date >= filterDateStart) && (!filterDateEnd || b.date <= filterDateEnd);
    return matchAct && matchDate && b.status !== 'cancelado' && b.status !== 'canceled';
  }), [bookings, filterAct, filterDateStart, filterDateEnd]);

  const reportBookings = useMemo(() => bookings.filter((b) => {
    const bDriver = b.driverId || b.driver;
    return bDriver && (!orderFilterDriver || String(bDriver) === String(orderFilterDriver)) &&
      (!orderDateStart || b.date >= orderDateStart) && (!orderDateEnd || b.date <= orderDateEnd) &&
      b.status !== 'cancelado' && b.status !== 'canceled';
  }), [bookings, orderFilterDriver, orderDateStart, orderDateEnd]);

  const totalPagesAssign = Math.ceil(filteredBookings.length / itemsPerPage);
  const currentAssign = filteredBookings.slice((pageAssign - 1) * itemsPerPage, pageAssign * itemsPerPage);
  const totalPagesDirectory = Math.ceil(drivers.length / itemsPerPage);
  const currentDirectory = drivers.slice((pageDirectory - 1) * itemsPerPage, pageDirectory * itemsPerPage);

  const resolveDriver = (val) => drivers.find((d) => String(d.id) === String(val) || d.name === val);

  const handleSaveDriver = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const submitted = {
      id: editing.id || Date.now(),
      name: fd.get('name').trim(),
      whatsapp: fd.get('whatsapp').trim(),
      vehicle: fd.get('vehicle').trim(),
      active: fd.get('active') === 'on',
    };
    persistDrivers(editing.id ? drivers.map((d) => (d.id === editing.id ? submitted : d)) : [submitted, ...drivers]);
    setEditing(null);
    addToast(editing.id ? 'Chofer actualizado' : 'Chofer creado', 'success');
  };

  const handleDelete = () => {
    persistDrivers(drivers.filter((d) => d.id !== showDelete));
    addToast('Chofer eliminado', 'success');
    setShowDelete(null);
  };

  const handleAssign = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const driverId = fd.get('driverId');
    const pickupTime = fd.get('pickupTime');
    const payment = Number(fd.get('payment')) || 0;
    const next = bookings.map((b) => b.id === assigning.id ? { ...b, driverId, driver: driverId, pickupTime, driverPayment: payment } : b);
    persistBookings(next);
    setAssigning(null);
    addToast('Asignación guardada', 'success');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{t('driversTitle')}</h2>
          <p className="page-subtitle">{t('driversSubtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({ ...emptyDriver })}>
          <Plus size={16} /> {t('newDriver')}
        </button>
      </div>

      <div className="card mb-4 no-print" style={{ padding: '0.85rem' }}>
        <div className="tabs" style={{ paddingBottom: 0 }}>
          <Tab active={activeTab === 'assign'} onClick={() => setActiveTab('assign')}>Asignar servicios</Tab>
          <Tab active={activeTab === 'directory'} onClick={() => setActiveTab('directory')}>Directorio</Tab>
          <Tab active={activeTab === 'orders'} onClick={() => setActiveTab('orders')}>Órdenes de recogida</Tab>
        </div>
      </div>

      {activeTab === 'assign' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <div className="page-toolbar filter-row">
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Reservas pendientes de asignar</h3>
              <div className="d-flex gap-2 filter-row" style={{ flex: 1, justifyContent: 'flex-end' }}>
                <select className="form-control" style={{ width: 'auto', minWidth: 160 }} value={filterAct} onChange={(e) => setFilterAct(e.target.value)}>
                  <option value="all">Todas las actividades</option>
                  {uniqueTours.map((tour) => <option key={tour} value={tour}>{tour}</option>)}
                </select>
                <input type="date" className="form-control" style={{ width: 150 }} value={filterDateStart} onChange={(e) => setFilterDateStart(e.target.value)} />
                <input type="date" className="form-control" style={{ width: 150 }} value={filterDateEnd} onChange={(e) => setFilterDateEnd(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="table-wrapper" style={{ borderRadius: 0, border: 'none' }}>
            <table className="table compact-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Actividad</th>
                  <th>Hora</th>
                  <th>Chofer</th>
                  <th>Pago chofer</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentAssign.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-faint)' }}>
                      <Calendar size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                      <div>No hay servicios en este rango</div>
                    </td>
                  </tr>
                ) : currentAssign.map((b) => {
                  const d = resolveDriver(b.driverId || b.driver);
                  return (
                    <tr key={b.id}>
                      <td className="font-bold" style={{ whiteSpace: 'nowrap' }}>{b.date}</td>
                      <td>
                        <div className="font-bold">{b.customer}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>{b.pax} pax · {b.hotel}</div>
                      </td>
                      <td>
                        <div className="font-bold">{b.tour}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>Ref: {b.id}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{b.pickupTime || b.time || '--:--'}</span>
                      </td>
                      <td>{d ? <span className="font-bold">{d.name}</span> : <span className="badge badge-warning">Sin chofer</span>}</td>
                      <td className="font-bold">${b.driverPayment || '0.00'}</td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => setAssigning(b)}>
                          <Edit3 size={13} /> Asignar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={pageAssign} totalPages={totalPagesAssign} totalItems={filteredBookings.length} itemsPerPage={itemsPerPage} onPageChange={setPageAssign} />
        </div>
      )}

      {activeTab === 'directory' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Directorio de choferes</h3>
          </div>
          <div className="table-wrapper" style={{ borderRadius: 0, border: 'none' }}>
            <table className="table compact-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Contacto</th>
                  <th>Vehículo</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentDirectory.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-faint)' }}>
                      <Truck size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                      <div>No hay choferes registrados</div>
                    </td>
                  </tr>
                ) : currentDirectory.map((d) => {
                  const initials = d.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
                  return (
                    <tr key={d.id}>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.78rem' }}>{initials}</div>
                          <span className="font-bold">{d.name}</span>
                        </div>
                      </td>
                      <td>
                        <a href={`https://wa.me/${d.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="d-flex align-items-center gap-1" style={{ color: 'var(--success)' }}>
                          <Phone size={12} /> {d.whatsapp}
                        </a>
                      </td>
                      <td><span className="d-flex align-items-center gap-1"><Car size={13} style={{ color: 'var(--text-faint)' }} /> {d.vehicle}</span></td>
                      <td>
                        <span className={`badge ${d.active ? 'badge-success' : 'badge-neutral'}`}>
                          <span className="status-dot" style={{ background: d.active ? 'var(--success)' : 'var(--text-faint)' }} />
                          {d.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                          <button className="icon-btn" onClick={() => setEditing({ ...d })} title="Editar"><Edit3 size={15} /></button>
                          <button className="icon-btn danger" onClick={() => setShowDelete(d.id)} title="Eliminar"><X size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={pageDirectory} totalPages={totalPagesDirectory} totalItems={drivers.length} itemsPerPage={itemsPerPage} onPageChange={setPageDirectory} />
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="card print-card">
          <div className="no-print" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, marginBottom: 4, fontSize: '1.05rem' }}>Órdenes de recogida</h3>
            <p style={{ color: 'var(--text-light)', fontSize: '0.88rem', margin: 0 }}>Consulta las rutas asignadas a los choferes para imprimir.</p>
          </div>

          <div className="no-print responsive-grid mb-4">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Chofer</label>
              <select className="form-control" value={orderFilterDriver} onChange={(e) => setOrderFilterDriver(e.target.value)}>
                <option value="">— Todos —</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.name} · {d.vehicle}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Desde</label>
              <input type="date" className="form-control" value={orderDateStart} onChange={(e) => setOrderDateStart(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Hasta</label>
              <input type="date" className="form-control" value={orderDateEnd} onChange={(e) => setOrderDateEnd(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn btn-primary btn-block no-print" onClick={() => window.print()}>
                <Printer size={15} /> Imprimir
              </button>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="table compact-table">
              <thead>
                <tr>
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
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-faint)' }}>
                      No se encontraron reservas con esos filtros
                    </td>
                  </tr>
                ) : reportBookings.map((b) => {
                  const d = resolveDriver(b.driverId || b.driver);
                  return (
                    <tr key={b.id}>
                      <td>
                        <div className="font-bold">{b.date}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{b.pickupTime || b.time || '--:--'}</div>
                      </td>
                      <td>
                        <div className="font-bold">{d ? d.name : (b.driver || '—')}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{d?.vehicle}</div>
                      </td>
                      <td>
                        <div className="font-bold">{b.customer}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{b.phone}</div>
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>{b.type === 'TRASLADO' ? `${b.pickupLocation || ''} → ${b.dropoffLocation || ''}` : b.hotel}</td>
                      <td style={{ fontSize: '0.82rem' }}>{b.type === 'TRASLADO' ? 'Traslado' : b.tour}</td>
                      <td>
                        <span className="d-flex align-items-center gap-1" style={{ fontSize: '0.82rem' }}>
                          <Users size={12} style={{ color: 'var(--text-faint)' }} />
                          {b.pax} Ad, {b.children || 0} Ni
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>{editing.id ? t('editDriver') : t('newDriver')}</h3>
              <button className="modal-close" onClick={() => setEditing(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveDriver}>
              <div className="form-group">
                <label>Nombre del chofer</label>
                <input name="name" type="text" className="form-control" placeholder="Ej. Carlos Transporte" required defaultValue={editing.name} />
              </div>
              <div className="responsive-grid">
                <div className="form-group">
                  <label>WhatsApp / Teléfono</label>
                  <input name="whatsapp" type="tel" className="form-control" placeholder="+1 809-555-0101" required defaultValue={editing.whatsapp} />
                </div>
                <div className="form-group">
                  <label>Vehículo</label>
                  <input name="vehicle" type="text" className="form-control" placeholder="Ej. Minivan Hyundai" required defaultValue={editing.vehicle} />
                </div>
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="driverActive" name="active" defaultChecked={editing.active} />
                <label htmlFor="driverActive" style={{ margin: 0, cursor: 'pointer' }}>Chofer activo (disponible para asignaciones)</label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">{editing.id ? t('update') : t('create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {assigning && (
        <div className="modal-overlay" onClick={() => setAssigning(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>Asignar chofer</h3>
              <button className="modal-close" onClick={() => setAssigning(null)}><X size={16} /></button>
            </div>
            <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', background: 'var(--bg-soft)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--primary-color)' }}>
              <div className="font-bold">{assigning.tour || 'Traslado'} · {assigning.customer}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>{assigning.date} · {assigning.hotel || assigning.pickupLocation}</div>
            </div>
            <form onSubmit={handleAssign}>
              <div className="form-group">
                <label>Chofer</label>
                <select name="driverId" className="form-control" required defaultValue={assigning.driverId || assigning.driver || ''}>
                  <option value="">— Seleccionar chofer —</option>
                  {drivers.filter((d) => d.active).map((d) => (
                    <option key={d.id} value={d.id}>{d.name} · {d.vehicle}</option>
                  ))}
                </select>
              </div>
              <div className="responsive-grid">
                <div className="form-group">
                  <label>Hora de recogida</label>
                  <input name="pickupTime" type="time" className="form-control" required defaultValue={assigning.pickupTime || assigning.time || ''} />
                </div>
                <div className="form-group">
                  <label>Pago chofer (US$)</label>
                  <input name="payment" type="number" step="0.01" min="0.01" className="form-control" required defaultValue={assigning.driverPayment || ''} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setAssigning(null)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">Guardar asignación</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!showDelete}
        onCancel={() => setShowDelete(null)}
        onConfirm={handleDelete}
        title="¿Eliminar chofer?"
        message="Esta acción no se puede deshacer y desvinculará sus asignaciones."
      />
    </div>
  );
};

export default DriversPage;
