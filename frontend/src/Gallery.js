
import React, { useState, useEffect } from 'react';
import { useAuth } from './App';
import Modal from './Modal';
import Upload from './Upload'; // Import the Upload component

function Gallery() {
  const [images, setImages] = useState([]);
  const { authToken, isAdmin } = useAuth(); // Get isAdmin from useAuth
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  const handleLike = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/images/${id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchImages(); // Refetch images to update likes
    } catch (error) {
      console.error('Error liking image:', error);
    }
  };

  const handleReaction = async (id, emoji) => {
    try {
      const response = await fetch(`${API_BASE_URL}/images/${id}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ emoji }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchImages(); // Refetch images to update reactions
    } catch (error) {
      console.error('Error reacting to image:', error);
    }
  };

  const openModal = (index) => {
    setSelectedImage(images[index]);
    setCurrentIndex(index);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const showNextImage = () => {
    const nextIndex = (currentIndex + 1) % images.length;
    setSelectedImage(images[nextIndex]);
    setCurrentIndex(nextIndex);
  };

  const showPrevImage = () => {
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setSelectedImage(images[prevIndex]);
    setCurrentIndex(prevIndex);
  };

  return (
    <div className="gallery-container">
      {isAdmin && <Upload />}
      <h2>Gallery</h2>
      <div className="image-grid">
        {images.map((image, index) => (
          <div key={image.id} className="image-card">
            <img src={`${API_BASE_URL}/static/${image.filename}`} alt={image.caption} onClick={() => openModal(index)} />
            <div className="image-info">
              <div className="image-caption">{image.caption}</div>
              <div className="image-actions">
                <button onClick={() => handleLike(image.id)}>❤️ {image.likes}</button>
                <div className="reactions">
                  {Object.entries(
                    image.reactions.reduce((acc, reaction) => {
                      acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([emoji, count]) => (
                    <span key={emoji}>{emoji} {count}</span>
                  ))}
                </div>
                <div className="emoji-picker">
                  <button onClick={() => handleReaction(image.id, '👍')}>👍</button>
                  <button onClick={() => handleReaction(image.id, '😂')}>😂</button>
                  <button onClick={() => handleReaction(image.id, '😍')}>😍</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Modal filename={selectedImage?.filename} caption={selectedImage?.caption} onClose={closeModal} onNext={showNextImage} onPrev={showPrevImage} />
    </div>
  );
}

export default Gallery;
