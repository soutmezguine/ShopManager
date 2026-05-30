async function fetchAdminSettings() {
  const response = await fetch('/auth/admin/settings');
  if (!response.ok) throw new Error('Could not load settings');
  return response.json();
}

async function fetchAdminUsers() {
  const response = await fetch('/auth/admin/users');
  if (!response.ok) throw new Error('Could not load users');
  return response.json();
}

function openAdminModal() {
  loadAdminPanel();
  openModal('admin-modal');
}

async function loadAdminPanel() {
  try {
    const [settings, users] = await Promise.all([fetchAdminSettings(), fetchAdminUsers()]);
    updateRegistrationToggle(settings.allowRegistration);
    renderAdminUsers(users);
  } catch (error) {
    console.error('Error loading admin panel:', error);
    showNotification('Unable to load admin settings', 'error');
  }
}

function updateRegistrationToggle(enabled) {
  const toggleButton = document.getElementById('toggle-registration-btn');
  if (!toggleButton) return;
  toggleButton.textContent = enabled ? 'Registration Enabled' : 'Registration Disabled';
  toggleButton.dataset.enabled = enabled ? '1' : '0';
}

async function toggleRegistration() {
  const button = document.getElementById('toggle-registration-btn');
  const enabled = button?.dataset.enabled === '1';
  try {
    const response = await fetch('/auth/admin/settings/registration', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowRegistration: !enabled })
    });
    if (!response.ok) throw new Error('Could not update registration setting');
    updateRegistrationToggle(!enabled);
    showNotification(`Registration ${!enabled ? 'enabled' : 'disabled'}`);
  } catch (error) {
    console.error('Error updating registration toggle:', error);
    showNotification('Unable to update registration setting', 'error');
  }
}

function renderAdminUsers(users) {
  const list = document.getElementById('admin-user-list');
  if (!list) return;
  list.innerHTML = '';

  if (users.length === 0) {
    list.innerHTML = '<p style="color: #999;">No users found</p>';
    return;
  }

  users.forEach(user => {
    const card = document.createElement('div');
    card.className = 'admin-user-card';
    card.dataset.userId = user.id;
    card.innerHTML = `
      <div class="admin-user-row">
        <div>
          <strong>${user.full_name}</strong> (${user.username})
          <span class="admin-user-created">Created: ${new Date(user.created_at).toLocaleDateString()}</span>
        </div>
        <div class="admin-action-group">
          <button class="btn btn-secondary btn-small admin-reset-password">Reset Password</button>
          <button class="btn btn-danger btn-small admin-delete-user">Remove</button>
        </div>
      </div>
      <div class="admin-permissions-grid">
        <label><input type="checkbox" data-field="is_admin" ${user.is_admin ? 'checked' : ''}> Admin</label>
        <label><input type="checkbox" data-field="can_access_admin" ${user.can_access_admin ? 'checked' : ''}> Admin Section</label>
        <label><input type="checkbox" data-field="can_appointments" ${user.can_appointments ? 'checked' : ''}> Appointments</label>
        <label><input type="checkbox" data-field="can_parts" ${user.can_parts ? 'checked' : ''}> Parts Log</label>
        <label><input type="checkbox" data-field="can_vendors" ${user.can_vendors ? 'checked' : ''}> Vendors</label>
        <label><input type="checkbox" data-field="can_leads" ${user.can_leads ? 'checked' : ''}> Leads</label>
      </div>
      <div class="admin-user-actions">
        <button class="btn btn-primary btn-small admin-save-user">Save</button>
      </div>
    `;

    const saveBtn = card.querySelector('.admin-save-user');
    const resetBtn = card.querySelector('.admin-reset-password');
    const deleteBtn = card.querySelector('.admin-delete-user');

    saveBtn?.addEventListener('click', async () => {
      const updates = {};
      card.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        const field = checkbox.dataset.field;
        updates[field] = checkbox.checked ? 1 : 0;
      });

      try {
        const response = await fetch(`/auth/admin/users/${user.id}/permissions`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error('Permission update failed');
        showNotification('User permissions updated');
      } catch (error) {
        console.error('Error updating user permissions:', error);
        showNotification('Could not save user permissions', 'error');
      }
    });

    resetBtn?.addEventListener('click', async () => {
      const password = prompt('Enter the new password for this user:');
      if (!password) return;
      try {
        const response = await fetch(`/auth/admin/users/${user.id}/reset-password`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        if (!response.ok) throw new Error('Reset failed');
        showNotification('Password reset successfully');
      } catch (error) {
        console.error('Error resetting password:', error);
        showNotification('Could not reset password', 'error');
      }
    });

    deleteBtn?.addEventListener('click', async () => {
      if (!confirm(`Remove user ${user.username}?`)) return;
      try {
        const response = await fetch(`/auth/admin/users/${user.id}`, {
          method: 'DELETE'
        });
        if (!response.ok) throw new Error('Delete failed');
        showNotification('User removed');
        loadAdminPanel();
      } catch (error) {
        console.error('Error removing user:', error);
        showNotification('Could not remove user', 'error');
      }
    });

    list.appendChild(card);
  });
}

function showAddUserForm() {
  const form = document.getElementById('admin-add-user-form');
  if (!form) return;
  form.classList.toggle('hidden');
}

async function submitAddUser(event) {
  event.preventDefault();
  const form = event.target;
  const username = form.querySelector('#new-user-username').value.trim();
  const fullName = form.querySelector('#new-user-fullname').value.trim();
  const password = form.querySelector('#new-user-password').value;
  const isAdmin = form.querySelector('#new-user-is-admin').checked;
  const canAccessAdmin = form.querySelector('#new-user-can-admin').checked;
  const canAppointments = form.querySelector('#new-user-can-appointments').checked;
  const canParts = form.querySelector('#new-user-can-parts').checked;
  const canVendors = form.querySelector('#new-user-can-vendors').checked;
  const canLeads = form.querySelector('#new-user-can-leads').checked;

  if (!username || !fullName || !password) {
    showNotification('Please fill all required fields', 'error');
    return;
  }

  try {
    const response = await fetch('/auth/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        fullName,
        password,
        is_admin: isAdmin,
        can_access_admin: canAccessAdmin,
        can_appointments: canAppointments,
        can_parts: canParts,
        can_vendors: canVendors,
        can_leads: canLeads
      })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Unable to create user');
    }
    showNotification('User created successfully');
    form.reset();
    form.classList.add('hidden');
    loadAdminPanel();
  } catch (error) {
    console.error('Error creating user:', error);
    showNotification(error.message || 'Could not create user', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('toggle-registration-btn')?.addEventListener('click', toggleRegistration);
  document.getElementById('btn-open-add-user')?.addEventListener('click', showAddUserForm);
  document.getElementById('admin-add-user-form')?.addEventListener('submit', submitAddUser);
});
