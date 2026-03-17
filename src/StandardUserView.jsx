import { useState, useContext } from 'react';
import AuthContext from './AuthContext';
import './App.css';

export default function StandardUserView() {
  const [formData, setFormData] = useState({
    patientName: '',
    doctorName: '',
    date: '',
    notes: '',
  });
  const [message, setMessage] = useState('');
  const { user, token, logout } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Medical note saved successfully!');
        setFormData({ patientName: '', doctorName: '', date: '', notes: '' });
      } else {
        setMessage('Error: ' + data.error);
      }
    } catch (err) {
      setMessage('Could not connect to server.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Navbar */}
      <nav style={{
        backgroundColor: '#667eea',
        color: 'white',
        padding: '20px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>EHR System</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span>Welcome, {user?.username}!</span>
          <button
            onClick={logout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#764ba2',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main content */}
      <div style={{ maxWidth: '600px', margin: '40px auto', backgroundColor: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>Upload Medical Notes</h2>
        {message && (
          <div style={{
            padding: '12px',
            marginBottom: '20px',
            borderRadius: '5px',
            backgroundColor: message.includes('Error') ? '#fee' : '#efe',
            color: message.includes('Error') ? '#c33' : '#3c3',
            borderLeft: `4px solid ${message.includes('Error') ? '#c33' : '#3c3'}`,
          }}>
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#555' }}>Patient Name</label>
            <input
              type="text"
              name="patientName"
              value={formData.patientName}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#555' }}>Doctor Name</label>
            <input
              type="text"
              name="doctorName"
              value={formData.doctorName}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#555' }}>Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#555' }}>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              required
              rows="6"
              style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box', fontFamily: 'Arial' }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
            }}
          >
            Submit Medical Note
          </button>
        </form>
      </div>
    </div>
  );
}
