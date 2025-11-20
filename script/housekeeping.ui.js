// ===== RENDER STAFF LIST =====
function renderStaffList(staffToRender = filteredStaff) {
  const staffList = document.getElementById('staffList');
  const assignBtn = document.getElementById('confirmStaffAssignBtn');
  if (!staffList) return;

  selectedStaffId = null;
  if (assignBtn) assignBtn.disabled = true;

  if (staffToRender.length === 0) {
    staffList.innerHTML = '<div style=\"text-align: center; padding: 20px; color: #666;\">No housekeeping staff found.</div>'; // MODIFIED
    return;
  }

  staffList.innerHTML = staffToRender.map(staff => {
    const statusClass = staff.availability.toLowerCase().replace(/ /g, '-'); 
    const isClickable = staff.availability === 'Available' ? 'clickable' : 'offline';
    
    return `
      <div class="staffListItem ${isClickable}" data-staff-id="${staff.id}" data-availability="${staff.availability}">
        <div class="staffListName">${staff.name}</div>
        <span class="staffListStatus ${statusClass}">${staff.availability}</span>
      </div>
    `;
  }).join('');

  staffList.querySelectorAll('.staffListItem.clickable').forEach(item => {
    item.addEventListener('click', () => handleStaffItemClick(item, staffList, assignBtn));
  });
}

function handleStaffItemClick(item, staffList, assignBtn) {
    staffList.querySelectorAll('.staffListItem').forEach(i => i.classList.remove('selected'));
    item.classList.add('selected');
    selectedStaffId = parseInt(item.dataset.staffId);
    if (assignBtn) assignBtn.disabled = false;
}

// ===== FILTER STAFF LIST =====
function applyStaffFilterAndRender() {
  const search = document.getElementById('staffModalSearchInput').value.toLowerCase();
  filteredStaff = currentStaffData.filter(staff => 
    staff.name.toLowerCase().includes(search)
  );
  
  // Sort: Available first, then by name
  filteredStaff.sort((a, b) => {
    if (a.availability === 'Available' && b.availability !== 'Available') return -1;
    if (a.availability !== 'Available' && b.availability === 'Available') return 1;
    return a.name.localeCompare(b.name);
  });
  
  renderStaffList(filteredStaff);
}

// ===== MODAL VISIBILITY CONTROLS =====

function showStaffModal() {
  document.getElementById('staffModal').style.display = 'flex';
}
function hideStaffModal() {
  document.getElementById('staffModal').style.display = 'none';
}

function showTaskTypeModal() { // MODIFIED
  document.getElementById('taskTypeModal').style.display = 'flex'; // MODIFIED
}
function hideTaskTypeModal() { // MODIFIED
  document.getElementById('taskTypeModal').style.display = 'none'; // MODIFIED
}

function showEditRoomStatusModal(view = 'normal') {
    const modal = document.getElementById('editRoomStatusModal');
    if (view === 'error-view') {
        modal.classList.add('error-view');
    } else {
        modal.classList.remove('error-view');
        document.getElementById('editRoomStatusErrorMessage').textContent = '';
    }
    modal.style.display = 'flex';
}
function hideEditRoomStatusModal() {
  document.getElementById('editRoomStatusModal').style.display = 'none';
}

function showConfirmModal(title, text, callback) {
  document.getElementById('confirmModalTitle').textContent = title;
  document.getElementById('confirmModalText').textContent = text;
  confirmCallback = callback;
  document.getElementById('confirmModal').style.display = 'flex';
}
function hideConfirmModal() {
  document.getElementById('confirmModal').style.display = 'none';
  confirmCallback = null;
}

function showSuccessModal(message) {
  document.getElementById('successModalMessage').textContent = message;
  document.getElementById('successModal').style.display = 'flex';
}
function hideSuccessModal() {
  document.getElementById('successModal').style.display = 'none';
}

function showErrorModal(message) {
    // Re-using success modal for error display, simple alert is also fine
    alert(message);
}