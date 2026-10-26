import React, { useEffect, useState, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import axios from 'axios';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const location = useLocation();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    console.log('useEffect dependencies:', { allowedRoles, pathname: location.pathname });

    const checkAuth = async () => {
      console.log('Checking auth for path:', location.pathname, 'with roles:', allowedRoles);

      if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
        console.error('ProtectedRoute: allowedRoles is invalid or empty');
        if (isMountedRef.current) setIsAuthenticated(false);
        return;
      }

      let token = null;
      let authEndpoint = null;

      if (allowedRoles.includes('child') && location.pathname.startsWith('/game')) {
        token = localStorage.getItem('child_token');
        authEndpoint = 'http://localhost:3000/child/verify-token';
      } else if (allowedRoles.includes('admin') && location.pathname.includes('/admin')) {
        token = localStorage.getItem('admin_token');
        authEndpoint = 'http://localhost:3000/admin/verify-token';
      } else if (allowedRoles.includes('superadmin') && location.pathname.startsWith('/superadmin')) {
        token = localStorage.getItem('superadmin_token');
        authEndpoint = 'http://localhost:3000/superadmin/verify-token';
      }

      console.log('Token retrieved:', token ? 'Present' : 'Missing', 'for role:', allowedRoles);

      if (!token) {
        console.log('No token found, redirecting...');
        if (isMountedRef.current) setIsAuthenticated(false);
        return;
      }

      try {
        const response = await axios.get(authEndpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Token verification response:', response.data);
        if (isMountedRef.current) setIsAuthenticated(true);
      } catch (error) {
        console.error('Token verification failed:', error.response?.data || error.message);
        localStorage.removeItem('child_token');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('superadmin_token');
        localStorage.removeItem('userId');
        localStorage.removeItem('admin_id');
        if (isMountedRef.current) setIsAuthenticated(false);
      }
    };

    checkAuth();

    return () => {
      isMountedRef.current = false;
    };
  }, [allowedRoles, location.pathname]);

  if (isAuthenticated === null) {
    console.log('Authentication state is null, showing loading...');
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login...');
    const role = allowedRoles[0];
    const redirectTo =
      role === 'child' ? '/' :
      role === 'admin' ? '/admin-login' :
      role === 'superadmin' ? '/superadmin-login' :
      '/';
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  console.log('Authenticated, rendering Outlet...');
  return <Outlet />;
};

export default ProtectedRoute;