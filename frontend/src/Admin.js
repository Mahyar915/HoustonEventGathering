
import React from 'react';
import ManageUsers from './ManageUsers';
import ManageImages from './ManageImages';
import ManageVotes from './ManageVotes';

function Admin() {
  return (
    <div className="admin-container">
      <h1>Admin Dashboard</h1>
      <div className="admin-sections">
        <ManageUsers />
        <ManageImages />
        <ManageVotes />
      </div>
    </div>
  );
}

export default Admin;
