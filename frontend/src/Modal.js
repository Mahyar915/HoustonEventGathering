
import React from 'react';

function Modal({ filename, caption, onClose, onNext, onPrev }) {
  if (!filename) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close-button" onClick={onClose}>&times;</span>
        <img src={`http://localhost:8000/static/${filename}`} alt={caption} />
        <div className="modal-caption">{caption}</div>
        <button className="prev-button" onClick={onPrev}>&#10094;</button>
        <button className="next-button" onClick={onNext}>&#10095;</button>
      </div>
    </div>
  );
}

export default Modal;
