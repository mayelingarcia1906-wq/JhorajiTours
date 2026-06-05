import { useState } from 'react';
import { Edit3, MessageCircle, Plus, Trash2, X, Search, Eraser } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const initialAgencies = [];

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
  const [agencies, setAgencies] = useState(() => readStoredData('jhoraji_agencies', initialAgencies));
  const [editingAgency, setEditingAgency] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const handleSearch = () => {
    setAppliedSearch(searchTerm);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const clearSearch = () => {
    setSearchTerm('');
    setAppliedSearch('');
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
          <h2>Agencias</h2>
          <p className="text-muted" style={{ margin: 0 }}>Panel de administración</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditingAgency({ ...emptyAgency })}>
          <Plus size={18} /> Nueva Agencia
        </button>
      </div>

      <div className="card mb-4">
        <div className="page-toolbar">
          <div className="d-flex gap-3" style={{ flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
            <div className="search-integrated">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar por nombre o WhatsApp..."
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
                <Search size={13} /> Buscar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>WhatsApp</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
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
              {agencies.filter(a => 
                (a.name || '').toLowerCase().includes((appliedSearch || '').toLowerCase()) || 
                (a.whatsapp && a.whatsapp.toLowerCase().includes((appliedSearch || '').toLowerCase()))
              ).length === 0 && agencies.length > 0 && (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                    No se encontraron resultados para "{appliedSearch}".
                  </td>
                </tr>
              )}
              {agencies.filter(a => 
                (a.name || '').toLowerCase().includes((appliedSearch || '').toLowerCase()) || 
                (a.whatsapp && a.whatsapp.toLowerCase().includes((appliedSearch || '').toLowerCase()))
              ).map(a => (
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
      </div>

      {/* Modal Crear/Editar */}
      {editingAgency && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 style={{ margin: 0 }}>
                {editingAgency.id ? 'Editar Agencia' : 'Nueva Agencia'}
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
                <button type="button" className="btn btn-outline" onClick={() => setEditingAgency(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {editingAgency.id ? 'Actualizar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {showDeleteConfirm && (
        <div className="modal-overlay" style={{ zIndex: 300 }}>
          <div className="card" style={{ maxWidth: '420px', width: '90%', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '15px' }}>Eliminar Agencia</h3>
            <p className="text-muted mb-4">¿Estás seguro que deseas eliminar esta agencia? Esta acción no se puede deshacer.</p>
            <div className="d-flex justify-content-center gap-3" style={{ flexWrap: 'wrap' }}>
              <button className="btn btn-outline" onClick={() => setShowDeleteConfirm(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgenciesPage;
