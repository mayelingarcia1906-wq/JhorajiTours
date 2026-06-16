import { useState, useMemo, useEffect } from 'react';
import { Edit3, MessageCircle, Plus, Trash2, X, Search, Eraser } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { Pagination } from '../components/Pagination';
import { useLanguage } from '../context/LanguageContext';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const initialAgencies = Array.from({ length: 15 }, (_, i) => ({
  id: 1000 + i,
  name: `Agencia ${i + 1} ${['VIP', 'Tours', 'Travel', 'Punta Cana'][i % 4]}`,
  whatsapp: `809-555-${String(1000 + i).padStart(4, '0')}`,
}));

const emptyAgency = { name: '', whatsapp: '' };

const readStoredData = (key, defaultData) => {
  const saved = localStorage.getItem(key);
  if (!saved) return defaultData;
  try { return JSON.parse(saved); } catch { return defaultData; }
};

const logAudit = (action, detail) => {
  try {
    const logs = JSON.parse(localStorage.getItem('jhoraji_audit') || '[]');
    logs.unshift({ id: Date.now(), module: 'Agencias', action, detail, user: 'Administrador', timestamp: new Date().toISOString() });
    localStorage.setItem('jhoraji_audit', JSON.stringify(logs.slice(0, 200)));
  } catch (e) {}
};

const AgenciesPage = () => {
  const { addToast } = useToast();
  const { t } = useLanguage();
  const [agencies, setAgencies] = useState(() => readStoredData('jhoraji_agencies', initialAgencies));
  const [editingAgency, setEditingAgency] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const filteredAgencies = useMemo(() => {
    return agencies.filter(a => 
      (a.name || '').toLowerCase().includes((appliedSearch || '').toLowerCase()) || 
      (a.whatsapp && a.whatsapp.toLowerCase().includes((appliedSearch || '').toLowerCase()))
    );
  }, [agencies, appliedSearch]);

  const totalPages = Math.ceil(filteredAgencies.length / itemsPerPage);
  const currentItems = filteredAgencies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Force mock data to demonstrate pagination
  useEffect(() => {
    if (agencies.length < 15) {
      const mock = Array.from({ length: 15 }, (_, i) => ({
        id: 9000 + i,
        name: `Agencia Demo ${i + 1}`,
        whatsapp: `809-555-${String(9000 + i).padStart(4, '0')}`,
      }));
      const next = [...agencies, ...mock];
      setAgencies(next);
      localStorage.setItem('jhoraji_agencies', JSON.stringify(next));
    }
  }, [agencies]);

  const handleSearch = () => {
    setAppliedSearch(searchTerm);
    setCurrentPage(1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const clearSearch = () => {
    setSearchTerm('');
    setAppliedSearch('');
    setCurrentPage(1);
  };

  const persistAgencies = (nextAgencies) => {
    setAgencies(nextAgencies);
    localStorage.setItem('jhoraji_agencies', JSON.stringify(nextAgencies));
  };

  const handleSaveAgency = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const isNew = !editingAgency.id;
    const submitted = {
      id: editingAgency.id || Date.now(),
      name: formData.get('name').trim(),
      whatsapp: formData.get('whatsapp').trim(),
    };

    const nextAgencies = editingAgency.id
      ? agencies.map((a) => (a.id === editingAgency.id ? submitted : a))
      : [...agencies, submitted];

    persistAgencies(nextAgencies);
    logAudit(isNew ? 'Creó agencia' : 'Editó agencia', submitted.name);
    setEditingAgency(null);
    addToast(isNew ? 'Agencia creada exitosamente' : 'Agencia actualizada', 'success');
  };

  const handleDelete = () => {
    const agency = agencies.find(a => a.id === showDeleteConfirm);
    persistAgencies(agencies.filter(a => a.id !== showDeleteConfirm));
    logAudit('Eliminó agencia', agency?.name || '');
    addToast('Agencia eliminada', 'success');
    setShowDeleteConfirm(null);
  };

  return (
    <div>
      <div className="page-header mb-4">
        <div>
          <h2>{t('agenciesTitle')}</h2>
          <p className="text-muted" style={{ margin: 0 }}>{t('agenciesSubtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditingAgency({ ...emptyAgency })}>
          <Plus size={18} /> {t('newAgency')}
        </button>
      </div>

      <div className="card mb-4">
        <div className="page-toolbar">
          <div className="d-flex gap-3" style={{ flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
            <div className="search-integrated">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder={t('searchAgency')}
                className="form-control"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className={`search-clear-btn ${searchTerm ? 'visible' : ''}`}
                onClick={clearSearch}
                title="Limpiar búsqueda"
                type="button"
              >
                <Eraser size={15} />
              </button>
              <button className="search-btn-inner" onClick={handleSearch} type="button">
                <Search size={13} /> {t('search')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table compact-table" style={{ minWidth: '0', width: '100%', fontSize: '0.85rem' }}>
            <thead style={{ fontSize: '0.75rem' }}>
              <tr style={{ color: 'var(--text-light)', borderBottom: '1px solid var(--border-color)' }}>
                <th>{t('agencyName')}</th>
                <th>WhatsApp</th>
                <th style={{ textAlign: 'right' }}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {agencies.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                    No hay agencias registradas. ¡Agrega la primera!
                  </td>
                </tr>
              )}
              {filteredAgencies.length === 0 && agencies.length > 0 && (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                    No se encontraron resultados para "{appliedSearch}".
                  </td>
                </tr>
              )}
              {currentItems.map(a => (
                <tr key={a.id}>
                  <td className="font-bold">{a.name}</td>
                  <td>
                    {a.whatsapp ? (
                      <div className="d-flex align-items-center gap-1" style={{ color: '#25D366', fontWeight: '500' }}>
                        <MessageCircle size={15} /> {a.whatsapp}
                      </div>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                      <button className="icon-btn" onClick={() => setEditingAgency(a)} title="Editar" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: 'var(--warning)' }}>
                        <Edit3 size={16} />
                      </button>
                      <button className="icon-btn" onClick={() => setShowDeleteConfirm(a.id)} title="Eliminar" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '0 1rem', paddingBottom: '1rem' }}>
          <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredAgencies.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
        </div>
      </div>

      {/* Modal Crear/Editar */}
      {editingAgency && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 style={{ margin: 0 }}>
                {editingAgency.id ? t('editAgency') : t('newAgency')}
              </h3>
              <button onClick={() => setEditingAgency(null)} style={{ background: 'none', color: 'var(--text-light)' }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveAgency}>
              <div className="form-group">
                <label>Nombre</label>
                <input name="name" type="text" className="form-control" required defaultValue={editingAgency.name} />
              </div>
              <div className="form-group">
                <label>WhatsApp</label>
                <input name="whatsapp" type="text" className="form-control" defaultValue={editingAgency.whatsapp} />
              </div>
              <div className="modal-actions mt-4">
                <button type="button" className="btn btn-outline" onClick={() => setEditingAgency(null)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">
                  {editingAgency.id ? t('update') : t('create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(null)}
        onConfirm={handleDelete}
        title={t('deleteAgencyTitle')}
        message="¿Estás seguro que deseas eliminar esta agencia? Esta acción no se puede deshacer."
      />
    </div>
  );
};

export default AgenciesPage;
