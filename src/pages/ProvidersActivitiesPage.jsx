import { useState } from 'react';
import { Edit3, Plus, Trash2, X, Phone, Mail } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

const initialProviders = [];

const initialActivities = [];

const emptyProvider = { name: '', phone: '', email: '', notes: '' };
const emptyActivity = { name: '', providerId: '', costBase: 0, chargeMode: 'PAX', active: true, description: '', commissions: { getYourGuide: 27, viator: 30, civitatis: 30, direct: 0 } };

const readStoredData = (key, defaultData) => {
  const saved = localStorage.getItem(key);
  if (!saved) return defaultData;
  try {
    return JSON.parse(saved);
  } catch {
    return defaultData;
  }
};

const ProvidersActivitiesPage = () => {
  const { addToast } = useToast();
  const { t } = useLanguage();
  
  const [activeTab, setActiveTab] = useState('providers');
  const [providers, setProviders] = useState(() => readStoredData('jhoraji_providers', initialProviders));
  const [activities, setActivities] = useState(() => readStoredData('jhoraji_act', initialActivities));

  const [editingProvider, setEditingProvider] = useState({ ...emptyProvider });
  const [editingActivity, setEditingActivity] = useState({ ...emptyActivity });

  const persistProviders = (nextProviders) => {
    setProviders(nextProviders);
    localStorage.setItem('jhoraji_providers', JSON.stringify(nextProviders));
  };

  const persistActivities = (nextActivities) => {
    setActivities(nextActivities);
    localStorage.setItem('jhoraji_act', JSON.stringify(nextActivities));
  };

  const handleSaveProvider = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submitted = {
      id: editingProvider.id || Date.now(),
      name: formData.get('name').trim(),
      phone: formData.get('phone').trim(),
      email: formData.get('email').trim(),
      notes: formData.get('notes').trim(),
    };

    const nextProviders = editingProvider.id
      ? providers.map((p) => (p.id === editingProvider.id ? submitted : p))
      : [...providers, submitted]; // Add to end like the screenshot shows them sorted usually

    persistProviders(nextProviders);
    setEditingProvider({ ...emptyProvider });
    addToast(t('providerSaved'), 'success');
  };

  const handleDeleteProvider = (id) => {
    persistProviders(providers.filter(p => p.id !== id));
    addToast(t('providerDeleted'), 'success');
  };

  const handleSaveActivity = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submitted = {
      id: editingActivity.id || Date.now(),
      name: formData.get('name').trim(),
      providerId: Number(formData.get('providerId')),
      costBase: Number(formData.get('costBase')),
      chargeMode: formData.get('chargeMode'),
      active: formData.get('active') === 'on',
      description: formData.get('description').trim(),
      commissions: {
        getYourGuide: Number(formData.get('getYourGuide')),
        viator: Number(formData.get('viator')),
        civitatis: Number(formData.get('civitatis')),
        direct: Number(formData.get('direct')),
      }
    };

    const nextActivities = editingActivity.id
      ? activities.map((a) => (a.id === editingActivity.id ? submitted : a))
      : [submitted, ...activities];

    persistActivities(nextActivities);
    setEditingActivity({ ...emptyActivity });
    addToast(t('activitySaved'), 'success');
  };

  const handleDeleteActivity = (id) => {
    persistActivities(activities.filter(a => a.id !== id));
    addToast(t('activityDeleted'), 'success');
  };

  return (
    <div>
      <div className="page-header mb-4">
        <div>
          <h2>{t('providersAndActivities')}</h2>
          <p className="text-muted" style={{ margin: 0 }}>{t('adminPanel')}</p>
        </div>
      </div>

      <div className="card mb-4" style={{ padding: '0 1rem' }}>
        <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--border-color)' }}>
          <button 
            className={`tab-btn ${activeTab === 'providers' ? 'active' : ''}`} 
            style={{ borderRadius: 0, border: 'none', borderBottom: activeTab === 'providers' ? '2px solid var(--primary-color)' : '2px solid transparent', padding: '1rem 0', background: 'none' }}
            onClick={() => setActiveTab('providers')}
          >
            {t('providers')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'activities' ? 'active' : ''}`} 
            style={{ borderRadius: 0, border: 'none', borderBottom: activeTab === 'activities' ? '2px solid var(--primary-color)' : '2px solid transparent', padding: '1rem 0', background: 'none' }}
            onClick={() => setActiveTab('activities')}
          >
            {t('activities')}
          </button>
        </div>
      </div>

      {activeTab === 'providers' && (
        <div className="dashboard-grid-2">
          {/* Form */}
          <div className="card" style={{ alignSelf: 'flex-start' }}>
            <h3 style={{ fontSize: '0.9375rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)' }}>
              <Plus size={20} /> {editingProvider.id ? t('editProviderTitle') : t('newProviderTitle')}
            </h3>
            <form onSubmit={handleSaveProvider} key={editingProvider.id || 'new'}>
              <div className="form-group">
                <label>{t('companyPersonName')}</label>
                <input name="name" type="text" className="form-control" placeholder="Ej. Buggies Macao" required defaultValue={editingProvider.name} />
              </div>
              <div className="responsive-grid" style={{ gap: '15px' }}>
                <div className="form-group">
                  <label>{t('phone')}</label>
                  <input name="phone" type="tel" className="form-control" defaultValue={editingProvider.phone} />
                </div>
                <div className="form-group">
                  <label>{t('email')}</label>
                  <input name="email" type="email" className="form-control" defaultValue={editingProvider.email} />
                </div>
              </div>
              <div className="form-group">
                <label>{t('internalNotes')}</label>
                <textarea name="notes" className="form-control" rows="3" defaultValue={editingProvider.notes}></textarea>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                {editingProvider.id ? t('updateProvider') : t('createProvider')}
              </button>
              {editingProvider.id && (
                <button type="button" className="btn btn-outline mt-2" style={{ width: '100%' }} onClick={() => setEditingProvider({ ...emptyProvider })}>{t('cancel')}</button>
              )}
            </form>
          </div>

          {/* List */}
          <div className="card">
            <h3 style={{ fontSize: '0.9375rem', marginBottom: '0.75rem' }}>{t('providerList')}</h3>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('name')}</th>
                    <th>{t('contact')}</th>
                    <th style={{ textAlign: 'right' }}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map(p => (
                    <tr key={p.id}>
                      <td className="font-bold">{p.name}</td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          {p.phone && <div className="d-flex align-items-center gap-1 mb-1" style={{ color: 'var(--danger)' }}><Phone size={14} /> {p.phone}</div>}
                          {p.email && <div className="d-flex align-items-center gap-1" style={{ color: 'var(--primary-color)' }}><Mail size={14} /> {p.email}</div>}
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                          <button className="icon-btn" onClick={() => setEditingProvider(p)} style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}><Edit3 size={16} /></button>
                          <button className="icon-btn" onClick={() => handleDeleteProvider(p.id)} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activities' && (
        <div className="dashboard-grid-2">
          {/* Form */}
          <div className="card" style={{ alignSelf: 'flex-start' }}>
            <h3 style={{ fontSize: '0.9375rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)' }}>
              <Plus size={20} /> {editingActivity.id ? t('editActivityTitle') : t('newActivityTitle')}
            </h3>
            <form onSubmit={handleSaveActivity} key={editingActivity.id || 'new'}>
              <div className="responsive-grid" style={{ gap: '15px' }}>
                <div className="form-group">
                  <label>{t('provider') || 'Proveedor'}</label>
                  <select name="providerId" className="form-control" required defaultValue={editingActivity.providerId}>
                    <option value="">-- {t('search') || 'Seleccionar'} --</option>
                    {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('baseCostField')}</label>
                  <input name="costBase" type="number" min="0" step="0.01" className="form-control" required defaultValue={editingActivity.costBase} />
                </div>
                <div className="form-group">
                  <label>{t('chargeMode')}</label>
                  <select name="chargeMode" className="form-control" defaultValue={editingActivity.chargeMode}>
                    <option value="PAX">{t('perPerson')}</option>
                    <option value="TRIP">{t('perTrip')}</option>
                  </select>
                </div>
              </div>
              
              <div className="responsive-grid" style={{ gap: '15px' }}>
                <div className="form-group">
                  <label>{t('activityName')}</label>
                  <input name="name" type="text" className="form-control" placeholder="Ej. Saona VIP" required defaultValue={editingActivity.name} />
                </div>
                <div className="form-group">
                  <label>{t('status')}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                    <input type="checkbox" id="actActive" name="active" defaultChecked={editingActivity.active} />
                    <label htmlFor="actActive" style={{ margin: 0 }}>{t('activityAvailable')}</label>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>{t('description')}</label>
                <textarea name="description" className="form-control" rows="3" defaultValue={editingActivity.description}></textarea>
              </div>

              <div className="form-group mt-4">
                <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '10px' }}>{t('commissionConfig')}</label>
                <div className="card" style={{ padding: '1rem', backgroundColor: 'var(--secondary-color)', boxShadow: 'none' }}>
                  <div className="responsive-grid" style={{ gap: '15px' }}>
                    
                    <div style={{ textAlign: 'center' }}>
                      <label style={{ color: '#f97316', fontSize: '0.85rem', fontWeight: 600 }}>GetYourGuide</label>
                      <div className="search-field" style={{ width: '100%' }}>
                        <input name="getYourGuide" type="number" className="form-control text-center" defaultValue={editingActivity.commissions?.getYourGuide} />
                        <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}>%</span>
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <label style={{ color: '#16a34a', fontSize: '0.85rem', fontWeight: 600 }}>Viator</label>
                      <div className="search-field" style={{ width: '100%' }}>
                        <input name="viator" type="number" className="form-control text-center" defaultValue={editingActivity.commissions?.viator} />
                        <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}>%</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <label style={{ color: '#e11d48', fontSize: '0.85rem', fontWeight: 600 }}>Civitatis</label>
                      <div className="search-field" style={{ width: '100%' }}>
                        <input name="civitatis" type="number" className="form-control text-center" defaultValue={editingActivity.commissions?.civitatis} />
                        <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}>%</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <label style={{ color: 'var(--text-dark)', fontSize: '0.85rem', fontWeight: 600 }}>{t('otherDirect')}</label>
                      <div className="search-field" style={{ width: '100%' }}>
                        <input name="direct" type="number" className="form-control text-center" defaultValue={editingActivity.commissions?.direct} />
                        <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}>%</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary mt-4" style={{ width: '100%' }}>
                {editingActivity.id ? t('updateActivity') : t('saveActivity')}
              </button>
              {editingActivity.id && (
                <button type="button" className="btn btn-outline mt-2" style={{ width: '100%' }} onClick={() => setEditingActivity({ ...emptyActivity })}>{t('cancel')}</button>
              )}
            </form>
          </div>

          {/* List */}
          <div className="card">
            <h3 style={{ fontSize: '0.9375rem', marginBottom: '0.75rem' }}>{t('activityList')}</h3>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('activity') || 'Actividad'}</th>
                    <th>{t('provider') || 'Proveedor'}</th>
                    <th>{t('cost')}</th>
                    <th style={{ textAlign: 'right' }}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map(a => {
                    const provider = providers.find(p => p.id === a.providerId);
                    return (
                      <tr key={a.id}>
                        <td>
                          <div className="font-bold">{a.name}</div>
                          <span className={`badge ${a.active ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem' }}>
                            {a.active ? t('active') : t('inactive')}
                          </span>
                        </td>
                        <td>{provider?.name || t('unknown')}</td>
                        <td className="font-bold text-muted">${a.costBase}</td>
                        <td>
                          <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                            <button className="icon-btn" onClick={() => setEditingActivity(a)} style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}><Edit3 size={16} /></button>
                            <button className="icon-btn" onClick={() => handleDeleteActivity(a.id)} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProvidersActivitiesPage;
