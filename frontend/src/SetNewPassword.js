import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './App';
import { jwtDecode } from 'jwt-decode';

function SetNewPassword() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false); // New state
  const [showNewPassword, setShowNewPassword] = useState(false); // New state
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false); // New state
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false);
  const navigate = useNavigate();
  const { authToken, setAuthToken } = useAuth();

  useEffect(() => {
    if (authToken) {
      try {
        const decodedToken = jwtDecode(authToken);
        setPasswordChangeRequired(decodedToken.password_change_required);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, [authToken]);

  const API_BASE_URL = 'http://127.0.0.1:8000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      };
      
      const body = {
        new_password: newPassword,
      };

      if (!passwordChangeRequired) {
        body.old_password = oldPassword;
      }

      const response = await fetch(`${API_BASE_URL}/set_new_password/`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.detail) {
            errorMessage = errorData.detail;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        } catch (jsonError) {
          console.error("Failed to parse error response as JSON:", jsonError);
        }
        throw new Error(errorMessage);
      }

      setSuccess('Password updated successfully! You will be logged out. Please log in with your new password.');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => {
        setAuthToken(null);
        localStorage.removeItem('authToken');
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Set new password error:', err);
      setError(err.message || 'Failed to set new password. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <h2>{passwordChangeRequired ? 'Create Your Password' : 'Change Your Password'}</h2>
      <form onSubmit={handleSubmit}>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        {!passwordChangeRequired && (
          <div>
            <label htmlFor="oldPassword">Old Password:</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showOldPassword ? 'text' : 'password'}
                id="oldPassword"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
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
                onClick={() => setShowOldPassword(!showOldPassword)}
              >
                {showOldPassword ? '🙈' : '👁️'}
              </span>
            </div>
          </div>
        )}
        <div>
          <label htmlFor="newPassword">New Password:</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showNewPassword ? 'text' : 'password'}
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? '🙈' : '👁️'}
            </span>
          </div>
        </div>
        <div>
          <label htmlFor="confirmNewPassword">Confirm New Password:</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showConfirmNewPassword ? 'text' : 'password'}
              id="confirmNewPassword"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
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
              onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
            >
              {showConfirmNewPassword ? '🙈' : '👁️'}
            </span>
          </div>
        </div>
        <button type="submit">Set Password</button>
      </form>
    </div>
  );
}

export default SetNewPassword;
