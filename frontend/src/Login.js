import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './App'; // Import useAuth from App.js

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false); // New state for password visibility
  const navigate = useNavigate();
  const { setAuthToken } = useAuth();

  const API_BASE_URL = 'http://127.0.0.1:8000'; // FastAPI backend URL

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded', // Important for OAuth2PasswordRequestForm
        },
        body: new URLSearchParams({
          username: username,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received access token:', data.access_token);
      setAuthToken(data.access_token);
      localStorage.setItem('authToken', data.access_token); // Store token
      navigate('/'); // Redirect to main page
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        {error && <p className="error-message">{error}</p>}
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
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
        </div>
        <button type="submit">Login</button>
      </form>
      <p>Don't have an account? <Link to="/register">Register here</Link></p>
      <p><Link to="/request-password-reset">Forgot Password?</Link></p>
    </div>
  );
}

export default Login;