import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import { PermissionsProvider } from './context/PermissionsContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { CurrencyProvider } from './context/CurrencyContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import BookingsPage from './pages/BookingsPage';

import CustomersPage from './pages/CustomersPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UsersPage';
import DriversPage from './pages/DriversPage';
import ProvidersPage from './pages/ProvidersPage';
import ActivitiesPage from './pages/ActivitiesPage';
import AuditPage from './pages/AuditPage';
import SchedulePage from './pages/SchedulePage';
import AgenciesPage from './pages/AgenciesPage';
import OrdersPage from './pages/OrdersPage';

import FinancesPage from './pages/FinancesPage';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <PermissionsProvider>
          <NotificationsProvider>
            <CurrencyProvider>
              <ToastProvider>
                <HashRouter>
                  <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/" element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardHome />} />
                    <Route path="bookings" element={<BookingsPage />} />

                    <Route path="customers" element={<CustomersPage />} />
                    <Route path="users" element={<UsersPage />} />
                    <Route path="drivers" element={<DriversPage />} />
                    <Route path="providers" element={<ProvidersPage />} />
                    <Route path="activities" element={<ActivitiesPage />} />
                    <Route path="agencies" element={<AgenciesPage />} />
                    <Route path="orders" element={<OrdersPage />} />

                    <Route path="finances" element={<FinancesPage />} />
                    <Route path="audit" element={<AuditPage />} />
                    <Route path="schedule" element={<SchedulePage />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>
                  {/* Catch-all: any unknown route redirects to login */}
                  <Route path="*" element={<Navigate to="/login" replace />} />
                  </Routes>
                </HashRouter>
              </ToastProvider>
            </CurrencyProvider>
          </NotificationsProvider>
        </PermissionsProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;

