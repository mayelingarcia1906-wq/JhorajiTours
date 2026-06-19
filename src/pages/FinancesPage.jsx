import { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, DollarSign, Edit3, Printer, Trash2, X, Plus, Filter, Eraser, CheckCircle, AlertCircle, Fuel, Wrench, Users, Briefcase, FileText, ChevronDown, Car } from 'lucide-react';
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
    { value: 'Gasolina', label: t('gas'), icon: Fuel, color: '#ef4444' },
    { value: 'Mantenimiento', label: t('maintenance'), icon: Wrench, color: '#64748b' },
    { value: 'Pago Guías', label: t('guidePay'), icon: Users, color: '#8b5cf6' },
    { value: 'Pago Nómina', label: t('payroll'), icon: Briefcase, color: '#d97706' },
    { value: 'Otros', label: t('others'), icon: FileText, color: '#f97316' }
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
      <div className="stats-grid stats-grid-6 mb-4">
        <div className="stat-card tone-primary">
          <div className="stat-header">
            <span className="stat-label" style={{ fontSize: '0.7rem' }}>{t('grossIncome')}</span>
            <div className="stat-icon"><DollarSign size={16} /></div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.15rem', fontWeight: 800 }}>{formatPrice(totalBruto)}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-faint)', marginTop: 4, lineHeight: 1.2 }}>{t('grossIncomeDesc')}</div>
        </div>
        <div className="stat-card tone-danger">
          <div className="stat-header">
            <span className="stat-label" style={{ fontSize: '0.7rem' }}>{t('provPayments')}</span>
            <div className="stat-icon"><Briefcase size={16} /></div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.15rem', fontWeight: 800 }}>{formatPrice(totalProv)}</div>
        </div>
        <div className="stat-card tone-warning">
          <div className="stat-header">
            <span className="stat-label" style={{ fontSize: '0.7rem' }}>{t('otaCommissions')}</span>
            <div className="stat-icon"><FileText size={16} /></div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.15rem', fontWeight: 800 }}>{formatPrice(totalOta)}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-faint)', marginTop: 4, lineHeight: 1.2 }}>{t('otaDesc')}</div>
        </div>
        <div className="stat-card tone-info">
          <div className="stat-header">
            <span className="stat-label" style={{ fontSize: '0.7rem' }}>{t('drivers')}</span>
            <div className="stat-icon"><Car size={16} /></div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.15rem', fontWeight: 800 }}>{formatPrice(totalDriver)}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-faint)', marginTop: 4, lineHeight: 1.2 }}>{t('driversDesc')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label" style={{ fontSize: '0.7rem' }}>{t('operExpenses')}</span>
            <div className="stat-icon"><Fuel size={16} /></div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.15rem', fontWeight: 800 }}>{formatPrice(totalGastos)}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-faint)', marginTop: 4, lineHeight: 1.2 }}>{t('operExpensesDesc')}</div>
        </div>
        <div className="card-ganancia stat-card">
          <div className="stat-header">
            <span className="ganancia-title stat-label" style={{ fontSize: '0.7rem' }}>{t('realProfit')}</span>
            <div className="stat-icon" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}><CheckCircle size={16} /></div>
          </div>
          <div className="ganancia-amount" style={{ fontSize: '1.25rem', fontWeight: 800 }}>{formatPrice(gananciaReal)}</div>
          <div className="ganancia-subtitle" style={{ fontSize: '0.65rem' }}>{t('profitDesc')}</div>
        </div>
      </div>

      <div className="card mb-4" style={{ overflowX: 'auto', padding: '12px 15px' }}>
        <div className="page-toolbar" style={{ display: 'flex', gap: '10px', flexWrap: 'nowrap', alignItems: 'center', minWidth: 'max-content' }}>
          <input type="date" className="form-control" style={{ maxWidth: '140px', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }} value={fromDate} onChange={e => setFromDate(e.target.value)} />
          <input type="date" className="form-control" style={{ maxWidth: '140px', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }} value={toDate} onChange={e => setToDate(e.target.value)} />
          
          {activeTab === 'choferes' && (
            <select className="form-control" style={{ maxWidth: '160px', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }} value={driverFilter} onChange={e => setDriverFilter(e.target.value)}>
              <option value="all">{t('driverFilterPlaceholder')}</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}

          {activeTab === 'proveedores' && (
            <select className="form-control" style={{ maxWidth: '160px', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }} value={providerFilter} onChange={e => setProviderFilter(e.target.value)}>
              <option value="all">{t('providerFilterPlaceholder')}</option>
              {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}

          {activeTab === 'gastos' && (
            <select className="form-control" style={{ maxWidth: '160px', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="all">{t('categoryFilterPlaceholder')}</option>
              {expenseCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          )}

          {(activeTab === 'proveedores' || activeTab === 'choferes') && (
            <input type="text" className="form-control" style={{ maxWidth: '160px', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }} placeholder={t('searchClientPlaceholder')} value={clientFilter} onChange={e => setClientFilter(e.target.value)} />
          )}

          <button className="btn btn-primary" onClick={handleRefresh} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}>
            <Filter size={14} /> {t('search')}
          </button>
          <button className="btn btn-outline" onClick={handleClear} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}>
            <Eraser size={14} /> {t('clear')}
          </button>
        </div>
      </div>

      <div className="card mb-4" style={{ padding: '1.25rem 1.5rem' }}>
        <div className="tabs">
          {['proveedores', 'choferes', 'gastos'].map(tab => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab); setSelectedProv([]); setSelectedDriver([]); setSelectedExp([]); setCurrentPageProv(1); setCurrentPageDriver(1); setCurrentPageExp(1); }}
            >
              {tab === 'proveedores' ? t('provAndComm') : tab === 'choferes' ? t('driverLiq') : t('expenseLog')}
            </button>
          ))}
        </div>

        <div style={{ paddingTop: '1.25rem' }}>

          {/* TAB: PROVEEDORES */}
          {activeTab === 'proveedores' && (
            <div>
              {selectedProv.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: 'var(--bg-soft)', padding: '10px 15px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '15px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.8125rem' }}>{selectedProv.length} {t('selected')}</span>
                  <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-strong)' }}></div>
                  <button className="btn btn-link" onClick={() => toggleProvStatus('Pagado')} style={{ color: 'var(--success)', padding: 0, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', fontWeight: 600 }}><CheckCircle size={16}/> {t('pay')}</button>
                  <button className="btn btn-link" onClick={() => toggleProvStatus('Pendiente')} style={{ color: '#ef4444', padding: 0, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', fontWeight: 600 }}><AlertCircle size={16}/> {t('pending')}</button>
                </div>
              )}
              <div className="table-wrapper" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', overflowX: 'auto' }}>
                <table className="table compact-table" style={{ margin: 0, fontSize: '0.8rem', width: '100%', tableLayout: 'auto' }}>
                  <thead style={{ backgroundColor: 'var(--bg-soft)', color: 'var(--text-light)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border-color)' }}>
                    <tr>
                      <th style={{width: '40px', padding: '0.5rem'}}><input type="checkbox" onChange={e => setSelectedProv(e.target.checked ? filteredProvLiq.map(p=>p.id) : [])} checked={filteredProvLiq.length > 0 && selectedProv.length === filteredProvLiq.length}/></th>
                      <th style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>{t('date')}</th>
                      <th style={{ padding: '0.5rem' }}>{t('client')}</th>
                      <th style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>{t('provider')}</th>
                      <th style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>{t('baseCost')}</th>
                      <th style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>{t('extras')}</th>
                      <th style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>{t('totalCost')}</th>
                      <th style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>{t('clientPrice')}</th>
                      <th style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>{t('otaCommissions')}</th>
                      <th style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>{t('profit')}</th>
                      <th style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>{t('status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProvLiq.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.5rem' }}><input type="checkbox" checked={selectedProv.includes(p.id)} onChange={() => setSelectedProv(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}/></td>
                        <td style={{ padding: '0.5rem', color: 'var(--text-medium)', whiteSpace: 'nowrap' }}>{p.date}</td>
                        <td style={{ padding: '0.5rem', color: 'var(--text-dark)' }}>{p.client}</td>
                        <td style={{ padding: '0.5rem', fontWeight: '700', color: 'var(--text-dark)' }}>{p.provider}</td>
                        <td style={{ padding: '0.5rem', color: 'var(--text-medium)', whiteSpace: 'nowrap' }}>{formatPrice(p.costBase)}</td>
                        <td style={{ padding: '0.5rem', color: 'var(--text-medium)', whiteSpace: 'nowrap' }}>{formatPrice(p.extras)}</td>
                        <td style={{ padding: '0.5rem', fontWeight: '800', color: 'var(--text-dark)', whiteSpace: 'nowrap' }}>{formatPrice(p.costTotal)}</td>
                        <td style={{ padding: '0.5rem', color: 'var(--text-medium)', whiteSpace: 'nowrap' }}>{formatPrice(p.priceClient)}</td>
                        <td style={{ padding: '0.5rem', color: 'var(--text-medium)', whiteSpace: 'nowrap' }}>{formatPrice(p.ota)}</td>
                        <td style={{ padding: '0.5rem', color: 'var(--success)', fontWeight: '800', whiteSpace: 'nowrap' }}>{formatPrice(p.profit)}</td>
                        <td style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>
                          <span className={`badge badge-${p.status === 'Pagado' ? 'success' : 'danger'}`}>{p.status === 'Pagado' ? t('paid') : t('pending')}</span>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: 'var(--bg-soft)', color: 'var(--text-dark)' }}>
                      <td colSpan="6" style={{ padding: '0.5rem', textAlign: 'right', fontWeight: '700', fontSize: '0.85rem', letterSpacing: '0.5px', color: 'var(--text-light)' }}>{t('totals')}</td>
                      <td style={{ padding: '0.5rem', fontWeight: '800', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>{formatPrice(totalProv)}</td>
                      <td style={{ padding: '0.5rem', fontWeight: '700', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>{formatPrice(totalBruto)}</td>
                      <td style={{ padding: '0.5rem', color: 'var(--warning)', fontWeight: '800', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>{formatPrice(totalOta)}</td>
                      <td style={{ padding: '0.5rem', color: 'var(--success)', fontWeight: '800', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>{formatPrice(totalBruto - totalProv - totalOta)}</td>
                      <td style={{ padding: '0.5rem' }}></td>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: 'var(--bg-soft)', padding: '10px 15px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '15px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.8125rem' }}>{selectedDriver.length} {t('selected')}</span>
                  <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-strong)' }}></div>
                  <button className="btn btn-link" onClick={() => toggleDriverStatus('Pagado')} style={{ color: 'var(--success)', padding: 0, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', fontWeight: 600 }}><CheckCircle size={16}/> {t('pay')}</button>
                  <button className="btn btn-link" onClick={() => toggleDriverStatus('Pendiente')} style={{ color: '#ef4444', padding: 0, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', fontWeight: 600 }}><AlertCircle size={16}/> {t('pending')}</button>
                </div>
              )}
              <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                <table className="table compact-table" style={{ fontSize: '0.8rem', tableLayout: 'auto', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{width: '30px', padding: '0.5rem'}}><input type="checkbox" onChange={e => setSelectedDriver(e.target.checked ? filteredDriverLiq.map(d=>d.id) : [])} checked={filteredDriverLiq.length > 0 && selectedDriver.length === filteredDriverLiq.length}/></th>
                      <th style={{ whiteSpace: 'nowrap', padding: '0.5rem' }}>{t('date')}</th>
                      <th style={{ whiteSpace: 'nowrap', padding: '0.5rem' }}>{t('driver')}</th>
                      <th style={{ padding: '0.5rem' }}>{t('client')}</th>
                      <th style={{ padding: '0.5rem' }}>{t('service')}</th>
                      <th style={{ padding: '0.5rem' }}>{t('adults')}</th>
                      <th style={{ padding: '0.5rem' }}>{t('children')}</th>
                      <th style={{ whiteSpace: 'nowrap', padding: '0.5rem' }}>{t('amountCol')}</th>
                      <th style={{ whiteSpace: 'nowrap', padding: '0.5rem' }}>{t('status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentDriverLiq.map(d => (
                      <tr key={d.id}>
                        <td style={{ padding: '0.5rem' }}><input type="checkbox" checked={selectedDriver.includes(d.id)} onChange={() => setSelectedDriver(prev => prev.includes(d.id) ? prev.filter(id => id !== d.id) : [...prev, d.id])}/></td>
                        <td style={{ whiteSpace: 'nowrap', padding: '0.5rem' }}>{d.date}</td>
                        <td style={{fontWeight: '600', whiteSpace: 'nowrap', padding: '0.5rem'}}>{d.driver}</td>
                        <td style={{ padding: '0.5rem' }}>{d.client}</td>
                        <td style={{ padding: '0.5rem' }}>{d.service}</td>
                        <td style={{ padding: '0.5rem' }}>{d.adults}</td>
                        <td style={{ padding: '0.5rem' }}>{d.children}</td>
                        <td style={{fontWeight: '700', color: 'var(--info)', whiteSpace: 'nowrap', padding: '0.5rem'}}>{formatPrice(d.amount)}</td>
                        <td style={{ whiteSpace: 'nowrap', padding: '0.5rem' }}>
                          <span className={`badge badge-${d.status === 'Pagado' ? 'success' : 'danger'}`}>{d.status === 'Pagado' ? t('paid') : t('pending')}</span>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: 'var(--bg-soft)', fontWeight: 'bold' }}>
                      <td colSpan="7" style={{ textAlign: 'right', padding: '0.5rem', color: 'var(--text-light)' }}>{t('totalDrivers')}</td>
                      <td style={{color: 'var(--info)', whiteSpace: 'nowrap', padding: '0.5rem'}}>{formatPrice(totalDriver)}</td>
                      <td style={{ padding: '0.5rem' }}></td>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: 'var(--bg-soft)', padding: '10px 15px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '15px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.8125rem' }}>{selectedExp.length} {t('selectedFem')}</span>
                  <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-strong)' }}></div>
                  <button className="btn btn-link no-print" onClick={confirmDeleteExpense} style={{ color: '#ef4444', padding: 0, fontSize: '0.85rem', display: 'flex', gap: '5px', alignItems: 'center', textDecoration: 'none', fontWeight: 600 }}><Trash2 size={16}/> {t('delete')}</button>
                </div>
              )}
              <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                <table className="table compact-table" style={{ fontSize: '0.8rem', tableLayout: 'auto', width: '100%' }}>
                  <thead>
                    <tr>
                      <th className="no-print" style={{width: '30px', padding: '0.5rem'}}><input type="checkbox" onChange={e => setSelectedExp(e.target.checked ? filteredExpenses.map(ex=>ex.id) : [])} checked={filteredExpenses.length > 0 && selectedExp.length === filteredExpenses.length}/></th>
                      <th style={{ whiteSpace: 'nowrap', padding: '0.5rem' }}>{t('date')}</th>
                      <th style={{ whiteSpace: 'nowrap', padding: '0.5rem' }}>{t('category')}</th>
                      <th style={{ padding: '0.5rem' }}>{t('description')}</th>
                      <th style={{ whiteSpace: 'nowrap', padding: '0.5rem' }}>{t('amountCol')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentExpenses.map(ex => (
                      <tr key={ex.id}>
                        <td style={{ padding: '0.5rem' }}><input type="checkbox" checked={selectedExp.includes(ex.id)} onChange={() => setSelectedExp(prev => prev.includes(ex.id) ? prev.filter(id => id !== ex.id) : [...prev, ex.id])}/></td>
                        <td style={{ whiteSpace: 'nowrap', padding: '0.5rem' }}>{ex.date}</td>
                        <td style={{fontWeight: '600', whiteSpace: 'nowrap', padding: '0.5rem'}}>{ex.category}</td>
                        <td style={{ padding: '0.5rem' }}>{ex.desc}</td>
                        <td style={{fontWeight: '700', color: 'var(--danger)', whiteSpace: 'nowrap', padding: '0.5rem'}}>{formatPrice(ex.amount)}</td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: 'var(--bg-soft)', fontWeight: 'bold' }}>
                      <td colSpan="4" style={{ textAlign: 'right', padding: '0.5rem', color: 'var(--text-light)' }}>{t('totalExpenses')}</td>
                      <td style={{color: 'var(--danger)', whiteSpace: 'nowrap', padding: '0.5rem'}}>{formatPrice(totalGastos)}</td>
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
            <div className="card" style={{ width: '100%', margin: 0, padding: '20px', backgroundColor: 'var(--card-bg)', border: 'none', borderRadius: 'var(--radius-xl)', boxShadow: 'none' }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 style={{ color: 'var(--text-dark)', fontSize: '0.95rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('periodSummary')}
                </h3>
                <button onClick={() => setShowSummaryModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={20} /></button>
              </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8125rem' }}>
          <span style={{ color: 'var(--text-medium)' }}>{t('totalBookingsLabel')}</span>
          <span style={{ fontWeight: 'bold', color: 'var(--text-dark)' }}>{allBookings.length}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8125rem' }}>
          <span style={{ color: 'var(--text-medium)' }}>{t('grossIncomeLabel')}</span>
          <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>{formatPrice(totalBruto)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8125rem' }}>
          <span style={{ color: 'var(--text-medium)' }}>{t('provPaymentLabel')}</span>
          <span style={{ fontWeight: 'bold', color: '#ef4444' }}>{formatPrice(totalProv)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8125rem' }}>
          <span style={{ color: 'var(--text-medium)' }}>{t('otaCommLabel')}</span>
          <span style={{ fontWeight: 'bold', color: 'var(--warning)' }}>{formatPrice(totalOta)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8125rem' }}>
          <span style={{ color: 'var(--text-medium)' }}>{t('driverPayLabel')}</span>
          <span style={{ fontWeight: 'bold', color: 'var(--info)' }}>{formatPrice(totalDriver)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '0.8125rem' }}>
          <span style={{ color: 'var(--text-medium)' }}>{t('operExpLabel')}</span>
          <span style={{ fontWeight: 'bold', color: 'var(--text-dark)' }}>{formatPrice(totalGastos)}</span>
        </div>

        <div style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: '0.95rem', color: 'var(--text-dark)' }}>
          {t('expBreakdown')}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-medium)', display: 'flex', alignItems: 'center', gap: '6px' }}>⛽ {t('gas')}</span>
          <span style={{ color: 'var(--text-medium)' }}>{formatPrice(gasTotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-medium)', display: 'flex', alignItems: 'center', gap: '6px' }}>🔧 {t('maintenance')}</span>
          <span style={{ color: 'var(--text-medium)' }}>{formatPrice(mantTotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-medium)', display: 'flex', alignItems: 'center', gap: '6px' }}>👥 {t('guidePay')}</span>
          <span style={{ color: 'var(--text-medium)' }}>{formatPrice(guiasTotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-medium)', display: 'flex', alignItems: 'center', gap: '6px' }}>💼 {t('payroll')}</span>
          <span style={{ color: 'var(--text-medium)' }}>{formatPrice(nominaTotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-medium)', display: 'flex', alignItems: 'center', gap: '6px' }}>📝 {t('others')}</span>
          <span style={{ color: 'var(--text-medium)' }}>{formatPrice(otrosTotal)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', paddingTop: '15px', borderTop: '1px solid var(--border-color)', fontSize: '0.95rem' }}>
          <span style={{ fontWeight: '800', color: 'var(--text-dark)' }}>{t('realProfitLabel')}</span>
          <span style={{ fontWeight: '800', color: 'var(--success)' }}>{formatPrice(gananciaReal)}</span>
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
                <label>{t('category')}</label>
                <input type="hidden" name="category" value={expenseCategory} />
                <div 
                  className="form-control d-flex align-items-center justify-content-between" 
                  onClick={() => setExpenseCatOpen(!expenseCatOpen)}
                  style={{ cursor: 'pointer', backgroundColor: 'var(--card-bg)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <SelectedIcon size={18} color={selectedCatObj?.color} />
                    <span>{selectedCatObj?.label}</span>
                  </div>
                  <ChevronDown size={18} color="var(--text-light)" />
                </div>

                {expenseCatOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                    backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-md)', marginTop: '4px', overflow: 'hidden'
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
                            backgroundColor: isSelected ? 'var(--bg-soft)' : 'var(--card-bg)',
                            borderLeft: isSelected ? `3px solid ${cat.color}` : '3px solid transparent'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-color)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isSelected ? 'var(--bg-soft)' : 'var(--card-bg)'}
                        >
                          <Icon size={18} color={cat.color} />
                          <span style={{ fontWeight: isSelected ? '600' : 'normal', color: 'var(--text-dark)' }}>{cat.label}</span>
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
        title={t('deleteExpenses')}
        message={t('deleteExpensesConfirm')?.replace('{count}', selectedExp.length)}
      />
    </div>
  );
};

export default FinancesPage;
