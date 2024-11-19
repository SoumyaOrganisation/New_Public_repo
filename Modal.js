import React from 'react';
import PropTypes from 'prop-types'; // Import PropTypes
import './Modal.css';

const Modal = ({ show, image, onClose, onPrev, onNext, showArrows = false }) => {
  if (!show) {
    return null;
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onClose();
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="button"
      tabIndex="0"
      onKeyDown={handleKeyDown}
      aria-label="Close modal"
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        {showArrows && (
          <button
            className="modal-prev-button"
            onClick={onPrev}
            aria-label="Previous image"
          >
            ←
          </button>
        )}
        <img src={image} alt="Popup" className="modal-image" />
        {showArrows && (
          <button
            className="modal-next-button"
            onClick={onNext}
            aria-label="Next image"
          >
            →
          </button>
        )}
        <button
          onClick={onClose}
          className="modal-close-button"
          aria-label="Close modal"
        >
          X
        </button>
      </div>
    </div>
  );
};

// Prop types validation
Modal.propTypes = {
  show: PropTypes.bool.isRequired,
  image: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onPrev: PropTypes.func,
  onNext: PropTypes.func,
  showArrows: PropTypes.bool,
};

// Default props for optional props
Modal.defaultProps = {
  onPrev: null,
  onNext: null,
  showArrows: false,
};

export default Modal;