
import React, { useState } from 'react';
import { useAuth } from './App';

function Upload() {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { authToken } = useAuth();

  const API_BASE_URL = 'http://localhost:8000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('caption', caption);

    try {
      const response = await fetch(`${API_BASE_URL}/images/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      setSuccess('Image uploaded successfully!');
      setFile(null);
      setCaption('');
    } catch (err) {
      console.error('Image upload error:', err);
      setError(err.message || 'Failed to upload image. Please try again.');
    }
  };

  return (
    <div className="upload-container">
      <h2>Upload Image</h2>
      <form onSubmit={handleSubmit}> 
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        <div>
          <label htmlFor="file">Image:</label>
          <input
            type="file"
            id="file"
            onChange={(e) => setFile(e.target.files[0])}
            accept="image/*"
            required
          />
        </div>
        <div>
          <label htmlFor="caption">Caption:</label>
          <input
            type="text"
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>
        <button type="submit">Upload</button>
      </form>
    </div>
  );
}

export default Upload;
