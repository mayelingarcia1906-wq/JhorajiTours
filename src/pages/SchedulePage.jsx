import { useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, User, Users } from 'lucide-react';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const FULL_DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const readStoredData = (key, defaultData) => {
  const saved = localStorage.getItem(key);
  if (!saved) return defaultData;
  try { return JSON.parse(saved); } catch { return defaultData; }
};

const getWeekDates = (referenceDate) => {
  const d = new Date(referenceDate);
  const day = d.getDay();
  const diff = d.getDate() - day;
  const sunday = new Date(d.setDate(diff));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + i);
    return date;
  });
};

const formatDateKey = (date) => date.toISOString().split('T')[0];

const SchedulePage = () => {
  const [currentWeekRef, setCurrentWeekRef] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState(null);

  const bookings = useMemo(() => readStoredData('jhoraji_bookings', []), []);
  const drivers = useMemo(() => readStoredData('jhoraji_drivers', []), []);

  const weekDates = useMemo(() => getWeekDates(currentWeekRef), [currentWeekRef]);

  const goToPrevWeek = () => {
    const d = new Date(currentWeekRef);
    d.setDate(d.getDate() - 7);
    setCurrentWeekRef(d);
  };

  const goToNextWeek = () => {
    const d = new Date(currentWeekRef);
    d.setDate(d.getDate() + 7);
    setCurrentWeekRef(d);
  };

  const goToToday = () => setCurrentWeekRef(new Date());

  const bookingsByDate = useMemo(() => {
    const map = {};
    weekDates.forEach(d => { map[formatDateKey(d)] = []; });
    bookings.forEach(b => {
      if (map[b.date] !== undefined && b.status !== 'canceled') {
        map[b.date].push(b);
      }
    });
    return map;
  }, [bookings, weekDates]);

  const todayKey = formatDateKey(new Date());
  const monthYearLabel = weekDates[0].toLocaleDateString('es-DO', { month: 'long', year: 'numeric' });

  const getDriverName = (driverId) => {
    if (!driverId) return null;
    const d = drivers.find(dr => String(dr.id) === String(driverId));
    return d ? d.name : null;
  };

  const totalWeekBookings = Object.values(bookingsByDate).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div>
      <div className="page-header mb-4">
        <div>
          <h2>Horario Semanal</h2>
          <p className="text-muted" style={{ margin: 0 }}>Vista de servicios asignados por semana</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline" onClick={goToPrevWeek}>
            <ChevronLeft size={18} />
          </button>
          <button className="btn btn-outline" onClick={goToToday} style={{ fontWeight: 600 }}>
            <Calendar size={16} /> Hoy
          </button>
          <button className="btn btn-outline" onClick={goToNextWeek}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="d-flex gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: '140px', padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary-color)' }}>{totalWeekBookings}</div>
          <div className="text-muted" style={{ fontSize: '0.8rem' }}>Servicios esta semana</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: '140px', padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--success)' }}>
            {Object.values(bookingsByDate).flat().filter(b => b.status === 'paid').length}
          </div>
          <div className="text-muted" style={{ fontSize: '0.8rem' }}>Pagados</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: '140px', padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--warning)' }}>
            {Object.values(bookingsByDate).flat().filter(b => b.status === 'pending').length}
          </div>
          <div className="text-muted" style={{ fontSize: '0.8rem' }}>Pendientes</div>
        </div>
        <div className="card" style={{ flex: 2, minWidth: '200px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={20} color="var(--primary-color)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', textTransform: 'capitalize' }}>{monthYearLabel}</div>
            <div className="text-muted" style={{ fontSize: '0.78rem' }}>
              {weekDates[0].toLocaleDateString('es-DO', { day: 'numeric', month: 'short' })} — {weekDates[6].toLocaleDateString('es-DO', { day: 'numeric', month: 'short' })}
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: '700px' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '70px repeat(7, 1fr)', borderBottom: '2px solid var(--border-color)' }}>
              <div style={{ padding: '12px', backgroundColor: 'var(--secondary-color)', borderRight: '1px solid var(--border-color)' }}></div>
              {weekDates.map((date, i) => {
                const key = formatDateKey(date);
                const isToday = key === todayKey;
                const count = bookingsByDate[key]?.length || 0;
                return (
                  <div key={i} style={{
                    padding: '12px 8px',
                    textAlign: 'center',
                    backgroundColor: isToday ? 'rgba(14,165,233,0.08)' : 'var(--secondary-color)',
                    borderRight: i < 6 ? '1px solid var(--border-color)' : 'none',
                    borderBottom: isToday ? '3px solid var(--primary-color)' : '3px solid transparent',
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isToday ? 'var(--primary-color)' : 'var(--text-light)', textTransform: 'uppercase' }}>
                      {DAYS[date.getDay()]}
                    </div>
                    <div style={{
                      fontSize: '1.2rem', fontWeight: 700,
                      color: isToday ? 'var(--primary-color)' : 'var(--text-dark)',
                      marginTop: '2px'
                    }}>
                      {date.getDate()}
                    </div>
                    {count > 0 && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--primary-color)', fontWeight: 600, marginTop: '2px' }}>
                        {count} serv.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Body */}
            <div style={{ display: 'grid', gridTemplateColumns: '70px repeat(7, 1fr)', minHeight: '300px' }}>
              <div style={{
                backgroundColor: 'var(--secondary-color)',
                borderRight: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '10px 6px',
              }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontWeight: 600, writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}>
                  SERVICIOS
                </span>
              </div>
              {weekDates.map((date, i) => {
                const key = formatDateKey(date);
                const dayBookings = bookingsByDate[key] || [];
                const isToday = key === todayKey;
                return (
                  <div key={i} style={{
                    padding: '8px',
                    borderRight: i < 6 ? '1px solid var(--border-color)' : 'none',
                    backgroundColor: isToday ? 'rgba(14,165,233,0.03)' : 'transparent',
                    minHeight: '200px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}>
                    {dayBookings.length === 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: '0.75rem', paddingTop: '20px', opacity: 0.5 }}>—</div>
                    )}
                    {dayBookings.map(b => (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBooking(b)}
                        style={{
                          backgroundColor: b.status === 'paid' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                          borderLeft: `3px solid ${b.status === 'paid' ? 'var(--success)' : 'var(--warning)'}`,
                          borderRadius: '4px',
                          padding: '5px 7px',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <div style={{ fontWeight: 700, color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {b.tour}
                        </div>
                        <div style={{ color: 'var(--text-light)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {b.customer} · {b.pax} pax
                        </div>
                        {b.pickupTime && (
                          <div style={{ color: 'var(--primary-color)', fontWeight: 600, marginTop: '2px' }}>
                            <Clock size={10} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                            {b.pickupTime}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 style={{ margin: 0 }}>{selectedBooking.id}</h3>
              <button onClick={() => setSelectedBooking(null)} style={{ background: 'none', color: 'var(--text-light)' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>×</span>
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="d-flex align-items-center gap-2">
                <MapPin size={16} color="var(--primary-color)" />
                <span className="font-bold">{selectedBooking.tour}</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <User size={16} color="var(--text-light)" />
                <span>{selectedBooking.customer}</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <Users size={16} color="var(--text-light)" />
                <span>{selectedBooking.pax} personas · {selectedBooking.hotel}</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <Calendar size={16} color="var(--text-light)" />
                <span>{selectedBooking.date}</span>
                {selectedBooking.pickupTime && (
                  <>
                    <Clock size={16} color="var(--text-light)" />
                    <span>{selectedBooking.pickupTime}</span>
                  </>
                )}
              </div>
              {selectedBooking.driverId && (
                <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                  <strong>Chofer:</strong> {getDriverName(selectedBooking.driverId) || 'Asignado'}
                </div>
              )}
              <div>
                <span className={`badge badge-${selectedBooking.status === 'paid' ? 'success' : selectedBooking.status === 'pending' ? 'warning' : 'danger'}`}>
                  {selectedBooking.status === 'paid' ? 'Pagado' : selectedBooking.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                </span>
                <span style={{ marginLeft: '8px', fontWeight: 700, color: 'var(--primary-color)' }}>{selectedBooking.amount}</span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setSelectedBooking(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulePage;
