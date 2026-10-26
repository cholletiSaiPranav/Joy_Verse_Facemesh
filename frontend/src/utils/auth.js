// auth.js
import axios from 'axios';

const setAuthToken = (token, role, id) => {
  if (token && role) {
    localStorage.setItem(`${role}_token`, token);
    if (id) {
      if (role === 'child') {
        localStorage.setItem('userId', id);
      } else if (role === 'admin') {
        localStorage.setItem('admin_id', id);
      }
    }
  }
};

const clearAuthToken = (role) => {
  localStorage.removeItem(`${role}_token`);
  if (role === 'child') {
    localStorage.removeItem('userId');
  } else if (role === 'admin') {
    localStorage.removeItem('admin_id');
  }
};

const getAuthToken = (role) => {
  return localStorage.getItem(`${role}_token`);
};

const verifyToken = async (role) => {
  const token = getAuthToken(role);
  if (!token) return false;

  try {
    const endpoint = `http://localhost:3000/${role}/verify-token`;
    await axios.get(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return true;
  } catch (error) {
    console.error(`Token verification failed for ${role}:`, error.response?.data || error.message);
    clearAuthToken(role);
    return false;
  }
};

const login = async (role, credentials) => {
  try {
    const endpoint = `http://localhost:3000/${role}/login`;
    const response = await axios.post(endpoint, credentials);
    const { token, adminId, userId } = response.data;

    if (role === 'child') {
      setAuthToken(token, 'child', userId);
    } else if (role === 'admin') {
      setAuthToken(token, 'admin', adminId);
    } else if (role === 'superadmin') {
      setAuthToken(token, 'superadmin');
    }

    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

const logout = (role) => {
  clearAuthToken(role);
};

export { setAuthToken, clearAuthToken, getAuthToken, verifyToken, login, logout };