import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/errorstyle.css';
import '@fontsource/arvo';

const ErrorPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getLoginPath = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes('admin')) return '/admin-login';
    if (path.includes('superadmin')) return '/superadmin-login';
    return '/';
  };

  const loginPath = getLoginPath();

  return (
    <section className="page_404">
      <div className="error-content">
        <h1 className="error-title">404</h1>
        <div className="four_zero_four_bg"></div>
      </div>
      <div className="contant_box_404">
        <h3>Looks like you're lost</h3>
        <p>The page you are looking for is not available!</p>
        <button className="link_404" onClick={() => navigate(loginPath)}>
          Go to Login
        </button>
      </div>
    </section>
  );
};

export default ErrorPage;