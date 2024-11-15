import React from 'react';
import './Modal.css'; // Ensure you import the correct CSS

const Modal = ({ show, image, onClose, onPrev, onNext, showArrows = false }) => {
  if (!show) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {showArrows && (
          <button className="modal-prev-button" onClick={onPrev}>←</button>
        )}
        <img src={image} alt="Popup" className="modal-image" />
        {showArrows && (
          <button className="modal-next-button" onClick={onNext}>→</button>
        )}
        <button onClick={onClose} className="modal-close-button">X</button>
      </div>
    </div>
  );
};

export default Modal;
