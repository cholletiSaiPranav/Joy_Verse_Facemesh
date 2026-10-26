import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SuperAdminLogin from './components/SuperAdminLogin';
import SuperAdmin from './components/SuperAdmin';
import AdminLogin from './components/AdminLogin';
import Admin from './components/Admin';
import ChildLogin from './components/ChildLogin';
import Game from './components/Game';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorPage from './components/ErrorPage'; // Import the new component

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChildLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/superadmin-login" element={<SuperAdminLogin />} />
        <Route element={<ProtectedRoute allowedRoles={['child']} />}>
          <Route path="/game" element={<Game />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<Admin />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
          <Route path="/superadmin" element={<SuperAdmin />} />
        </Route>
        <Route path="*" element={<ErrorPage />} /> {/* Catch-all route for 404 */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;