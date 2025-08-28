import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './App'; // Assuming useAuth is exported from App.js

function SimplifiedRegister() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // New state for loading
  const navigate = useNavigate();
  const { setAuthToken } = useAuth();

  const API_BASE_URL = 'http://localhost:8000';

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true); // Set loading to true

    try {
      const response = await fetch(`${API_BASE_URL}/register_simplified/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMessage(data.message);
      setOtpRequested(true);
    } catch (err) {
      console.error('Request OTP error:', err);
      setError(err.message || 'Failed to request OTP.');
    } finally {
      setIsLoading(false); // Set loading to false
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Client-side password validation
    if (password.length < 8 || !/[!@#$%^&*()_+=?<>]/.test(password)) {
      setError('Password must be at least 8 characters long and contain at least one special character.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/register_simplified/`, {
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
      setMessage(data.message);
      // Assuming successful registration also logs the user in or provides a token
      // If the backend returns a token, store it and redirect
      // For now, just redirect to login or home
      navigate('/login'); // Or navigate('/') if auto-login
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed.');
    }
  };

  return (
    <div className="auth-container">
      <h2>Registration</h2>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      {!otpRequested ? (
        <form onSubmit={handleRequestOtp}>
          <div>
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Sending OTP... Please wait' : 'Request OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister}>
          <div>
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              readOnly // Email should not be editable after OTP request
              required
            />
          </div>
          <div>
            <label htmlFor="otp">OTP:</label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </div>
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
            <label htmlFor="password">Choose a password:</label>
            <input
              type="text"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
                        <p className="password-hint">Password must be at least 8 characters long and contain at least one special character: {'!@#$%^&*()_+=?<>'}.</p>
          </div>
          <button type="submit">Register</button>
        </form>
      )}
      <p>Already have an account? <Link to="/login">Login here</Link></p>
    </div>
  );
}

export default SimplifiedRegister;
