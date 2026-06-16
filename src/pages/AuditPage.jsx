import { useMemo, useState } from 'react';
import { Activity, BarChart3, Clock, Edit3, Eye, LogIn, Plus, Search, Trash2, User, X, CheckCircle, AlertCircle, Power, Eraser } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Pagination } from '../components/Pagination';

const STORAGE_KEY = 'jhoraji_audit';

const read = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const ACTION_META = {
  'Creó': { icon: Plus, tone: 'success' },
  'Editó': { icon: Edit3, tone: 'info' },
  'Eliminó': { icon: Trash2, tone: 'danger' },
  'Activó': { icon: Power, tone: 'success' },
  'Desactivó': { icon: Power, tone: 'warning' },
  'Login': { icon: LogIn, tone: 'info' },
  'Logout': { icon: LogIn, tone: 'neutral' },
  'Marcó': { icon: CheckCircle, tone: 'success' },
  'Registró': { icon: Plus, tone: 'primary' },
  'Actualizó': { icon: Edit3, tone: 'info' },
  'Imprimió': { icon: Eye, tone: 'neutral' },
  'Restauró': { icon: CheckCircle, tone: 'success' },
  'Exportó': { icon: BarChart3, tone: 'info' },
};

const getActionMeta = (action) => {
  const match = Object.keys(ACTION_META).find((k) => action?.toLowerCase().startsWith(k.toLowerCase()));
  return match ? ACTION_META[match] : { icon: Activity, tone: 'neutral' };
};

const AuditPage = () => {
  const { t } = useLanguage();
  const [logs, setLogs] = useState(() => read(STORAGE_KEY, []));
  const [moduleFilter, setModuleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  const modules = useMemo(() => Array.from(new Set(logs.map((l) => l.module).filter(Boolean))).sort(), [logs]);

  const filtered = useMemo(() => {
    const term = applied.toLowerCase();
    return logs.filter((l) => {
      if (moduleFilter !== 'all' && l.module !== moduleFilter) return false;
      if (!term) return true;
      return [l.action, l.detail, l.user, l.module].some((v) => String(v || '').toLowerCase().includes(term));
    });
  }, [logs, moduleFilter, applied]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const totalLogs = logs.length;
  const todayLogs = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return logs.filter((l) => l.timestamp?.startsWith(today)).length;
  }, [logs]);
  const createsToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return logs.filter((l) => l.timestamp?.startsWith(today) && l.action?.toLowerCase().startsWith('creó')).length;
  }, [logs]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{t('auditTitle') || 'Auditoría'}</h2>
          <p className="page-subtitle">Registro completo de acciones del sistema</p>
        </div>
      </div>

      <div className="stats-grid mb-4">
        <div className="stat-card tone-primary">
          <div className="stat-header">
            <span className="stat-label">Total eventos</span>
            <div className="stat-icon"><BarChart3 size={18} /></div>
          </div>
          <div className="stat-value">{totalLogs}</div>
        </div>
        <div className="stat-card tone-info">
          <div className="stat-header">
            <span className="stat-label">Eventos hoy</span>
            <div className="stat-icon"><Clock size={18} /></div>
          </div>
          <div className="stat-value">{todayLogs}</div>
        </div>
        <div className="stat-card tone-success">
          <div className="stat-header">
            <span className="stat-label">Creaciones hoy</span>
            <div className="stat-icon"><Plus size={18} /></div>
          </div>
          <div className="stat-value">{createsToday}</div>
        </div>
        <div className="stat-card tone-warning">
          <div className="stat-header">
            <span className="stat-label">Módulos</span>
            <div className="stat-icon"><Activity size={18} /></div>
          </div>
          <div className="stat-value">{modules.length}</div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="page-toolbar">
          <div className="d-flex gap-2 align-items-center" style={{ flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
            <div className="search-integrated">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar en auditoría…"
                className="form-control"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (setApplied(search), setPage(1))}
              />
              {search && (
                <button className="search-clear-btn visible" onClick={() => { setSearch(''); setApplied(''); setPage(1); }} type="button">
                  <Eraser size={14} />
                </button>
              )}
              <button className="search-btn-inner" onClick={() => { setApplied(search); setPage(1); }} type="button">
                <Search size={12} /> Buscar
              </button>
            </div>
          </div>
          <select className="form-control" style={{ width: 'auto', minWidth: 180 }} value={moduleFilter} onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}>
            <option value="all">Todos los módulos</option>
            {modules.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper" style={{ borderRadius: 0, border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 50 }}></th>
                <th>Módulo</th>
                <th>Acción</th>
                <th>Detalle</th>
                <th>Usuario</th>
                <th>Fecha y hora</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-faint)' }}>
                    <BarChart3 size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <div>No hay eventos de auditoría</div>
                  </td>
                </tr>
              ) : currentItems.map((log) => {
                const meta = getActionMeta(log.action);
                const Icon = meta.icon;
                const tone = meta.tone;
                return (
                  <tr key={log.id}>
                    <td>
                      <div
                        className={`stat-icon ${tone !== 'neutral' ? `tone-${tone}` : ''}`}
                        style={{ width: 34, height: 34 }}
                      >
                        <Icon size={15} />
                      </div>
                    </td>
                    <td><span className="badge badge-primary">{log.module || '—'}</span></td>
                    <td className="font-bold" style={{ fontSize: '0.85rem' }}>{log.action}</td>
                    <td style={{ color: 'var(--text-medium)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.detail || '—'}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.82rem' }}>
                        <User size={12} style={{ color: 'var(--text-light)' }} />
                        {log.user || '—'}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={itemsPerPage} onPageChange={setPage} />
      </div>
    </div>
  );
};

export default AuditPage;
