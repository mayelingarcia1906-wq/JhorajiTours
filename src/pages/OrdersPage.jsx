import { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, Printer, Trash2, Edit3, MessageCircle, X, Plus } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const initialOrders = [];

const emptyOrder = { date: '', time: '', type: 'ACTIVIDAD', client: '', route: '', service: '', adults: 1, children: 0, providerPrice: 'US$ 0.00', provider: '', driver: '' };

const readStoredData = (key, defaultData) => {
  const saved = localStorage.getItem(key);
  if (!saved) return defaultData;
  try { return JSON.parse(saved); } catch { return defaultData; }
};

const logAudit = (action, detail) => {
  try {
    const logs = JSON.parse(localStorage.getItem('jhoraji_audit') || '[]');
    logs.unshift({ id: Date.now(), module: 'Órdenes', action, detail, user: 'Administrador', timestamp: new Date().toISOString() });
    localStorage.setItem('jhoraji_audit', JSON.stringify(logs.slice(0, 200)));
  } catch (e) {}
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  if (!dateStr.includes('-')) return dateStr;
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

const OrdersPage = () => {
  const { addToast } = useToast();
  const [orders, setOrders] = useState(() => readStoredData('jhoraji_orders', initialOrders));
  const providers = readStoredData('jhoraji_providers', []);
  const drivers = readStoredData('jhoraji_drivers', []);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');
  const [driverFilter, setDriverFilter] = useState('all');
  const [clientSearch, setClientSearch] = useState('');
  
  const [appliedFilters, setAppliedFilters] = useState({
    fromDate: '', toDate: '', provider: 'all', driver: 'all', client: ''
  });

  const [selectedOrders, setSelectedOrders] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);

  const handleFilter = () => {
    setAppliedFilters({
      fromDate, toDate, provider: providerFilter, driver: driverFilter, client: clientSearch
    });
    setSelectedOrders([]);
  };

  const persistOrders = (nextOrders) => {
    setOrders(nextOrders);
    localStorage.setItem('jhoraji_orders', JSON.stringify(nextOrders));
  };

  const handleSaveOrder = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const isNew = !editingOrder.id;
    const submitted = {
      id: editingOrder.id || Date.now(),
      date: formData.get('date'),
      time: formData.get('time'),
      type: formData.get('type'),
      client: formData.get('client').trim(),
      route: formData.get('route').trim(),
      service: formData.get('service').trim(),
      adults: parseInt(formData.get('adults'), 10),
      children: parseInt(formData.get('children'), 10),
      providerPrice: formData.get('providerPrice'),
      provider: formData.get('provider'),
      driver: formData.get('driver'),
    };

    const nextOrders = isNew
      ? [submitted, ...orders]
      : orders.map((o) => (o.id === editingOrder.id ? submitted : o));

    persistOrders(nextOrders);
    logAudit(isNew ? 'Creó orden' : 'Editó orden', submitted.client);
    setEditingOrder(null);
    addToast(isNew ? 'Orden creada exitosamente' : 'Orden actualizada', 'success');
  };

  const handleDeleteSelected = () => {
    if (selectedOrders.length === 0) return;
    if (window.confirm(`¿Estás seguro de que deseas eliminar las ${selectedOrders.length} órdenes seleccionadas?`)) {
      persistOrders(orders.filter(o => !selectedOrders.includes(o.id)));
      logAudit('Eliminó órdenes', `${selectedOrders.length} órdenes eliminadas`);
      addToast(`${selectedOrders.length} órdenes eliminadas`, 'success');
      setSelectedOrders([]);
    }
  };

  const handlePrintSelected = () => {
    if (selectedOrders.length === 0) return;
    addToast('Imprimiendo órdenes seleccionadas...', 'success');
    logAudit('Imprimió órdenes', `${selectedOrders.length} órdenes impresas`);
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrders(filteredOrders.map(o => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const toggleSelectOrder = (id) => {
    setSelectedOrders(prev => prev.includes(id) ? prev.filter(orderId => orderId !== id) : [...prev, id]);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const { fromDate, toDate, provider, driver, client } = appliedFilters;
      let match = true;
      if (fromDate && o.date < fromDate) match = false;
      if (toDate && o.date > toDate) match = false;
      if (provider !== 'all' && String(o.provider) !== String(provider)) match = false;
      if (driver !== 'all' && String(o.driver) !== String(driver)) match = false;
      if (client && !(o.client || '').toLowerCase().includes(client.toLowerCase())) match = false;
      return match;
    });
  }, [orders, appliedFilters]);

  const currentDateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div>
      <div className="page-header mb-4">
        <div>
          <h2>Control de órdenes</h2>
          <p className="text-muted" style={{ margin: 0 }}>Panel de administración</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0ea5e9', fontWeight: 600 }}>
            <CalendarIcon size={18} /> {currentDateStr}
          </div>
          <button className="btn btn-primary" onClick={() => setEditingOrder({ ...emptyOrder })}>
            <Plus size={18} /> Nueva Orden
          </button>
        </div>
      </div>

      <div className="card mb-4" style={{ padding: '20px' }}>
        <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>Control de Órdenes - Jhoraji Tour Operador</p>
        
        <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', alignItems: 'end', marginBottom: '20px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', marginBottom: '5px', display: 'block', color: 'var(--text-light)' }}>Desde</label>
            <input type="date" className="form-control" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', marginBottom: '5px', display: 'block', color: 'var(--text-light)' }}>Hasta</label>
            <input type="date" className="form-control" value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
          <div title="*Si eliges un proveedor, aún verás traslados.">
            <label style={{ fontSize: '0.85rem', marginBottom: '5px', display: 'block', color: 'var(--text-light)' }}>Proveedor</label>
            <select className="form-control" value={providerFilter} onChange={e => setProviderFilter(e.target.value)}>
              <option value="all">Todos</option>
              {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div title="*Si eliges un chofer, verás solo los traslados de ese chofer.">
            <label style={{ fontSize: '0.85rem', marginBottom: '5px', display: 'block', color: 'var(--text-light)' }}>Chofer (Traslados)</label>
            <select className="form-control" value={driverFilter} onChange={e => setDriverFilter(e.target.value)}>
              <option value="all">Todos (Actividades + Traslados)</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', marginBottom: '5px', display: 'block', color: 'var(--text-light)' }}>Cliente</label>
            <input type="text" className="form-control" placeholder="Nombre cliente" value={clientSearch} onChange={e => setClientSearch(e.target.value)} />
          </div>
          <div style={{ paddingBottom: '0' }}>
            <button className="btn btn-primary" onClick={handleFilter} style={{ backgroundColor: '#10b981', border: 'none', padding: '10px 20px', borderRadius: '20px' }}>Filtrar</button>
          </div>
        </div>

        <div className="d-flex gap-2 mb-3">
          <button 
            className="btn" 
            disabled={selectedOrders.length === 0} 
            onClick={handlePrintSelected} 
            style={{ backgroundColor: '#a855f7', color: '#fff', fontSize: '0.8rem', display: 'flex', gap: '5px', alignItems: 'center' }}
          >
            <Printer size={15}/> IMPRIMIR SELECCIÓN
          </button>
          <button 
            className="btn" 
            onClick={handleDeleteSelected} 
            disabled={selectedOrders.length === 0} 
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.8rem', display: 'flex', gap: '5px', alignItems: 'center' }}
          >
            <Trash2 size={15}/> ELIMINAR SELECCIÓN
          </button>
        </div>

        <div className="table-wrapper">
          <table className="table compact-table">
            <thead>
              <tr style={{ color: 'var(--text-light)', fontSize: '0.85rem', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ width: '40px' }}><input type="checkbox" onChange={toggleSelectAll} checked={filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length} /></th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Tipo</th>
                <th>Cliente</th>
                <th>Ruta</th>
                <th>Servicio</th>
                <th>Adultos</th>
                <th>Niños</th>
                <th>Precio Prov.</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                    No hay órdenes que coincidan con los filtros.
                  </td>
                </tr>
              )}
              {filteredOrders.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td><input type="checkbox" checked={selectedOrders.includes(o.id)} onChange={() => toggleSelectOrder(o.id)} /></td>
                  <td style={{ color: 'var(--text-dark)', fontSize: '0.9rem' }}>{formatDate(o.date)}</td>
                  <td style={{ color: '#0ea5e9', fontWeight: 600, fontSize: '0.9rem' }}>{o.time}</td>
                  <td>
                    <span style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#16a34a', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px' }}>
                      {o.type}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-dark)', fontSize: '0.9rem' }}>{o.client}</td>
                  <td style={{ color: 'var(--text-dark)', fontSize: '0.85rem', maxWidth: '200px', whiteSpace: 'normal' }}>{o.route}</td>
                  <td style={{ color: 'var(--text-dark)', fontSize: '0.85rem' }}>{o.service}</td>
                  <td style={{ color: 'var(--text-dark)', fontSize: '0.9rem' }}>{o.adults}</td>
                  <td style={{ color: 'var(--text-dark)', fontSize: '0.9rem' }}>{o.children}</td>
                  <td style={{ color: 'var(--text-dark)', fontWeight: 700, fontSize: '0.9rem' }}>{o.providerPrice}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="d-flex gap-2" style={{ justifyContent: 'flex-end' }}>
                      <button className="btn" onClick={() => setEditingOrder(o)} style={{ backgroundColor: '#14b8a6', color: '#fff', padding: '4px 12px', borderRadius: '15px', fontSize: '0.8rem', border: 'none' }}>Editar</button>
                      <button className="btn" style={{ backgroundColor: '#22c55e', color: '#fff', padding: '4px 12px', borderRadius: '15px', fontSize: '0.8rem', border: 'none' }}>WhatsApp</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear/Editar Orden */}
      {editingOrder && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 style={{ margin: 0 }}>{editingOrder.id ? 'Editar Orden' : 'Nueva Orden'}</h3>
              <button onClick={() => setEditingOrder(null)} style={{ background: 'none', color: 'var(--text-light)' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveOrder}>
              <div className="responsive-grid" style={{ gap: '15px' }}>
                <div className="form-group">
                  <label>Fecha</label>
                  <input name="date" type="date" className="form-control" required defaultValue={editingOrder.date} />
                </div>
                <div className="form-group">
                  <label>Hora</label>
                  <input name="time" type="time" className="form-control" required defaultValue={editingOrder.time} />
                </div>
              </div>
              <div className="responsive-grid" style={{ gap: '15px' }}>
                <div className="form-group">
                  <label>Tipo</label>
                  <select name="type" className="form-control" defaultValue={editingOrder.type}>
                    <option value="ACTIVIDAD">ACTIVIDAD</option>
                    <option value="TRASLADO">TRASLADO</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Cliente</label>
                  <input name="client" type="text" className="form-control" required defaultValue={editingOrder.client} />
                </div>
              </div>
              <div className="form-group">
                <label>Punto / Ruta</label>
                <input name="route" type="text" className="form-control" defaultValue={editingOrder.route} />
              </div>
              <div className="form-group">
                <label>Servicio</label>
                <input name="service" type="text" className="form-control" defaultValue={editingOrder.service} />
              </div>
              <div className="responsive-grid" style={{ gap: '15px' }}>
                <div className="form-group">
                  <label>Adultos</label>
                  <input name="adults" type="number" min="0" className="form-control" defaultValue={editingOrder.adults} />
                </div>
                <div className="form-group">
                  <label>Niños</label>
                  <input name="children" type="number" min="0" className="form-control" defaultValue={editingOrder.children} />
                </div>
                <div className="form-group">
                  <label>Precio Prov.</label>
                  <input name="providerPrice" type="text" className="form-control" defaultValue={editingOrder.providerPrice} />
                </div>
              </div>
              <div className="responsive-grid" style={{ gap: '15px' }}>
                <div className="form-group">
                  <label>Asignar Proveedor</label>
                  <select name="provider" className="form-control" defaultValue={editingOrder.provider}>
                    <option value="">Ninguno</option>
                    {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Asignar Chofer</label>
                  <select name="driver" className="form-control" defaultValue={editingOrder.driver}>
                    <option value="">Ninguno</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="modal-actions mt-4">
                <button type="button" className="btn btn-outline" onClick={() => setEditingOrder(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Orden</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
