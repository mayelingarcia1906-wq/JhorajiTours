import { useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, User, Users, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const read = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };

const getWeekDates = (ref) => {
  const d = new Date(ref);
  const sunday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + i);
    return date;
  });
};

const fmt = (d) => d.toISOString().split('T')[0];

const SchedulePage = () => {
  const { t } = useLanguage();
  const [ref, setRef] = useState(new Date());
  const [selected, setSelected] = useState(null);
  const [bookings, setBookings] = useState(() => read('jhoraji_bookings', []));
  const [drivers] = useState(() => read('jhoraji_drivers', []));

  const weekDates = useMemo(() => getWeekDates(ref), [ref]);
  const todayKey = fmt(new Date());

  useEffect(() => {
    const sync = () => setBookings(read('jhoraji_bookings', []));
    window.addEventListener('bookings_updated', sync);
    return () => window.removeEventListener('bookings_updated', sync);
  }, []);

  const byDate = useMemo(() => {
    const map = {};
    weekDates.forEach((d) => { map[fmt(d)] = []; });
    bookings.forEach((b) => {
      if (map[b.date] !== undefined && b.status !== 'cancelado' && b.status !== 'canceled') {
        map[b.date].push(b);
      }
    });
    return map;
  }, [bookings, weekDates]);

  const allWeek = Object.values(byDate).flat();
  const totalWeek = allWeek.length;
  const paid = allWeek.filter((b) => b.status === 'pagado' || b.status === 'paid' || b.paymentDone).length;
  const pending = allWeek.filter((b) => b.status === 'pendiente' || b.status === 'pending').length;

  const monthLabel = weekDates[0].toLocaleDateString('es-DO', { month: 'long', year: 'numeric' });
  const rangeLabel = `${weekDates[0].toLocaleDateString('es-DO', { day: 'numeric', month: 'short' })} — ${weekDates[6].toLocaleDateString('es-DO', { day: 'numeric', month: 'short' })}`;

  const getDriver = (id) => drivers.find((d) => String(d.id) === String(id) || d.name === id);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{t('scheduleTitle') || 'Horario Semanal'}</h2>
          <p className="page-subtitle">{t('scheduleSubtitle') || 'Servicios asignados por semana'}</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline" onClick={() => { const d = new Date(ref); d.setDate(d.getDate() - 7); setRef(d); }}><ChevronLeft size={16} /></button>
          <button className="btn btn-outline" onClick={() => setRef(new Date())}><Calendar size={15} /> {t('today') || 'Hoy'}</button>
          <button className="btn btn-outline" onClick={() => { const d = new Date(ref); d.setDate(d.getDate() + 7); setRef(d); }}><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="stats-grid mb-4">
        <div className="stat-card tone-primary">
          <div className="stat-header">
            <span className="stat-label">Servicios esta semana</span>
            <div className="stat-icon"><Calendar size={18} /></div>
          </div>
          <div className="stat-value">{totalWeek}</div>
        </div>
        <div className="stat-card tone-success">
          <div className="stat-header">
            <span className="stat-label">Pagados</span>
            <div className="stat-icon"><Calendar size={18} /></div>
          </div>
          <div className="stat-value">{paid}</div>
        </div>
        <div className="stat-card tone-warning">
          <div className="stat-header">
            <span className="stat-label">Pendientes</span>
            <div className="stat-icon"><Calendar size={18} /></div>
          </div>
          <div className="stat-value">{pending}</div>
        </div>
        <div className="stat-card tone-info">
          <div className="stat-header">
            <span className="stat-label">{monthLabel}</span>
            <div className="stat-icon"><Clock size={18} /></div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.1rem', textTransform: 'capitalize' }}>{rangeLabel}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <div className="schedule-grid" style={{ minWidth: 720, borderRadius: 0, border: 'none' }}>
            <div className="schedule-header-cell"></div>
            {weekDates.map((d) => {
              const key = fmt(d);
              const isToday = key === todayKey;
              const count = byDate[key]?.length || 0;
              return (
                <div
                  key={key}
                  className="schedule-header-cell"
                  style={isToday ? { background: 'var(--primary-50)', color: 'var(--primary-color)', borderBottom: '3px solid var(--primary-color)' } : {}}
                >
                  <div style={{ fontSize: '0.7rem' }}>{DAYS_ES[d.getDay()]}</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: 2, color: isToday ? 'var(--primary-color)' : 'var(--text-dark)' }}>{d.getDate()}</div>
                  {count > 0 && <div style={{ fontSize: '0.65rem', color: 'var(--primary-color)', fontWeight: 700, marginTop: 2 }}>{count} serv.</div>}
                </div>
              );
            })}

            <div className="schedule-time-cell" style={{ minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', fontSize: '0.7rem', color: 'var(--text-light)', fontWeight: 700, letterSpacing: '0.1em' }}>SERVICIOS</span>
            </div>
            {weekDates.map((d) => {
              const key = fmt(d);
              const dayBookings = byDate[key] || [];
              const isToday = key === todayKey;
              return (
                <div
                  key={key}
                  className="schedule-day-cell"
                  style={isToday ? { background: 'rgba(14, 165, 233, 0.04)', minHeight: 280 } : { minHeight: 280 }}
                >
                  {dayBookings.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: '0.75rem', paddingTop: 24, opacity: 0.5 }}>—</div>
                  ) : dayBookings.map((b) => {
                    const isPaid = b.status === 'pagado' || b.status === 'paid' || b.paymentDone;
                    return (
                      <div
                        key={b.id}
                        className={`schedule-event ${isPaid ? 'paid' : 'pending'}`}
                        onClick={() => setSelected(b)}
                        title={`${b.tour} · ${b.customer}`}
                      >
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.tour}</div>
                        <div style={{ fontSize: '0.6rem', opacity: 0.85, marginTop: 1 }}>
                          {b.customer} · {b.pax} pax
                        </div>
                        {b.pickupTime && (
                          <div style={{ fontSize: '0.6rem', marginTop: 1 }}>
                            <Clock size={9} style={{ verticalAlign: 'middle' }} /> {b.pickupTime}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>{selected.tour}</h3>
              <button className="modal-close" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="d-flex align-items-center gap-2">
                <User size={16} style={{ color: 'var(--primary-color)' }} />
                <span className="font-bold">{selected.customer}</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <Users size={15} style={{ color: 'var(--text-light)' }} />
                <span>{selected.pax} personas · {selected.hotel || '—'}</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <Calendar size={15} style={{ color: 'var(--text-light)' }} />
                <span>{selected.date}</span>
                {selected.pickupTime && <><Clock size={15} style={{ color: 'var(--text-light)' }} /><span>{selected.pickupTime}</span></>}
              </div>
              {(selected.driverId || selected.driver) && (
                <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-soft)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                  <strong>Chofer:</strong> {getDriver(selected.driverId || selected.driver)?.name || selected.driver}
                </div>
              )}
              <div>
                <span className={`badge badge-${selected.status === 'pagado' || selected.status === 'paid' || selected.paymentDone ? 'success' : 'warning'}`}>
                  {selected.status || 'pendiente'}
                </span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setSelected(null)}>{t('close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulePage;
