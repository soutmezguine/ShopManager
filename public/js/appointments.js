// Appointments Module
let currentView = 'daily';
let currentEditingAppointmentId = null;

const appointmentDateInput = document.getElementById('appointment-date');
const viewBtns = document.querySelectorAll('.view-btn');
const appointmentsList = document.getElementById('appointments-list');
const appointmentModal = document.getElementById('appointment-modal');
const appointmentForm = document.getElementById('appointment-form');
const btnAddAppointment = document.getElementById('btn-add-appointment');
const btnDeleteApt = document.getElementById('btn-delete-apt');

// View controls
viewBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    viewBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentView = btn.dataset.view;
    loadAppointments();
  });
});

appointmentDateInput?.addEventListener('change', () => {
  loadAppointments();
});

// Add appointment button
btnAddAppointment?.addEventListener('click', () => {
  currentEditingAppointmentId = null;
  resetAppointmentForm();
  document.getElementById('modal-title').textContent = 'Add Appointment';
  btnDeleteApt.classList.add('hidden');
  openModal('appointment-modal');
});

// Form submission
appointmentForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const appointmentData = {
    appointmentDate: document.getElementById('apt-date').value,
    appointmentTime: document.getElementById('apt-time').value,
    customerName: document.getElementById('apt-customer').value,
    phoneNumber: document.getElementById('apt-phone').value,
    vehicleYear: document.getElementById('apt-year').value || null,
    vehicleMake: document.getElementById('apt-make').value,
    vehicleModel: document.getElementById('apt-model').value,
    serviceRequired: document.getElementById('apt-service').value
  };

  try {
    let response;
    if (currentEditingAppointmentId) {
      response = await fetch(`/appointments/api/${currentEditingAppointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData)
      });
    } else {
      response = await fetch('/appointments/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData)
      });
    }

    if (response.ok) {
      showNotification(currentEditingAppointmentId ? 'Appointment updated' : 'Appointment created');
      closeModal('appointment-modal');
      resetAppointmentForm();
      loadAppointments();
    } else {
      showNotification('Error saving appointment', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification('Error saving appointment', 'error');
  }
});

// Delete button
btnDeleteApt?.addEventListener('click', async () => {
  if (!confirm('Are you sure you want to delete this appointment?')) return;

  try {
    const response = await fetch(`/appointments/api/${currentEditingAppointmentId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showNotification('Appointment deleted');
      closeModal('appointment-modal');
      loadAppointments();
    } else {
      showNotification('Error deleting appointment', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification('Error deleting appointment', 'error');
  }
});

async function loadAppointments() {
  const selectedDate = appointmentDateInput?.valueAsDate || new Date();
  const dateStr = selectedDate.toISOString().split('T')[0];

  try {
    const response = await fetch(`/appointments/api/${currentView}?date=${dateStr}`);
    if (!response.ok) throw new Error('Failed to load appointments');
    
    const appointments = await response.json();
    renderAppointments(appointments);
  } catch (error) {
    console.error('Error loading appointments:', error);
    appointmentsList.innerHTML = '<p style="text-align: center; color: #666;">Error loading appointments</p>';
  }
}

function renderAppointments(appointments) {
  appointmentsList.innerHTML = '';

  if (appointments.length === 0) {
    appointmentsList.innerHTML = '<p style="text-align: center; color: #999;">No appointments found</p>';
    return;
  }

  appointments.forEach(apt => {
    const item = document.createElement('div');
    item.className = 'appointment-item';
    item.innerHTML = `
      <h4>${apt.customer_name}</h4>
      <div class="appointment-item-meta">
        <strong>${apt.appointment_date}</strong> at <strong>${apt.appointment_time}</strong>
      </div>
      ${apt.phone_number ? `<div class="appointment-item-meta">📱 ${apt.phone_number}</div>` : ''}
      ${apt.vehicle_year || apt.vehicle_make || apt.vehicle_model ? 
        `<div class="appointment-item-vehicle">${apt.vehicle_year || ''} ${apt.vehicle_make || ''} ${apt.vehicle_model || ''}</div>` 
        : ''}
      <div class="appointment-item-meta" style="margin-top: 8px; font-style: italic;">
        ${apt.service_required.substring(0, 100)}${apt.service_required.length > 100 ? '...' : ''}
      </div>
    `;

    // Double click to edit
    item.addEventListener('dblclick', () => {
      editAppointment(apt);
    });

    appointmentsList.appendChild(item);
  });
}

async function editAppointment(apt) {
  currentEditingAppointmentId = apt.id;
  
  document.getElementById('apt-date').value = apt.appointment_date;
  document.getElementById('apt-time').value = apt.appointment_time;
  document.getElementById('apt-customer').value = apt.customer_name;
  document.getElementById('apt-phone').value = apt.phone_number || '';
  document.getElementById('apt-year').value = apt.vehicle_year || '';
  document.getElementById('apt-make').value = apt.vehicle_make || '';
  document.getElementById('apt-model').value = apt.vehicle_model || '';
  document.getElementById('apt-service').value = apt.service_required;

  document.getElementById('modal-title').textContent = 'Edit Appointment';
  btnDeleteApt.classList.remove('hidden');
  
  openModal('appointment-modal');
}

function resetAppointmentForm() {
  appointmentForm.reset();
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('apt-date').value = today;
  currentEditingAppointmentId = null;
}

function openAppointmentModal() {
  currentEditingAppointmentId = null;
  resetAppointmentForm();
  document.getElementById('modal-title').textContent = 'Add Appointment';
  btnDeleteApt.classList.add('hidden');
  openModal('appointment-modal');
}
