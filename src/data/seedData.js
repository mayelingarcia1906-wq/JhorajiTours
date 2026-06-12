import jsonData from './seedData.json';

export const seedMockData = () => {
  // Bump version to v10 to force reload of the new JSON data
  if (localStorage.getItem('jhoraji_seed_v10')) return;

  const {
    tours, customers, drivers, agencies,
    providers, activities, bookings, orders, expenses, audit
  } = jsonData;

  localStorage.setItem('jhoraji_tours', JSON.stringify(tours));
  localStorage.setItem('jhoraji_customers', JSON.stringify(customers));
  localStorage.setItem('jhoraji_customers_list', JSON.stringify(customers));
  localStorage.setItem('jhoraji_drivers', JSON.stringify(drivers));
  localStorage.setItem('jhoraji_agencies', JSON.stringify(agencies));
  localStorage.setItem('jhoraji_providers', JSON.stringify(providers));
  localStorage.setItem('jhoraji_act', JSON.stringify(activities));
  localStorage.setItem('jhoraji_bookings', JSON.stringify(bookings));
  localStorage.setItem('jhoraji_orders', JSON.stringify(orders));
  localStorage.setItem('jhoraji_expenses', JSON.stringify(expenses));
  localStorage.setItem('jhoraji_audit', JSON.stringify(audit));

  localStorage.setItem('jhoraji_seed_v10', 'true');
};
