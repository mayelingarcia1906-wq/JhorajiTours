import { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, DollarSign, Edit3, Printer, Trash2, X, Plus, Filter, Eraser, CheckCircle } from 'lucide-react';
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
  
  const providers = readStoredData('jhoraji_providers', []);
  const drivers = readStoredData('jhoraji_drivers', []);

  const [expenses, setExpenses] = useState(() => readStoredData('jhoraji_expenses', initialExpenses));
  const [provLiq, setProvLiq] = useState(() => readStoredData('jhoraji_prov_liq', initialProvLiq));
  const [driverLiq, setDriverLiq] = useState(() => readStoredData('jhoraji_driver_liq', initialDriverLiq));

  const [fromDate, setFromDate] = useState('2026-06-05');
  const [toDate, setToDate] = useState('2026-06-05');
  const [driverFilter, setDriverFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');

  const [selectedProv, setSelectedProv] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState([]);
  const [selectedExp, setSelectedExp] = useState([]);

  // Stats calculation
  const allBookings = readStoredData('jhoraji_bookings', []);
  const totalBruto = allBookings
    .filter(b => b.status === 'paid')
    .reduce((sum, b) => {
      const val = parseFloat((b.amount || '').replace(/[^0-9.-]+/g, ""));
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  const totalProv = provLiq.reduce((acc, curr) => acc + curr.costTotal, 0);
  const totalOta = provLiq.reduce((acc, curr) => acc + curr.ota, 0);
  const totalDriver = driverLiq.reduce((acc, curr) => acc + curr.amount, 0);
  const totalGastos = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const gananciaReal = totalBruto - totalProv - totalOta - totalDriver - totalGastos;

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
      <div className="page-header mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Gastos Empresa & Liquidación</h2>
          <p className="text-muted" style={{ margin: 0 }}>Panel de administración</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0ea5e9', fontWeight: 600 }}>
          <CalendarIcon size={18} /> 05/06/2026
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
        <div className="page-toolbar d-flex" style={{ gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '10px', flex: 1, flexWrap: 'wrap' }}>
            <input type="date" className="form-control" style={{ maxWidth: '150px' }} value={fromDate} onChange={e => setFromDate(e.target.value)} />
            <input type="date" className="form-control" style={{ maxWidth: '150px' }} value={toDate} onChange={e => setToDate(e.target.value)} />
            <select className="form-control" style={{ maxWidth: '180px' }} value={driverFilter} onChange={e => setDriverFilter(e.target.value)}>
              <option value="all">-- Chofer --</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select className="form-control" style={{ maxWidth: '180px' }} value={providerFilter} onChange={e => setProviderFilter(e.target.value)}>
              <option value="all">-- Proveedor --</option>
              {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Filter size={16} /> Refrescar
            </button>
          </div>
          <button className="btn" onClick={() => setShowExpenseModal(true)} style={{ backgroundColor: '#1e293b', color: '#fff' }}>
            <Plus size={18} /> Registrar Gasto
          </button>
        </div>
      </div>

      <div className="card">
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
              <div className="table-wrapper">
                <table className="table compact-table">
                  <thead>
                    <tr>
                      <th style={{width: '30px'}}><input type="checkbox" onChange={e => setSelectedProv(e.target.checked ? provLiq.map(p=>p.id) : [])} checked={provLiq.length > 0 && selectedProv.length === provLiq.length}/></th>
                      <th>FECHA</th>
                      <th>CLIENTE</th>
                      <th>PROVEEDOR</th>
                      <th>COSTO BASE</th>
                      <th>EXTRAS</th>
                      <th>COSTO TOTAL</th>
                      <th>PRECIO CL.</th>
                      <th>OTA</th>
                      <th>GANANCIA</th>
                      <th>ESTADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {provLiq.map(p => (
                      <tr key={p.id}>
                        <td><input type="checkbox" checked={selectedProv.includes(p.id)} onChange={() => setSelectedProv(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}/></td>
                        <td>{p.date}</td>
                        <td>{p.client}</td>
                        <td style={{fontWeight: '600'}}>{p.provider}</td>
                        <td>US$ {p.costBase.toFixed(2)}</td>
                        <td>US$ {p.extras.toFixed(2)}</td>
                        <td style={{fontWeight: '700'}}>US$ {p.costTotal.toFixed(2)}</td>
                        <td>US$ {p.priceClient.toFixed(2)}</td>
                        <td>US$ {p.ota.toFixed(2)}</td>
                        <td style={{color: '#22c55e', fontWeight: 'bold'}}>US$ {p.profit.toFixed(2)}</td>
                        <td>
                          <span className={`badge badge-${p.status === 'Pagado' ? 'success' : 'danger'}`}>{p.status}</span>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: '#1e293b', color: '#fff', fontWeight: 'bold' }}>
                      <td colSpan="6" style={{ textAlign: 'right' }}>TOTALES:</td>
                      <td>US$ {totalProv.toFixed(2)}</td>
                      <td>US$ {totalBruto.toFixed(2)}</td>
                      <td style={{color: '#f59e0b'}}>US$ {totalOta.toFixed(2)}</td>
                      <td style={{color: '#22c55e'}}>US$ {(totalBruto - totalProv - totalOta).toFixed(2)}</td>
                      <td></td>
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
                    {driverLiq.map(d => (
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
                    {expenses.map(ex => (
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

      {/* Modal Registrar Gasto */}
      {showExpenseModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 style={{ margin: 0 }}>Registrar Gasto</h3>
              <button onClick={() => setShowExpenseModal(false)} style={{ background: 'none', color: 'var(--text-light)' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveExpense}>
              <div className="form-group">
                <label>Categoría</label>
                <select name="category" className="form-control" required>
                  <option value="Gasolina">Gasolina</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Pago Guías">Pago Guías</option>
                  <option value="Pago Nómina">Pago Nómina</option>
                  <option value="Otros">Otros</option>
                </select>
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
                <input name="date" type="date" className="form-control" required defaultValue="2026-06-05" />
              </div>
              <div className="modal-actions mt-4">
                <button type="button" className="btn btn-outline" onClick={() => setShowExpenseModal(false)}>Cancelar</button>
                <button type="submit" className="btn" style={{ backgroundColor: '#0f172a', color: '#fff' }}>GUARDAR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancesPage;
