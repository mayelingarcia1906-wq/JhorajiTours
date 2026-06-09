import { useState, useMemo, useEffect } from 'react';
import { Printer, Trash2, Edit3, MessageCircle, X, Plus, Filter, Eye } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { Pagination } from '../components/Pagination';
import { usePermissions } from '../context/PermissionsContext';
import { useNotifications } from '../context/NotificationsContext';
import { useCurrency } from '../context/CurrencyContext';

const initialOrders = [
  { id: 'RES-00101', date: '2026-06-10', time: '08:30', type: 'ACTIVIDAD', client: 'Carlos Mendoza', route: 'Punta Cana - Saona', service: 'Excursión VIP', adults: 2, children: 0, providerPrice: 'US$ 120.00', provider: '', driver: '' },
  { id: 'RES-00102', date: '2026-06-11', time: '14:00', type: 'TRASLADO', client: 'Familia Perez', route: 'Aeropuerto - Hotel Riu', service: 'Transfer Privado', adults: 4, children: 2, providerPrice: 'US$ 45.00', provider: '', driver: '' },
  { id: 'RES-00103', date: '2026-06-12', time: '09:00', type: 'ACTIVIDAD', client: 'Ana Gonzalez', route: 'Bávaro - Buggies', service: 'Buggies Doble', adults: 2, children: 0, providerPrice: 'US$ 55.00', provider: '', driver: '' }
];

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

const OrdersPage = ({ hideHeader, onEditOrder, onViewOrder }) => {
  const { addToast } = useToast();
  const { t } = useLanguage();
  const { canPerformAction } = usePermissions();
  const { addNotification } = useNotifications();
  const { formatPrice } = useCurrency();
  const [orders, setOrders] = useState(() => readStoredData('jhoraji_orders', initialOrders));
  const providers = readStoredData('jhoraji_providers', []);
  const drivers = readStoredData('jhoraji_drivers', []);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');
  const [driverFilter, setDriverFilter] = useState('all');
  const [clientSearch, setClientSearch] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [selectedOrders, setSelectedOrders] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);

  useEffect(() => {
    const handleStorage = () => {
      setOrders(readStoredData('jhoraji_orders', initialOrders));
    };
    window.addEventListener('orders_updated', handleStorage);
    return () => window.removeEventListener('orders_updated', handleStorage);
  }, []);

  const persistOrders = (nextOrders) => {
    setOrders(nextOrders);
    localStorage.setItem('jhoraji_orders', JSON.stringify(nextOrders));
  };

  const handleSaveOrder = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const isNew = !editingOrder.id;
    const submitted = {
      id: editingOrder.id || `RES-${String(Date.now()).slice(-6)}`,
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
    addToast(isNew ? t('orderCreated') : t('orderUpdated'), 'success');
    
    if (isNew) {
      addNotification(`Nueva orden generada para ${submitted.client}`);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedOrders.length === 0) return;
    if (window.confirm(`${t('deleteConfirmOrders')} ${selectedOrders.length} ${t('selectedOrders')}`)) {
      persistOrders(orders.filter(o => !selectedOrders.includes(o.id)));
      logAudit('Eliminó órdenes', `${selectedOrders.length} órdenes eliminadas`);
      addToast(`${selectedOrders.length} ${t('ordersDeleted')}`, 'success');
      setSelectedOrders([]);
    }
  };

  const handlePrintSelected = () => {
    if (selectedOrders.length === 0) return;
    addToast(t('printingOrders'), 'success');
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
      let match = true;
      if (fromDate && o.date < fromDate) match = false;
      if (toDate && o.date > toDate) match = false;
      
      // Si elige proveedor, filtramos las actividades, pero mantenemos los traslados visibles
      if (providerFilter !== 'all') {
        if (o.type === 'ACTIVIDAD' && String(o.provider) !== String(providerFilter)) {
          match = false;
        }
      }
      
      // Si elige chofer, mostramos solo traslados de ese chofer
      if (driverFilter !== 'all' && String(o.driver) !== String(driverFilter)) match = false;
      
      if (clientSearch && !(o.client || '').toLowerCase().includes(clientSearch.toLowerCase())) match = false;
      return match;
    });
  }, [orders, fromDate, toDate, providerFilter, driverFilter, clientSearch]);

  // Handle page resets on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [fromDate, toDate, providerFilter, driverFilter, clientSearch]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const currentItems = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div>
      {!hideHeader && (
        <div className="page-header mb-4">
          <div>
            <h2>{t('ordersTitle')}</h2>
            <p className="text-muted" style={{ margin: 0 }}>{t('adminPanel')}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
            {canPerformAction('create') && (
              <button className="btn btn-primary" onClick={() => {
                const d = new Date();
                d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                setEditingOrder({ ...emptyOrder, date: d.toISOString().split('T')[0] });
              }}>
                <Plus size={18} /> {t('newOrder')}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="card mb-4" style={{ padding: '20px' }}>
        
        <div className="page-toolbar" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '5px' }}>
            <input type="date" className="form-control" style={{ minWidth: '130px', flex: 1 }} value={fromDate} onChange={e => setFromDate(e.target.value)} title="Desde" />
            <input type="date" className="form-control" style={{ minWidth: '130px', flex: 1 }} value={toDate} onChange={e => setToDate(e.target.value)} title="Hasta" />
            
            <select className="form-control" style={{ minWidth: '150px', flex: 1.5 }} value={providerFilter} onChange={e => setProviderFilter(e.target.value)}>
              <option value="all">-- {t('provider') || 'Proveedor'} --</option>
              {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            
            <select className="form-control" style={{ minWidth: '180px', flex: 1.5 }} value={driverFilter} onChange={e => setDriverFilter(e.target.value)}>
              <option value="all">-- {t('driver') || 'Chofer'} --</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            
            <input type="text" className="form-control" style={{ minWidth: '150px', flex: 1.5 }} placeholder={t('clientName')} value={clientSearch} onChange={e => setClientSearch(e.target.value)} />
          </div>
        </div>

        {selectedOrders.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px 15px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', marginBottom: '15px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)' }}>{selectedOrders.length} seleccionada(s)</span>
            <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)' }}></div>
            <button 
              className="btn" 
              onClick={handlePrintSelected} 
              style={{ backgroundColor: 'transparent', color: '#a855f7', fontSize: '0.85rem', display: 'flex', gap: '6px', alignItems: 'center', padding: '4px 8px', fontWeight: 600, border: 'none' }}
              title="Imprimir"
            >
              <Printer size={16}/> Imprimir
            </button>
            {canPerformAction('delete') && (
              <button 
                className="btn" 
                onClick={handleDeleteSelected} 
                style={{ backgroundColor: 'transparent', color: '#ef4444', fontSize: '0.85rem', display: 'flex', gap: '6px', alignItems: 'center', padding: '4px 8px', fontWeight: 600, border: 'none' }}
                title="Eliminar"
              >
                <Trash2 size={16}/> Eliminar
              </button>
            )}
          </div>
        )}

        <div className="table-wrapper">
          <table className="table compact-table">
            <thead>
              <tr style={{ color: 'var(--text-light)', fontSize: '0.85rem', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ width: '40px' }}><input type="checkbox" onChange={toggleSelectAll} checked={filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length} /></th>
                <th>{t('ref')}</th>
                <th>{t('date')}</th>
                <th>{t('time')}</th>
                <th>{t('type')}</th>
                <th>{t('customer')}</th>
                <th>{t('route')}</th>
                <th>{t('service')}</th>
                <th>{t('adults')}</th>
                <th>{t('children')}</th>
                <th>{t('providerPrice')}</th>
                <th>{t('payment')}</th>
                <th style={{ textAlign: 'right' }}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="12" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                    {t('noOrdersMatch')}
                  </td>
                </tr>
              )}
              {currentItems.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td><input type="checkbox" checked={selectedOrders.includes(o.id)} onChange={() => toggleSelectOrder(o.id)} /></td>
                  <td style={{ color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 600 }}>{o.bookingId || (String(o.id).startsWith('RES') || String(o.id).startsWith('#') ? o.id : `RES-${String(o.id).slice(-6)}`)}</td>
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
                  <td style={{ color: 'var(--text-dark)', fontWeight: 700, fontSize: '0.9rem' }}>{formatPrice(o.providerPrice)}</td>
                  <td>
                    {o.paymentDone ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#ecfdf5', color: '#059669', padding: '4px 8px', borderRadius: '6px', border: '1px solid #a7f3d0', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px' }}>
                        PAGADO
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#fffbeb', color: '#d97706', padding: '4px 8px', borderRadius: '6px', border: '1px solid #fde68a', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px' }}>
                        PENDIENTE
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="d-flex gap-2" style={{ justifyContent: 'flex-end' }}>
                      {onViewOrder && (
                        <button className="btn" onClick={() => onViewOrder(o)} title="Ver detalles" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '6px', borderRadius: '8px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Eye size={16} /></button>
                      )}
                      {canPerformAction('edit') && (
                        <button className="btn" onClick={() => onEditOrder ? onEditOrder(o) : setEditingOrder(o)} title="Editar" style={{ backgroundColor: 'rgba(20, 184, 166, 0.1)', color: '#14b8a6', padding: '6px', borderRadius: '8px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit3 size={16} /></button>
                      )}
                      <button className="btn" title="WhatsApp" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '6px', borderRadius: '8px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MessageCircle size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '0 1rem', paddingBottom: '1rem' }}>
          <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredOrders.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
        </div>
      </div>

      {/* Modal Crear/Editar Orden */}
      {editingOrder && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 style={{ margin: 0 }}>{editingOrder.id ? t('editOrder') : t('newOrder')}</h3>
              <button onClick={() => setEditingOrder(null)} style={{ background: 'none', color: 'var(--text-light)' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveOrder}>
              <div className="responsive-grid" style={{ gap: '15px' }}>
                <div className="form-group">
                  <label>Fecha</label>
                  <input name="date" type="date" className="form-control" required defaultValue={editingOrder.date} min={!editingOrder.id ? new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0] : undefined} />
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
                <button type="button" className="btn btn-outline" onClick={() => setEditingOrder(null)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('saveOrder')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
