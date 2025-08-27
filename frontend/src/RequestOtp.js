import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function RequestOtp() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL = 'http://127.0.0.1:8000'; // FastAPI backend URL

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    setRedirecting(false);

    try {
      const response = await fetch(`${API_BASE_URL}/request_otp/`, {
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

      setMessage('OTP sent to your email. Please check your inbox and proceed to registration.');
      setRedirecting(true);
      setTimeout(() => {
        navigate('/register', { state: { email } });
      }, 2000);
    } catch (err) {
      console.error('Request OTP error:', err);
      setError(err.message || 'Failed to request OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Request OTP for Registration</h2>
      <form onSubmit={handleSubmit}>
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}
        {redirecting && <p style={{ fontSize: '1.2em', fontWeight: 'bold', color: 'blue' }}>Redirecting to the registration page...</p>}
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
        <button type="submit" disabled={loading || redirecting}>
          {loading ? 'Sending...' : 'Request OTP'}
        </button>
      </form>
      <p>Already have an account? <Link to="/login">Login here</Link></p>
      <p>Already have an OTP? <Link to="/register">Register with OTP</Link></p>
    </div>
  );
}

export default RequestOtp;
