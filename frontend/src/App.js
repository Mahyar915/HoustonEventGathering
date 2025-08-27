import React, { useState, createContext, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Import jwtDecode
import './App.css'; // Keep App.css for general styling
import Login from './Login';
import SetNewPassword from './SetNewPassword'; // Import SetNewPassword
import RequestPasswordReset from './RequestPasswordReset'; // New import
import ResetPassword from './ResetPassword'; // New import
import SimplifiedRegister from './SimplifiedRegister'; // New import for simplified registration

import Gallery from './Gallery';
import Upload from './Upload';
import Voting from './Voting'; // New import

import CreateProfile from './CreateProfile';
import Admin from './Admin';

// Create an Auth Context
const AuthContext = createContext(null);

// Custom hook to use Auth Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Private Route Component
const PrivateRoute = ({ children }) => {
  const { authToken } = useAuth();
  return authToken ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { authToken, isAdmin } = useAuth();
  return authToken && isAdmin ? children : <Navigate to="/" />;
};



function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { handleLogout } = useAuth();

  const handleMouseEnter = () => {
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  return (
    <div className="profile-dropdown" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button className="profile-button">
        Profile
      </button>
      {isOpen && (
        <div className="dropdown-content">
          <Link to="/set-new-password">Change Password</Link>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
}

function App() {
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken')); // Get token from localStorage
  const [isAdmin, setIsAdmin] = useState(false);
  const [backgroundImages, setBackgroundImages] = useState([]);
  const [currentBackground, setCurrentBackground] = useState(() => {
    // Initialize currentBackground from localStorage to prevent white flash
    const savedBackground = localStorage.getItem('lastBackgroundUrl');
    if (savedBackground) {
      document.body.style.backgroundImage = `url(${savedBackground})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundAttachment = 'fixed';
    }
    return savedBackground || '';
  });

  const API_BASE_URL = 'http://localhost:8000'; // FastAPI backend URL

  // Fetch background images on component mount
  useEffect(() => {
    const fetchBackgrounds = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/backgrounds`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setBackgroundImages(data);

        // Select and set a new random background if not logged in
        if (!authToken && data.length > 0) {
          const randomIndex = Math.floor(Math.random() * data.length);
          const newSelectedBackground = `${API_BASE_URL}/static/BackgroundLogin/${data[randomIndex]}`;
          setCurrentBackground(newSelectedBackground);
          localStorage.setItem('lastBackgroundUrl', newSelectedBackground);
          document.body.style.backgroundImage = `url(${newSelectedBackground})`;
          document.body.style.backgroundSize = 'cover';
          document.body.style.backgroundPosition = 'center';
          document.body.style.backgroundRepeat = 'no-repeat';
          document.body.style.backgroundAttachment = 'fixed';
        }

      } catch (err) {
        console.error('Error fetching backgrounds:', err);
      }
    };

    fetchBackgrounds();
  }, [authToken]); // Depend on authToken to re-fetch if user logs out/in

  // Clear background when logged in
  useEffect(() => {
    if (authToken) {
      document.body.style.backgroundImage = 'none';
      localStorage.removeItem('lastBackgroundUrl'); // Clear saved background on login
    }
  }, [authToken]);

  useEffect(() => {
    if (authToken) {
      try {
        const decodedToken = jwtDecode(authToken);
        setIsAdmin(decodedToken.is_admin);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, [authToken]);

  const handleLogout = () => {
    setAuthToken(null);
    setIsAdmin(false);
    localStorage.removeItem('authToken'); // Remove token from localStorage
  };

  return (
    <AuthContext.Provider value={{ authToken, setAuthToken, handleLogout, isAdmin }}>
      <Router>
        <div className="App">
          <header className="App-header">
            <h1>Application</h1>
            <nav>
              {authToken ? (
                <>
                  <Link to="/">Home</Link>
                  <Link to="/gallery" style={{ marginLeft: '10px' }}>Gallery</Link>
                  <Link to="/voting" style={{ marginLeft: '10px' }}>Vote</Link>
                  {isAdmin && <Link to="/admin" style={{ marginLeft: '10px' }}>Admin</Link>}
                  <ProfileDropdown />
                </>
              ) : (
                <>
                  <Link to="/login">Login</Link>
                  <Link to="/register" style={{ marginLeft: '10px' }}>Register</Link> {/* Simplified Registration */}
                </>
              )}
            </nav>
          </header>
          <main>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/create-profile" element={<CreateProfile />} />
              <Route path="/register" element={<SimplifiedRegister />} /> {/* Simplified Registration */}
              <Route path="/set-new-password" element={<SetNewPassword />} /> {/* New route */}
              <Route path="/request-password-reset" element={<RequestPasswordReset />} /> {/* New route */}
              <Route path="/reset-password" element={<ResetPassword />} /> {/* New route */}
              <Route path="/gallery" element={<PrivateRoute><Gallery /></PrivateRoute>} />
              <Route path="/voting" element={<PrivateRoute><Voting /></PrivateRoute>} />
              <Route path="/admin" element={<AdminRoute><Admin /><Upload /></AdminRoute>} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                      <RegistrationContent />
                  </PrivateRoute>
                }
              />
            </Routes>
          </main>
          <footer className="App-footer">
            <p>Copyright © 2025-2026 VeloAI. All rights reserved.</p>
          </footer>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}


// This component will contain the original registration form and list
function RegistrationContent() {
  const [registrations, setRegistrations] = useState([]);
  const [name, setName] = useState('');
  const [guests, setGuests] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const { authToken, setAuthToken } = useAuth(); // Get setAuthToken from context
  const [currentUserId, setCurrentUserId] = useState(null); // State to store current user's ID

  const API_BASE_URL = 'http://localhost:8000'; // FastAPI backend URL

  // Decode token to get current user's ID
  useEffect(() => {
    if (authToken) {
      try {
        const decodedToken = jwtDecode(authToken);
        setCurrentUserId(decodedToken.user_id); // Use user_id from decoded token
      } catch (error) {
        console.error("Error decoding token:", error);
        // If token is invalid, clear it
        setAuthToken(null);
        localStorage.removeItem('authToken');
      }
    } else {
      setCurrentUserId(null);
    }
  }, [authToken, setAuthToken]); // Depend on setAuthToken to avoid lint warning

  // Fetch all registrations
  const fetchRegistrations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/registrations/`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        // If 401, token might be expired or invalid
        if (response.status === 401) {
          setAuthToken(null); // Clear token
          localStorage.removeItem('authToken');
          console.log('Authentication failed, please log in again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRegistrations(data);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };

  // Add or Update a registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newRegistration = { name, guests: parseInt(guests) };

    try {
      let response;
      if (editingId) {
        // Update existing registration
        response = await fetch(`${API_BASE_URL}/registrations/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(newRegistration),
        });
        setEditingId(null); // Exit editing mode
      } else {
        // Add new registration
        response = await fetch(`${API_BASE_URL}/registrations/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(newRegistration),
        });
      }

      if (!response.ok) {
        // If 401 or 403, handle appropriately
        if (response.status === 401) {
          setAuthToken(null);
          localStorage.removeItem('authToken');
          console.log('Authentication failed, please log in again.');
        } else if (response.status === 403) {
          console.log('Not authorized to perform this action.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setName('');
      setGuests(0);
      fetchRegistrations(); // Refresh the list
    } catch (error) {
      console.error('Error submitting registration:', error);
    }
  };

  // Delete a registration
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/registrations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        // If 401 or 403, handle appropriately
        if (response.status === 401) {
          setAuthToken(null);
          localStorage.removeItem('authToken');
          console.log('Authentication failed, please log in again.');
        } else if (response.status === 403) {
          console.log('Not authorized to perform this action.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchRegistrations(); // Refresh the list
    } catch (error) {
      console.error('Error deleting registration:', error);
    }
  };

  // Edit a registration (populate form with data)
  const handleEdit = (registration) => {
    setName(registration.name);
    setGuests(registration.guests);
    setEditingId(registration.id);
  };

  // Initial fetch on component mount
  useEffect(() => {
    if (authToken) { // Only fetch if authenticated
      fetchRegistrations();
    }
  }, [authToken]); // Re-fetch when token changes

  const userHasRegistered = registrations.some(reg => reg.user_id === currentUserId);

  return (
    <>
      {(!userHasRegistered || editingId) && (
        <section className="registration-form">
          <h2>{editingId ? 'Edit Registration' : 'Add New Registration'}</h2>
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name">Name:</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="guests">Number of Guests:</label>
              <input
                type="number"
                id="guests"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                min="0"
                required
              />
            </div>
            <button type="submit">{editingId ? 'Update' : 'Register'}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setName(''); setGuests(0); }}>Cancel Edit</button>}
          </form>
        </section>
      )}

      <section className="registration-list">
        <h2>Registered Participants</h2>
        {registrations.length === 0 ? (
          <p>No registrations yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Guests</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((reg) => (
                <tr key={reg.id}>
                  <td>{reg.id}</td>
                  <td>{reg.name}</td>
                  <td>{reg.guests}</td>
                  <td>
                    {/* Conditionally render Edit/Delete buttons */}
                    {currentUserId && reg.user_id === currentUserId ? (
                      <>
                        <button onClick={() => handleEdit(reg)}>Edit</button>
                        <button onClick={() => handleDelete(reg.id)}>Delete</button>
                      </>
                    ) : (
                      <span>No actions</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

export default App;
