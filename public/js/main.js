// Main JS - Global utilities and initialization
console.log('Shop Manager app loaded');

// Add notification styles dynamically
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
  .notification {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 4px;
    background: #4CAF50;
    color: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    z-index: 3000;
    animation: slideIn 0.3s ease;
  }

  .notification-error {
    background: #f44336;
  }

  .notification-warning {
    background: #ff9800;
  }

  .notification-info {
    background: #2196F3;
  }

  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(notificationStyle);
