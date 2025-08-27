
import React, { useState, useEffect } from 'react';
import { useAuth } from './App';

function ManageImages() {
  const [images, setImages] = useState([]);
  const { authToken } = useAuth();

  const API_BASE_URL = 'http://localhost:8000';

  const fetchImages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/images/`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setImages(data);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchImages();
    }
  }, [authToken]);

  const handleDeleteImage = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/images/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchImages();
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  return (
    <div className="manage-images-container">
      <h2>Manage Images</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Filename</th>
            <th>Caption</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {images.map((image) => (
            <tr key={image.id}>
              <td>{image.id}</td>
              <td>{image.filename}</td>
              <td>{image.caption}</td>
              <td>
                <button onClick={() => handleDeleteImage(image.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ManageImages;
