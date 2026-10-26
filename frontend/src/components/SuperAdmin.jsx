// SuperAdmin.js: Component for superadmin dashboard to manage admin accounts
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios'; // For making HTTP requests to the backend
import { useNavigate } from 'react-router-dom'; // For programmatic navigation
import '../styles/superadmin.css'; // Styles for the superadmin UI

const SuperAdmin = () => {
  // State to track the active section of the dashboard (register, listOfAdmins, update, delete)
  const [activeSection, setActiveSection] = useState('register');
  // State to store the list of registered admins
  const [admins, setAdmins] = useState([]);
  // State to store form data for registering a new admin
  const [adminData, setAdminData] = useState({
    name: '',
    phone: '',
    email: '',
    profilePhoto: null,
    password: '',
  });
  // State to store the selected admin for updating
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  // State to store the phone number for deleting an admin
  const [phoneToDelete, setPhoneToDelete] = useState('');
  // State to display success or error messages
  const [message, setMessage] = useState('');
  const navigate = useNavigate(); // Hook for navigation

  // Fetch admins from the backend (memoized to avoid unnecessary re-renders)
  const fetchAdmins = useCallback(async (token) => {
    try {
      const response = await axios.get('http://localhost:3000/superadmin/admins', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdmins(response.data); // Update admins list
    } catch (error) {
      console.error('Error fetching admins:', error);
      setMessage('Failed to fetch admins');
    }
  }, []);

  // Check for token and fetch admins on component mount
  useEffect(() => {
    const token = localStorage.getItem('superadmin_token');
    if (!token) {
      navigate('/superadmin-login'); // Redirect to login if no token
      return;
    }

    fetchAdmins(token);
  }, [navigate, fetchAdmins]);

  // Handle admin registration form submission
  const handleAdminRegistration = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('superadmin_token');
    if (!token) {
      navigate('/superadmin-login');
      return;
    }

    // Create FormData for multipart form submission
    const formData = new FormData();
    formData.append('name', adminData.name);
    formData.append('phone', adminData.phone);
    formData.append('email', adminData.email);
    if (adminData.profilePhoto) {
      formData.append('profilePhoto', adminData.profilePhoto);
    }
    formData.append('password', adminData.password);

    try {
      const response = await axios.post('http://localhost:3000/superadmin/register-admin', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage(response.data.message); // Display success message
      setAdmins(prev => [...prev, response.data.admin]); // Add new admin to list
      // Reset form
      setAdminData({ name: '', phone: '', email: '', profilePhoto: null, password: '' });
      document.getElementById('profilePhoto').value = null; // Clear file input
    } catch (error) {
      console.error('Error registering admin:', error);
      setMessage(error.response?.data?.message || 'Registration failed');
    }
  };

  // Handle enabling or disabling an admin
  const handleToggleAdmin = async (active) => {
    if (!selectedAdmin) {
      setMessage('Please select an admin');
      return;
    }

    const token = localStorage.getItem('superadmin_token');
    try {
      const response = await axios.put(
        'http://localhost:3000/superadmin/toggle-admin',
        { phone: selectedAdmin.phone, active },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(response.data.message); // Display success message
      // Update admin in the list
      setAdmins(prev =>
        prev.map(admin =>
          admin.phone === selectedAdmin.phone ? response.data.admin : admin
        )
      );
      setSelectedAdmin(null); // Clear selection
    } catch (error) {
      console.error('Error toggling admin:', error);
      setMessage(error.response?.data?.message || 'Error toggling admin');
    }
  };

  // Handle admin deletion
  const handleDeleteAdmin = async () => {
    if (!phoneToDelete) {
      setMessage('Please enter a phone number');
      return;
    }

    const token = localStorage.getItem('superadmin_token');
    try {
      const response = await axios.delete(`http://localhost:3000/superadmin/delete-admin/${phoneToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage(response.data.message); // Display success message
      // Remove deleted admin from the list
      setAdmins(prev => prev.filter(admin => admin.phone !== phoneToDelete));
      setPhoneToDelete(''); // Clear input
    } catch (error) {
      console.error('Error deleting admin:', error);
      setMessage(error.response?.data?.message || 'Error deleting admin');
    }
  };

  // Handle logout by clearing token and redirecting to login
  const handleLogout = () => {
    localStorage.removeItem('superadmin_token');
    navigate('/superadmin-login');
  };

  return (
    <div className="superadmin-container">
      {/* Navigation bar for switching sections */}
      <nav className="superadmin-nav">
        <button onClick={() => setActiveSection('register')}>Register</button>
        <button onClick={() => setActiveSection('listOfAdmins')}>List of Admins</button>
        <button onClick={() => setActiveSection('update')}>Update</button>
        <button onClick={() => setActiveSection('delete')}>Delete</button>
      </nav>
      <h1>SuperAdmin Dashboard</h1>
      {message && <p className="message">{message}</p>}

      <div className="admin-content">
        {/* Register new admin section */}
        {activeSection === 'register' && (
          <div className="admin-registration">
            <h2>Register New Admin</h2>
            <form onSubmit={handleAdminRegistration}>
              <input
                type="text"
                placeholder="Admin Name"
                value={adminData.name}
                onChange={e => setAdminData({ ...adminData, name: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Phone Number"
                value={adminData.phone}
                onChange={e => setAdminData({ ...adminData, phone: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={adminData.email}
                onChange={e => setAdminData({ ...adminData, email: e.target.value })}
                required
              />
              <input
                id="profilePhoto"
                type="file"
                accept="image/*"
                onChange={e => setAdminData({ ...adminData, profilePhoto: e.target.files[0] })}
              />
              <input
                type="password"
                placeholder="Password"
                value={adminData.password}
                onChange={e => setAdminData({ ...adminData, password: e.target.value })}
                required
              />
              <button type="submit">Register Admin</button>
            </form>
          </div>
        )}

        {/* List registered admins section */}
        {activeSection === 'listOfAdmins' && (
          <div className="admin-list">
            <h2>Registered Admins</h2>
            {admins.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map(admin => (
                    <tr key={admin.phone}>
                      <td>{admin.name}</td>
                      <td>{admin.phone}</td>
                      <td>{admin.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No admins registered yet.</p>
            )}
          </div>
        )}

        {/* Update admin status section */}
        {activeSection === 'update' && (
          <div className="admin-actions">
            <h2>Update Admin</h2>
            <div className="admin-selector">
              <select
                value={selectedAdmin ? selectedAdmin.phone : ''}
                onChange={e => {
                  const admin = admins.find(a => a.phone === e.target.value);
                  setSelectedAdmin(admin || null);
                }}
              >
                <option value="">Select an admin</option>
                {admins.map(admin => (
                  <option key={admin.phone} value={admin.phone}>
                    {admin.name} ({admin.phone})
                  </option>
                ))}
              </select>
            </div>
            {selectedAdmin && (
              <>
                <button onClick={() => handleToggleAdmin(true)}>Enable Admin</button>
                <button onClick={() => handleToggleAdmin(false)}>Disable Admin</button>
                <button onClick={() => setSelectedAdmin(null)}>Cancel</button>
              </>
            )}
            {!selectedAdmin && <p>Please select an admin to update.</p>}
          </div>
        )}

        {/* Delete admin section */}
        {activeSection === 'delete' && (
          <div className="admin-actions">
            <h2>Delete Admin</h2>
            <input
              type="text"
              placeholder="Enter phone number to delete"
              value={phoneToDelete}
              onChange={e => setPhoneToDelete(e.target.value)}
            />
            <button onClick={handleDeleteAdmin}>Delete Admin</button>
          </div>
        )}
      </div>

      {/* Footer with logout button */}
      <div className="footer">
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    </div>
  );
};

export default SuperAdmin;
