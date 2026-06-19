import { useMemo, useState } from 'react';
import {
  ArrowUpRight, Calendar, Car, CheckCircle2, ChevronRight, Clock, DollarSign,
  MapPin, Plus, TrendingUp, Users, Wallet, XCircle, AlertCircle,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useNavigate } from 'react-router-dom';

const read = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

const StatCard = ({ tone, label, value, icon: Icon, delta, deltaLabel }) => (
  <div className={`stat-card ${tone ? `tone-${tone}` : ''}`}>
    <div className="stat-header">
      <span className="stat-label">{label}</span>
      {Icon && <div className="stat-icon"><Icon size={14} /></div>}
    </div>
    <div className="stat-value">{value}</div>
    {delta && (
      <div className={`stat-delta ${delta >= 0 ? 'up' : 'down'}`}>
        <TrendingUp size={12} style={{ transform: delta < 0 ? 'rotate(180deg)' : 'none' }} />
        {delta >= 0 ? '+' : ''}{delta}% {deltaLabel}
      </div>
    )}
  </div>
);

const Section = ({ title, action, children, className = '' }) => (
  <div className={`card ${className}`}>
    <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: '0.75rem' }}>
      <h3 style={{ margin: 0, fontSize: '0.875rem' }}>{title}</h3>
      {action}
    </div>
    {children}
  </div>
);

const ActivityItem = ({ icon: Icon, tone, title, subtitle, time, action }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
    <div
      className={`stat-icon ${tone ? `tone-${tone}` : ''}`}
      style={{ width: 28, height: 28, flexShrink: 0 }}
    >
      <Icon size={13} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-dark)' }}>{title}</div>
      {subtitle && <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 1 }}>{subtitle}</div>}
    </div>
    <div style={{ textAlign: 'right', flexShrink: 0 }}>
      {action && <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{action}</div>}
      {time && <div style={{ fontSize: '0.6875rem', color: 'var(--text-faint)' }}>{time}</div>}
    </div>
  </div>
);

const DashboardHome = () => {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('week');

  const bookings = read('jhoraji_bookings', []);
  const orders = read('jhoraji_orders', []);
  const customers = read('jhoraji_customers', read('jhoraji_customers_list', []));
  const drivers = read('jhoraji_drivers', []);
  const tours = read('jhoraji_tours', []);
  const expenses = read('jhoraji_expenses', []);

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - 6);

  const inRange = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= startOfWeek && d <= today;
  };

  const periodBookings = bookings.filter((b) => inRange(b.date));
  const totalRevenue = periodBookings.reduce((s, b) => s + (parseFloat(b.clientPrice) || 0), 0);
  const pendingBookings = bookings.filter((b) => b.status === 'pendiente' || b.status === 'pending').length;
  const completedToday = orders.filter((o) => o.date === today.toISOString().split('T')[0] && o.status === 'completado').length;

  const chartData = useMemo(() => {
    const days = language === 'es'
      ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const buckets = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      buckets[key] = { day: days[d.getDay()], reservas: 0, ingresos: 0 };
    }
    bookings.forEach((b) => {
      if (buckets[b.date]) {
        buckets[b.date].reservas += 1;
        buckets[b.date].ingresos += parseFloat(b.clientPrice) || 0;
      }
    });
    return Object.values(buckets);
  }, [bookings, language]);

  const upcomingBookings = useMemo(() => {
    const todayStr = today.toISOString().split('T')[0];
    return bookings
      .filter((b) => b.date >= todayStr && (b.status === 'confirmado' || b.status === 'confirmed' || b.status === 'pendiente' || b.status === 'pending'))
      .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')))
      .slice(0, 5);
  }, [bookings]);

  const topTours = useMemo(() => {
    const counts = {};
    bookings.forEach((b) => {
      const key = b.tour || b.activity || 'Otros';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [bookings]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{t('dashboardTitle')}</h2>
          <p className="page-subtitle">
            {t('dashboardSubtitle')}
          </p>
        </div>
        <div className="d-flex gap-2">
          <div className="tabs" style={{ paddingBottom: 0 }}>
            <button className={`tab-btn ${period === 'week' ? 'active' : ''}`} onClick={() => setPeriod('week')}>
              {t('week')}
            </button>
            <button className={`tab-btn ${period === 'month' ? 'active' : ''}`} onClick={() => setPeriod('month')}>
              {t('month')}
            </button>
            <button className={`tab-btn ${period === 'year' ? 'active' : ''}`} onClick={() => setPeriod('year')}>
              {t('year')}
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/bookings')}>
            <Plus size={16} /> {t('newBooking')}
          </button>
        </div>
      </div>

      <div className="stats-grid mb-4">
        <StatCard
          tone="primary"
          label={t('totalBookings')}
          value={bookings.length.toLocaleString()}
          icon={Calendar}
          delta={12}
          deltaLabel={t('vsLastWeek')}
        />
        <StatCard
          tone="success"
          label={t('revenue')}
          value={formatPrice(totalRevenue.toFixed(2))}
          icon={DollarSign}
          delta={8}
          deltaLabel={t('vsLastWeek')}
        />
        <StatCard
          tone="warning"
          label={t('pending')}
          value={pendingBookings}
          icon={Clock}
          delta={-3}
          deltaLabel={t('vsLastWeek')}
        />
        <StatCard
          tone="info"
          label={t('completedToday')}
          value={completedToday}
          icon={CheckCircle2}
          delta={5}
          deltaLabel={t('vsYesterday')}
        />
      </div>

      <div className="dashboard-grid-2 mb-4">
        <Section
          title={t('bookingsThisWeek')}
          action={
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/bookings')}>
              {t('viewAll')} <ChevronRight size={14} />
            </button>
          }
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1} />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--text-faint)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-faint)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  fontSize: '0.82rem',
                }}
                cursor={{ fill: 'var(--bg-soft)' }}
              />
              <Bar dataKey="reservas" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>

        <Section title={t('topTours')}>
          {topTours.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-faint)', fontSize: '0.88rem' }}>
              {t('noDataYet')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {topTours.map((tour, i) => {
                const pct = (tour.count / topTours[0].count) * 100;
                return (
                  <div key={tour.name} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <span
                      style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: 'var(--primary-50)', color: 'var(--primary-color)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.6875rem', fontWeight: 600, flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {tour.name}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', flexShrink: 0, marginLeft: 6 }}>
                          {tour.count}
                        </span>
                      </div>
                      <div style={{ height: 5, background: 'var(--bg-soft)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary-color), var(--primary-hover))', borderRadius: 999 }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      <div className="dashboard-grid-2 mb-4">
        <Section
          title={t('upcomingBookings')}
          action={
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/bookings')}>
              {t('viewAll')} <ChevronRight size={14} />
            </button>
          }
        >
          {upcomingBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-faint)', fontSize: '0.88rem' }}>
              {t('noUpcomingBookings')}
            </div>
          ) : (
            upcomingBookings.map((b) => (
              <ActivityItem
                key={b.id}
                icon={b.type === 'TRASLADO' ? Car : MapPin}
                tone="info"
                title={b.customer || b.tour || 'Reserva'}
                subtitle={`${b.date} ${b.time || ''} · ${b.pax || 1} pax`}
                action={formatPrice(b.clientPrice)}
                time={b.time}
              />
            ))
          )}
        </Section>

        <Section title={t('operationalHealth')}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="d-flex justify-content-between align-items-center" style={{ padding: '0.4375rem 0.625rem', background: 'var(--bg-soft)', borderRadius: 'var(--radius-md)' }}>
              <div className="d-flex align-items-center gap-2">
                <div className="stat-icon tone-success" style={{ width: 26, height: 26 }}>
                  <CheckCircle2 size={14} />
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 400 }}>{t('customers')}</span>
              </div>
              <span className="badge badge-primary">{customers.length}</span>
            </div>

            <div className="d-flex justify-content-between align-items-center" style={{ padding: '0.4375rem 0.625rem', background: 'var(--bg-soft)', borderRadius: 'var(--radius-md)' }}>
              <div className="d-flex align-items-center gap-2">
                <div className="stat-icon tone-info" style={{ width: 26, height: 26 }}>
                  <Car size={14} />
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 400 }}>{t('moduleDrivers')}</span>
              </div>
              <span className="badge badge-primary">{drivers.length}</span>
            </div>

            <div className="d-flex justify-content-between align-items-center" style={{ padding: '0.4375rem 0.625rem', background: 'var(--bg-soft)', borderRadius: 'var(--radius-md)' }}>
              <div className="d-flex align-items-center gap-2">
                <div className="stat-icon tone-primary" style={{ width: 26, height: 26 }}>
                  <MapPin size={14} />
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 400 }}>{t('tours')}</span>
              </div>
              <span className="badge badge-primary">{tours.length}</span>
            </div>

            <div className="d-flex justify-content-between align-items-center" style={{ padding: '0.4375rem 0.625rem', background: 'var(--bg-soft)', borderRadius: 'var(--radius-md)' }}>
              <div className="d-flex align-items-center gap-2">
                <div className="stat-icon tone-warning" style={{ width: 26, height: 26 }}>
                  <Wallet size={14} />
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 400 }}>{t('periodExpenses')}</span>
              </div>
              <span className="badge badge-warning">{formatPrice(expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0).toFixed(2))}</span>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
};

export default DashboardHome;
