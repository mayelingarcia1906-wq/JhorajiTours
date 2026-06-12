import { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, DollarSign, Edit3, Printer, Trash2, X, Plus, Filter, Eraser, CheckCircle, AlertCircle, Fuel, Wrench, Users, Briefcase, FileText, ChevronDown } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { Pagination } from '../components/Pagination';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const initialExpenses = [
  { id: 201, date: '2026-06-05', category: 'Gasolina', desc: 'Llenado de tanque Van 1', amount: 45.00 },
  { id: 202, date: '2026-06-05', category: 'Mantenimiento', desc: 'Cambio de aceite', amount: 30.00 }
];
const initialProvLiq = [
  { id: 301, date: '2026-06-05', client: 'Maria Lopez', provider: 'Ocean Tours', costBase: 100, extras: 20, costTotal: 120, priceClient: 150, ota: 15, profit: 15, status: 'Pendiente' }
];
const initialDriverLiq = [
  { id: 401, date: '2026-06-05', driver: 'Juan Perez', client: 'Pedro Sanchez', service: 'Transfer PUJ', adults: 2, children: 0, amount: 25.00, status: 'Pendiente' }
];

const readStoredData = (key, defaultData) => {
  const saved = localStorage.getItem(key);
  if (!saved) return defaultData;
  try { return JSON.parse(saved); } catch { return defaultData; }
};

const logAudit = (action, detail) => {
  try {
    const logs = JSON.parse(localStorage.getItem('jhoraji_audit') || '[]');
    logs.unshift({ id: Date.now(), module: 'Finanzas', action, detail, user: 'Administrador', timestamp: new Date().toISOString() });
    localStorage.setItem('jhoraji_audit', JSON.stringify(logs.slice(0, 200)));
  } catch (e) {}
};

const FinancesPage = () => {
  const { addToast } = useToast();
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('proveedores');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState('Gasolina');
  const [expenseCatOpen, setExpenseCatOpen] = useState(false);
  
  const expenseCategories = [
    { value: 'Gasolina', label: 'Gasolina', icon: Fuel, color: '#ef4444' },
    { value: 'Mantenimiento', label: 'Mantenimiento', icon: Wrench, color: '#64748b' },
    { value: 'Pago Guías', label: 'Pago Guías', icon: Users, color: '#8b5cf6' },
    { value: 'Pago Nómina', label: 'Pago Nómina', icon: Briefcase, color: '#d97706' },
    { value: 'Otros', label: 'Otros', icon: FileText, color: '#f97316' }
  ];
  const selectedCatObj = expenseCategories.find(c => c.value === expenseCategory);
  const SelectedIcon = selectedCatObj ? selectedCatObj.icon : Fuel;

  const providers = readStoredData('jhoraji_providers', []);
  const drivers = readStoredData('jhoraji_drivers', []);

  const [expenses, setExpenses] = useState(() => readStoredData('jhoraji_expenses', initialExpenses));
  const allBookings = readStoredData('jhoraji_bookings', []);
  const [liqStatus, setLiqStatus] = useState(() => readStoredData('jhoraji_liq_status', {}));

  const provLiq = allBookings
    .filter(b => b.type === 'ACTIVIDAD' && b.provider)
    .map(b => {
      const costBase = Number(b.providerCost) || 0;
      const priceClient = parseFloat((b.amount || '').replace(/[^0-9.-]+/g, "")) || 0;
      const extras = Number(b.extras) || 0;
      const ota = (priceClient * (Number(b.platformPercent) || 0)) / 100;
      return {
        id: `prov_${b.id}`,
        bookingId: b.id,
        date: b.date,
        client: b.customer,
        provider: b.provider,
        costBase: costBase,
        extras: extras,
        costTotal: costBase + extras,
        priceClient: priceClient,
        ota: ota,
        profit: priceClient - costBase - extras - ota,
        status: liqStatus[`prov_${b.id}`] || 'Pendiente'
      };
    });

  const driverLiq = allBookings
    .filter(b => b.type === 'TRASLADO' && b.driver)
    .map(b => {
      return {
        id: `drv_${b.id}`,
        bookingId: b.id,
        date: b.date,
        driver: b.driver,
        client: b.customer,
        service: `Traslado ${b.pickupLocation || ''} - ${b.dropoffLocation || ''}`,
        adults: b.pax || 0,
        children: b.children || 0,
        amount: Number(b.driverPayment) || 0,
        status: liqStatus[`drv_${b.id}`] || 'Pendiente'
      };
    });

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const defaultFrom = firstOfMonth.toISOString().split('T')[0];
  const defaultTo = lastOfMonth.toISOString().split('T')[0];

  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);
  const [driverFilter, setDriverFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('');

  const [appliedFilters, setAppliedFilters] = useState({
    fromDate: defaultFrom,
    toDate: defaultTo,
    driver: 'all',
    provider: 'all',
    category: 'all',
    client: ''
  });

  const handleRefresh = () => {
    setAppliedFilters({
      fromDate,
      toDate,
      driver: driverFilter,
      provider: providerFilter,
      category: categoryFilter,
      client: clientFilter
    });
    setSelectedProv([]);
    setSelectedDriver([]);
    setSelectedExp([]);
    setCurrentPageProv(1);
    setCurrentPageDriver(1);
    setCurrentPageExp(1);
  };

  const handleClear = () => {
    setFromDate(defaultFrom);
    setToDate(defaultTo);
    setDriverFilter('all');
    setProviderFilter('all');
    setCategoryFilter('all');
    setClientFilter('');
    setAppliedFilters({
      fromDate: defaultFrom,
      toDate: defaultTo,
      driver: 'all',
      provider: 'all',
      category: 'all',
      client: ''
    });
    setSelectedProv([]);
    setSelectedDriver([]);
    setSelectedExp([]);
    setCurrentPageProv(1);
    setCurrentPageDriver(1);
    setCurrentPageExp(1);
  };

  const [selectedProv, setSelectedProv] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState([]);
  const [selectedExp, setSelectedExp] = useState([]);

  const [currentPageProv, setCurrentPageProv] = useState(1);
  const [currentPageDriver, setCurrentPageDriver] = useState(1);
  const [currentPageExp, setCurrentPageExp] = useState(1);
  const itemsPerPage = 12;

  // Stats calculation
  const filteredProvLiq = provLiq.filter(p => {
    if (p.date < appliedFilters.fromDate || p.date > appliedFilters.toDate) return false;
    if (appliedFilters.provider !== 'all') {
      const selectedProvObj = providers.find(pr => pr.id.toString() === appliedFilters.provider);
      if (selectedProvObj && p.provider !== selectedProvObj.name) return false;
    }
    if (appliedFilters.client && p.client && !p.client.toLowerCase().includes(appliedFilters.client.toLowerCase())) return false;
    return true;
  });

  const filteredDriverLiq = driverLiq.filter(d => {
    if (d.date < appliedFilters.fromDate || d.date > appliedFilters.toDate) return false;
    if (appliedFilters.driver !== 'all') {
      const selectedDriverObj = drivers.find(dr => dr.id.toString() === appliedFilters.driver);
      if (selectedDriverObj && d.driver !== selectedDriverObj.name) return false;
    }
    if (appliedFilters.client && d.client && !d.client.toLowerCase().includes(appliedFilters.client.toLowerCase())) return false;
    return true;
  });

  const filteredExpenses = expenses.filter(e => {
    if (e.date < appliedFilters.fromDate || e.date > appliedFilters.toDate) return false;
    if (appliedFilters.category !== 'all' && e.category !== appliedFilters.category) return false;
    return true;
  });

  const totalBruto = allBookings
    .filter(b => b.status === 'paid' && b.date >= appliedFilters.fromDate && b.date <= appliedFilters.toDate)
    .reduce((sum, b) => {
      const val = parseFloat((b.amount || '').replace(/[^0-9.-]+/g, ""));
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  const totalProv = filteredProvLiq.reduce((acc, curr) => acc + curr.costTotal, 0);
  const totalOta = filteredProvLiq.reduce((acc, curr) => acc + curr.ota, 0);
  const totalDriver = filteredDriverLiq.reduce((acc, curr) => acc + curr.amount, 0);
  const totalGastos = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const gananciaReal = totalBruto - totalProv - totalOta - totalDriver - totalGastos;

  const gasTotal = filteredExpenses.filter(e => e.category === 'Gasolina').reduce((sum, e) => sum + e.amount, 0);
  const mantTotal = filteredExpenses.filter(e => e.category === 'Mantenimiento').reduce((sum, e) => sum + e.amount, 0);
  const guiasTotal = filteredExpenses.filter(e => e.category === 'Pago Guías').reduce((sum, e) => sum + e.amount, 0);
  const nominaTotal = filteredExpenses.filter(e => e.category === 'Pago Nómina').reduce((sum, e) => sum + e.amount, 0);
  const otrosTotal = filteredExpenses.filter(e => !['Gasolina', 'Mantenimiento', 'Pago Guías', 'Pago Nómina'].includes(e.category)).reduce((sum, e) => sum + e.amount, 0);

  const persistData = (key, data, setter) => {
    setter(data);
    localStorage.setItem(key, JSON.stringify(data));
  };

  const handleSaveExpense = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newExp = {
      id: Date.now(),
      date: formData.get('date'),
      category: formData.get('category'),
      desc: formData.get('desc'),
      amount: parseFloat(formData.get('amount'))
    };
    persistData('jhoraji_expenses', [newExp, ...expenses], setExpenses);
    logAudit('Registró Gasto Operativo', `${newExp.category} - US$ ${newExp.amount}`);
    addToast('Gasto registrado exitosamente', 'success');
    setShowExpenseModal(false);
  };

  const confirmDeleteExpense = () => {
    if (selectedExp.length === 0) return;
    setShowDeleteConfirm(true);
  };

  const handleDeleteExpense = () => {
    if (selectedExp.length === 0) return;
    persistData('jhoraji_expenses', expenses.filter(e => !selectedExp.includes(e.id)), setExpenses);
    logAudit('Eliminó Gastos', `${selectedExp.length} gastos eliminados`);
    addToast('Gastos eliminados', 'success');
    setSelectedExp([]);
    setShowDeleteConfirm(false);
  };

  const toggleProvStatus = (status) => {
    if (selectedProv.length === 0) return;
    const nextStatus = { ...liqStatus };
    selectedProv.forEach(id => {
      nextStatus[id] = status;
    });
    setLiqStatus(nextStatus);
    localStorage.setItem('jhoraji_liq_status', JSON.stringify(nextStatus));
    logAudit('Actualizó estado a proveedor', `${selectedProv.length} marcados como ${status}`);
    addToast(`Comisiones marcadas como ${status}`, 'success');
    setSelectedProv([]);
  };

  const toggleDriverStatus = (status) => {
    if (selectedDriver.length === 0) return;
    const nextStatus = { ...liqStatus };
    selectedDriver.forEach(id => {
      nextStatus[id] = status;
    });
    setLiqStatus(nextStatus);
    localStorage.setItem('jhoraji_liq_status', JSON.stringify(nextStatus));
    logAudit('Actualizó estado a chofer', `${selectedDriver.length} marcados como ${status}`);
    addToast(`Liquidaciones marcadas como ${status}`, 'success');
    setSelectedDriver([]);
  };

  const currentProvLiq = filteredProvLiq.slice((currentPageProv - 1) * itemsPerPage, currentPageProv * itemsPerPage);
  const totalPagesProv = Math.ceil(filteredProvLiq.length / itemsPerPage);

  const currentDriverLiq = filteredDriverLiq.slice((currentPageDriver - 1) * itemsPerPage, currentPageDriver * itemsPerPage);
  const totalPagesDriver = Math.ceil(filteredDriverLiq.length / itemsPerPage);

  const currentExpenses = filteredExpenses.slice((currentPageExp - 1) * itemsPerPage, currentPageExp * itemsPerPage);
  const totalPagesExp = Math.ceil(filteredExpenses.length / itemsPerPage);

  return (
    <div>
      <div className="page-header mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2>{t('financesTitle')}</h2>
          <p className="text-muted" style={{ margin: 0 }}>{t('adminPanel')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button className="btn btn-resumen" onClick={() => setShowSummaryModal(true)}>
            <FileText size={18} /> {t('summary')}
          </button>
          <button className="btn btn-primary" onClick={() => { setExpenseCategory('Gasolina'); setExpenseCatOpen(false); setShowExpenseModal(true); }}>
            <Plus size={18} /> {t('registerExpense')}
          </button>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="metrics-row filter-row mb-4" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, padding: '20px', minWidth: '150px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-light)' }}>{t('grossIncome')}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-dark)', margin: '5px 0' }}>{formatPrice(totalBruto)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', borderTop: '1px dashed var(--border-color)', paddingTop: '5px' }}>{t('grossIncomeDesc')}</div>
        </div>
        <div className="card" style={{ flex: 1, padding: '20px', minWidth: '150px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-light)' }}>{t('provPayments')}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444', margin: '5px 0' }}>{formatPrice(totalProv)}</div>
        </div>
        <div className="card" style={{ flex: 1, padding: '20px', minWidth: '150px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-light)' }}>{t('otaCommissions')}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b', margin: '5px 0' }}>{formatPrice(totalOta)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', borderTop: '1px dashed var(--border-color)', paddingTop: '5px' }}>{t('otaDesc')}</div>
        </div>
        <div className="card" style={{ flex: 1, padding: '20px', minWidth: '150px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-light)' }}>{t('drivers')}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6', margin: '5px 0' }}>{formatPrice(totalDriver)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', borderTop: '1px dashed var(--border-color)', paddingTop: '5px' }}>{t('driversDesc')}</div>
        </div>
        <div className="card" style={{ flex: 1, padding: '20px', minWidth: '150px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-light)' }}>{t('operExpenses')}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-dark)', margin: '5px 0' }}>{formatPrice(totalGastos)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', borderTop: '1px dashed var(--border-color)', paddingTop: '5px' }}>{t('operExpensesDesc')}</div>
        </div>
        <div className="card card-ganancia" style={{ flex: 1, padding: '20px', minWidth: '150px' }}>
          <div className="ganancia-title" style={{ fontSize: '0.7rem', fontWeight: 700 }}>{t('realProfit')}</div>
          <div className="ganancia-amount" style={{ fontSize: '1.5rem', fontWeight: 800, margin: '5px 0' }}>{formatPrice(gananciaReal)}</div>
          <div className="ganancia-subtitle" style={{ fontSize: '0.75rem', paddingTop: '5px' }}>{t('profitDesc')}</div>
        </div>
      </div>

      <div className="card mb-4" style={{ overflowX: 'auto' }}>
        <div className="page-toolbar" style={{ display: 'flex', gap: '15px', flexWrap: 'nowrap', alignItems: 'center', minWidth: 'max-content' }}>
          <input type="date" className="form-control" style={{ maxWidth: '160px' }} value={fromDate} onChange={e => setFromDate(e.target.value)} />
          <input type="date" className="form-control" style={{ maxWidth: '160px' }} value={toDate} onChange={e => setToDate(e.target.value)} />
          
          {activeTab === 'choferes' && (
            <select className="form-control" style={{ maxWidth: '200px' }} value={driverFilter} onChange={e => setDriverFilter(e.target.value)}>
              <option value="all">-- Chofer --</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}

          {activeTab === 'proveedores' && (
            <select className="form-control" style={{ maxWidth: '200px' }} value={providerFilter} onChange={e => setProviderFilter(e.target.value)}>
              <option value="all">-- Proveedor --</option>
              {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}

          {activeTab === 'gastos' && (
            <select className="form-control" style={{ maxWidth: '200px' }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="all">-- Categoría --</option>
              {expenseCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          )}

          {(activeTab === 'proveedores' || activeTab === 'choferes') && (
            <input type="text" className="form-control" style={{ maxWidth: '180px' }} placeholder="Buscar cliente..." value={clientFilter} onChange={e => setClientFilter(e.target.value)} />
          )}

          <button className="btn btn-primary" onClick={handleRefresh} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Filter size={16} /> {t('search')}
          </button>
          <button className="btn btn-outline" onClick={handleClear} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Eraser size={16} /> Limpiar
          </button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="tabs" style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
          {['proveedores', 'choferes', 'gastos'].map(tab => (
            <button 
              key={tab}
              onClick={() => { setActiveTab(tab); setSelectedProv([]); setSelectedDriver([]); setSelectedExp([]); setCurrentPageProv(1); setCurrentPageDriver(1); setCurrentPageExp(1); }}
              style={{
                flex: 1, padding: '15px', background: 'none', border: 'none', 
                borderBottom: activeTab === tab ? '3px solid var(--primary-color)' : '3px solid transparent',
                color: activeTab === tab ? 'var(--primary-color)' : 'var(--text-light)',
                fontWeight: activeTab === tab ? 'bold' : 'normal',
                textTransform: 'uppercase', fontSize: '0.85rem'
              }}
            >
              {tab === 'proveedores' ? t('provAndComm') : tab === 'choferes' ? t('driverLiq') : t('expenseLog')}
            </button>
          ))}
        </div>

        <div style={{ padding: '20px' }}>
          
          {/* TAB: PROVEEDORES */}
          {activeTab === 'proveedores' && (
            <div>
              {selectedProv.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: '#f8fafc', padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                  <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{selectedProv.length} {t('selected')}</span>
                  <div style={{ width: '1px', height: '20px', backgroundColor: '#cbd5e1' }}></div>
                  <button className="btn btn-link" onClick={() => toggleProvStatus('Pagado')} style={{ color: '#10b981', padding: 0, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', fontWeight: 600 }}><CheckCircle size={16}/> {t('pay')}</button>
                  <button className="btn btn-link" onClick={() => toggleProvStatus('Pendiente')} style={{ color: '#ef4444', padding: 0, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', fontWeight: 600 }}><AlertCircle size={16}/> {t('pending')}</button>
                </div>
              )}
              <div className="table-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <table className="table compact-table" style={{ margin: 0 }}>
                  <thead style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      <th style={{width: '40px', padding: '15px'}}><input type="checkbox" onChange={e => setSelectedProv(e.target.checked ? filteredProvLiq.map(p=>p.id) : [])} checked={filteredProvLiq.length > 0 && selectedProv.length === filteredProvLiq.length}/></th>
                      <th style={{ padding: '15px' }}>{t('date')}</th>
                      <th style={{ padding: '15px' }}>{t('client')}</th>
                      <th style={{ padding: '15px' }}>{t('provider')}</th>
                      <th style={{ padding: '15px' }}>{t('baseCost')}</th>
                      <th style={{ padding: '15px' }}>{t('extras')}</th>
                      <th style={{ padding: '15px' }}>{t('totalCost')}</th>
                      <th style={{ padding: '15px' }}>{t('clientPrice')}</th>
                      <th style={{ padding: '15px' }}>{t('otaCommissions')}</th>
                      <th style={{ padding: '15px' }}>{t('profit')}</th>
                      <th style={{ padding: '15px' }}>{t('status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProvLiq.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '15px' }}><input type="checkbox" checked={selectedProv.includes(p.id)} onChange={() => setSelectedProv(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}/></td>
                        <td style={{ padding: '15px', color: '#475569', fontSize: '0.9rem' }}>{p.date}</td>
                        <td style={{ padding: '15px', color: '#1e293b', fontSize: '0.9rem' }}>{p.client}</td>
                        <td style={{ padding: '15px', fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>{p.provider}</td>
                        <td style={{ padding: '15px', color: '#475569', fontSize: '0.9rem' }}>{formatPrice(p.costBase)}</td>
                        <td style={{ padding: '15px', color: '#475569', fontSize: '0.9rem' }}>{formatPrice(p.extras)}</td>
                        <td style={{ padding: '15px', fontWeight: '800', color: '#0f172a', fontSize: '0.95rem' }}>{formatPrice(p.costTotal)}</td>
                        <td style={{ padding: '15px', color: '#475569', fontSize: '0.9rem' }}>{formatPrice(p.priceClient)}</td>
                        <td style={{ padding: '15px', color: '#475569', fontSize: '0.9rem' }}>{formatPrice(p.ota)}</td>
                        <td style={{ padding: '15px', color: '#16a34a', fontWeight: '800', fontSize: '0.95rem' }}>{formatPrice(p.profit)}</td>
                        <td style={{ padding: '15px' }}>
                          {p.status === 'Pagado' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px' }}>
                              {t('paid').toUpperCase()}
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#fef2f2', color: '#ef4444', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px' }}>
                              {t('pending').toUpperCase()}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}>
                      <td colSpan="6" style={{ padding: '16px 15px', textAlign: 'right', fontWeight: '700', fontSize: '0.85rem', letterSpacing: '0.5px', color: '#64748b' }}>{t('totals')}</td>
                      <td style={{ padding: '16px 15px', fontWeight: '800', fontSize: '0.95rem' }}>{formatPrice(totalProv)}</td>
                      <td style={{ padding: '16px 15px', fontWeight: '700', fontSize: '0.9rem' }}>{formatPrice(totalBruto)}</td>
                      <td style={{ padding: '16px 15px', color: '#f59e0b', fontWeight: '800', fontSize: '0.95rem' }}>{formatPrice(totalOta)}</td>
                      <td style={{ padding: '16px 15px', color: '#16a34a', fontWeight: '800', fontSize: '0.95rem' }}>{formatPrice(totalBruto - totalProv - totalOta)}</td>
                      <td style={{ padding: '16px 15px' }}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={currentPageProv} totalPages={totalPagesProv} totalItems={filteredProvLiq.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPageProv} />
            </div>
          )}

          {/* TAB: CHOFERES */}
          {activeTab === 'choferes' && (
            <div>
              {selectedDriver.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: '#f8fafc', padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                  <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{selectedDriver.length} {t('selected')}</span>
                  <div style={{ width: '1px', height: '20px', backgroundColor: '#cbd5e1' }}></div>
                  <button className="btn btn-link" onClick={() => toggleDriverStatus('Pagado')} style={{ color: '#10b981', padding: 0, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', fontWeight: 600 }}><CheckCircle size={16}/> {t('pay')}</button>
                  <button className="btn btn-link" onClick={() => toggleDriverStatus('Pendiente')} style={{ color: '#ef4444', padding: 0, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', fontWeight: 600 }}><AlertCircle size={16}/> {t('pending')}</button>
                </div>
              )}
              <div className="table-wrapper">
                <table className="table compact-table">
                  <thead>
                    <tr>
                      <th style={{width: '30px'}}><input type="checkbox" onChange={e => setSelectedDriver(e.target.checked ? filteredDriverLiq.map(d=>d.id) : [])} checked={filteredDriverLiq.length > 0 && selectedDriver.length === filteredDriverLiq.length}/></th>
                      <th>{t('date')}</th>
                      <th>{t('driver')}</th>
                      <th>{t('client')}</th>
                      <th>{t('service')}</th>
                      <th>{t('adults')}</th>
                      <th>{t('children')}</th>
                      <th>{t('amountCol')}</th>
                      <th>{t('status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentDriverLiq.map(d => (
                      <tr key={d.id}>
                        <td><input type="checkbox" checked={selectedDriver.includes(d.id)} onChange={() => setSelectedDriver(prev => prev.includes(d.id) ? prev.filter(id => id !== d.id) : [...prev, d.id])}/></td>
                        <td>{d.date}</td>
                        <td style={{fontWeight: '600'}}>{d.driver}</td>
                        <td>{d.client}</td>
                        <td>{d.service}</td>
                        <td>{d.adults}</td>
                        <td>{d.children}</td>
                        <td style={{fontWeight: '700', color: '#3b82f6'}}>{formatPrice(d.amount)}</td>
                        <td>
                          <span className={`badge badge-${d.status === 'Pagado' ? 'success' : 'danger'}`}>{d.status}</span>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
                      <td colSpan="7" style={{ textAlign: 'right' }}>TOTAL CHOFERES:</td>
                      <td style={{color: '#3b82f6'}}>{formatPrice(totalDriver)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={currentPageDriver} totalPages={totalPagesDriver} totalItems={filteredDriverLiq.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPageDriver} />
            </div>
          )}

          {/* TAB: GASTOS OPERATIVOS */}
          {activeTab === 'gastos' && (
            <div>
              {selectedExp.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: '#f8fafc', padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                  <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{selectedExp.length} seleccionada(s)</span>
                  <div style={{ width: '1px', height: '20px', backgroundColor: '#cbd5e1' }}></div>
                  <button className="btn btn-link no-print" onClick={confirmDeleteExpense} style={{ color: '#ef4444', padding: 0, fontSize: '0.85rem', display: 'flex', gap: '5px', alignItems: 'center', textDecoration: 'none', fontWeight: 600 }}><Trash2 size={16}/> Eliminar</button>
                </div>
              )}
              <div className="table-wrapper">
                <table className="table compact-table">
                  <thead>
                    <tr>
                      <th className="no-print" style={{width: '30px'}}><input type="checkbox" onChange={e => setSelectedExp(e.target.checked ? filteredExpenses.map(ex=>ex.id) : [])} checked={filteredExpenses.length > 0 && selectedExp.length === filteredExpenses.length}/></th>
                      <th>{t('date')}</th>
                      <th>{t('category')}</th>
                      <th>{t('description')}</th>
                      <th>{t('amountCol')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentExpenses.map(ex => (
                      <tr key={ex.id}>
                        <td><input type="checkbox" checked={selectedExp.includes(ex.id)} onChange={() => setSelectedExp(prev => prev.includes(ex.id) ? prev.filter(id => id !== ex.id) : [...prev, ex.id])}/></td>
                        <td>{ex.date}</td>
                        <td style={{fontWeight: '600'}}>{ex.category}</td>
                        <td>{ex.desc}</td>
                        <td style={{fontWeight: '700', color: '#ef4444'}}>{formatPrice(ex.amount)}</td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
                      <td colSpan="4" style={{ textAlign: 'right' }}>TOTAL GASTOS:</td>
                      <td style={{color: '#ef4444'}}>{formatPrice(totalGastos)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={currentPageExp} totalPages={totalPagesExp} totalItems={filteredExpenses.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPageExp} />
            </div>
          )}
        </div>
      </div>

      {/* Modal Resumen del Período */}
      {showSummaryModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', padding: 0 }}>
            <div className="card" style={{ width: '100%', margin: 0, padding: '20px', backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: 'none' }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 style={{ color: '#0f172a', fontSize: '0.95rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('periodSummary')}
                </h3>
                <button onClick={() => setShowSummaryModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={20} /></button>
              </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
          <span style={{ color: '#333' }}>{t('totalBookingsLabel')}</span>
          <span style={{ fontWeight: 'bold', color: '#000' }}>{allBookings.length}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
          <span style={{ color: '#333' }}>{t('grossIncomeLabel')}</span>
          <span style={{ fontWeight: 'bold', color: '#10b981' }}>{formatPrice(totalBruto)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
          <span style={{ color: '#333' }}>{t('provPaymentLabel')}</span>
          <span style={{ fontWeight: 'bold', color: '#ef4444' }}>{formatPrice(totalProv)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
          <span style={{ color: '#333' }}>{t('otaCommLabel')}</span>
          <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>{formatPrice(totalOta)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
          <span style={{ color: '#333' }}>{t('driverPayLabel')}</span>
          <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>{formatPrice(totalDriver)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '0.9rem' }}>
          <span style={{ color: '#333' }}>{t('operExpLabel')}</span>
          <span style={{ fontWeight: 'bold', color: '#000' }}>{formatPrice(totalGastos)}</span>
        </div>

        <div style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: '0.95rem', color: '#000' }}>
          {t('expBreakdown')}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
          <span style={{ color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>⛽ {t('gas')}</span>
          <span style={{ color: '#333' }}>{formatPrice(gasTotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
          <span style={{ color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>🔧 {t('maintenance')}</span>
          <span style={{ color: '#333' }}>{formatPrice(mantTotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
          <span style={{ color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>👥 {t('guidePay')}</span>
          <span style={{ color: '#333' }}>{formatPrice(guiasTotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
          <span style={{ color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>💼 {t('payroll')}</span>
          <span style={{ color: '#333' }}>{formatPrice(nominaTotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '0.85rem' }}>
          <span style={{ color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>📝 {t('others')}</span>
          <span style={{ color: '#333' }}>{formatPrice(otrosTotal)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', paddingTop: '15px', borderTop: '1px solid #e2e8f0', fontSize: '0.95rem' }}>
          <span style={{ fontWeight: '800', color: '#000' }}>{t('realProfitLabel')}</span>
          <span style={{ fontWeight: '800', color: '#10b981' }}>{formatPrice(gananciaReal)}</span>
        </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Registrar Gasto */}
      {showExpenseModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 style={{ margin: 0 }}>{t('registerExpense')}</h3>
              <button onClick={() => setShowExpenseModal(false)} style={{ background: 'none', color: 'var(--text-light)' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveExpense}>
              <div className="form-group" style={{ position: 'relative' }}>
                <label>Categoría</label>
                <input type="hidden" name="category" value={expenseCategory} />
                <div 
                  className="form-control d-flex align-items-center justify-content-between" 
                  onClick={() => setExpenseCatOpen(!expenseCatOpen)}
                  style={{ cursor: 'pointer', backgroundColor: '#fff' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <SelectedIcon size={18} color={selectedCatObj?.color} />
                    <span>{selectedCatObj?.label}</span>
                  </div>
                  <ChevronDown size={18} color="#64748b" />
                </div>

                {expenseCatOpen && (
                  <div style={{ 
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, 
                    backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', 
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginTop: '4px', overflow: 'hidden' 
                  }}>
                    {expenseCategories.map(cat => {
                      const Icon = cat.icon;
                      const isSelected = expenseCategory === cat.value;
                      return (
                        <div 
                          key={cat.value}
                          onClick={() => {
                            setExpenseCategory(cat.value);
                            setExpenseCatOpen(false);
                          }}
                          style={{ 
                            padding: '10px 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                            backgroundColor: isSelected ? '#f8fafc' : '#fff',
                            borderLeft: isSelected ? `3px solid ${cat.color}` : '3px solid transparent'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isSelected ? '#f8fafc' : '#fff'}
                        >
                          <Icon size={18} color={cat.color} />
                          <span style={{ fontWeight: isSelected ? '600' : 'normal', color: '#1e293b' }}>{cat.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>{t('expenseAmount')}</label>
                <input name="amount" type="number" step="0.01" min="0" className="form-control" required placeholder="0.00" />
              </div>
              <div className="form-group">
                <label>{t('expenseDetail')}</label>
                <textarea name="desc" className="form-control" rows="2" placeholder="..." required></textarea>
              </div>
              <div className="form-group">
                <label>{t('date')}</label>
                <input name="date" type="date" className="form-control" required defaultValue={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]} min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]} />
              </div>
              <div className="modal-actions mt-4">
                <button type="button" className="btn btn-outline" onClick={() => setShowExpenseModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('save').toUpperCase()}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteExpense}
        title="Eliminar Gastos"
        message={`¿Estás seguro de que deseas eliminar ${selectedExp.length} gasto(s)? Esta acción no se puede deshacer.`}
      />
    </div>
  );
};

export default FinancesPage;
