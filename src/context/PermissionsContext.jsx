import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PermissionsContext = createContext();

export const usePermissions = () => useContext(PermissionsContext);

const defaultPermissions = {
  'Operador de Reservas': {
    modules: {
      dashboard: true,
      bookings: true,
      tours: false,
      customers: true,
      finances: false,
      drivers: false,
      providers: false,
      agencies: false,
      activities: false,
      schedule: true,
      users: false,
      audit: false,
      orders: false,
      settings: false,
    },
    actions: {
      create: true,
      edit: true,
      delete: false,
    },
  }
};

export const PermissionsProvider = ({ children }) => {
  const [permissions, setPermissions] = useState(() => {
    const saved = localStorage.getItem('jhoraji_permissions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed['Operador de Reservas'] && parsed['Operador de Reservas'].modules) {
          const finalPerms = {};
          Object.keys(defaultPermissions).forEach(role => {
            finalPerms[role] = parsed[role] || defaultPermissions[role];
            finalPerms[role].modules = { ...defaultPermissions[role].modules, ...(finalPerms[role].modules || {}) };
            finalPerms[role].actions = { ...defaultPermissions[role].actions, ...(finalPerms[role].actions || {}) };
          });
          return finalPerms;
        }
      } catch (e) {
        console.error('Error parsing permissions from localStorage', e);
      }
    }
    return defaultPermissions;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('jhoraji_user');
    return savedUser ? JSON.parse(savedUser) : { role: 'Admin' };
  });

  useEffect(() => {
    // Escuchar cambios de usuario si otro componente actualiza jhoraji_user
    const handleStorageChange = (e) => {
      if (e.key === 'jhoraji_user') {
        setCurrentUser(e.newValue ? JSON.parse(e.newValue) : { role: 'Admin' });
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updatePermissions = useCallback((role, category, item, value) => {
    setPermissions(prev => {
      const nextPerms = {
        ...prev,
        [role]: {
          ...prev[role],
          [category]: { ...prev[role][category], [item]: value }
        }
      };
      localStorage.setItem('jhoraji_permissions', JSON.stringify(nextPerms));
      return nextPerms;
    });
  }, []);

  const isAdmin = currentUser.role === 'Administrador' || currentUser.role === 'Admin';

  const canAccessModule = useCallback((moduleName) => {
    if (isAdmin) return true;
    const rolePerms = permissions[currentUser.role];
    if (!rolePerms || !rolePerms.modules) return false;
    return rolePerms.modules[moduleName] === true;
  }, [isAdmin, permissions, currentUser.role]);

  const canPerformAction = useCallback((actionName) => {
    if (isAdmin) return true;
    const rolePerms = permissions[currentUser.role];
    if (!rolePerms || !rolePerms.actions) return false;
    return rolePerms.actions[actionName] === true;
  }, [isAdmin, permissions, currentUser.role]);

  return (
    <PermissionsContext.Provider value={{
      permissions,
      updatePermissions,
      canAccessModule,
      canPerformAction,
      isAdmin,
      currentUserRole: currentUser.role
    }}>
      {children}
    </PermissionsContext.Provider>
  );
};
