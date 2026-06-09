import { useState, useMemo } from 'react';
import { ArrowUpRight, DollarSign, Eye, ShoppingCart, TrendingUp, Users, Download, Loader2, X, User, MapPin, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useCurrency } from '../context/CurrencyContext';

const DashboardHome = () => {
  const { addToast } = useToast();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

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
    { title: t('totalRevenue'), value: formatPrice(totalRevenue), change: '+12%', icon: <DollarSign size={24} color="var(--primary-color)" />, color: 'var(--primary-color)' },
    { title: t('todayBookings'), value: todayBookingsCount.toString(), change: '+5%', icon: <ShoppingCart size={24} color="var(--success)" />, color: 'var(--success)' },
    { title: t('newCustomers'), value: totalCustomers.toString(), change: '+18%', icon: <Users size={24} color="var(--warning)" />, color: 'var(--warning)' },
    { title: t('activeTours'), value: activeToursCount.toString(), change: '0%', icon: <TrendingUp size={24} color="var(--danger)" />, color: 'var(--danger)' },
  ];

  const recentBookings = allBookings.slice(0, 5);

  const popularTours = useMemo(() => {
    if (allBookings.length === 0) return [];
    const counts = {};
    let max = 0;
    allBookings.forEach(b => {
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
  }, [allBookings]);

  const handleDownloadReport = () => {
    setIsDownloading(true);
    // Simular el proceso de generar un reporte real
    setTimeout(() => {
      setIsDownloading(false);
      addToast('Reporte generado y descargado exitosamente', 'success');
      
      // Crear un archivo de texto de muestra para la descarga
      const textContent = `REPORTE GENERAL - JHORAJI TOURS\nFecha: ${new Date().toLocaleDateString()}\n\n-- ESTADÍSTICAS --\nIngresos Totales: ${formatPrice(totalRevenue)}\nReservas Hoy: ${todayBookingsCount}\nNuevos Clientes: ${totalCustomers}\nTours Activos: ${activeToursCount}\n\nEste es un reporte autogenerado por el sistema.`;
      const element = document.createElement("a");
      const file = new Blob([textContent], {type: 'text/plain;charset=utf-8'});
      element.href = URL.createObjectURL(file);
      element.download = `Reporte_General_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(element); // Requerido para Firefox
      element.click();
      document.body.removeChild(element);
    }, 1500);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4" style={{ flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2>{t('dashboardSummary')}</h2>
          <p className="text-muted" style={{ margin: 0, textTransform: 'capitalize' }}>
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button 
          className="btn btn-primary d-flex align-items-center gap-2" 
          onClick={handleDownloadReport}
          disabled={isDownloading}
        >
          {isDownloading ? <Loader2 size={18} className="spin" /> : <Download size={18} />}
          {isDownloading ? 'Generando Reporte...' : t('downloadReport')}
        </button>
      </div>

      <div className="stats-grid mb-4">
        {stats.map((stat) => (
          <div key={stat.title} className="card d-flex align-items-center gap-4">
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: `${stat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {stat.icon}
            </div>
            <div>
              <p className="text-muted" style={{ margin: 0 }}>{stat.title}</p>
              <h3 style={{ margin: '5px 0', fontSize: '1.5rem' }}>{stat.value}</h3>
              <div className="d-flex align-items-center gap-1" style={{ fontSize: '0.85rem', color: stat.change.startsWith('+') ? 'var(--success)' : 'var(--text-light)', fontWeight: 500 }}>
                {stat.change.startsWith('+') && <ArrowUpRight size={14} />}
                {stat.change} {t('thisMonth')}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="card">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{t('recentBookings')}</h3>
            <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => navigate('/bookings')}>{t('seeAll')}</button>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t('customer')}</th>
                  <th>{t('tour')}</th>
                  <th>Fecha</th>
                  <th>Pax</th>
                  <th>Hotel</th>
                  <th>{t('status')}</th>
                  <th>{t('amount')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="font-bold">{booking.id}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{booking.customer}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{booking.email}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{booking.tour}</div>
                    </td>
                    <td className="text-muted">{booking.date}</td>
                    <td className="text-muted">{booking.pax}</td>
                    <td className="text-muted">{booking.hotel}</td>
                    <td>
                      <span className={`badge badge-${statusBadgeMap[booking.status]}`}>
                        {t(booking.status)}
                      </span>
                    </td>
                    <td className="font-bold">{booking.amount}</td>
                    <td>
                      <button onClick={() => setSelectedBooking(booking)} style={{ background: 'none', color: 'var(--primary-color)' }}>
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.2rem', margin: '0 0 20px 0' }}>{t('popularTours')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {popularTours.map((tour) => (
              <div key={tour.name}>
                <div className="d-flex justify-content-between mb-2">
                  <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{tour.name}</span>
                  <span className="text-muted">{tour.salesCount} {t('sales')}</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{ width: tour.percent, height: '100%', backgroundColor: 'var(--primary-color)', borderRadius: 'var(--radius-full)' }} />
                </div>
              </div>
            ))}
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
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
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
