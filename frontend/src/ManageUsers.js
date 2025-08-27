
import React, { useState, useEffect } from 'react';
import { useAuth } from './App';
import { jwtDecode } from 'jwt-decode';

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const { authToken } = useAuth();
  const [currentUserId, setCurrentUserId] = useState(null);

  const API_BASE_URL = 'http://localhost:8000';

  useEffect(() => {
    if (authToken) {
      try {
        const decodedToken = jwtDecode(authToken);
        setCurrentUserId(decodedToken.user_id);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, [authToken]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchUsers();
    }
  }, [authToken]);

  const handleUpdateUser = async (id, isAdmin) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}/set-admin?is_admin=${isAdmin}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  return (
    <div className="manage-users-container">
      <h2>Manage Users</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Admin</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>
                <input
                  type="checkbox"
                  checked={user.is_admin}
                  onChange={(e) => {
                    console.log("Checkbox changed for user:", user.id, "New value:", e.target.checked);
                    handleUpdateUser(user.id, e.target.checked);
                  }}
                  disabled={user.id === currentUserId} // Disable if it's the current user
                />
              </td>
              <td>
                <button onClick={() => handleDeleteUser(user.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ManageUsers;
