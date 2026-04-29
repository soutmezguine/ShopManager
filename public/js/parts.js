// Parts Module
let currentEditingPartId = null;
let allPartsOrders = [];

const partsSearch = document.getElementById('parts-search');
const partsList = document.getElementById('parts-list');
const partsModal = document.getElementById('parts-modal');
const partsForm = document.getElementById('parts-form');
const btnAddPart = document.getElementById('btn-add-part');
const btnDeletePart = document.getElementById('btn-delete-part');

// Search functionality
partsSearch?.addEventListener('input', () => {
  filterPartsOrders();
});

// Add part button
btnAddPart?.addEventListener('click', () => {
  currentEditingPartId = null;
  resetPartsForm();
  document.querySelector('#parts-modal .modal-header h3').textContent = 'Add Parts Order';
  btnDeletePart.classList.add('hidden');
  openModal('parts-modal');
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
    checkNumber: document.getElementById('part-check').value || null
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
      loadPartsOrders();
    } else {
      showNotification('Error saving order', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification('Error saving order', 'error');
  }
});

// Delete button
btnDeletePart?.addEventListener('click', async () => {
  if (!confirm('Are you sure you want to delete this order?')) return;

  try {
    const response = await fetch(`/parts/api/${currentEditingPartId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showNotification('Order deleted');
      closeModal('parts-modal');
      loadPartsOrders();
    } else {
      showNotification('Error deleting order', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification('Error deleting order', 'error');
  }
});

async function loadPartsOrders() {
  try {
    const response = await fetch('/parts/api');
    if (!response.ok) throw new Error('Failed to load parts orders');
    
    allPartsOrders = await response.json();
    filterPartsOrders();
  } catch (error) {
    console.error('Error loading parts orders:', error);
    partsList.innerHTML = '<p style="text-align: center; color: #666;">Error loading orders</p>';
  }
}

function filterPartsOrders() {
  const searchTerm = partsSearch?.value.toLowerCase() || '';
  
  const filtered = allPartsOrders.filter(order => {
    const searchFields = [
      order.ro,
      order.parts_ordered,
      order.vendor,
      order.check_number
    ].join(' ').toLowerCase();
    
    return searchFields.includes(searchTerm);
  });

  renderPartsOrders(filtered);
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
    
    const costDisplay = order.cost ? `$${parseFloat(order.cost).toFixed(2)}` : 'N/A';
    const arrivalDisplay = order.arrival_date ? new Date(order.arrival_date).toLocaleDateString() : 'Pending';
    
    item.innerHTML = `
      <div class="parts-row-header">
        <div><strong>RO: ${order.ro}</strong></div>
        <div><strong>Vendor: ${order.vendor}</strong></div>
        <div><strong>Order Date: ${new Date(order.order_date).toLocaleDateString()}</strong></div>
      </div>
      <div class="parts-row-data">
        <div>Parts: ${order.parts_ordered.substring(0, 50)}${order.parts_ordered.length > 50 ? '...' : ''}</div>
        <div>Arrival: ${arrivalDisplay}</div>
        <div>Cost: ${costDisplay} ${order.check_number ? `| Check: ${order.check_number}` : ''}</div>
      </div>
    `;

    // Double click to edit
    item.addEventListener('dblclick', () => {
      editPart(order);
    });

    partsList.appendChild(item);
  });
}

async function editPart(order) {
  currentEditingPartId = order.id;
  
  document.getElementById('part-order-date').value = order.order_date;
  document.getElementById('part-ro').value = order.ro;
  document.getElementById('part-parts').value = order.parts_ordered;
  document.getElementById('part-vendor').value = order.vendor;
  document.getElementById('part-arrival').value = order.arrival_date || '';
  document.getElementById('part-cost').value = order.cost || '';
  document.getElementById('part-check').value = order.check_number || '';

  document.querySelector('#parts-modal .modal-header h3').textContent = 'Edit Parts Order';
  btnDeletePart.classList.remove('hidden');
  
  openModal('parts-modal');
}

function resetPartsForm() {
  partsForm.reset();
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('part-order-date').value = today;
  currentEditingPartId = null;
}
