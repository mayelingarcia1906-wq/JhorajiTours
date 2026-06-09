import { useState, useMemo } from 'react';
import { Edit3, Mail, Phone, Plus, Trash2, X, Search, Eraser } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { Pagination } from '../components/Pagination';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { useLanguage } from '../context/LanguageContext';

const initialProviders = [];

const emptyProvider = { name: '', phone: '', email: '', notes: '' };

const readStoredData = (key, defaultData) => {
  const saved = localStorage.getItem(key);
  if (!saved) return defaultData;
  try { return JSON.parse(saved); } catch { return defaultData; }
};

const logAudit = (action, detail) => {
  const logs = JSON.parse(localStorage.getItem('jhoraji_audit') || '[]');
  logs.unshift({ id: Date.now(), module: 'Proveedores', action, detail, user: 'Administrador', timestamp: new Date().toISOString() });
  localStorage.setItem('jhoraji_audit', JSON.stringify(logs.slice(0, 200)));
};

const ProvidersPage = () => {
  const { addToast } = useToast();
  const { t } = useLanguage();
  const [providers, setProviders] = useState(() => readStoredData('jhoraji_providers', initialProviders));
  const [editingProvider, setEditingProvider] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const filteredProviders = useMemo(() => {
    return providers.filter(p => 
      (p.name || '').toLowerCase().includes((appliedSearch || '').toLowerCase()) || 
      (p.email && p.email.toLowerCase().includes((appliedSearch || '').toLowerCase())) ||
      (p.phone && p.phone.toLowerCase().includes((appliedSearch || '').toLowerCase()))
    );
  }, [providers, appliedSearch]);

  const totalPages = Math.ceil(filteredProviders.length / itemsPerPage);
  const currentItems = filteredProviders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

  const persistProviders = (nextProviders) => {
    setProviders(nextProviders);
    localStorage.setItem('jhoraji_providers', JSON.stringify(nextProviders));
  };

  const handleSaveProvider = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const isNew = !editingProvider.id;
    const submitted = {
      id: editingProvider.id || Date.now(),
      name: formData.get('name').trim(),
      phone: formData.get('phone').trim(),
      email: formData.get('email').trim(),
      notes: formData.get('notes').trim(),
    };

    const nextProviders = editingProvider.id
      ? providers.map((p) => (p.id === editingProvider.id ? submitted : p))
      : [...providers, submitted];

    persistProviders(nextProviders);
    logAudit(isNew ? 'Creó proveedor' : 'Editó proveedor', submitted.name);
    setEditingProvider(null);
    addToast(isNew ? 'Proveedor creado exitosamente' : 'Proveedor actualizado', 'success');
  };

  const handleDelete = () => {
    const provider = providers.find(p => p.id === showDeleteConfirm);
    persistProviders(providers.filter(p => p.id !== showDeleteConfirm));
    logAudit('Eliminó proveedor', provider?.name || '');
    addToast('Proveedor eliminado', 'success');
    setShowDeleteConfirm(null);
  };

  return (
    <div>
      <div className="page-header mb-4">
        <div>
          <h2>{t('providersTitle')}</h2>
          <p className="text-muted" style={{ margin: 0 }}>{t('providersSubtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditingProvider({ ...emptyProvider })}>
          <Plus size={18} /> {t('newProvider')}
        </button>
      </div>

      <div className="card mb-4">
        <div className="page-toolbar">
          <div className="d-flex gap-3" style={{ flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
            <div className="search-integrated">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder={t('searchProvider')}
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
          <table className="table">
            <thead>
              <tr>
                <th>{t('providerName')}</th>
                <th>{t('contact')}</th>
                <th>{t('notes')}</th>
                <th style={{ textAlign: 'right' }}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {providers.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                    No hay proveedores registrados. ¡Agrega el primero!
                  </td>
                </tr>
              )}
              {filteredProviders.length === 0 && providers.length > 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                    No se encontraron resultados para "{appliedSearch}".
                  </td>
                </tr>
              )}
              {currentItems.map(p => (
                <tr key={p.id}>
                  <td className="font-bold">{p.name}</td>
                  <td>
                    <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {p.phone && (
                        <div className="d-flex align-items-center gap-1" style={{ color: 'var(--danger)' }}>
                          <Phone size={13} /> {p.phone}
                        </div>
                      )}
                      {p.email && (
                        <div className="d-flex align-items-center gap-1" style={{ color: 'var(--primary-color)' }}>
                          <Mail size={13} /> {p.email}
                        </div>
                      )}
                      {!p.phone && !p.email && <span className="text-muted">—</span>}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-light)', maxWidth: '200px' }}>
                    {p.notes ? p.notes.substring(0, 60) + (p.notes.length > 60 ? '…' : '') : '—'}
                  </td>
                  <td>
                    <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                      <button className="icon-btn" onClick={() => setEditingProvider(p)} title="Editar" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: 'var(--warning)' }}>
                        <Edit3 size={16} />
                      </button>
                      <button className="icon-btn" onClick={() => setShowDeleteConfirm(p.id)} title="Eliminar" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>
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
          <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredProviders.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
        </div>
      </div>

      {/* Modal Crear/Editar */}
      {editingProvider && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 style={{ margin: 0 }}>
                {editingProvider.id ? t('editProvider') : t('newProvider')}
              </h3>
              <button onClick={() => setEditingProvider(null)} style={{ background: 'none', color: 'var(--text-light)' }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveProvider}>
              <div className="form-group">
                <label>Nombre Empresa / Persona</label>
                <input name="name" type="text" className="form-control" placeholder="Ej. Buggies Macao" required defaultValue={editingProvider.name} />
              </div>
              <div className="responsive-grid" style={{ gap: '15px' }}>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input name="phone" type="tel" className="form-control" defaultValue={editingProvider.phone} />
                </div>
                <div className="form-group">
                  <label>Correo</label>
                  <input name="email" type="email" className="form-control" defaultValue={editingProvider.email} />
                </div>
              </div>
              <div className="form-group">
                <label>Notas internas</label>
                <textarea name="notes" className="form-control" rows="3" placeholder="Detalles de contacto, cuentas bancarias..." defaultValue={editingProvider.notes}></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setEditingProvider(null)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">
                  {editingProvider.id ? t('update') : t('create')}
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
        title={t('deleteProviderTitle')}
        message="¿Estás seguro que deseas eliminar este proveedor? Esta acción no se puede deshacer."
      />
    </div>
  );
};

export default ProvidersPage;
