export const seedMockData = () => {
  // Solo seeder si no existe la version de seed v5
  if (localStorage.getItem('jhoraji_seed_v5')) return;

  const users = [
    { name: 'Administrador General', role: 'Administrador' },
    { name: 'Margarita Torres', role: 'Operador de Reservas' }
  ];

  // Randomizer helper
  const rUser = () => users[Math.floor(Math.random() * users.length)];
  const rnd = (max) => Math.floor(Math.random() * max);

  const bookings = [
    {
      id: Date.now() + 1,
      type: 'ACTIVIDAD',
      date: '2026-06-15',
      time: '08:00',
      provider: 'Excursiones Marítimas SA',
      tour: 'Isla Saona Vip',
      customer: 'John Doe',
      hotel: 'Hard Rock Hotel',
      phone: '+1 555-0101',
      language: 'Inglés',
      pax: 2,
      children: 0,
      units: 1,
      providerCost: 40,
      clientPrice: 75,
      platform: 'Expedia',
      platformPercent: 15,
      agency: 'Sin agencia',
      paymentDone: true,
      notes: 'Llevar silla de ruedas',
      status: 'confirmed',
      amount: '$150.00',
      email: 'john@example.com',
      driver: 'Pedro Pérez',
      pickupLocation: 'Lobby',
      dropoffLocation: 'Lobby',
      flightNumber: '',
      isRoundTrip: false,
      createdBy: 'Margarita Torres',
      timestamp: '2026-06-08T10:30:00Z'
    },
    {
      id: Date.now() + 2,
      type: 'TRASLADO',
      date: '2026-06-16',
      time: '14:30',
      provider: 'Transportes VIP',
      tour: 'Traslado PUJ - Hotel',
      customer: 'Maria Garcia',
      hotel: 'Meliá Caribe',
      phone: '+1 555-0202',
      language: 'Español',
      pax: 4,
      children: 2,
      units: 1,
      providerCost: 30,
      clientPrice: 50,
      platform: 'Directo / sin plataforma',
      platformPercent: 0,
      agency: 'Agencia Local',
      paymentDone: false,
      notes: 'Pagar al chofer',
      status: 'pending',
      amount: '$50.00',
      email: 'maria@example.com',
      driver: 'Luis Gómez',
      pickupLocation: 'Aeropuerto PUJ',
      dropoffLocation: 'Meliá Caribe',
      flightNumber: 'AA1234',
      isRoundTrip: true,
      createdBy: 'Administrador General',
      timestamp: '2026-06-09T09:15:00Z'
    }
  ];

  const tours = [
    { id: 1, title: 'Isla Saona Vip', location: 'Bayahibe', duration: 'Día Completo', price: 75, category: 'Aventura', createdBy: 'Administrador General', rating: 4.8, active: true, image: 'images/tour_saona.png' },
    { id: 2, title: 'Safari Buggies', location: 'Macao', duration: 'Medio Día', price: 45, category: 'Aventura', createdBy: 'Margarita Torres', rating: 4.5, active: true, image: 'images/tour_buggies.png' },
    { id: 3, title: 'City Tour Santo Domingo', location: 'Santo Domingo', duration: 'Día Completo', price: 85, category: 'Cultura', createdBy: 'Administrador General', rating: 4.9, active: true, image: 'images/tour_city.png' }
  ];

  const customers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+1 555-0101', country: 'USA', bookings: 1, totalSpent: 150, createdBy: 'Margarita Torres' },
    { id: 2, name: 'Maria Garcia', email: 'maria@example.com', phone: '+1 555-0202', country: 'España', bookings: 3, totalSpent: 210, createdBy: 'Administrador General' }
  ];

  const drivers = [
    { id: 1, name: 'Pedro Pérez', phone: '809-555-0001', vehicle: 'Hyundai H1', plate: 'I000001', status: 'Activo', type: 'Interno', createdBy: 'Administrador General' },
    { id: 2, name: 'Luis Gómez', phone: '829-555-0002', vehicle: 'Chevrolet Express', plate: 'I000002', status: 'Activo', type: 'Tercero', createdBy: 'Administrador General' }
  ];

  const agencies = [
    { id: 1, name: 'Expedia', contact: 'Soporte B2B', phone: '1-800-EXPEDIA', email: 'b2b@expedia.com', commission: 15, status: 'Activo', createdBy: 'Margarita Torres' },
    { id: 2, name: 'Agencia Local', contact: 'Juan Pérez', phone: '809-555-7777', email: 'juan@agencialocal.do', commission: 10, status: 'Activo', createdBy: 'Administrador General' }
  ];

  const providers = [
    { id: 1, name: 'Excursiones Marítimas SA', type: 'Actividades', contact: 'Carlos', phone: '829-111-2222', email: 'reservas@maritimas.com', status: 'Activo', createdBy: 'Administrador General' },
    { id: 2, name: 'Transportes VIP', type: 'Transporte', contact: 'Ana', phone: '809-333-4444', email: 'logistica@vip.com', status: 'Activo', createdBy: 'Administrador General' }
  ];

  const activities = [
    { id: 1, name: 'Isla Saona Vip', provider: 'Excursiones Marítimas SA', cost: 40, price: 75, status: 'Activo', createdBy: 'Margarita Torres' },
    { id: 2, name: 'Safari Buggies', provider: 'Excursiones Marítimas SA', cost: 25, price: 45, status: 'Activo', createdBy: 'Administrador General' }
  ];

  const expenses = [
    { id: 1, date: '2026-06-08', category: 'Combustible', amount: 50, desc: 'Gasolina Hyundai H1', createdBy: 'Administrador General' },
    { id: 2, date: '2026-06-09', category: 'Mantenimiento', amount: 120, desc: 'Cambio de aceite Chevrolet', createdBy: 'Margarita Torres' }
  ];

  const provLiq = [
    { id: 1, date: '2026-06-15', provider: 'Excursiones Marítimas SA', client: 'John Doe', costBase: 40, extras: 0, costTotal: 40, priceClient: 75, ota: 11.25, profit: 23.75, status: 'Pendiente', createdBy: 'Margarita Torres' }
  ];

  const driverLiq = [
    { id: 1, date: '2026-06-16', driver: 'Luis Gómez', client: 'Maria Garcia', service: 'Traslado PUJ - Hotel', adults: 4, children: 2, amount: 30, status: 'Pendiente', createdBy: 'Administrador General' }
  ];

  const orders = [
    { id: 1001, date: '2026-06-08', client: 'John Doe', items: 'Isla Saona Vip (x2)', total: 150, status: 'Pagado', method: 'Tarjeta', createdBy: 'Margarita Torres' },
    { id: 1002, date: '2026-06-09', client: 'Maria Garcia', items: 'Traslado PUJ (x1)', total: 50, status: 'Pendiente', method: 'Efectivo', createdBy: 'Administrador General' }
  ];

  const audit = [
    { id: 1, module: 'Sistema', action: 'Inicialización de Base de Datos', detail: 'Se cargaron los datos de prueba iniciales', user: 'Sistema', timestamp: new Date().toISOString() },
    { id: 2, module: 'Reservas', action: 'Crear', detail: 'Reserva para John Doe creada', user: 'Margarita Torres', timestamp: '2026-06-08T10:30:00Z' },
    { id: 3, module: 'Reservas', action: 'Crear', detail: 'Reserva para Maria Garcia creada', user: 'Administrador General', timestamp: '2026-06-09T09:15:00Z' }
  ];

  localStorage.setItem('jhoraji_bookings', JSON.stringify(bookings));
  localStorage.setItem('jhoraji_tours', JSON.stringify(tours));
  localStorage.setItem('jhoraji_customers', JSON.stringify(customers));
  localStorage.setItem('jhoraji_drivers', JSON.stringify(drivers));
  localStorage.setItem('jhoraji_agencies', JSON.stringify(agencies));
  localStorage.setItem('jhoraji_providers', JSON.stringify(providers));
  localStorage.setItem('jhoraji_activities', JSON.stringify(activities));
  localStorage.setItem('jhoraji_expenses', JSON.stringify(expenses));
  localStorage.setItem('jhoraji_prov_liq', JSON.stringify(provLiq));
  localStorage.setItem('jhoraji_driver_liq', JSON.stringify(driverLiq));
  localStorage.setItem('jhoraji_orders', JSON.stringify(orders));
  localStorage.setItem('jhoraji_audit', JSON.stringify(audit));

  localStorage.setItem('jhoraji_seed_v5', 'true');
};
