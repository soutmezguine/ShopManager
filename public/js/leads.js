let allLeads = [];

const leadsSearch = document.getElementById('leads-search');
const leadsList = document.getElementById('leads-list');
const leadCount = document.getElementById('lead-count');

function filterLeads() {
  const searchTerm = leadsSearch?.value.toLowerCase() || '';
  const filtered = allLeads.filter(lead => {
    const fields = [lead.customer_name, lead.email, lead.phone_number, lead.message]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return fields.includes(searchTerm);
  });
  renderLeads(filtered);
}

async function loadLeads() {
  if (!leadsList) return;

  try {
    const response = await fetch('/leads/api');
    if (!response.ok) throw new Error('Unable to fetch leads');

    allLeads = await response.json();
    filterLeads();
  } catch (error) {
    console.error('Error loading leads:', error);
    leadsList.innerHTML = '<p style="text-align: center; color: #999;">Error loading leads</p>';
  }
}

function renderLeads(leads) {
  if (!leadsList) return;

  leadsList.innerHTML = '';
  if (leadCount) {
    leadCount.textContent = `${leads.length} lead${leads.length === 1 ? '' : 's'}`;
  }

  if (leads.length === 0) {
    leadsList.innerHTML = '<p style="text-align: center; color: #999;">No leads found</p>';
    return;
  }

  leads.forEach(lead => {
    const card = document.createElement('div');
    card.className = 'lead-card';
    card.innerHTML = `
      <div class="lead-card-top">
        <label class="lead-contacted-label">
          <input type="checkbox" class="lead-contacted-checkbox" data-id="${lead.id}" ${lead.contacted ? 'checked' : ''}>
          Contacted
        </label>
        <div class="lead-card-actions">
          <button type="button" class="lead-delete-button" data-id="${lead.id}">Delete</button>
          <span class="lead-created">${new Date(lead.created_at).toLocaleString()}</span>
        </div>
      </div>
      <div class="lead-card-row"><strong>${lead.customer_name}</strong></div>
      <div class="lead-card-row">${lead.email || ''}${lead.phone_number ? ' • ' + lead.phone_number : ''}</div>
      <div class="lead-card-message">${lead.message || ''}</div>
    `;

    const checkbox = card.querySelector('.lead-contacted-checkbox');
    checkbox?.addEventListener('change', async () => {
      try {
        const response = await fetch(`/leads/api/${lead.id}/contacted`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contacted: checkbox.checked })
        });
        if (!response.ok) throw new Error('Failed to update lead');
      } catch (error) {
        console.error('Error updating lead status:', error);
        checkbox.checked = !checkbox.checked;
      }
    });

    const deleteButton = card.querySelector('.lead-delete-button');
    deleteButton?.addEventListener('click', async () => {
      if (!window.confirm('Delete this lead? This cannot be undone.')) return;

      try {
        const response = await fetch(`/leads/api/${lead.id}`, {
          method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete lead');
        loadLeads();
      } catch (error) {
        console.error('Error deleting lead:', error);
        alert('Could not delete lead. Please try again.');
      }
    });

    leadsList.appendChild(card);
  });
}

leadsSearch?.addEventListener('input', filterLeads);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && document.getElementById('leads-module')?.classList.contains('active')) {
    loadLeads();
  }
});
