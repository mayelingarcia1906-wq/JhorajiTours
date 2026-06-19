import { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, ClipboardList, Eye, Filter, MessageCircle, Plus, Printer, Trash2, X, Clock, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useCurrency } from '../context/CurrencyContext';
import { useNotifications } from '../context/NotificationsContext';
import { usePermissions } from '../context/PermissionsContext';
import { Pagination } from '../components/Pagination';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const read = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const formatDate = (dateStr) => {
  if (!dateStr || !dateStr.includes('-')) return dateStr || '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

const emptyOrder = { date: '', time: '', type: 'ACTIVIDAD', client: '', route: '', service: '', adults: 1, children: 0, providerPrice: 'US$ 0.00', provider: '', driver: '' };

const OrdersPage = () => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const { formatPrice } = useCurrency();
  const { addNotification } = useNotifications();
  const { canPerformAction } = usePermissions();

  const [orders, setOrders] = useState(() => read('jhoraji_orders', []));
  const providers = read('jhoraji_providers', []);
  const drivers = read('jhoraji_drivers', []);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');
  const [driverFilter, setDriverFilter] = useState('all');
  const [clientSearch, setClientSearch] = useState('');

  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  const [selected, setSelected] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    const sync = () => setOrders(read('jhoraji_orders', []));
    window.addEventListener('orders_updated', sync);
    return () => window.removeEventListener('orders_updated', sync);
  }, []);

  useEffect(() => { setPage(1); }, [fromDate, toDate, providerFilter, driverFilter, clientSearch]);

  const filtered = useMemo(() => orders.filter((o) => {
    if (fromDate && o.date < fromDate) return false;
    if (toDate && o.date > toDate) return false;
    if (providerFilter !== 'all' && o.type === 'ACTIVIDAD' && String(o.provider) !== String(providerFilter)) return false;
    if (driverFilter !== 'all' && String(o.driver) !== String(driverFilter)) return false;
    if (clientSearch && !String(o.client || '').toLowerCase().includes(clientSearch.toLowerCase())) return false;
    return true;
  }), [orders, fromDate, toDate, providerFilter, driverFilter, clientSearch]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const persist = (next) => { setOrders(next); write('jhoraji_orders', next); };

  const handleSave = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const submitted = {
      id: editing.id || `RES-${String(Date.now()).slice(-6)}`,
      date: fd.get('date'),
      time: fd.get('time'),
      type: fd.get('type'),
      client: fd.get('client').trim(),
      route: fd.get('route').trim(),
      service: fd.get('service').trim(),
      adults: parseInt(fd.get('adults'), 10) || 1,
      children: parseInt(fd.get('children'), 10) || 0,
      providerPrice: fd.get('providerPrice'),
      provider: fd.get('provider'),
      driver: fd.get('driver'),
    };
    persist(editing.id ? orders.map((o) => (o.id === editing.id ? submitted : o)) : [submitted, ...orders]);
    if (!editing.id) addNotification('notifNewOrder', { client: submitted.client }, 'order', '/orders');
    setEditing(null);
    addToast(editing.id ? t('orderUpdated') : t('orderCreated'), 'success');
  };

  const handleDeleteSelected = () => {
    persist(orders.filter((o) => !selected.includes(o.id)));
    addToast(`${selected.length} ${t('ordersDeleted')}`, 'success');
    setSelected([]);
    setShowDelete(false);
  };

  const toggleSelectAll = (e) => setSelected(e.target.checked ? filtered.map((o) => o.id) : []);
  const toggleSelect = (id) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{t('ordersTitle')}</h2>
          <p className="page-subtitle">{filtered.length} {t('ordersCount')} {selected.length > 0 && `· ${selected.length} ${t('selectedCount')}`}</p>
        </div>
        {canPerformAction('create') && (
          <button className="btn btn-primary" onClick={() => {
            const d = new Date();
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            setEditing({ ...emptyOrder, date: d.toISOString().split('T')[0] });
          }}>
            <Plus size={16} /> {t('newOrder')}
          </button>
        )}
      </div>

      <div className="card mb-4">
        <div className="page-toolbar">
          <div className="d-flex gap-2 align-items-center" style={{ flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
            <div className="search-field" style={{ width: 150 }}>
              <Calendar size={14} />
              <input type="date" className="form-control" value={fromDate} onChange={(e) => setFromDate(e.target.value)} title="Desde" />
            </div>
            <div className="search-field" style={{ width: 150 }}>
              <Calendar size={14} />
              <input type="date" className="form-control" value={toDate} onChange={(e) => setToDate(e.target.value)} title="Hasta" />
            </div>
            <select className="form-control" style={{ width: 180 }} value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)}>
              <option value="all">{t('allProviders')}</option>
              {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select className="form-control" style={{ width: 180 }} value={driverFilter} onChange={(e) => setDriverFilter(e.target.value)}>
              <option value="all">{t('allDrivers')}</option>
              {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <input type="text" className="form-control" style={{ width: 200 }} placeholder={t('searchClient')} value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="card mb-4" style={{ padding: '0.85rem 1.15rem', background: 'var(--primary-50)', borderColor: 'var(--primary-100)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span className="d-flex align-items-center gap-2 font-bold" style={{ color: 'var(--primary-hover)', fontSize: '0.88rem' }}>
            <CheckCircle2 size={16} /> {selected.length} {t('selectedCount')}
          </span>
          <div style={{ flex: 1 }} />
          {canPerformAction('delete') && (
            <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(true)}>
              <Trash2 size={14} /> {t('delete')}
            </button>
          )}
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper" style={{ borderRadius: 0, border: 'none' }}>
          <table className="table compact-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selected.length === filtered.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>{t('ref')}</th>
                <th>{t('date')}</th>
                <th>{t('time')}</th>
                <th>{t('type')}</th>
                <th>{t('client')}</th>
                <th>{t('route')}</th>
                <th>{t('service')}</th>
                <th>{t('pax')}</th>
                <th>{t('price')}</th>
                <th>{t('payment')}</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-faint)' }}>
                    <ClipboardList size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <div>{t('noOrdersFilters')}</div>
                  </td>
                </tr>
              ) : currentItems.map((o) => (
                <tr key={o.id}>
                  <td><input type="checkbox" checked={selected.includes(o.id)} onChange={() => toggleSelect(o.id)} /></td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-light)' }}>{o.bookingId || o.id}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(o.date)}</td>
                  <td><span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{o.time}</span></td>
                  <td>
                    <span className={`badge ${o.type === 'TRASLADO' ? 'badge-info' : 'badge-primary'}`}>{o.type}</span>
                  </td>
                  <td className="font-bold">{o.client}</td>
                  <td style={{ maxWidth: 200, fontSize: '0.82rem', color: 'var(--text-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.route}</td>
                  <td style={{ fontSize: '0.82rem' }}>{o.service}</td>
                  <td><span className="font-bold">{o.adults}</span> + <span style={{ color: 'var(--text-light)' }}>{o.children}</span></td>
                  <td className="font-bold">{formatPrice(o.providerPrice)}</td>
                  <td>
                    <span className={`badge ${o.paymentDone ? 'badge-success' : 'badge-warning'}`}>
                      <span className="status-dot" style={{ background: o.paymentDone ? 'var(--success)' : 'var(--warning)' }} />
                      {o.paymentDone ? t('paid') : t('pending')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={itemsPerPage} onPageChange={setPage} />
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>
            <div className="modal-header">
              <h3>{editing.id ? t('editOrder') : t('newOrder')}</h3>
              <button className="modal-close" onClick={() => setEditing(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="responsive-grid">
                <div className="form-group"><label>{t('date')}</label><input name="date" type="date" className="form-control" required defaultValue={editing.date} /></div>
                <div className="form-group"><label>{t('time')}</label><input name="time" type="time" className="form-control" required defaultValue={editing.time} /></div>
                <div className="form-group">
                  <label>{t('type')}</label>
                  <select name="type" className="form-control" defaultValue={editing.type}>
                    <option value="ACTIVIDAD">ACTIVIDAD</option>
                    <option value="TRASLADO">TRASLADO</option>
                  </select>
                </div>
                <div className="form-group"><label>{t('client')}</label><input name="client" type="text" className="form-control" required defaultValue={editing.client} /></div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Punto / {t('route')}</label><input name="route" type="text" className="form-control" defaultValue={editing.route} /></div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>{t('service')}</label><input name="service" type="text" className="form-control" defaultValue={editing.service} /></div>
                <div className="form-group"><label>{t('adults')}</label><input name="adults" type="number" min="0" className="form-control" defaultValue={editing.adults} /></div>
                <div className="form-group"><label>{t('children')}</label><input name="children" type="number" min="0" className="form-control" defaultValue={editing.children} /></div>
                <div className="form-group"><label>{t('providerPrice')}</label><input name="providerPrice" type="text" className="form-control" defaultValue={editing.providerPrice} /></div>
                <div className="form-group">
                  <label>{t('provider')}</label>
                  <select name="provider" className="form-control" defaultValue={editing.provider}>
                    <option value="">{t('none')}</option>
                    {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('driver')}</label>
                  <select name="driver" className="form-control" defaultValue={editing.driver}>
                    <option value="">{t('none')}</option>
                    {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('saveOrder')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal isOpen={showDelete} onCancel={() => setShowDelete(false)} onConfirm={handleDeleteSelected} title={t('deleteOrdersTitle')} message={t('deleteOrdersMsg')?.replace('{count}', selected.length)} />
    </div>
  );
};

export default OrdersPage;
