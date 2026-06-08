import { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, DollarSign, Edit3, Printer, Trash2, X, Plus, Filter, Eraser, CheckCircle, Fuel, Wrench, Users, Briefcase, FileText, ChevronDown } from 'lucide-react';
import { useToast } from '../context/ToastContext';

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
  const [activeTab, setActiveTab] = useState('proveedores');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
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
  const [provLiq, setProvLiq] = useState(() => readStoredData('jhoraji_prov_liq', initialProvLiq));
  const [driverLiq, setDriverLiq] = useState(() => readStoredData('jhoraji_driver_liq', initialDriverLiq));

  const [fromDate, setFromDate] = useState('2026-06-05');
  const [toDate, setToDate] = useState('2026-06-05');
  const [driverFilter, setDriverFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [appliedFilters, setAppliedFilters] = useState({
    fromDate: '2026-06-05',
    toDate: '2026-06-05',
    driver: 'all',
    provider: 'all',
    category: 'all'
  });

  const handleRefresh = () => {
    setAppliedFilters({
      fromDate,
      toDate,
      driver: driverFilter,
      provider: providerFilter,
      category: categoryFilter
    });
  };

  const [selectedProv, setSelectedProv] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState([]);
  const [selectedExp, setSelectedExp] = useState([]);

  // Stats calculation
  const filteredProvLiq = provLiq.filter(p => {
    if (p.date < appliedFilters.fromDate || p.date > appliedFilters.toDate) return false;
    if (appliedFilters.provider !== 'all') {
      const selectedProvObj = providers.find(pr => pr.id.toString() === appliedFilters.provider);
      if (selectedProvObj && p.provider !== selectedProvObj.name) return false;
    }
    return true;
  });

  const filteredDriverLiq = driverLiq.filter(d => {
    if (d.date < appliedFilters.fromDate || d.date > appliedFilters.toDate) return false;
    if (appliedFilters.driver !== 'all') {
      const selectedDriverObj = drivers.find(dr => dr.id.toString() === appliedFilters.driver);
      if (selectedDriverObj && d.driver !== selectedDriverObj.name) return false;
    }
    return true;
  });

  const filteredExpenses = expenses.filter(e => {
    if (e.date < appliedFilters.fromDate || e.date > appliedFilters.toDate) return false;
    if (appliedFilters.category !== 'all' && e.category !== appliedFilters.category) return false;
    return true;
  });

  const allBookings = readStoredData('jhoraji_bookings', []);
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

  const handleDeleteExpense = () => {
    if (selectedExp.length === 0) return;
    if (window.confirm(`¿Eliminar ${selectedExp.length} gastos seleccionados?`)) {
      persistData('jhoraji_expenses', expenses.filter(e => !selectedExp.includes(e.id)), setExpenses);
      logAudit('Eliminó Gastos', `${selectedExp.length} gastos eliminados`);
      addToast('Gastos eliminados', 'success');
      setSelectedExp([]);
    }
  };

  const toggleProvStatus = (status) => {
    if (selectedProv.length === 0) return;
    const nextProv = provLiq.map(p => selectedProv.includes(p.id) ? { ...p, status } : p);
    persistData('jhoraji_prov_liq', nextProv, setProvLiq);
    logAudit('Actualizó estado a proveedor', `${selectedProv.length} marcados como ${status}`);
    addToast(`Comisiones marcadas como ${status}`, 'success');
    setSelectedProv([]);
  };

  const toggleDriverStatus = (status) => {
    if (selectedDriver.length === 0) return;
    const nextDr = driverLiq.map(d => selectedDriver.includes(d.id) ? { ...d, status } : d);
    persistData('jhoraji_driver_liq', nextDr, setDriverLiq);
    logAudit('Actualizó estado a chofer', `${selectedDriver.length} marcados como ${status}`);
    addToast(`Liquidaciones marcadas como ${status}`, 'success');
    setSelectedDriver([]);
  };

  return (
    <div>
      <div className="page-header mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2>Gastos Empresa & Liquidación</h2>
          <p className="text-muted" style={{ margin: 0 }}>Panel de administración</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button className="btn btn-primary" onClick={() => { setExpenseCategory('Gasolina'); setExpenseCatOpen(false); setShowExpenseModal(true); }}>
            <Plus size={18} /> Registrar Gasto
          </button>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="metrics-row mb-4" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, padding: '20px', minWidth: '150px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-light)' }}>INGRESO BRUTO</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-dark)', margin: '5px 0' }}>US$ {totalBruto.toFixed(2)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', borderTop: '1px dashed var(--border-color)', paddingTop: '5px' }}>Total pagado por clientes</div>
        </div>
        <div className="card" style={{ flex: 1, padding: '20px', minWidth: '150px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-light)' }}>PROV. (PAGOS)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444', margin: '5px 0' }}>US$ {totalProv.toFixed(2)}</div>
        </div>
        <div className="card" style={{ flex: 1, padding: '20px', minWidth: '150px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-light)' }}>OTA</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b', margin: '5px 0' }}>US$ {totalOta.toFixed(2)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', borderTop: '1px dashed var(--border-color)', paddingTop: '5px' }}>Comisiones plataformas</div>
        </div>
        <div className="card" style={{ flex: 1, padding: '20px', minWidth: '150px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-light)' }}>CHOFERES</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6', margin: '5px 0' }}>US$ {totalDriver.toFixed(2)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', borderTop: '1px dashed var(--border-color)', paddingTop: '5px' }}>Pagos a conductores</div>
        </div>
        <div className="card" style={{ flex: 1, padding: '20px', minWidth: '150px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-light)' }}>GASTOS OPER.</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-dark)', margin: '5px 0' }}>US$ {totalGastos.toFixed(2)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', borderTop: '1px dashed var(--border-color)', paddingTop: '5px' }}>Incluye Nómina</div>
        </div>
        <div className="card" style={{ flex: 1, padding: '20px', minWidth: '150px', backgroundColor: '#0f172a', color: '#fff' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8' }}>GANANCIA REAL</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e', margin: '5px 0' }}>US$ {gananciaReal.toFixed(2)}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px dashed #334155', paddingTop: '5px' }}>Ingresos - Gastos</div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="page-toolbar" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
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

          <button className="btn btn-primary" onClick={handleRefresh} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Filter size={16} /> Refrescar
          </button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="tabs" style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
          {['proveedores', 'choferes', 'gastos'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: '15px', background: 'none', border: 'none', 
                borderBottom: activeTab === tab ? '3px solid var(--primary-color)' : '3px solid transparent',
                color: activeTab === tab ? 'var(--primary-color)' : 'var(--text-light)',
                fontWeight: activeTab === tab ? 'bold' : 'normal',
                textTransform: 'uppercase', fontSize: '0.85rem'
              }}
            >
              {tab === 'proveedores' ? 'Proveedores y Comisiones' : tab === 'choferes' ? 'Liquidación de Choferes' : 'Bitácora de Gastos'}
            </button>
          ))}
        </div>

        <div style={{ padding: '20px' }}>
          
          {/* TAB: PROVEEDORES */}
          {activeTab === 'proveedores' && (
            <div>
              {selectedProv.length > 0 && (
                <div className="d-flex gap-2 mb-3">
                  <button className="btn" onClick={() => toggleProvStatus('Pagado')} style={{ backgroundColor: '#10b981', color: '#fff', fontSize: '0.8rem' }}>PAGAR SELECCIÓN</button>
                  <button className="btn" onClick={() => toggleProvStatus('Pendiente')} style={{ backgroundColor: '#ef4444', color: '#fff', fontSize: '0.8rem' }}>PENDIENTE SELECCIÓN</button>
                  <button className="btn" style={{ backgroundColor: '#a855f7', color: '#fff', fontSize: '0.8rem', display: 'flex', gap: '5px', alignItems: 'center' }}><Printer size={15}/> IMPRIMIR SELECCIÓN</button>
                </div>
              )}
              <div className="table-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <table className="table compact-table" style={{ margin: 0 }}>
                  <thead style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      <th style={{width: '40px', padding: '15px'}}><input type="checkbox" onChange={e => setSelectedProv(e.target.checked ? provLiq.map(p=>p.id) : [])} checked={provLiq.length > 0 && selectedProv.length === provLiq.length}/></th>
                      <th style={{ padding: '15px' }}>FECHA</th>
                      <th style={{ padding: '15px' }}>CLIENTE</th>
                      <th style={{ padding: '15px' }}>PROVEEDOR</th>
                      <th style={{ padding: '15px' }}>COSTO BASE</th>
                      <th style={{ padding: '15px' }}>EXTRAS</th>
                      <th style={{ padding: '15px' }}>COSTO TOTAL</th>
                      <th style={{ padding: '15px' }}>PRECIO CL.</th>
                      <th style={{ padding: '15px' }}>OTA</th>
                      <th style={{ padding: '15px' }}>GANANCIA</th>
                      <th style={{ padding: '15px' }}>ESTADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProvLiq.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '15px' }}><input type="checkbox" checked={selectedProv.includes(p.id)} onChange={() => setSelectedProv(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}/></td>
                        <td style={{ padding: '15px', color: '#475569', fontSize: '0.9rem' }}>{p.date}</td>
                        <td style={{ padding: '15px', color: '#1e293b', fontSize: '0.9rem' }}>{p.client}</td>
                        <td style={{ padding: '15px', fontWeight: '700', color: '#0f172a', fontSize: '0.95rem' }}>{p.provider}</td>
                        <td style={{ padding: '15px', color: '#475569', fontSize: '0.9rem' }}>US$ {p.costBase.toFixed(2)}</td>
                        <td style={{ padding: '15px', color: '#475569', fontSize: '0.9rem' }}>US$ {p.extras.toFixed(2)}</td>
                        <td style={{ padding: '15px', fontWeight: '800', color: '#0f172a', fontSize: '0.95rem' }}>US$ {p.costTotal.toFixed(2)}</td>
                        <td style={{ padding: '15px', color: '#475569', fontSize: '0.9rem' }}>US$ {p.priceClient.toFixed(2)}</td>
                        <td style={{ padding: '15px', color: '#475569', fontSize: '0.9rem' }}>US$ {p.ota.toFixed(2)}</td>
                        <td style={{ padding: '15px', color: '#16a34a', fontWeight: '800', fontSize: '0.95rem' }}>US$ {p.profit.toFixed(2)}</td>
                        <td style={{ padding: '15px' }}>
                          {p.status === 'Pagado' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px' }}>
                              PAGADO
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#fef2f2', color: '#ef4444', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px' }}>
                              PENDIENTE
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}>
                      <td colSpan="6" style={{ padding: '16px 15px', textAlign: 'right', fontWeight: '700', fontSize: '0.85rem', letterSpacing: '0.5px', color: '#64748b' }}>TOTALES:</td>
                      <td style={{ padding: '16px 15px', fontWeight: '800', fontSize: '0.95rem' }}>US$ {totalProv.toFixed(2)}</td>
                      <td style={{ padding: '16px 15px', fontWeight: '700', fontSize: '0.9rem' }}>US$ {totalBruto.toFixed(2)}</td>
                      <td style={{ padding: '16px 15px', color: '#f59e0b', fontWeight: '800', fontSize: '0.95rem' }}>US$ {totalOta.toFixed(2)}</td>
                      <td style={{ padding: '16px 15px', color: '#16a34a', fontWeight: '800', fontSize: '0.95rem' }}>US$ {(totalBruto - totalProv - totalOta).toFixed(2)}</td>
                      <td style={{ padding: '16px 15px' }}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: CHOFERES */}
          {activeTab === 'choferes' && (
            <div>
              {selectedDriver.length > 0 && (
                <div className="d-flex gap-2 mb-3">
                  <button className="btn" onClick={() => toggleDriverStatus('Pagado')} style={{ backgroundColor: '#10b981', color: '#fff', fontSize: '0.8rem' }}>PAGAR SELECCIÓN</button>
                  <button className="btn" onClick={() => toggleDriverStatus('Pendiente')} style={{ backgroundColor: '#ef4444', color: '#fff', fontSize: '0.8rem' }}>PENDIENTE SELECCIÓN</button>
                  <button className="btn" style={{ backgroundColor: '#a855f7', color: '#fff', fontSize: '0.8rem', display: 'flex', gap: '5px', alignItems: 'center' }}><Printer size={15}/> IMPRIMIR SELECCIÓN</button>
                </div>
              )}
              <div className="table-wrapper">
                <table className="table compact-table">
                  <thead>
                    <tr>
                      <th style={{width: '30px'}}><input type="checkbox" onChange={e => setSelectedDriver(e.target.checked ? driverLiq.map(d=>d.id) : [])} checked={driverLiq.length > 0 && selectedDriver.length === driverLiq.length}/></th>
                      <th>FECHA</th>
                      <th>CHOFER</th>
                      <th>CLIENTE</th>
                      <th>SERVICIO</th>
                      <th>ADULTOS</th>
                      <th>NIÑOS</th>
                      <th>MONTO</th>
                      <th>ESTADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDriverLiq.map(d => (
                      <tr key={d.id}>
                        <td><input type="checkbox" checked={selectedDriver.includes(d.id)} onChange={() => setSelectedDriver(prev => prev.includes(d.id) ? prev.filter(id => id !== d.id) : [...prev, d.id])}/></td>
                        <td>{d.date}</td>
                        <td style={{fontWeight: '600'}}>{d.driver}</td>
                        <td>{d.client}</td>
                        <td>{d.service}</td>
                        <td>{d.adults}</td>
                        <td>{d.children}</td>
                        <td style={{fontWeight: '700', color: '#3b82f6'}}>US$ {d.amount.toFixed(2)}</td>
                        <td>
                          <span className={`badge badge-${d.status === 'Pagado' ? 'success' : 'danger'}`}>{d.status}</span>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
                      <td colSpan="7" style={{ textAlign: 'right' }}>TOTAL CHOFERES:</td>
                      <td style={{color: '#3b82f6'}}>US$ {totalDriver.toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: GASTOS OPERATIVOS */}
          {activeTab === 'gastos' && (
            <div>
              {selectedExp.length > 0 && (
                <div className="d-flex gap-2 mb-3">
                  <button className="btn" style={{ backgroundColor: '#a855f7', color: '#fff', fontSize: '0.8rem', display: 'flex', gap: '5px', alignItems: 'center' }}><Printer size={15}/> IMPRIMIR SELECCIÓN</button>
                  <button className="btn" onClick={handleDeleteExpense} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.8rem', display: 'flex', gap: '5px', alignItems: 'center' }}><Trash2 size={15}/> ELIMINAR</button>
                </div>
              )}
              <div className="table-wrapper">
                <table className="table compact-table">
                  <thead>
                    <tr>
                      <th style={{width: '30px'}}><input type="checkbox" onChange={e => setSelectedExp(e.target.checked ? expenses.map(ex=>ex.id) : [])} checked={expenses.length > 0 && selectedExp.length === expenses.length}/></th>
                      <th>FECHA</th>
                      <th>CATEGORÍA</th>
                      <th>DESCRIPCIÓN</th>
                      <th>MONTO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map(ex => (
                      <tr key={ex.id}>
                        <td><input type="checkbox" checked={selectedExp.includes(ex.id)} onChange={() => setSelectedExp(prev => prev.includes(ex.id) ? prev.filter(id => id !== ex.id) : [...prev, ex.id])}/></td>
                        <td>{ex.date}</td>
                        <td style={{fontWeight: '600'}}>{ex.category}</td>
                        <td>{ex.desc}</td>
                        <td style={{fontWeight: '700', color: '#ef4444'}}>US$ {ex.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
                      <td colSpan="4" style={{ textAlign: 'right' }}>TOTAL GASTOS:</td>
                      <td style={{color: '#ef4444'}}>US$ {totalGastos.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '20px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <h3 style={{ color: '#0f172a', fontSize: '0.95rem', fontWeight: 700, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          RESUMEN DEL PERÍODO
        </h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
          <span style={{ color: '#333' }}>Total Reservas:</span>
          <span style={{ fontWeight: 'bold', color: '#000' }}>{allBookings.length}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
          <span style={{ color: '#333' }}>Ingreso Bruto:</span>
          <span style={{ fontWeight: 'bold', color: '#10b981' }}>US$ {totalBruto.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
          <span style={{ color: '#333' }}>Pago Proveedores:</span>
          <span style={{ fontWeight: 'bold', color: '#ef4444' }}>US$ {totalProv.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
          <span style={{ color: '#333' }}>Comisiones OTA:</span>
          <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>US$ {totalOta.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
          <span style={{ color: '#333' }}>Pagos Choferes:</span>
          <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>US$ {totalDriver.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '0.9rem' }}>
          <span style={{ color: '#333' }}>Gastos Operativos:</span>
          <span style={{ fontWeight: 'bold', color: '#000' }}>US$ {totalGastos.toFixed(2)}</span>
        </div>

        <div style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: '0.95rem', color: '#000' }}>
          Desglose Gastos:
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
          <span style={{ color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>⛽ Gasolina:</span>
          <span style={{ color: '#333' }}>US$ {gasTotal.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
          <span style={{ color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>🔧 Mantenimiento:</span>
          <span style={{ color: '#333' }}>US$ {mantTotal.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
          <span style={{ color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>👥 Pago Guías:</span>
          <span style={{ color: '#333' }}>US$ {guiasTotal.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
          <span style={{ color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>💼 Pago Nómina:</span>
          <span style={{ color: '#333' }}>US$ {nominaTotal.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '0.85rem' }}>
          <span style={{ color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>📝 Otros:</span>
          <span style={{ color: '#333' }}>US$ {otrosTotal.toFixed(2)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', paddingTop: '15px', borderTop: '1px solid #e2e8f0', fontSize: '0.95rem' }}>
          <span style={{ fontWeight: '800', color: '#000' }}>GANANCIA REAL:</span>
          <span style={{ fontWeight: '800', color: '#10b981' }}>US$ {gananciaReal.toFixed(2)}</span>
        </div>
      </div>

      {/* Modal Registrar Gasto */}
      {showExpenseModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 style={{ margin: 0 }}>Registrar Gasto</h3>
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
                <label>Monto US$</label>
                <input name="amount" type="number" step="0.01" min="0" className="form-control" required placeholder="0.00" />
              </div>
              <div className="form-group">
                <label>Detalle</label>
                <textarea name="desc" className="form-control" rows="2" placeholder="Descripción del gasto..." required></textarea>
              </div>
              <div className="form-group">
                <label>Fecha</label>
                <input name="date" type="date" className="form-control" required defaultValue={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]} min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]} />
              </div>
              <div className="modal-actions mt-4">
                <button type="button" className="btn btn-outline" onClick={() => setShowExpenseModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">GUARDAR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancesPage;
