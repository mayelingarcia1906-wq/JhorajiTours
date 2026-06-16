import { useMemo, useState } from 'react';
import { Activity, Edit3, Eraser, Plus, Search, ShieldCheck, Trash2, X } from 'lucide-react';
import { Pagination } from '../components/Pagination';
import { useLanguage } from '../context/LanguageContext';

const MODULE_COLORS = {
  Usuarios: { bg: 'rgba(14,165,233,0.1)', color: 'var(--primary-color)' },
  Proveedores: { bg: 'rgba(245,158,11,0.1)', color: 'var(--warning)' },
  Actividades: { bg: 'rgba(139,92,246,0.1)', color: '#8b5cf6' },
  Reservas: { bg: 'rgba(34,197,94,0.1)', color: 'var(--success)' },
  Tours: { bg: 'rgba(239,68,68,0.1)', color: 'var(--danger)' },
  Clientes: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
  Choferes: { bg: 'rgba(249,115,22,0.1)', color: '#f97316' },
  Agencias: { bg: 'rgba(236,72,153,0.1)', color: '#ec4899' },
  Órdenes: { bg: 'rgba(56,189,248,0.1)', color: '#38bdf8' },
  Finanzas: { bg: 'rgba(168,85,247,0.1)', color: '#a855f7' },
  Sistema: { bg: 'rgba(100,116,139,0.1)', color: 'var(--text-light)' },
};

const ACTION_ICONS = {
  'Creó': { icon: Plus, color: 'var(--success)' },
  'Editó': { icon: Edit3, color: 'var(--warning)' },
  'Eliminó': { icon: Trash2, color: 'var(--danger)' },
  'Activó': { icon: Activity, color: 'var(--success)' },
  'Desactivó': { icon: Activity, color: 'var(--text-light)' },
};

const readAuditLogs = () => {
  try {
    return JSON.parse(localStorage.getItem('jhoraji_audit') || '[]');
  } catch {
    return [];
  }
};

const formatDateTime = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
};

const AuditPage = () => {
  const { t } = useLanguage();
  const [logs, setLogs] = useState(readAuditLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const modules = ['all', ...Object.keys(MODULE_COLORS)];

  const refreshLogs = () => setLogs(readAuditLogs());

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchModule = moduleFilter === 'all' || log.module === moduleFilter;
      const term = appliedSearch.toLowerCase();
      const matchSearch = !term || [log.action, log.detail, log.user, log.module].some(v => String(v || '').toLowerCase().includes(term));
      return matchModule && matchSearch;
    });
  }, [logs, moduleFilter, appliedSearch]);

  const handleSearch = () => { setAppliedSearch(searchQuery); setCurrentPage(1); };
  const clearSearch = () => { setSearchQuery(''); setAppliedSearch(''); setCurrentPage(1); };

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const currentItems = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleClearLogs = () => {
    localStorage.removeItem('jhoraji_audit');
    setLogs([]);
    setShowClearConfirm(false);
  };

  const getActionStyle = (action) => {
    const key = Object.keys(ACTION_ICONS).find(k => action?.startsWith(k));
    return key ? ACTION_ICONS[key] : { icon: Activity, color: 'var(--primary-color)' };
  };

  return (
    <div>
      <div className="page-header mb-4">
        <div>
          <h2>{t('auditTitle')}</h2>
          <p className="text-muted" style={{ margin: 0 }}>{t('auditSubtitle')}</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline" onClick={refreshLogs}>
            <Activity size={16} /> {t('update')}
          </button>
          <button className="btn btn-danger" onClick={() => setShowClearConfirm(true)}>
            <Trash2 size={16} /> {t('clearLog')}
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="stats-grid mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
        <div className="card" style={{ textAlign: 'center', padding: '12px 14px', borderRadius: '10px' }}>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary-color)' }}>{logs.length}</div>
          <div className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '2px' }}>{t('totalActions')}</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '12px 14px', borderRadius: '10px' }}>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--success)' }}>
            {logs.filter(l => l.action?.startsWith('Creó')).length}
          </div>
          <div className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '2px' }}>{t('creations')}</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '12px 14px', borderRadius: '10px' }}>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--warning)' }}>
            {logs.filter(l => l.action?.startsWith('Editó')).length}
          </div>
          <div className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '2px' }}>{t('editions')}</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '12px 14px', borderRadius: '10px' }}>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--danger)' }}>
            {logs.filter(l => l.action?.startsWith('Eliminó')).length}
          </div>
          <div className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '2px' }}>{t('deletions')}</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '12px 14px', borderRadius: '10px' }}>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary-color)' }}>
            {logs.filter(l => l.action?.startsWith('Activó') || l.action?.startsWith('Desactivó')).length}
          </div>
          <div className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '2px' }}>{t('statusChanges')}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="page-toolbar">
          <div className="search-integrated">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder={t('searchLog')}
              className="form-control"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button className={`search-clear-btn ${searchQuery ? 'visible' : ''}`} onClick={clearSearch} type="button"><Eraser size={15} /></button>
            <button className="search-btn-inner" onClick={handleSearch} type="button"><Search size={13} /> {t('search')}</button>
          </div>
          <select className="form-control" style={{ width: 'min(100%, 200px)', height: '36px', padding: '0 12px', fontSize: '0.85rem', borderRadius: 'var(--radius-full)' }} value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}>
            {modules.map(m => <option key={m} value={m}>{m === 'all' ? t('allModules') : m}</option>)}
          </select>
        </div>
      </div>

      {/* Log List */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>
            <ShieldCheck size={18} style={{ marginRight: '8px', color: 'var(--primary-color)', verticalAlign: 'middle' }} />
            {filteredLogs.length} {t('records')}
          </h3>
        </div>

        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
            <ShieldCheck size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p>{t('noAuditLogs')}</p>
            <p style={{ fontSize: '0.85rem' }}>{t('auditLogsDesc')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {currentItems.map(log => {
              const actionStyle = getActionStyle(log.action);
              const modStyle = MODULE_COLORS[log.module] || MODULE_COLORS['Sistema'];
              const ActionIcon = actionStyle.icon;
              return (
                <div key={log.id} className="audit-log-item">
                  <div className="audit-log-icon" style={{ backgroundColor: modStyle.bg }}>
                    <ActionIcon size={15} color={actionStyle.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="font-bold" style={{ fontSize: '0.9rem', color: 'var(--text-dark)' }}>{log.action}</span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>·</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-dark)' }}>{log.detail}</span>
                      <span className="badge" style={{ backgroundColor: modStyle.bg, color: modStyle.color, fontSize: '0.68rem', padding: '2px 8px' }}>{log.module}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '3px' }}>
                      Por <strong>{log.user}</strong> · {formatDateTime(log.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ padding: '0 1rem', paddingBottom: '1rem' }}>
          <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredLogs.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
        </div>
      </div>

      {showClearConfirm && (
        <div className="modal-overlay" style={{ zIndex: 300 }}>
          <div className="card" style={{ maxWidth: '420px', width: '90%', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '15px' }}>{t('clearAuditLog')}</h3>
            <p className="text-muted mb-4">{t('clearAuditLogConfirm')}</p>
            <div className="d-flex justify-content-center gap-3" style={{ flexWrap: 'wrap' }}>
              <button className="btn btn-outline" onClick={() => setShowClearConfirm(false)}>{t('cancel')}</button>
              <button className="btn btn-danger" onClick={handleClearLogs}>{t('clearAll')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditPage;
