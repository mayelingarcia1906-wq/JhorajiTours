import { useMemo, useState } from 'react';
import { Edit3, Eraser, Eye, Globe, Mail, Phone, Plus, Search, Trash2, User, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Pagination } from '../components/Pagination';
import { useNotifications } from '../context/NotificationsContext';

const initialCustomers = [];

const emptyCustomer = {
  name: '',
  email: '',
  phone: '',
  country: '',
  status: 'new',
  totalBookings: 0,
  totalSpent: '$0.00',
  lastVisit: new Date().toISOString().split('T')[0],
};

const readStoredCustomers = () => {
  const saved = localStorage.getItem('jhoraji_customers');
  if (!saved) return initialCustomers;

  try {
    return JSON.parse(saved);
  } catch {
    return initialCustomers;
  }
};

const statusBadge = {
  new: 'primary',
  active: 'success',
  vip: 'warning',
};

const CustomersPage = () => {
  const { addToast } = useToast();
  const { t } = useLanguage();
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [customers, setCustomers] = useState(readStoredCustomers);

  const statusTabs = ['all', 'new', 'active', 'vip'];

  const persistCustomers = (nextCustomers) => {
    setCustomers(nextCustomers);
    localStorage.setItem('jhoraji_customers', JSON.stringify(nextCustomers));
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesStatus = activeTab === 'all' || customer.status === activeTab;
      const term = appliedSearch.toLowerCase();
      const matchesSearch = [customer.name, customer.email, customer.country]
        .some((value) => (value || '').toLowerCase().includes(term));
      return matchesStatus && matchesSearch;
    });
  }, [customers, activeTab, appliedSearch]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const currentItems = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearch = () => {
    setAppliedSearch(searchQuery);
    setCurrentPage(1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const clearSearch = () => {
    setSearchQuery('');
    setAppliedSearch('');
    setCurrentPage(1);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const openNewCustomer = () => {
    setEditingCustomer({ ...emptyCustomer });
  };

  const openEditCustomer = (customer) => {
    setEditingCustomer({ ...customer });
  };

  const handleSaveCustomer = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submitted = {
      id: editingCustomer.id || Date.now(),
      name: formData.get('name').trim(),
      email: formData.get('email').trim(),
      phone: formData.get('phone').trim(),
      country: formData.get('country').trim(),
      status: formData.get('status'),
      totalBookings: editingCustomer.totalBookings || 0,
      totalSpent: editingCustomer.totalSpent || '$0.00',
      lastVisit: editingCustomer.lastVisit || new Date().toISOString().split('T')[0],
    };

    const nextCustomers = editingCustomer.id
      ? customers.map((customer) => (customer.id === editingCustomer.id ? submitted : customer))
      : [submitted, ...customers];

    persistCustomers(nextCustomers);
    setEditingCustomer(null);
    addToast(t('customerSaved'), 'success');
    
    if (!editingCustomer.id) {
      addNotification(`Nuevo cliente registrado: ${submitted.name}`);
    }
  };

  const handleDelete = () => {
    persistCustomers(customers.filter((customer) => customer.id !== showDeleteConfirm));
    addToast(t('customerDeleted'), 'success');
    setShowDeleteConfirm(null);
  };

  const renderCustomerFields = (customer) => (
    <div className="responsive-grid">
      <div className="form-group"><label>{t('fullName')}</label><input name="name" type="text" className="form-control" required defaultValue={customer.name} onInput={(e) => e.target.value = e.target.value.replace(/[0-9]/g, '')} /></div>
      <div className="form-group"><label>{t('email')}</label><input name="email" type="email" className="form-control" required defaultValue={customer.email} /></div>
      <div className="form-group"><label>{t('phone')}</label><input name="phone" type="tel" className="form-control" required defaultValue={customer.phone} onInput={(e) => e.target.value = e.target.value.replace(/[^0-9+\-\s()]/g, '')} /></div>
      <div className="form-group"><label>{t('countryOrigin')}</label>
        <select name="country" className="form-control" required defaultValue={customer.country || ''}>
          <option value="" disabled>{t('selectCountry')}</option>
          <option value="República Dominicana">República Dominicana</option>
          <option value="United States">United States</option>
          <option value="Canada">Canada</option>
          <option value="España">España</option>
          <option value="México">México</option>
          <option value="Colombia">Colombia</option>
          <option value="Argentina">Argentina</option>
          <option value="Chile">Chile</option>
          <option value="Perú">Perú</option>
          <option value="Ecuador">Ecuador</option>
          <option value="Venezuela">Venezuela</option>
          <option value="Panamá">Panamá</option>
          <option value="Puerto Rico">Puerto Rico</option>
          <option value="Costa Rica">Costa Rica</option>
          <option value="Brasil">Brasil</option>
          <option value="Reino Unido">Reino Unido</option>
          <option value="Francia">Francia</option>
          <option value="Alemania">Alemania</option>
          <option value="Italia">Italia</option>
        </select>
      </div>
      <div className="form-group"><label>{t('status')}</label>
        <select name="status" className="form-control" defaultValue={customer.status}>
          <option value="new">{t('new')}</option>
          <option value="active">{t('active')}</option>
          <option value="vip">{t('vip')}</option>
        </select>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header mb-4">
        <div>
          <h2>{t('customersTitle')}</h2>
          <p className="text-muted" style={{ margin: 0 }}>{t('customersSubtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={openNewCustomer}>
          <Plus size={18} /> {t('newCustomer')}
        </button>
      </div>

      <div className="card">
        <div className="page-toolbar mb-4">
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px', maxWidth: '100%' }}>
            {statusTabs.map((tab) => (
              <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => handleTabChange(tab)}>
                {t(tab)}
              </button>
            ))}
          </div>
          <div>
            <div className="search-integrated">
              <Search size={16} className="search-icon" />
              <input type="text" placeholder={t('searchCustomers')} className="form-control" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleKeyDown} />
              <button className={`search-clear-btn ${searchQuery ? 'visible' : ''}`} onClick={clearSearch} title="Limpiar" type="button"><Eraser size={15} /></button>
              <button className="search-btn-inner" onClick={handleSearch} type="button"><Search size={13} /> {t('search')}</button>
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>{t('customer')}</th>
                <th>{t('contact')}</th>
                <th>{t('country')}</th>
                <th>{t('totalBookings')}</th>
                <th>{t('totalSpent')}</th>
                <th>{t('lastVisit')}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.85rem', flexShrink: 0 }}>
                        {customer.name.charAt(0)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 500 }}>{customer.name}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{customer.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>{customer.phone}</td>
                  <td>{customer.country}</td>
                  <td>{customer.totalBookings}</td>
                  <td className="font-bold">{customer.totalSpent}</td>
                  <td>{customer.lastVisit}</td>
                  <td><span className={`badge badge-${statusBadge[customer.status]}`}>{t(customer.status)}</span></td>
                  <td>
                    <div className="action-buttons">
                      <button className="icon-btn" onClick={() => setSelectedCustomer(customer)} title={t('view')}><Eye size={18} /></button>
                      <button className="icon-btn" onClick={() => openEditCustomer(customer)} title={t('edit')}><Edit3 size={18} /></button>
                      <button className="icon-btn" onClick={() => setShowDeleteConfirm(customer.id)} title={t('delete')} style={{ color: 'var(--danger)' }}><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '0 1rem', paddingBottom: '1rem' }}>
          <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredCustomers.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
        </div>
      </div>

      {/* Detail Modal */}
      {selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 style={{ margin: 0 }}>{t('customerProfile')}</h3>
              <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', color: 'var(--text-light)' }}><X size={24} /></button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.3rem', flexShrink: 0 }}>
                {selectedCustomer.name.charAt(0)}
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0' }}>{selectedCustomer.name}</h4>
                <span className={`badge badge-${statusBadge[selectedCustomer.status]}`}>{t(selectedCustomer.status)}</span>
              </div>
            </div>

            <div className="responsive-grid">
              <div><p className="text-muted mb-1">{t('email')}</p><div className="d-flex align-items-center gap-2"><Mail size={16}/>{selectedCustomer.email}</div></div>
              <div><p className="text-muted mb-1">{t('phone')}</p><div className="d-flex align-items-center gap-2"><Phone size={16}/>{selectedCustomer.phone}</div></div>
              <div><p className="text-muted mb-1">{t('country')}</p><div className="d-flex align-items-center gap-2"><Globe size={16}/>{selectedCustomer.country}</div></div>
              <div><p className="text-muted mb-1">{t('status')}</p><div className="d-flex align-items-center gap-2"><User size={16}/>{t(selectedCustomer.status)}</div></div>
              <div><p className="text-muted mb-1">{t('totalBookings')}</p><div className="font-bold">{selectedCustomer.totalBookings}</div></div>
              <div><p className="text-muted mb-1">{t('totalSpent')}</p><div className="font-bold">{selectedCustomer.totalSpent}</div></div>
              <div><p className="text-muted mb-1">{t('lastVisit')}</p><div>{selectedCustomer.lastVisit}</div></div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setSelectedCustomer(null)}>{t('close')}</button>
              <button className="btn btn-primary" onClick={() => { setSelectedCustomer(null); openEditCustomer(selectedCustomer); }}>{t('editCustomer')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Create Modal */}
      {editingCustomer && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 style={{ margin: 0 }}>{editingCustomer.id ? t('editCustomer') : t('newCustomer')}</h3>
              <button onClick={() => setEditingCustomer(null)} style={{ background: 'none', color: 'var(--text-light)' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveCustomer}>
              {renderCustomerFields(editingCustomer)}
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setEditingCustomer(null)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="modal-overlay" style={{ zIndex: 300 }}>
          <div className="card" style={{ maxWidth: '420px', width: '90%', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '15px' }}>{t('deleteCustomerTitle')}</h3>
            <p className="text-muted mb-4">{t('deleteCustomerText')}</p>
            <div className="d-flex justify-content-center gap-3" style={{ flexWrap: 'wrap' }}>
              <button className="btn btn-outline" onClick={() => setShowDeleteConfirm(null)}>{t('cancel')}</button>
              <button className="btn btn-danger" onClick={handleDelete}>{t('delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
