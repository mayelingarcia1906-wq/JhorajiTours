import { Navigate, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute – Prevents unauthenticated access to dashboard modules.
 *
 * How it works:
 *  - Checks if `jhoraji_user` exists in localStorage.
 *  - If NOT logged in → redirects to /login (replaces history so back-button cannot re-enter).
 *  - If logged in → renders children normally.
 */
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const user = localStorage.getItem('jhoraji_user');

  if (!user) {
    // replace: true prevents the user from pressing "back" to return to a protected page
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
