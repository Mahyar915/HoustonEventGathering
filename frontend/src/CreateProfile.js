import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './App';

function CreateProfile() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false); // New state for password visibility
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthToken } = useAuth();

  const email = location.state?.email;
  const otp = location.state?.otp;

  useEffect(() => {
    if (!email || !otp) {
      navigate('/request-otp');
    }
  }, [email, otp, navigate]);

  const API_BASE_URL = 'http://localhost:8000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Password validation
    if (password.length < 8 || !/[!@#$%^&*()]/.test(password)) {
      setError('Password must be at least 8 characters long and contain a special character like !@#$%^&*()');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/create_user/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAuthToken(data.access_token);
      localStorage.setItem('authToken', data.access_token);
      setSuccess('Profile created successfully! Redirecting...');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Create profile error:', err);
      setError(err.message || 'Failed to create profile. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <h2>Create Your Profile</h2>
      <form onSubmit={handleSubmit}>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        <div>
          <label htmlFor="username">Choose Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Choose a Password:</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                cursor: 'pointer',
              }}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '🙈' : '👁️'}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: '#666' }}>Password must be at least 8 characters long and contain a special character like !@#$%^&*()</p>
        </div>
        <button type="submit">Create Profile</button>
      </form>
    </div>
  );
}

export default CreateProfile;
