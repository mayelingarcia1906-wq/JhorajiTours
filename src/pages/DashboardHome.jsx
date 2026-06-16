import { useState, useMemo } from 'react';
import { ArrowUpRight, DollarSign, Eye, ShoppingCart, TrendingUp, Users, X, User, MapPin, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Legend } from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useCurrency } from '../context/CurrencyContext';

const DashboardHome = () => {
  const { addToast } = useToast();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [popularFilter, setPopularFilter] = useState('year');

  const statusBadgeMap = {
    paid: 'success',
    pending: 'warning',
    canceled: 'danger',
  };

  // Real computations based on local storage data
  const totalCustomers = useMemo(() => {
    const saved = localStorage.getItem('jhoraji_customers_list');
    if (saved) { try { return JSON.parse(saved).length; } catch(e) {} }
    return 0;
  }, []);

  const activeToursCount = useMemo(() => {
    const saved = localStorage.getItem('jhoraji_tours');
    if (saved) { try { return JSON.parse(saved).filter(t => t.active).length; } catch(e) {} }
    return 0;
  }, []);

  // Read real data from system
  const allBookings = useMemo(() => {
    const saved = localStorage.getItem('jhoraji_bookings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fall back below
      }
    }
    return [];
  }, []);

  const totalRevenue = useMemo(() => {
    return allBookings
      .filter(b => b.status === 'paid')
      .reduce((sum, b) => {
        const val = parseFloat((b.amount || '').replace(/[^0-9.-]+/g, ""));
        return sum + (isNaN(val) ? 0 : val);
      }, 0);
  }, [allBookings]);

  const todayBookingsCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return allBookings.filter(b => b.date === today).length;
  }, [allBookings]);

  const stats = [
    { title: t('totalRevenue'), value: formatPrice(totalRevenue), change: '+12%', icon: <DollarSign size={18} color="var(--primary-color)" />, color: 'var(--primary-color)' },
    { title: t('todayBookings'), value: todayBookingsCount.toString(), change: '+5%', icon: <ShoppingCart size={18} color="var(--success)" />, color: 'var(--success)' },
    { title: t('newCustomers'), value: totalCustomers.toString(), change: '+18%', icon: <Users size={18} color="var(--warning)" />, color: 'var(--warning)' },
    { title: t('activeTours'), value: activeToursCount.toString(), change: '0%', icon: <TrendingUp size={18} color="var(--danger)" />, color: 'var(--danger)' },
  ];

  const recentBookings = allBookings.slice(0, 5);

  const popularTours = useMemo(() => {
    if (allBookings.length === 0) return [];

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();

    const filteredBookings = allBookings.filter(b => {
      if (!b.date) return false;
      const bDate = new Date(b.date);
      if (popularFilter === 'day') {
        return bDate.getDate() === currentDate && bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear;
      }
      if (popularFilter === 'month') {
        return bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear;
      }
      return bDate.getFullYear() === currentYear;
    });

    const counts = {};
    let max = 0;
    filteredBookings.forEach(b => {
      counts[b.tour] = (counts[b.tour] || 0) + 1;
      if (counts[b.tour] > max) max = counts[b.tour];
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        salesCount: count,
        percent: `${Math.round((count / max) * 100)}%`
      }));
  }, [allBookings, popularFilter]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4" style={{ flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2>{t('dashboardSummary')}</h2>
          <p className="text-muted" style={{ margin: 0, textTransform: 'capitalize' }}>
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="stats-grid mb-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        {stats.map((stat) => (
          <div key={stat.title} className="card" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px', borderRadius: '10px' }}>
            <div className="d-flex justify-content-between align-items-start">
              <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600 }}>{stat.title}</p>
              <div style={{ width: '30px', height: '30px', borderRadius: '6px', backgroundColor: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {stat.icon}
              </div>
            </div>
            <div>
              <h3 style={{ margin: '0 0 2px 0', fontSize: '1.15rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stat.value}</h3>
              <div className="d-flex align-items-center gap-1" style={{ fontSize: '0.7rem', color: stat.change.startsWith('+') ? 'var(--success)' : 'var(--text-light)', fontWeight: 600 }}>
                {stat.change.startsWith('+') && <ArrowUpRight size={12} />}
                {stat.change} <span style={{ color: 'var(--text-muted)' }}>{t('thisMonth')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'stretch' }}>
        <div className="card" style={{ flex: '2 1 500px' }}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{t('recentBookings')}</h3>
            <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => navigate('/bookings')}>{t('seeAll')}</button>
          </div>
          <div className="table-wrapper">
            <table className="table compact-table" style={{ minWidth: '0', width: '100%', fontSize: '0.85rem' }}>
              <thead style={{ fontSize: '0.75rem' }}>
                <tr>
                  <th style={{ whiteSpace: 'nowrap' }}>ID</th>
                  <th>{t('customer')}</th>
                  <th>{t('tour')}</th>
                  <th style={{ textAlign: 'right' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="font-bold" style={{ whiteSpace: 'nowrap' }}>{booking.id}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{booking.customer}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{booking.email}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{booking.tour}</div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <button onClick={() => setSelectedBooking(booking)} style={{ background: 'none', color: 'var(--primary-color)', padding: '4px 8px', borderRadius: '4px' }}>
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column' }}>
          <div className="d-flex justify-content-between align-items-center mb-4" style={{ flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0, whiteSpace: 'nowrap' }}>{t('popularTours')}</h3>
            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-color)', padding: '4px', borderRadius: 'var(--radius-full)' }}>
              {['day', 'month', 'year'].map(f => (
                <button
                  key={f}
                  onClick={() => setPopularFilter(f)}
                  style={{
                    border: 'none',
                    background: popularFilter === f ? 'var(--text-dark)' : 'transparent',
                    color: popularFilter === f ? '#fff' : 'var(--text-muted)',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textTransform: 'capitalize'
                  }}
                >
                  {f === 'day' ? 'Día' : f === 'month' ? 'Mes' : 'Año'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ width: '100%', height: '300px', display: 'flex', flexDirection: 'column' }}>
            {popularTours.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>
                {popularFilter === 'day' ? 'No hay reservas registradas para el día de hoy.' :
                 popularFilter === 'month' ? 'No hay reservas registradas para este mes.' :
                 'No hay reservas registradas para este año.'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popularTours} margin={{ top: 30, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis 
                    dataKey="name" 
                    tickFormatter={(name) => name.split(/[\s:-]+/).filter(w => w.length > 0).map(w => w[0].toUpperCase()).join('')} 
                    tick={{ fontSize: 11, fill: 'var(--text-dark)', fontWeight: 'bold' }} 
                    axisLine={{ stroke: 'var(--border-color)' }} 
                    tickLine={false} 
                    interval={0} 
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-light)' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(14,165,233,0.05)' }} 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-sm)', backgroundColor: 'var(--card-bg)', color: 'var(--text-dark)' }} 
                    formatter={(value) => [value, 'Reserva']}
                  />
                  <Bar dataKey="salesCount" fill="#8bbcf1" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {selectedBooking && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px', backgroundColor: '#1e293b', color: '#f8fafc', padding: '2rem' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Detalle de Reserva {selectedBooking.id}</h3>
              <button onClick={() => setSelectedBooking(null)} style={{ background: 'none', color: '#94a3b8', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px' }}>Cliente</div>
                <div className="d-flex align-items-center gap-2" style={{ fontWeight: 500 }}><User size={16} /> {selectedBooking.customer}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px' }}>Correo Electrónico</div>
                <div style={{ fontWeight: 700 }}>{selectedBooking.email}</div>
              </div>
              
              <div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px' }}>Teléfono</div>
                <div style={{ fontWeight: 700 }}>{selectedBooking.phone}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px' }}>Tour</div>
                <div className="d-flex align-items-center gap-2" style={{ fontWeight: 500 }}><MapPin size={16} /> {selectedBooking.tour}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px' }}>Fecha</div>
                <div className="d-flex align-items-center gap-2" style={{ fontWeight: 500 }}><Calendar size={16} /> {selectedBooking.date}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px' }}>Personas</div>
                <div className="d-flex align-items-center gap-2" style={{ fontWeight: 500 }}><Users size={16} /> {selectedBooking.pax}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px' }}>Estado</div>
                <span className={`badge badge-${statusBadgeMap[selectedBooking.status]}`} style={{ padding: '4px 12px', fontSize: '0.75rem', textTransform: 'uppercase' }}>{t(selectedBooking.status)}</span>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px' }}>Monto total</div>
                <div className="d-flex align-items-center gap-1" style={{ fontWeight: 700, fontSize: '1.1rem' }}>{selectedBooking.amount}</div>
              </div>

              {selectedBooking.notes && (
                <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px' }}>Notas</div>
                  <div style={{ backgroundColor: '#0f172a', padding: '15px', borderRadius: '8px', fontSize: '0.95rem' }}>
                    {selectedBooking.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;
