// Parts Module
let currentEditingPartId = null;
let currentEditingReturnId = null;
let currentPartsView = 'orders';
let allPartsOrders = [];
let allReturnOrders = [];

const partsSearch = document.getElementById('parts-search');
const partsList = document.getElementById('parts-list');
const partsModal = document.getElementById('parts-modal');
const returnsModal = document.getElementById('returns-modal');
const partsForm = document.getElementById('parts-form');
const returnsForm = document.getElementById('returns-form');
const btnAddPart = document.getElementById('btn-add-part');
const btnDeletePart = document.getElementById('btn-delete-part');
const btnDeleteReturn = document.getElementById('btn-delete-return');
const partsTabButtons = document.querySelectorAll('.parts-tab');

function normalizeDateValue(dateString) {
  if (!dateString) return '';
  const dateOnly = dateString.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    return dateOnly;
  }
  const parsed = new Date(dateOnly);
  if (Number.isNaN(parsed.getTime())) {
    return dateString;
  }
  return parsed.toISOString().split('T')[0];
}

function formatDisplayDate(dateString) {
  if (!dateString) return 'Pending';
  const dateOnly = dateString.split('T')[0];
  const [year, month, day] = dateOnly.split('-');
  if (!year || !month || !day) return dateString;
  return new Date(year, month - 1, day).toLocaleDateString();
}

partsSearch?.addEventListener('input', () => {
  filterOrders();
});

btnAddPart?.addEventListener('click', () => {
  if (currentPartsView === 'orders') {
    openPartsModal();
  } else {
    openReturnsModal();
  }
});

btnDeletePart?.addEventListener('click', async () => {
  if (!confirm('Are you sure you want to delete this order?')) return;

  try {
    const response = await fetch(`/parts/api/${currentEditingPartId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showNotification('Order deleted');
      closeModal('parts-modal');
      loadCurrentPartsView();
    } else {
      showNotification('Error deleting order', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification('Error deleting order', 'error');
  }
});

btnDeleteReturn?.addEventListener('click', async () => {
  if (!confirm('Are you sure you want to delete this return?')) return;

  try {
    const response = await fetch(`/returns/api/${currentEditingReturnId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showNotification('Return deleted');
      closeModal('returns-modal');
      loadCurrentPartsView();
    } else {
      showNotification('Error deleting return', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification('Error deleting return', 'error');
  }
});

partsTabButtons.forEach(button => {
  button.addEventListener('click', () => {
    currentPartsView = button.dataset.partView;
    partsTabButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.partView === currentPartsView));
    if (btnAddPart) {
      btnAddPart.textContent = currentPartsView === 'orders' ? '+ Add Order' : '+ Add Return';
    }
    loadCurrentPartsView();
  });
});

// Form submission
partsForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const partsData = {
    orderDate: document.getElementById('part-order-date').value,
    ro: document.getElementById('part-ro').value,
    partsOrdered: document.getElementById('part-parts').value,
    vendor: document.getElementById('part-vendor').value,
    arrivalDate: document.getElementById('part-arrival').value || null,
    cost: document.getElementById('part-cost').value || null,
    checkNumber: document.getElementById('part-check').value || null,
    repName: document.getElementById('part-rep-name').value || null,
    status: document.getElementById('part-status').value || 'Pending'
  };

  try {
    let response;
    if (currentEditingPartId) {
      response = await fetch(`/parts/api/${currentEditingPartId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partsData)
      });
    } else {
      response = await fetch('/parts/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partsData)
      });
    }

    if (response.ok) {
      showNotification(currentEditingPartId ? 'Order updated' : 'Order created');
      closeModal('parts-modal');
      resetPartsForm();
      loadCurrentPartsView();
    } else {
      showNotification('Error saving order', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification('Error saving order', 'error');
  }
});

returnsForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const returnData = {
    returnDate: document.getElementById('return-date').value,
    vendor: document.getElementById('return-vendor').value,
    partsReturned: document.getElementById('return-parts').value,
    status: document.getElementById('return-status').value || 'Pending'
  };

  try {
    let response;
    if (currentEditingReturnId) {
      response = await fetch(`/returns/api/${currentEditingReturnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnData)
      });
    } else {
      response = await fetch('/returns/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnData)
      });
    }

    if (response.ok) {
      showNotification(currentEditingReturnId ? 'Return updated' : 'Return created');
      closeModal('returns-modal');
      resetReturnsForm();
      loadCurrentPartsView();
    } else {
      showNotification('Error saving return', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification('Error saving return', 'error');
  }
});

async function loadPartsOrders() {
  try {
    const response = await fetch('/parts/api');
    if (!response.ok) throw new Error('Failed to load parts orders');

    allPartsOrders = await response.json();
    filterOrders();
    updateRefreshTimestamp();
  } catch (error) {
    console.error('Error loading parts orders:', error);
    partsList.innerHTML = '<p style="text-align: center; color: #666;">Error loading orders</p>';
  }
}

async function loadReturnOrders() {
  try {
    const response = await fetch('/returns/api');
    if (!response.ok) throw new Error('Failed to load returns');

    allReturnOrders = await response.json();
    filterOrders();
    updateRefreshTimestamp();
  } catch (error) {
    console.error('Error loading returns:', error);
    partsList.innerHTML = '<p style="text-align: center; color: #666;">Error loading returns</p>';
  }
}

function loadCurrentPartsView() {
  if (currentPartsView === 'orders') {
    loadPartsOrders();
  } else {
    loadReturnOrders();
  }
}

function updateRefreshTimestamp() {
  const timestampEl = document.getElementById('parts-refresh-timestamp');
  if (!timestampEl) return;
  const now = new Date();
  timestampEl.textContent = `Last refreshed: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

setInterval(() => {
  loadCurrentPartsView();
}, 300000);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    loadCurrentPartsView();
  }
});

function filterOrders() {
  if (currentPartsView === 'orders') {
    filterPartsOrders();
  } else {
    filterReturnOrders();
  }
}

function filterPartsOrders() {
  const searchTerm = partsSearch?.value.toLowerCase() || '';
  const filtered = allPartsOrders.filter(order => {
    const searchFields = [
      order.ro,
      order.parts_ordered,
      order.vendor,
      order.check_number,
      order.rep_name,
      order.ordered_by_name,
      order.ordered_by_username
    ].join(' ').toLowerCase();

    return searchFields.includes(searchTerm);
  });

  renderPartsOrders(filtered);
}

function filterReturnOrders() {
  const searchTerm = partsSearch?.value.toLowerCase() || '';
  const filtered = allReturnOrders.filter(order => {
    const searchFields = [
      order.vendor,
      order.parts_returned,
      order.status,
      order.created_by_name,
      order.created_by_username
    ].join(' ').toLowerCase();

    return searchFields.includes(searchTerm);
  });

  const sorted = filtered.slice().sort((a, b) => {
    const rank = status => status === 'Pending' ? 0 : status === 'Picked Up' ? 1 : 2;
    const statusDiff = rank(a.status) - rank(b.status);
    if (statusDiff !== 0) return statusDiff;
    return (b.return_date || '').localeCompare(a.return_date || '');
  });

  renderReturnOrders(sorted);
}

function renderPartsOrders(orders) {
  partsList.innerHTML = '';

  if (orders.length === 0) {
    partsList.innerHTML = '<p style="text-align: center; color: #999;">No orders found</p>';
    return;
  }

  orders.forEach(order => {
    const item = document.createElement('div');
    item.className = 'parts-row';

    let statusColor = '#f0f0f0';
    switch (order.status) {
      case 'Pending':
        statusColor = '#FFFF99';
        break;
      case 'Arrived':
        statusColor = '#99FF99';
        break;
      case 'Delayed':
        statusColor = '#FFCC99';
        break;
      case 'Cancelled':
        statusColor = '#FF9999';
        break;
    }
    item.style.backgroundColor = statusColor;

    const costDisplay = order.cost ? `$${parseFloat(order.cost).toFixed(2)}` : 'N/A';
    const arrivalDisplay = order.arrival_date ? formatDisplayDate(order.arrival_date) : 'Pending';
    const orderedByDisplay = order.ordered_by_name || order.ordered_by_username || 'Unknown';

    item.innerHTML = `
      <div class="parts-row-header">
        <div><strong>RO: ${order.ro}</strong></div>
        <div><strong>Vendor: ${order.vendor}</strong></div>
        <div><strong>Order Date: ${formatDisplayDate(order.order_date)}</strong></div>
        <div><strong>Status: ${order.status || 'Pending'}</strong></div>
      </div>
      <div class="parts-row-data">
        <div>Parts: ${order.parts_ordered.substring(0, 50)}${order.parts_ordered.length > 50 ? '...' : ''}</div>
        <div>Arrival: ${arrivalDisplay}</div>
        <div>Cost: ${costDisplay} ${order.check_number ? `| Check: ${order.check_number}` : ''}</div>
        <div>Ordered by: <strong>${orderedByDisplay}</strong></div>
        ${order.rep_name ? `<div>Rep: ${order.rep_name}</div>` : ''}
      </div>
    `;

    item.addEventListener('dblclick', () => {
      editPart(order);
    });

    partsList.appendChild(item);
  });
}

function renderReturnOrders(orders) {
  partsList.innerHTML = '';

  if (orders.length === 0) {
    partsList.innerHTML = '<p style="text-align: center; color: #999;">No returns found</p>';
    return;
  }

  orders.forEach(order => {
    const item = document.createElement('div');
    item.className = 'parts-row';

    const statusColor = order.status === 'Picked Up' ? '#99FF99' : '#FFFF99';
    item.style.backgroundColor = statusColor;

    const createdByDisplay = order.created_by_name || order.created_by_username || 'Unknown';

    item.innerHTML = `
      <div class="parts-row-header">
        <div><strong>Vendor: ${order.vendor}</strong></div>
        <div><strong>Return Date: ${formatDisplayDate(order.return_date)}</strong></div>
        <div><strong>Status: ${order.status || 'Pending'}</strong></div>
      </div>
      <div class="parts-row-data">
        <div>Parts: ${order.parts_returned.substring(0, 50)}${order.parts_returned.length > 50 ? '...' : ''}</div>
        <div>Created by: <strong>${createdByDisplay}</strong></div>
      </div>
    `;

    item.addEventListener('dblclick', () => {
      editReturn(order);
    });

    partsList.appendChild(item);
  });
}

function editPart(order) {
  currentEditingPartId = order.id;

  document.getElementById('part-order-date').value = normalizeDateValue(order.order_date);
  document.getElementById('part-ro').value = order.ro;
  document.getElementById('part-parts').value = order.parts_ordered;
  document.getElementById('part-vendor').value = order.vendor;
  document.getElementById('part-arrival').value = order.arrival_date ? normalizeDateValue(order.arrival_date) : '';
  document.getElementById('part-cost').value = order.cost || '';
  document.getElementById('part-check').value = order.check_number || '';
  document.getElementById('part-rep-name').value = order.rep_name || '';
  document.getElementById('part-status').value = order.status || 'Pending';

  document.querySelector('#parts-modal .modal-header h3').textContent = 'Edit Parts Order';
  btnDeletePart.classList.remove('hidden');
  openModal('parts-modal');
}

function editReturn(order) {
  currentEditingReturnId = order.id;

  document.getElementById('return-date').value = normalizeDateValue(order.return_date);
  document.getElementById('return-vendor').value = order.vendor;
  document.getElementById('return-parts').value = order.parts_returned;
  document.getElementById('return-status').value = order.status || 'Pending';

  document.querySelector('#returns-modal .modal-header h3').textContent = 'Edit Return';
  btnDeleteReturn.classList.remove('hidden');
  openModal('returns-modal');
}

function resetPartsForm() {
  partsForm.reset();
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('part-order-date').value = today;
  document.getElementById('part-status').value = 'Pending';
  currentEditingPartId = null;
}

function resetReturnsForm() {
  returnsForm.reset();
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('return-date').value = today;
  document.getElementById('return-status').value = 'Pending';
  currentEditingReturnId = null;
}

function openCurrentPartsModal() {
  if (currentPartsView === 'orders') {
    openPartsModal();
  } else {
    openReturnsModal();
  }
}

function openPartsModal() {
  currentEditingPartId = null;
  resetPartsForm();
  document.querySelector('#parts-modal .modal-header h3').textContent = 'Add Parts Order';
  btnDeletePart?.classList.add('hidden');
  openModal('parts-modal');
}

function openReturnsModal() {
  currentEditingReturnId = null;
  resetReturnsForm();
  document.querySelector('#returns-modal .modal-header h3').textContent = 'Add Return';
  btnDeleteReturn?.classList.add('hidden');
  openModal('returns-modal');
}
