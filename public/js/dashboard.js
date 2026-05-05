// Dashboard navigation and module switching
document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.nav-link');
  const modules = document.querySelectorAll('.module');

  // Set today's date as default
  const dateInput = document.getElementById('appointment-date');
  if (dateInput) {
    dateInput.valueAsDate = new Date();
  }

  // Module switching
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const module = link.dataset.module;
      if (!module) return; // Skip logout link

      e.preventDefault();

      // Remove active class from all links
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Hide all modules
      modules.forEach(m => m.classList.remove('active'));

      // Show selected module
      const selectedModule = document.getElementById(`${module}-module`);
      if (selectedModule) {
        selectedModule.classList.add('active');
        
        // Load data for the module
        if (module === 'appointments') {
          loadAppointments();
        } else if (module === 'parts') {
          loadCurrentPartsView();
        }
      }
    });
  });

  // Initialize with appointments module
  loadAppointments();
  loadTodos();

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'n') {
        e.preventDefault();
        const activeModule = document.querySelector('.module.active');
        if (activeModule.id === 'appointments-module') {
          openAppointmentModal();
        } else if (activeModule.id === 'parts-module') {
          openCurrentPartsModal();
        }
      }
    }
  });
});

// Utility functions
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
  }
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
  }
}

// Modal close buttons
document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const modal = e.target.closest('.modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  });
});

// Close modal when clicking outside
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });
});
