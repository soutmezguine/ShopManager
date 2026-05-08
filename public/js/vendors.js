// Vendors Module
let currentEditingVendorId = null;
let allVendors = [];

const vendorSearch = document.getElementById('vendor-search');
const vendorList = document.getElementById('vendor-list');
const btnAddVendor = document.getElementById('btn-add-vendor');
const vendorForm = document.getElementById('vendor-form');
const btnDeleteVendor = document.getElementById('btn-delete-vendor');
const vendorPictureInput = document.getElementById('vendor-picture');
const vendorPictureData = document.getElementById('vendor-picture-data');
const vendorPicturePreview = document.getElementById('vendor-picture-preview');

vendorSearch?.addEventListener('input', () => {
  filterVendors();
});

btnAddVendor?.addEventListener('click', () => {
  currentEditingVendorId = null;
  resetVendorForm();
  document.querySelector('#vendor-modal .modal-header h3').textContent = 'Add Vendor';
  btnDeleteVendor.classList.add('hidden');
  openModal('vendor-modal');
});

vendorPictureInput?.addEventListener('change', () => {
  const file = vendorPictureInput.files[0];
  if (!file) {
    vendorPicturePreview.classList.add('hidden');
    vendorPictureData.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    vendorPictureData.value = reader.result;
    vendorPicturePreview.src = reader.result;
    vendorPicturePreview.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
});

vendorForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    picture: vendorPictureData.value || null,
    name: document.getElementById('vendor-name').value,
    address: document.getElementById('vendor-address').value,
    phone_number: document.getElementById('vendor-phone').value || null,
    email: document.getElementById('vendor-email').value || null,
    account_number: document.getElementById('vendor-account').value || null
  };

  try {
    let response;
    if (currentEditingVendorId) {
      response = await fetch(`/vendors/api/${currentEditingVendorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      response = await fetch('/vendors/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    if (response.ok) {
      showNotification(currentEditingVendorId ? 'Vendor updated' : 'Vendor added');
      closeModal('vendor-modal');
      resetVendorForm();
      loadVendors();
    } else {
      showNotification('Error saving vendor', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification('Error saving vendor', 'error');
  }
});

btnDeleteVendor?.addEventListener('click', async () => {
  if (!confirm('Delete this vendor?')) return;

  try {
    const response = await fetch(`/vendors/api/${currentEditingVendorId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showNotification('Vendor deleted');
      closeModal('vendor-modal');
      loadVendors();
    } else {
      showNotification('Error deleting vendor', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification('Error deleting vendor', 'error');
  }
});

async function loadVendors() {
  try {
    const response = await fetch('/vendors/api');
    if (!response.ok) throw new Error('Failed to load vendors');

    allVendors = await response.json();
    filterVendors();
  } catch (error) {
    console.error('Error loading vendors:', error);
    if (vendorList) {
      vendorList.innerHTML = '<p style="text-align: center; color: #999;">Error loading vendors</p>';
    }
  }
}

function filterVendors() {
  const searchTerm = vendorSearch?.value.toLowerCase() || '';
  const filtered = allVendors.filter(vendor => {
    const searchFields = [
      vendor.name,
      vendor.address,
      vendor.phone_number,
      vendor.email,
      vendor.account_number,
      vendor.created_by_name,
      vendor.created_by_username
    ].join(' ').toLowerCase();

    return searchFields.includes(searchTerm);
  });

  // Sort alphabetically by name
  filtered.sort((a, b) => a.name.localeCompare(b.name));

  renderVendors(filtered);
}

function renderVendors(vendors) {
  if (!vendorList) return;
  vendorList.innerHTML = '';

  if (vendors.length === 0) {
    vendorList.innerHTML = '<p style="text-align: center; color: #999;">No vendors found</p>';
    return;
  }

  vendors.forEach(vendor => {
    const card = document.createElement('div');
    card.className = 'vendor-card';

    const pictureHtml = vendor.picture ?
      `<div class="vendor-card-avatar"><img src="${vendor.picture}" alt="${vendor.name}"></div>` :
      `<div class="vendor-card-avatar vendor-card-avatar-empty">No image</div>`;

    card.innerHTML = `
      ${pictureHtml}
      <div class="vendor-card-body">
        <div class="vendor-card-row"><strong>${vendor.name}</strong></div>
        <div class="vendor-card-row">${vendor.address}</div>
        <div class="vendor-card-row">${vendor.phone_number || 'No phone'}</div>
        <div class="vendor-card-row">${vendor.email || 'No email'}</div>
        <div class="vendor-card-row vendor-card-meta">Added by: ${vendor.created_by_name || vendor.created_by_username || 'Unknown'}</div>
      </div>
    `;

    card.addEventListener('dblclick', () => {
      editVendor(vendor);
    });

    vendorList.appendChild(card);
  });
}

function editVendor(vendor) {
  currentEditingVendorId = vendor.id;
  document.getElementById('vendor-name').value = vendor.name || '';
  document.getElementById('vendor-address').value = vendor.address || '';
  document.getElementById('vendor-phone').value = vendor.phone_number || '';
  document.getElementById('vendor-email').value = vendor.email || '';
  document.getElementById('vendor-account').value = vendor.account_number || '';
  vendorPictureData.value = vendor.picture || '';

  if (vendor.picture) {
    vendorPicturePreview.src = vendor.picture;
    vendorPicturePreview.classList.remove('hidden');
  } else {
    vendorPicturePreview.classList.add('hidden');
  }

  document.querySelector('#vendor-modal .modal-header h3').textContent = 'Edit Vendor';
  btnDeleteVendor.classList.remove('hidden');
  openModal('vendor-modal');
}

function resetVendorForm() {
  vendorForm.reset();
  vendorPictureData.value = '';
  if (vendorPicturePreview) {
    vendorPicturePreview.src = '';
    vendorPicturePreview.classList.add('hidden');
  }
  currentEditingVendorId = null;
}

function openVendorModal() {
  currentEditingVendorId = null;
  resetVendorForm();
  document.querySelector('#vendor-modal .modal-header h3').textContent = 'Add Vendor';
  btnDeleteVendor.classList.add('hidden');
  openModal('vendor-modal');
}

setInterval(() => {
  loadVendors();
}, 300000);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    loadVendors();
  }
});
