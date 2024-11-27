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
    <button
      className="modal-overlay"
      onClick={onClose}
      tabIndex="0"
      onKeyDown={handleKeyDown}
      aria-label="Close modal"
    >
      <section
        role="dialog" // Specifies the role of the modal
        aria-modal="true" // Indicates the modal blocks interaction with the background
        aria-labelledby="modal-title" // Associates the modal with its title
        aria-describedby="modal-description" // Points to the description for screen readers
        tabIndex="0" // Makes the modal focusable
        className="modal-content"
        onClick={(e) => e.stopPropagation()} // Prevents click propagation
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.stopPropagation(); // Handles keyboard events for accessibility
          }
        }}
      >

        <div id="modal-description" className="sr-only">
          This is a modal dialog. Use the arrow buttons to navigate through images. Press Escape to close.
        </div>

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
      </section>

    </button>
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