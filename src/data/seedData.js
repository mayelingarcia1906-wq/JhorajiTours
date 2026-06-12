export const seedMockData = () => {
  // Solo seeder si no existe la version de seed v9
  if (localStorage.getItem('jhoraji_seed_v9')) return;

  // ─── TOURS ────────────────────────────────────────────────────────────
  // ToursPage expects: id, title, category (island|adventure|culture|nature),
  // price (string "$X.00"), priceChild (string), duration (halfDay|fullDay),
  // rating (string), description, includes, image (URL), active (bool)
  const tours = [
    { id: 1, title: 'Isla Saona Vip', category: 'island', price: '$75.00', priceChild: '$45.00', duration: 'fullDay', rating: '4.8', description: 'Excursión exclusiva a Isla Saona con catamarán privado, barra libre y almuerzo buffet en la playa. Incluye snorkeling en piscina natural.', includes: 'Transporte, catamarán, almuerzo, bebidas, snorkel', image: 'https://images.unsplash.com/photo-1596484552834-3a58f831d36a?w=500', active: true },
    { id: 2, title: 'Safari Buggies', category: 'adventure', price: '$45.00', priceChild: '$30.00', duration: 'halfDay', rating: '4.5', description: 'Aventura en buggies 4x4 por los campos de Macao. Visita a una plantación de cacao, cenote natural y playa de Macao.', includes: 'Buggy doble, guía, bebidas, seguro', image: 'https://images.unsplash.com/photo-1533669955142-6a73332af4db?w=500', active: true },
    { id: 3, title: 'City Tour Santo Domingo', category: 'culture', price: '$85.00', priceChild: '$50.00', duration: 'fullDay', rating: '4.9', description: 'Recorrido completo por la Zona Colonial, primera ciudad del Nuevo Mundo. Incluye Alcázar de Colón, Catedral Primada y Calle Las Damas.', includes: 'Transporte, guía certificado, almuerzo, entradas', image: 'https://images.unsplash.com/photo-1580237072617-771c3ecc4a24?w=500', active: true },
    { id: 4, title: 'Buceo Isla Catalina', category: 'adventure', price: '$110.00', priceChild: '$70.00', duration: 'fullDay', rating: '4.7', description: 'Inmersión de buceo en los arrecifes de Isla Catalina con instructores PADI certificados. Ideal para principiantes y avanzados.', includes: 'Equipo completo, instructor, almuerzo, transporte', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500', active: true },
    { id: 5, title: 'Coco Bongo', category: 'adventure', price: '$80.00', priceChild: '$0.00', duration: 'halfDay', rating: '4.6', description: 'Show nocturno espectacular con acróbatas, DJ, confeti y barra libre. La mejor vida nocturna de Punta Cana.', includes: 'Entrada VIP, barra libre premium, show completo', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500', active: true },
    { id: 6, title: 'Paseo a Caballo', category: 'nature', price: '$55.00', priceChild: '$35.00', duration: 'halfDay', rating: '4.4', description: 'Cabalgata por senderos tropicales hasta llegar a una playa virgen. Incluye tiempo libre para baño y fotos.', includes: 'Caballo, guía, refrigerio, seguro', image: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=500', active: true },
    { id: 7, title: 'Scape Park', category: 'adventure', price: '$129.00', priceChild: '$80.00', duration: 'fullDay', rating: '4.8', description: 'Parque de aventuras en Cap Cana con tirolesas, cenotes, cueva Iguabonita y circuito de cuerdas. Experiencia de adrenalina total.', includes: 'Todas las atracciones, almuerzo, transporte, guía', image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=500', active: true },
    { id: 8, title: 'Avistaje de Ballenas', category: 'nature', price: '$150.00', priceChild: '$90.00', duration: 'fullDay', rating: '4.9', description: 'Temporada Enero-Marzo. Observación de ballenas jorobadas en la Bahía de Samaná desde embarcaciones seguras con guías expertos.', includes: 'Transporte, embarcación, almuerzo, guía naturalista', image: 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=500', active: false }
  ];

  // ─── CUSTOMERS ────────────────────────────────────────────────────────
  // CustomersPage expects: id, name, email, phone, country (matching select options),
  // status (new|active|vip), totalBookings (number), totalSpent (string "$X.00"), lastVisit (date string)
  const customers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+1 555-0101', country: 'United States', status: 'active', totalBookings: 2, totalSpent: '$150.00', lastVisit: '2026-06-15' },
    { id: 2, name: 'Maria Garcia', email: 'maria@example.com', phone: '+34 655-0202', country: 'España', status: 'active', totalBookings: 3, totalSpent: '$210.00', lastVisit: '2026-06-16' },
    { id: 3, name: 'Jean Dupont', email: 'jean@example.fr', phone: '+33 612-3456', country: 'Francia', status: 'new', totalBookings: 1, totalSpent: '$110.00', lastVisit: '2026-06-20' },
    { id: 4, name: 'Ana Silva', email: 'ana@example.com.br', phone: '+55 11 98765', country: 'Brasil', status: 'vip', totalBookings: 4, totalSpent: '$320.00', lastVisit: '2026-06-22' },
    { id: 5, name: 'Laura Martinez', email: 'laura@example.co', phone: '+57 300-1234', country: 'Colombia', status: 'active', totalBookings: 2, totalSpent: '$110.00', lastVisit: '2026-06-10' },
    { id: 6, name: 'Mike Johnson', email: 'mike@example.ca', phone: '+1 416-555-99', country: 'Canada', status: 'new', totalBookings: 1, totalSpent: '$129.00', lastVisit: '2026-06-05' },
    { id: 7, name: 'Luigi Rossi', email: 'luigi@example.it', phone: '+39 333-4444', country: 'Italia', status: 'vip', totalBookings: 5, totalSpent: '$450.00', lastVisit: '2026-06-25' },
    { id: 8, name: 'Chen Wei', email: 'chen@example.cn', phone: '+86 139-8888', country: 'República Dominicana', status: 'new', totalBookings: 1, totalSpent: '$45.00', lastVisit: '2026-06-28' },
    { id: 9, name: 'Sophie Martin', email: 'sophie@example.fr', phone: '+33 699-8877', country: 'Francia', status: 'active', totalBookings: 2, totalSpent: '$160.00', lastVisit: '2026-06-08' },
    { id: 10, name: 'David Smith', email: 'david@example.co.uk', phone: '+44 770-1111', country: 'Reino Unido', status: 'active', totalBookings: 3, totalSpent: '$280.00', lastVisit: '2026-06-18' }
  ];

  // ─── DRIVERS ──────────────────────────────────────────────────────────
  // DriversPage expects: id, name, whatsapp, vehicle, active (boolean)
  const drivers = [
    { id: 1, name: 'Pedro Pérez', whatsapp: '809-555-0001', vehicle: 'Hyundai H1', active: true },
    { id: 2, name: 'Luis Gómez', whatsapp: '829-555-0002', vehicle: 'Chevrolet Express', active: true },
    { id: 3, name: 'Miguel Rodriguez', whatsapp: '809-555-0003', vehicle: 'Toyota Hiace', active: true },
    { id: 4, name: 'Jose Almonte', whatsapp: '829-555-0004', vehicle: 'Ford Transit', active: false },
    { id: 5, name: 'Ramon Diaz', whatsapp: '809-555-0005', vehicle: 'Mercedes Sprinter', active: true }
  ];

  // ─── AGENCIES ─────────────────────────────────────────────────────────
  // AgenciesPage expects: id, name, whatsapp
  const agencies = [
    { id: 1, name: 'Expedia', whatsapp: '1-800-397-3342' },
    { id: 2, name: 'Agencia Local RD', whatsapp: '809-555-7777' },
    { id: 3, name: 'Viator', whatsapp: '1-888-651-9785' },
    { id: 4, name: 'GetYourGuide', whatsapp: '+49 30 5683-7959' },
    { id: 5, name: 'Booking.com', whatsapp: '1-888-850-3958' },
    { id: 6, name: 'Despegar', whatsapp: '+54 11 5235-7835' },
    { id: 7, name: 'Civitatis', whatsapp: '+34 919-012-345' },
    { id: 8, name: 'TripAdvisor Local', whatsapp: '809-555-8888' },
    { id: 9, name: 'Sunwing', whatsapp: '1-877-786-9464' },
    { id: 10, name: 'Apple Vacations', whatsapp: '1-800-517-2000' },
    { id: 11, name: 'Travel Zone', whatsapp: '809-555-1100' },
    { id: 12, name: 'Turismoi PC', whatsapp: '809-555-1200' },
    { id: 13, name: 'BD Travel', whatsapp: '809-555-1300' },
    { id: 14, name: 'Caribe Tours Agency', whatsapp: '809-555-1400' },
    { id: 15, name: 'Punta Cana VIP', whatsapp: '809-555-1500' }
  ];

  // ─── PROVIDERS ────────────────────────────────────────────────────────
  // ProvidersPage expects: id, name, phone, email, notes
  const providers = [
    { id: 1, name: 'Excursiones Marítimas SA', phone: '829-111-2222', email: 'reservas@maritimas.com', notes: 'Proveedor principal de excursiones marítimas. Cuenta bancaria: BHD-León 2201-0010-2345. Contacto: Carlos.' },
    { id: 2, name: 'Transportes VIP', phone: '809-333-4444', email: 'logistica@vip.com', notes: 'Servicio de transporte terrestre. Flota propia de 8 vehículos. Contacto: Ana, Cel: 829-333-4445.' },
    { id: 3, name: 'Buceo del Caribe', phone: '809-444-5555', email: 'dive@caribe.com', notes: 'Instructores PADI certificados. Equipo propio. Contacto: Marcos. Facturan con NCF.' },
    { id: 4, name: 'Coco Bongo Punta Cana', phone: '809-666-7777', email: 'ventas@cocobongo.do', notes: 'Show nocturno. Reservas 48hrs antes. Contacto: Departamento de Ventas.' },
    { id: 5, name: 'Rancho Uvero Alto', phone: '829-888-9999', email: 'reservas@ranchouvero.com', notes: 'Paseos a caballo y actividades ecuestre. Contacto: Julio. Pago semanal los viernes.' },
    { id: 6, name: 'Scape Park SA', phone: '809-123-4567', email: 'info@scapepark.com', notes: 'Parque de aventuras en Cap Cana. Entradas al por mayor con 20% descuento. Soporte 24/7.' }
  ];

  // ─── ACTIVITIES ───────────────────────────────────────────────────────
  // ActivitiesPage reads from 'jhoraji_act' and expects:
  // id, name, providerId (number), costBase (number), chargeMode ('PAX'|'VEHICULO'),
  // active (bool), description, commissions: { getYourGuide?, viator?, civitatis?, direct? }
  const activities = [
    { id: 1, name: 'Isla Saona Vip', providerId: 1, costBase: 40, chargeMode: 'PAX', active: true, description: 'Excursión full day a Isla Saona con catamarán y almuerzo.', commissions: { getYourGuide: '27', viator: '30', civitatis: '30', direct: '0' } },
    { id: 2, name: 'Safari Buggies', providerId: 1, costBase: 25, chargeMode: 'VEHICULO', active: true, description: 'Tour en buggies por Macao con cenote y playa.', commissions: { getYourGuide: '25', viator: '28' } },
    { id: 3, name: 'Buceo Isla Catalina', providerId: 3, costBase: 60, chargeMode: 'PAX', active: true, description: 'Inmersión de buceo con instructores PADI.', commissions: { viator: '30', direct: '10' } },
    { id: 4, name: 'Coco Bongo', providerId: 4, costBase: 50, chargeMode: 'PAX', active: true, description: 'Show nocturno con barra libre premium.', commissions: { getYourGuide: '20', civitatis: '25', direct: '0' } },
    { id: 5, name: 'Paseo a Caballo', providerId: 5, costBase: 30, chargeMode: 'PAX', active: true, description: 'Cabalgata por senderos tropicales hasta la playa.', commissions: { direct: '15' } },
    { id: 6, name: 'Scape Park', providerId: 6, costBase: 80, chargeMode: 'PAX', active: true, description: 'Parque de aventuras con tirolesas y cenotes.', commissions: { getYourGuide: '22', viator: '25', civitatis: '25' } }
  ];

  // ─── BOOKINGS ─────────────────────────────────────────────────────────
  // BookingsPage expects status values: 'paid', 'pending', 'canceled'
  // Also uses: id, type, date, time, provider, tour, customer, hotel, phone, language,
  // pax, children, units, providerCost, clientPrice, platform, platformPercent,
  // agency, paymentDone, notes, status, amount, email, driver,
  // pickupLocation, dropoffLocation, flightNumber, isRoundTrip
  const bookings = [
    {
      id: '#RES-001', type: 'ACTIVIDAD', date: '2026-06-15', time: '08:00',
      provider: 'Excursiones Marítimas SA', tour: 'Isla Saona Vip', customer: 'John Doe',
      hotel: 'Hard Rock Hotel', phone: '+1 555-0101', language: 'Inglés',
      pax: 2, children: 0, units: 1, providerCost: 40, clientPrice: 75,
      platform: 'Directo / sin plataforma', platformPercent: 0, agency: 'Expedia',
      paymentDone: true, notes: 'Llevar silla de ruedas', status: 'paid',
      amount: '$150.00', email: 'john@example.com', driver: '', extras: 15,
      pickupLocation: 'Lobby', dropoffLocation: 'Lobby', flightNumber: '',
      isRoundTrip: false, createdBy: 'Margarita Torres', timestamp: '2026-06-08T10:30:00Z'
    },
    {
      id: '#RES-002', type: 'TRASLADO', date: '2026-06-16', time: '14:30',
      provider: 'Transportes VIP', tour: 'Traslado: Aeropuerto PUJ', customer: 'Maria Garcia',
      hotel: 'Meliá Caribe', phone: '+34 655-0202', language: 'Español',
      pax: 4, children: 2, units: 1, providerCost: 30, clientPrice: 50,
      platform: 'Directo / sin plataforma', platformPercent: 0, agency: 'Agencia Local RD',
      paymentDone: false, notes: 'Pagar al chofer', status: 'pending',
      amount: '$50.00', email: 'maria@example.com', driver: 'Luis Gómez', driverPayment: 15,
      pickupLocation: 'Aeropuerto PUJ', dropoffLocation: 'Meliá Caribe', flightNumber: 'AA1234',
      isRoundTrip: true, createdBy: 'Administrador General', timestamp: '2026-06-09T09:15:00Z'
    },
    {
      id: '#RES-003', type: 'ACTIVIDAD', date: '2026-06-20', time: '07:30',
      provider: 'Buceo del Caribe', tour: 'Buceo Isla Catalina', customer: 'Jean Dupont',
      hotel: 'Iberostar Bavaro', phone: '+33 612-3456', language: 'Francés',
      pax: 1, children: 0, units: 1, providerCost: 60, clientPrice: 110,
      platform: 'Viator', platformPercent: 20, agency: 'Viator',
      paymentDone: true, notes: 'Certificación PADI avanzada', status: 'paid',
      amount: '$110.00', email: 'jean@example.fr', driver: '',
      pickupLocation: 'Entrada principal', dropoffLocation: 'Entrada principal', flightNumber: '',
      isRoundTrip: false, createdBy: 'Carlos Santos', timestamp: '2026-06-10T11:20:00Z'
    },
    {
      id: '#RES-004', type: 'ACTIVIDAD', date: '2026-06-22', time: '21:00',
      provider: 'Coco Bongo Punta Cana', tour: 'Coco Bongo', customer: 'Ana Silva',
      hotel: 'Riu Palace Macao', phone: '+55 11 98765', language: 'Portugués',
      pax: 4, children: 0, units: 1, providerCost: 50, clientPrice: 80,
      platform: 'GetYourGuide', platformPercent: 18, agency: 'GetYourGuide',
      paymentDone: true, notes: 'Cumpleaños de uno de los pax', status: 'paid',
      amount: '$320.00', email: 'ana@example.com.br', driver: '',
      pickupLocation: 'Lobby Riu', dropoffLocation: 'Lobby Riu', flightNumber: '',
      isRoundTrip: false, createdBy: 'Margarita Torres', timestamp: '2026-06-11T14:45:00Z'
    },
    {
      id: '#RES-005', type: 'ACTIVIDAD', date: '2026-06-25', time: '09:00',
      provider: 'Scape Park SA', tour: 'Scape Park', customer: 'Luigi Rossi',
      hotel: 'Secrets Royal Beach', phone: '+39 333-4444', language: 'Español',
      pax: 2, children: 2, units: 1, providerCost: 80, clientPrice: 129,
      platform: 'Directo / sin plataforma', platformPercent: 0, agency: 'Despegar',
      paymentDone: false, notes: 'Cobrar en destino', status: 'pending',
      amount: '$516.00', email: 'luigi@example.it', driver: '',
      pickupLocation: 'Recepción', dropoffLocation: 'Recepción', flightNumber: '',
      isRoundTrip: false, createdBy: 'Administrador General', timestamp: '2026-06-12T08:10:00Z'
    },
    {
      id: '#RES-006', type: 'ACTIVIDAD', date: '2026-06-10', time: '08:30',
      provider: 'Rancho Uvero Alto', tour: 'Paseo a Caballo', customer: 'Laura Martinez',
      hotel: 'Breathless Punta Cana', phone: '+57 300-1234', language: 'Español',
      pax: 2, children: 0, units: 1, providerCost: 30, clientPrice: 55,
      platform: 'Directo / sin plataforma', platformPercent: 0, agency: 'Sin agencia',
      paymentDone: true, notes: '', status: 'paid',
      amount: '$110.00', email: 'laura@example.co', driver: '',
      pickupLocation: 'Lobby', dropoffLocation: 'Lobby', flightNumber: '',
      isRoundTrip: false, createdBy: 'Carlos Santos', timestamp: '2026-06-05T16:00:00Z'
    },
    {
      id: '#RES-007', type: 'TRASLADO', date: '2026-06-28', time: '11:00',
      provider: 'Transportes VIP', tour: 'Traslado: Majestic Elegance', customer: 'Chen Wei',
      hotel: 'Majestic Elegance', phone: '+86 139-8888', language: 'Inglés',
      pax: 1, children: 0, units: 1, providerCost: 25, clientPrice: 45,
      platform: 'Directo / sin plataforma', platformPercent: 0, agency: 'Booking.com',
      paymentDone: true, notes: '', status: 'paid',
      amount: '$45.00', email: 'chen@example.cn', driver: 'Luis Gómez', driverPayment: 12,
      pickupLocation: 'Majestic Elegance', dropoffLocation: 'Aeropuerto PUJ', flightNumber: 'AF500',
      isRoundTrip: false, createdBy: 'Administrador General', timestamp: '2026-06-12T09:30:00Z'
    },
    {
      id: '#RES-008', type: 'ACTIVIDAD', date: '2026-06-18', time: '07:00',
      provider: 'Excursiones Marítimas SA', tour: 'Isla Saona Vip', customer: 'David Smith',
      hotel: 'Bavaro Princess', phone: '+44 770-1111', language: 'Inglés',
      pax: 2, children: 1, units: 1, providerCost: 40, clientPrice: 75,
      platform: 'Viator', platformPercent: 20, agency: 'Viator',
      paymentDone: false, notes: 'Menú vegetariano para 1 pax', status: 'canceled',
      amount: '$225.00', email: 'david@example.co.uk', driver: '',
      pickupLocation: 'Lobby Principal', dropoffLocation: 'Lobby Principal', flightNumber: '',
      isRoundTrip: false, createdBy: 'Margarita Torres', timestamp: '2026-06-07T12:00:00Z'
    },
    {
      id: '#RES-009', type: 'TRASLADO', date: '2026-06-14', time: '16:00',
      provider: 'Transportes VIP', tour: 'Traslado: Hard Rock Hotel', customer: 'Sophie Martin',
      hotel: 'Hard Rock Hotel', phone: '+33 699-8877', language: 'Francés',
      pax: 2, children: 0, units: 1, providerCost: 35, clientPrice: 60,
      platform: 'Directo / sin plataforma', platformPercent: 0, agency: 'Sin agencia',
      paymentDone: true, notes: 'Recogida en Terminal B', status: 'paid',
      amount: '$60.00', email: 'sophie@example.fr', driver: 'Pedro Pérez', driverPayment: 20,
      pickupLocation: 'Aeropuerto PUJ Terminal B', dropoffLocation: 'Hard Rock Hotel', flightNumber: 'AF230',
      isRoundTrip: true, returnDate: '2026-06-21', returnTime: '10:00',
      createdBy: 'Carlos Santos', timestamp: '2026-06-06T14:00:00Z'
    },
    {
      id: '#RES-010', type: 'ACTIVIDAD', date: '2026-06-12', time: '08:00',
      provider: 'Excursiones Marítimas SA', tour: 'Safari Buggies', customer: 'Mike Johnson',
      hotel: 'Barceló Bávaro Palace', phone: '+1 416-555-99', language: 'Inglés',
      pax: 2, children: 0, units: 1, providerCost: 25, clientPrice: 45,
      platform: 'Civitatis', platformPercent: 30, agency: 'Civitatis',
      paymentDone: true, notes: '', status: 'paid',
      amount: '$90.00', email: 'mike@example.ca', driver: '',
      pickupLocation: 'Lobby', dropoffLocation: 'Lobby', flightNumber: '',
      isRoundTrip: false, createdBy: 'Administrador General', timestamp: '2026-06-04T09:00:00Z'
    }
  ];

  // ─── ORDERS ───────────────────────────────────────────────────────────
  // OrdersPage expects: id, bookingId, date, time, type, client, route, service,
  // adults, children, providerPrice (string "US$ X.00"), provider (id), driver (id), paymentDone
  const orders = [
    { id: 'RES-001', bookingId: '#RES-001', date: '2026-06-15', time: '08:00', type: 'ACTIVIDAD', client: 'John Doe', route: 'Hard Rock Hotel', service: 'Isla Saona Vip', adults: 2, children: 0, providerPrice: 'US$ 40.00', provider: '1', driver: '', paymentDone: true },
    { id: 'RES-002', bookingId: '#RES-002', date: '2026-06-16', time: '14:30', type: 'TRASLADO', client: 'Maria Garcia', route: 'Aeropuerto PUJ - Meliá Caribe', service: 'Traslado', adults: 4, children: 2, providerPrice: 'US$ 30.00', provider: '2', driver: '2', paymentDone: false },
    { id: 'RES-003', bookingId: '#RES-003', date: '2026-06-20', time: '07:30', type: 'ACTIVIDAD', client: 'Jean Dupont', route: 'Iberostar Bavaro', service: 'Buceo Isla Catalina', adults: 1, children: 0, providerPrice: 'US$ 60.00', provider: '3', driver: '', paymentDone: true },
    { id: 'RES-004', bookingId: '#RES-004', date: '2026-06-22', time: '21:00', type: 'ACTIVIDAD', client: 'Ana Silva', route: 'Riu Palace Macao', service: 'Coco Bongo', adults: 4, children: 0, providerPrice: 'US$ 50.00', provider: '4', driver: '', paymentDone: true },
    { id: 'RES-005', bookingId: '#RES-005', date: '2026-06-25', time: '09:00', type: 'ACTIVIDAD', client: 'Luigi Rossi', route: 'Secrets Royal Beach', service: 'Scape Park', adults: 2, children: 2, providerPrice: 'US$ 80.00', provider: '6', driver: '', paymentDone: false },
    { id: 'RES-006', bookingId: '#RES-006', date: '2026-06-10', time: '08:30', type: 'ACTIVIDAD', client: 'Laura Martinez', route: 'Breathless Punta Cana', service: 'Paseo a Caballo', adults: 2, children: 0, providerPrice: 'US$ 30.00', provider: '5', driver: '', paymentDone: true },
    { id: 'RES-007', bookingId: '#RES-007', date: '2026-06-28', time: '11:00', type: 'TRASLADO', client: 'Chen Wei', route: 'Majestic Elegance - Aeropuerto PUJ', service: 'Traslado', adults: 1, children: 0, providerPrice: 'US$ 25.00', provider: '2', driver: '2', paymentDone: true },
    { id: 'RES-009', bookingId: '#RES-009', date: '2026-06-14', time: '16:00', type: 'TRASLADO', client: 'Sophie Martin', route: 'Aeropuerto PUJ Terminal B - Hard Rock Hotel', service: 'Traslado', adults: 2, children: 0, providerPrice: 'US$ 35.00', provider: '2', driver: '1', paymentDone: true },
    { id: 'RES-010', bookingId: '#RES-010', date: '2026-06-12', time: '08:00', type: 'ACTIVIDAD', client: 'Mike Johnson', route: 'Barceló Bávaro Palace', service: 'Safari Buggies', adults: 2, children: 0, providerPrice: 'US$ 25.00', provider: '1', driver: '', paymentDone: true }
  ];

  // ─── EXPENSES ─────────────────────────────────────────────────────────
  // FinancesPage expects: id, date, category (Gasolina|Mantenimiento|Pago Guías|Pago Nómina|Otros), desc, amount
  const expenses = [
    { id: 1, date: '2026-06-05', category: 'Gasolina', amount: 45, desc: 'Llenado tanque Hyundai H1' },
    { id: 2, date: '2026-06-05', category: 'Mantenimiento', amount: 30, desc: 'Cambio de aceite Chevrolet Express' },
    { id: 3, date: '2026-06-06', category: 'Gasolina', amount: 55, desc: 'Gasoil Toyota Hiace' },
    { id: 4, date: '2026-06-07', category: 'Pago Guías', amount: 80, desc: 'Pago guía tour Santo Domingo - semana 1' },
    { id: 5, date: '2026-06-08', category: 'Gasolina', amount: 50, desc: 'Gasolina Mercedes Sprinter' },
    { id: 6, date: '2026-06-09', category: 'Mantenimiento', amount: 120, desc: 'Revisión frenos Ford Transit' },
    { id: 7, date: '2026-06-10', category: 'Otros', amount: 35, desc: 'Papelería e impresión oficina' },
    { id: 8, date: '2026-06-11', category: 'Pago Nómina', amount: 500, desc: 'Nómina quincenal choferes internos' },
    { id: 9, date: '2026-06-12', category: 'Gasolina', amount: 60, desc: 'Gasoil Hyundai H1' },
    { id: 10, date: '2026-06-12', category: 'Otros', amount: 200, desc: 'Campaña Facebook Ads - junio' }
  ];

  // ─── AUDIT ────────────────────────────────────────────────────────────
  const audit = [
    { id: 1, module: 'Sistema', action: 'Inicialización', detail: 'Se cargaron los datos de prueba v7', user: 'Sistema', timestamp: '2026-06-01T08:00:00Z' },
    { id: 2, module: 'Reservas', action: 'Crear', detail: 'Reserva #RES-001 para John Doe', user: 'Margarita Torres', timestamp: '2026-06-08T10:30:00Z' },
    { id: 3, module: 'Reservas', action: 'Crear', detail: 'Reserva #RES-002 para Maria Garcia', user: 'Administrador General', timestamp: '2026-06-09T09:15:00Z' },
    { id: 4, module: 'Reservas', action: 'Actualizar', detail: 'Pago confirmado para Laura Martinez #RES-006', user: 'Carlos Santos', timestamp: '2026-06-06T10:00:00Z' },
    { id: 5, module: 'Finanzas', action: 'Crear Gasto', detail: 'Nómina quincenal choferes - $500.00', user: 'Administrador General', timestamp: '2026-06-11T09:00:00Z' },
    { id: 6, module: 'Reservas', action: 'Cancelar', detail: 'Reserva #RES-008 de David Smith cancelada', user: 'Margarita Torres', timestamp: '2026-06-07T12:05:00Z' },
    { id: 7, module: 'Tours', action: 'Desactivó tour', detail: 'Avistaje de Ballenas (fuera de temporada)', user: 'Administrador General', timestamp: '2026-06-02T10:00:00Z' },
    { id: 8, module: 'Proveedores', action: 'Creó proveedor', detail: 'Scape Park SA registrado', user: 'Margarita Torres', timestamp: '2026-06-03T14:30:00Z' },
    { id: 9, module: 'Agencias', action: 'Creó agencia', detail: 'Civitatis agregada al directorio', user: 'Carlos Santos', timestamp: '2026-06-04T11:20:00Z' },
    { id: 10, module: 'Actividades', action: 'Creó actividad', detail: 'Scape Park configurada con comisiones', user: 'Administrador General', timestamp: '2026-06-05T08:45:00Z' },
    { id: 11, module: 'Órdenes', action: 'Creó orden', detail: 'Orden RES-010 para Mike Johnson', user: 'Administrador General', timestamp: '2026-06-04T09:05:00Z' },
    { id: 12, module: 'Finanzas', action: 'Crear Gasto', detail: 'Facebook Ads $200.00', user: 'Administrador General', timestamp: '2026-06-12T11:00:00Z' }
  ];

  // ─── PERSIST TO LOCALSTORAGE ──────────────────────────────────────────
  localStorage.setItem('jhoraji_tours', JSON.stringify(tours));
  localStorage.setItem('jhoraji_customers', JSON.stringify(customers));
  localStorage.setItem('jhoraji_customers_list', JSON.stringify(customers));
  localStorage.setItem('jhoraji_drivers', JSON.stringify(drivers));
  localStorage.setItem('jhoraji_agencies', JSON.stringify(agencies));
  localStorage.setItem('jhoraji_providers', JSON.stringify(providers));
  localStorage.setItem('jhoraji_act', JSON.stringify(activities));       // Activities page reads from jhoraji_act
  localStorage.setItem('jhoraji_bookings', JSON.stringify(bookings));
  localStorage.setItem('jhoraji_orders', JSON.stringify(orders));
  localStorage.setItem('jhoraji_expenses', JSON.stringify(expenses));
  localStorage.setItem('jhoraji_audit', JSON.stringify(audit));

  localStorage.setItem('jhoraji_seed_v9', 'true');
};
