
import React, { useState, useEffect } from 'react';
import { useAuth } from './App';
import { useNavigate } from 'react-router-dom';

function Voting() {
  const { authToken, handleLogout } = useAuth();
  const navigate = useNavigate();
  const [votes, setVotes] = useState({});
  const [myVotes, setMyVotes] = useState([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const API_BASE_URL = 'http://localhost:8000';

  const getFridays = (year, month) => {
    const fridays = [];
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      if (date.getDay() === 5) { // 5 = Friday
        fridays.push(new Date(date));
      }
      date.setDate(date.getDate() + 1);
    }
    return fridays;
  };

  const fetchVotes = async (month) => {
    try {
      const response = await fetch(`${API_BASE_URL}/votes/${month}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const voteCounts = data.reduce((acc, vote) => {
        acc[vote.event_date] = (acc[vote.event_date] || 0) + 1;
        return acc;
      }, {});
      setVotes(prevVotes => ({ ...prevVotes, [month]: voteCounts }));
    } catch (error) {
      console.error('Error fetching votes:', error);
    }
  };

  const fetchMyVotes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/votes/my-votes`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMyVotes(data.map(vote => vote.event_date));
    } catch (error) {
      console.error("Error fetching user's votes:", error);
    }
  };

  const handleVote = async (eventDate, month) => {
    if (!authToken) {
      // Redirect to login if not authenticated
      // This assumes you have a navigate function available, e.g., from react-router-dom's useNavigate hook
      // For now, we'll just log and return
      console.error("No authentication token found. Please log in.");
      navigate('/login');
      return;
    }

    // Optimistic UI update
    const isCurrentlyVoted = myVotes.includes(eventDate);
    const previousMyVotes = [...myVotes]; // Save current state for potential rollback

    if (isCurrentlyVoted) {
      setMyVotes(myVotes.filter(date => date !== eventDate));
    } else {
      setMyVotes([...myVotes, eventDate]);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/votes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ event_date: eventDate, month }),
      });
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid, clear token and redirect to login
          handleLogout(); // Assuming handleLogout is available from useAuth
          navigate('/login'); // You would need to import useNavigate
          console.error("Authentication failed. Please log in again.");
        }
        // If API call fails, revert UI
        setMyVotes(previousMyVotes);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // After successful API call, re-fetch to ensure consistency (especially for vote counts)
      fetchVotes(month);
      // fetchMyVotes(); // No longer strictly needed for myVotes, but good for consistency
    } catch (error) {
      console.error('Error casting vote:', error);
      // If API call fails, revert UI
      setMyVotes(previousMyVotes);
    }
  };

  const months = [
    { name: 'September', value: 8 },
    { name: 'October', value: 9 },
    { name: 'November', value: 10 },
    { name: 'December', value: 11 },
  ];

  useEffect(() => {
    months.forEach(month => fetchVotes(month.name));
    fetchMyVotes();
  }, []);

  return (
    <div className="voting-container">
      <h2>Vote for the Gathering Date</h2>
      <div className="voting-cards-container">
        {months.map(month => {
          const fridays = getFridays(currentYear, month.value);
          const totalVotes = Object.values(votes[month.name] || {}).reduce((acc, count) => acc + count, 0);
          return (
            <div key={month.name} className="month-card">
              <h3>{month.name}</h3>
              <ul className="friday-list">
                {fridays.map(friday => {
                  const dateString = friday.toDateString();
                  const count = votes[month.name]?.[dateString] || 0;
                  const percentage = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(2) : 0;
                  const isVoted = myVotes.includes(dateString);
                  return (
                    <li key={dateString} className="friday-item">
                      <div className="friday-info">
                        <span className="friday-date">{dateString}</span>
                        <span className="friday-votes">{count} votes ({percentage}%)</span>
                      </div>
                      <div className="friday-actions">
                        {isVoted ? (
                          <button className="vote-btn minus" onClick={() => handleVote(dateString, month.name)}>-</button>
                        ) : (
                          <button className="vote-btn plus" onClick={() => handleVote(dateString, month.name)}>+</button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Voting;
