
import React, { useState, useEffect } from 'react';
import { useAuth } from './App';

function ManageVotes() {
  const [votes, setVotes] = useState([]);
  const { authToken } = useAuth();

  const API_BASE_URL = 'http://localhost:8000';

  const fetchAllVotes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/votes`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setVotes(data);
    } catch (error) {
      console.error('Error fetching votes:', error);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchAllVotes();
    }
  }, [authToken]);

  return (
    <div className="manage-votes-container">
      <h2>Manage Votes</h2>
      <table>
        <thead>
          <tr>
            <th>Vote ID</th>
            <th>User</th>
            <th>Email</th>
            <th>Voted Date</th>
            <th>Month</th>
          </tr>
        </thead>
        <tbody>
          {votes.map((vote) => (
            <tr key={vote.id}>
              <td>{vote.id}</td>
              <td>{vote.owner.username}</td>
              <td>{vote.owner.email}</td>
              <td>{vote.event_date}</td>
              <td>{vote.month}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ManageVotes;
