import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function RequestPasswordReset() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const API_BASE_URL = 'http://localhost:8000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/request_password_reset/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to request password reset.');
      }

      setMessage(data.message);
      // Optionally, navigate to a success page or back to login after a delay
      // navigate('/login');
    } catch (err) {
      console.error('Request password reset error:', err);
      setError(err.message || 'Failed to request password reset. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <h2>Request Password Reset</h2>
      <form onSubmit={handleSubmit}>
        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
        <div>
          <label htmlFor="email">Enter your registered email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit">Send Reset Link</button>
      </form>
    </div>
  );
}

export default RequestPasswordReset;