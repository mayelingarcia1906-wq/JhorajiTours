import { useEffect, useMemo, useState } from 'react';
import { Calendar, Truck, User, Edit3, Trash2, X, Plus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

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
  
  // Assignment Filters
  const today = new Date().toISOString().split('T')[0];
  const [assignFilterAct, setAssignFilterAct] = useState('all');
  const [assignFilterDateStart, setAssignFilterDateStart] = useState(today);
  const [assignFilterDateEnd, setAssignFilterDateEnd] = useState(today);

  // Search Order Filters
  const [orderFilterVehicle, setOrderFilterVehicle] = useState('');
  const [orderFilterDateStart, setOrderFilterDateStart] = useState(today);
  const [orderFilterDateEnd, setOrderFilterDateEnd] = useState(today);

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
        return { ...b, driverId, pickupTime, driverPayment: payment };
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

  const uniqueTours = useMemo(() => {
    const tours = new Set(bookings.map(b => b.tour));
    return Array.from(tours);
  }, [bookings]);

  return (
    <div>
      <div className="page-header mb-4">
        <div>
          <h2>Control de choferes</h2>
          <p className="text-muted" style={{ margin: 0 }}>Gestión de personal y asignación de rutas</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditingDriver({ ...emptyDriver })}>
          <Plus size={18} /> Nuevo Chofer
        </button>
      </div>

      <div className="card mb-4" style={{ padding: '0.5rem' }}>
        <div className="d-flex gap-2" style={{ overflowX: 'auto', padding: '0.5rem' }}>
          <button className={`tab-btn ${activeTab === 'assign' ? 'active' : ''}`} onClick={() => setActiveTab('assign')}>
            Asignar Reservas
          </button>
          <button className={`tab-btn ${activeTab === 'directory' ? 'active' : ''}`} onClick={() => setActiveTab('directory')}>
            Directorio de Choferes
          </button>
          <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            Órdenes de Recogida
          </button>
        </div>
      </div>

      {activeTab === 'assign' && (
        <div className="card">
          <div className="page-toolbar mb-4" style={{ alignItems: 'flex-start' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0, marginTop: '8px' }}>Asignar Reservas</h3>
            <div className="d-flex gap-2" style={{ flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
              <select className="form-control" style={{ width: 'auto' }} value={assignFilterAct} onChange={e => setAssignFilterAct(e.target.value)}>
                <option value="all">Todas las Actividades</option>
                {uniqueTours.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="search-field" style={{ width: '160px' }}>
                <Calendar size={18} />
                <input type="date" className="form-control" value={assignFilterDateStart} onChange={e => setAssignFilterDateStart(e.target.value)} />
              </div>
              <div className="search-field" style={{ width: '160px' }}>
                <Calendar size={18} />
                <input type="date" className="form-control" value={assignFilterDateEnd} onChange={e => setAssignFilterDateEnd(e.target.value)} />
              </div>
              <button className="btn btn-primary">Filtrar</button>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="table" style={{ minWidth: '800px' }}>
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Fecha / Cliente</th>
                  <th style={{ width: '30%' }}>Actividad</th>
                  <th style={{ width: '45%' }}>Asignación (Hora / Chofer / Pago)</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                      <Calendar size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                      <div>No hay servicios para esta fecha o actividad.</div>
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map(b => (
                    <tr key={b.id}>
                      <td>
                        <div className="font-bold">{b.date}</div>
                        <div className="text-muted d-flex align-items-center gap-1"><User size={14} />{b.customer} ({b.pax} pax)</div>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>{b.hotel}</div>
                      </td>
                      <td>
                        <div className="font-bold">{b.tour}</div>
                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>Ref: {b.id}</div>
                      </td>
                      <td>
                        <div className="d-flex gap-2" style={{ flexWrap: 'wrap' }}>
                          <input 
                            type="time" 
                            className="form-control" 
                            style={{ width: '120px' }} 
                            defaultValue={b.pickupTime || ''}
                            onBlur={(e) => handleAssignDriver(b.id, b.driverId, e.target.value, b.driverPayment)}
                          />
                          <select 
                            className="form-control" 
                            style={{ flex: 1, minWidth: '200px' }}
                            value={b.driverId || ''}
                            onChange={(e) => handleAssignDriver(b.id, e.target.value, b.pickupTime, b.driverPayment)}
                          >
                            <option value="">-- Seleccionar Chofer --</option>
                            {drivers.map(d => <option key={d.id} value={d.id}>{d.vehicle} - {d.name}</option>)}
                          </select>
                          <div className="search-field" style={{ width: '120px' }}>
                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}>$</span>
                            <input 
                              type="number" 
                              className="form-control" 
                              style={{ paddingLeft: '25px' }} 
                              placeholder="0.00"
                              defaultValue={b.driverPayment || ''}
                              onBlur={(e) => handleAssignDriver(b.id, b.driverId, b.pickupTime, e.target.value)}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'directory' && (
        <div className="card">
          <div className="page-toolbar mb-4">
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Directorio de Choferes Registrados</h3>
          </div>
          <div className="table-wrapper">
            <table className="table" style={{ minWidth: '100%' }}>
              <thead>
                <tr>
                  <th>Chofer</th>
                  <th>Contacto (WhatsApp)</th>
                  <th>Vehículo Asignado</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
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
                {drivers.map(d => (
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
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--primary-color)', marginBottom: '5px' }}>Ver Orden de Recogida</h3>
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>Genera un reporte con la ruta asignada a un chofer específico.</p>
          </div>
          
          <div className="form-group mb-4">
            <label>Seleccionar Chofer o Vehículo</label>
            <select className="form-control" value={orderFilterVehicle} onChange={e => setOrderFilterVehicle(e.target.value)}>
              <option value="">-- Todos los choferes --</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.vehicle})</option>)}
            </select>
          </div>
          
          <div className="responsive-grid mb-4" style={{ gap: '15px' }}>
            <div className="form-group">
              <label>Fecha Desde</label>
              <div className="search-field" style={{ width: '100%' }}>
                <Calendar size={18} />
                <input type="date" className="form-control" value={orderFilterDateStart} onChange={e => setOrderFilterDateStart(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Fecha Hasta</label>
              <div className="search-field" style={{ width: '100%' }}>
                <Calendar size={18} />
                <input type="date" className="form-control" value={orderFilterDateEnd} onChange={e => setOrderFilterDateEnd(e.target.value)} />
              </div>
            </div>
          </div>
          
          <button className="btn btn-primary" style={{ width: '100%', padding: '12px' }} onClick={() => addToast('Consulta generada exitosamente', 'success')}>
            Generar Reporte de Recogida
          </button>
        </div>
      )}

      {/* Modal Crear/Editar Chofer */}
      {editingDriver && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 style={{ margin: 0 }}>{editingDriver.id ? 'Editar Chofer' : 'Nuevo Chofer'}</h3>
              <button onClick={() => setEditingDriver(null)} style={{ background: 'none', color: 'var(--text-light)' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveDriver}>
              <div className="form-group">
                <label>Nombre del Chofer</label>
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
                <label htmlFor="driverActive" style={{ margin: 0 }}>Chofer Activo (disponible para asignaciones)</label>
              </div>
              <div className="modal-actions mt-4">
                <button type="button" className="btn btn-outline" onClick={() => setEditingDriver(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editingDriver.id ? 'Actualizar Chofer' : 'Guardar Chofer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {showDeleteConfirm && (
        <div className="modal-overlay" style={{ zIndex: 300 }}>
          <div className="card" style={{ maxWidth: '420px', width: '90%', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '15px' }}>Eliminar Chofer</h3>
            <p className="text-muted mb-4">¿Estás seguro que deseas eliminar este chofer? Esta acción no se puede deshacer y desvinculará sus asignaciones previas.</p>
            <div className="d-flex justify-content-center gap-3" style={{ flexWrap: 'wrap' }}>
              <button className="btn btn-outline" onClick={() => setShowDeleteConfirm(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleDelete}>Eliminar Chofer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriversPage;
