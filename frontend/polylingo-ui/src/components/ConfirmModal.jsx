import React from "react";

const ConfirmModal = ({ show, message, onConfirm, onCancel }) => {
  if (!show) return null;

  return (
    <div
      className="confirm-overlay"
      onClick={onCancel}
    >
      <div
        className="confirm-box"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="confirm-btn confirm" onClick={onConfirm}>
            Yes, Clear 🧹
          </button>
          <button className="confirm-btn cancel" onClick={onCancel}>
            Cancel ❌
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
