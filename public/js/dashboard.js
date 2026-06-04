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
        } else if (module === 'vendors') {
          loadVendors();
        } else if (module === 'leads') {
          loadLeads();
        }

        // Always refresh shared todo list when the user switches modules.
        loadTodos();
      }
    });
  });

  // Initialize with appointments module
  loadAppointments();
  loadTodos();

  if (document.querySelector('.nav-link[data-module="leads"]')) {
    loadLeads();
  }

  const dropdownToggle = document.getElementById('user-dropdown-toggle');
  const dropdownMenu = document.getElementById('user-dropdown-menu');

  // Toggle dropdown on click or Enter/Space for accessibility
  const toggleDropdown = (e) => {
    e?.stopPropagation();
    if (!dropdownMenu) return;
    // If menu is not attached to body, attach it so it cannot be clipped by parents
    if (!document.body.contains(dropdownMenu)) {
      document.body.appendChild(dropdownMenu);
      dropdownMenu.style.position = 'absolute';
      dropdownMenu.style.zIndex = '2000';
    }

    if (dropdownMenu.classList.contains('hidden')) {
      // Position under the toggle
      const rect = dropdownToggle.getBoundingClientRect();
      dropdownMenu.style.left = `${rect.right - dropdownMenu.offsetWidth}px`;
      dropdownMenu.style.top = `${rect.bottom + window.scrollY + 6}px`;
      dropdownMenu.classList.remove('hidden');
    } else {
      dropdownMenu.classList.add('hidden');
    }
  };

  dropdownToggle?.addEventListener('click', toggleDropdown);
  dropdownToggle?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleDropdown(e);
    }
  });

  // Prevent clicks inside the menu from closing it
  dropdownMenu?.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Close dropdown when clicking outside or when Escape is pressed
  document.addEventListener('click', () => {
    if (dropdownMenu && !dropdownMenu.classList.contains('hidden')) {
      dropdownMenu.classList.add('hidden');
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dropdownMenu && !dropdownMenu.classList.contains('hidden')) {
      dropdownMenu.classList.add('hidden');
    }
  });

  document.getElementById('dropdown-admin')?.addEventListener('click', (e) => {
    e.preventDefault();
    openAdminModal();
    dropdownMenu?.classList.add('hidden');
  });

  // Refresh the shared todo list when the app becomes visible again
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      loadTodos();
    }
  });

  // Auto-refresh todo list every 5 minutes
  setInterval(() => {
    loadTodos();
  }, 300000);

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
        } else if (activeModule.id === 'vendors-module') {
          openVendorModal();
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
