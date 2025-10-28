// ===== HOUSEKEEPING DETAILS PAGE SCRIPT =====

// ===== MAINTENANCE CHECKBOX TOGGLE =====
const maintenanceCheck = document.getElementById('maintenanceCheck');
const maintenanceDropdowns = document.getElementById('maintenanceDropdowns');
const issueSection = document.getElementById('issueSection');

maintenanceCheck.addEventListener('change', function() {
  if (this.checked) {
    maintenanceDropdowns.classList.add('active');
    issueSection.classList.add('active');
  } else {
    maintenanceDropdowns.classList.remove('active');
    issueSection.classList.remove('active');
  }
});

// ===== MODAL FUNCTIONALITY =====
const doneBtn = document.getElementById('doneBtn');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalCancel = document.getElementById('modalCancel');
const modalSave = document.getElementById('modalSave');

// Open modal when Done button is clicked
doneBtn.addEventListener('click', () => {
  modalBackdrop.classList.add('active');
});

// Close modal when Cancel button is clicked
modalCancel.addEventListener('click', () => {
  modalBackdrop.classList.remove('active');
});

// Close modal when clicking outside
modalBackdrop.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) {
    modalBackdrop.classList.remove('active');
  }
});

// Save and close modal
modalSave.addEventListener('click', () => {
  // Get form data
  const formData = getFormData();
  
  // Validate required fields
  if (!validateForm(formData)) {
    alert('⚠️ Please fill in all required fields!');
    return;
  }
  
  // Save data (you would send this to your backend)
  console.log('Saving data:', formData);
  
  alert('✅ Task marked as complete!');
  modalBackdrop.classList.remove('active');
  
  // Here you would typically:
  // 1. Send data to backend API
  // 2. Redirect to housekeeping list page
  // Example:
  // window.location.href = 'housekeeping.html';
});

// ===== IN PROGRESS BUTTON =====
const inProgressBtn = document.getElementById('inProgressBtn');

inProgressBtn.addEventListener('click', () => {
  const formData = getFormData();
  
  console.log('Setting status to In Progress:', formData);
  
  alert('📋 Task marked as In Progress!');
  
  // Here you would typically:
  // 1. Update status in backend
  // 2. Optionally redirect back to list
  // Example:
  // window.location.href = 'housekeeping.html';
});

// ===== HELPER FUNCTIONS =====

/**
 * Get all form data
 */
function getFormData() {
  const remarks = document.querySelector('.remarks-textarea').value;
  const isMaintenance = maintenanceCheck.checked;
  
  const data = {
    room: document.querySelector('.detail-row:nth-child(1) .detail-value').textContent,
    guest: document.querySelector('.detail-row:nth-child(2) .detail-value').textContent,
    date: document.querySelector('.detail-row:nth-child(3) .detail-value').textContent,
    requestTime: document.querySelector('.detail-row:nth-child(4) .detail-value').textContent,
    status: document.querySelector('.detail-row:nth-child(5) .detail-value').textContent,
    remarks: remarks,
    maintenance: isMaintenance
  };
  
  // If maintenance is checked, get maintenance details
  if (isMaintenance) {
    data.workType = document.getElementById('workType').value;
    data.unitType = document.getElementById('unitType').value;
    data.issueDescription = document.querySelector('.issue-textarea').value;
  }
  
  return data;
}

/**
 * Validate form data
 */
function validateForm(data) {
  // If maintenance is checked, validate maintenance fields
  if (data.maintenance) {
    if (!data.workType || !data.unitType || !data.issueDescription) {
      return false;
    }
  }
  
  return true;
}

/**
 * Initialize page with data (call this when page loads with data from URL params or API)
 */
function initializePageData(requestData) {
  if (!requestData) return;
  
  // Set room details
  if (requestData.room) {
    document.querySelector('.detail-row:nth-child(1) .detail-value').textContent = requestData.room;
  }
  if (requestData.guest) {
    document.querySelector('.detail-row:nth-child(2) .detail-value').textContent = requestData.guest;
  }
  if (requestData.date) {
    document.querySelector('.detail-row:nth-child(3) .detail-value').textContent = requestData.date;
  }
  if (requestData.requestTime) {
    document.querySelector('.detail-row:nth-child(4) .detail-value').textContent = requestData.requestTime;
  }
  if (requestData.status) {
    document.querySelector('.detail-row:nth-child(5) .detail-value').textContent = requestData.status;
  }
}

// ===== PAGE INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('Maintenance Details page loaded');
  
  // Example: Get data from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const room = urlParams.get('room');
  
  if (room) {
    // You would typically fetch the full request data from your backend here
    // Example:
    // fetch(`/api/housekeeping/request/${room}`)
    //   .then(res => res.json())
    //   .then(data => initializePageData(data));
    
    console.log('Loading data for room:', room);
  }
  
  // Example of setting initial data (replace with actual data from your backend)
  // initializePageData({
  //   room: '101',
  //   guest: '001',
  //   date: '10/25/25',
  //   requestTime: '2:30 PM',
  //   status: 'Dirty / Unoccupied'
  // });
});