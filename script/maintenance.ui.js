// ===== RENDER STAFF LIST =====
function renderStaffList(staffToRender = filteredStaff) {
  const staffList = document.getElementById('staffList');
  const assignBtn = document.getElementById('confirmStaffAssignBtn');
  if (!staffList) return;

  selectedStaffId = null;
  if (assignBtn) assignBtn.disabled = true;

  if (staffToRender.length === 0) {
    staffList.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No maintenance staff found.</div>';
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
    item.addEventListener('click', () => {
        // 1. Reset all items
        staffList.querySelectorAll('.staffListItem').forEach(i => {
            i.classList.remove('selected');
            i.style.backgroundColor = ''; 
            i.style.border = '';          
        });

        // 2. Highlight selected item (Darker Gray)
        item.classList.add('selected');
        item.style.backgroundColor = '#cccccc'; // Changed to a darker gray
        item.style.border = '1px solid #999';   
        
        // 3. Update State
        selectedStaffId = parseInt(item.dataset.staffId);
        if (assignBtn) assignBtn.disabled = false;
    });
  });
}

function filterStaffInModal() {
  const search = document.getElementById('staffModalSearchInput')?.value.toLowerCase() || '';
  filteredStaff = currentStaffData.filter(staff => {
    const nameMatch = staff.name.toLowerCase().includes(search);
    const idMatch = staff.id.toString().toLowerCase().includes(search);
    return nameMatch || idMatch;
  });
  renderStaffList();
}

// ===== MODAL VISIBILITY =====
function showIssueTypeModal() {
    document.getElementById('issueTypeModal').style.display = 'flex';
}
function hideIssueTypeModal() {
    document.getElementById('issueTypeModal').style.display = 'none';
}

function showStaffModal() {
    selectedStaffId = null;
    document.getElementById('staffModalSearchInput').value = '';
    filteredStaff = [...currentStaffData];
    renderStaffList();
    document.getElementById('staffModal').style.display = 'flex';
}
function hideStaffModal() {
    document.getElementById('staffModal').style.display = 'none';
}

function showEditRoomStatusModal() {
    document.getElementById('editRoomStatusModal').style.display = 'flex';
}
function hideEditRoomStatusModal() {
    document.getElementById('editRoomStatusModal').style.display = 'none';
}

function showAddHotelAssetModal(isEdit = false, assetData = null) { 
  const modal = document.getElementById('addHotelAssetModal');
  const modalTitle = document.getElementById('addHotelAssetModalTitle');
  const modalSubtext = document.getElementById('addHotelAssetModalSubtext');
  const submitBtn = document.getElementById('submitHotelAssetBtn');
  
  modalSubtext.classList.remove('modal-error-message');
  modalSubtext.style.color = ''; 
  
  const inputs = {
    floor: document.getElementById('hotelAssetFloor'),
    room: document.getElementById('hotelAssetRoom'),
    name: document.getElementById('hotelAssetName'),
    type: document.getElementById('hotelAssetType'),
    manufacturer: document.getElementById('hotelAssetManufacturer'),
    modelNumber: document.getElementById('hotelAssetModelNumber'),
    installedDate: document.getElementById('hotelAssetInstalledDate'),
    status: document.getElementById('hotelAssetStatus'),
    remarks: document.getElementById('hotelAssetRemarks')
  };

  const statusGroup = document.getElementById('formGroup-status');
  const remarksGroup = document.getElementById('formGroup-remarks');

  if (isEdit && assetData) {
    modalTitle.textContent = 'Edit Hotel Asset';
    modalSubtext.textContent = 'Update the status and remarks for this asset.';
    submitBtn.textContent = 'UPDATE ASSET';
    
    document.getElementById('hotelAssetId').value = assetData.id;
    
    populateHotelAssetFloorDropdown(); 
    inputs.floor.value = assetData.floor;
    inputs.floor.disabled = false; 
    
    updateHotelAssetRoomDropdown(); 
    inputs.room.value = assetData.roomId; 
    inputs.room.disabled = false;
    
    inputs.name.value = assetData.item;
    inputs.name.disabled = false;
    
    populateHotelAssetTypeDropdown(); 
    inputs.type.value = assetData.type;
    inputs.type.disabled = false;
    
    inputs.manufacturer.value = assetData.manufacturer || '';
    inputs.manufacturer.disabled = false;
    inputs.modelNumber.value = assetData.modelNumber || '';
    inputs.modelNumber.disabled = false;
    inputs.installedDate.value = convertDisplayDateToISO(assetData.installedDate);
    inputs.installedDate.disabled = false;

    statusGroup.style.display = 'flex';
    inputs.status.value = assetData.status || 'Working';
    inputs.status.disabled = false;
    inputs.status.required = true;
    
    remarksGroup.style.display = 'flex';
    inputs.remarks.value = assetData.remarks || '';
    inputs.remarks.disabled = false;
    
  } else {
    modalTitle.textContent = 'Add Hotel Asset';
    modalSubtext.textContent = 'Please fill out the asset details carefully.';
    submitBtn.textContent = 'ADD ASSET';
    
    document.getElementById('hotelAssetId').value = '';
    document.getElementById('addHotelAssetForm').reset();
    
    Object.values(inputs).forEach(input => input.disabled = false);

    statusGroup.style.display = 'none';
    inputs.status.disabled = true;
    inputs.status.required = false;
    remarksGroup.style.display = 'none';
    inputs.remarks.disabled = true;

    populateHotelAssetFloorDropdown(); 
    updateHotelAssetRoomDropdown(); 
    populateHotelAssetTypeDropdown(); 
  }
  
  modal.style.display = 'flex';
}


function hideAddHotelAssetModal() { 
  document.getElementById('addHotelAssetModal').style.display = 'none';
  document.getElementById('addHotelAssetForm').reset();
  
  const inputs = document.querySelectorAll('#addHotelAssetForm .formInput');
  inputs.forEach(input => input.disabled = false);
  
  const modalSubtext = document.getElementById('addHotelAssetModalSubtext');
  modalSubtext.textContent = 'Please fill out the asset details carefully...';
  modalSubtext.classList.remove('modal-error-message');
  modalSubtext.style.color = '';
  
  document.getElementById('formGroup-status').style.display = 'none';
  document.getElementById('formGroup-remarks').style.display = 'none';
}

function showSuccessModal(message) {
  document.getElementById('successModalMessage').textContent = message;
  document.getElementById('successModal').style.display = 'flex';
}

function hideSuccessModal() {
  document.getElementById('successModal').style.display = 'none';
}

function showDeleteModal() {
  document.getElementById('deleteModal').style.display = 'flex';
}

function hideDeleteModal() {
  document.getElementById('deleteModal').style.display = 'none';
  currentHotelAssetId = null; 
}

// ===== MODAL FORM POPULATION =====
function populateHotelAssetFloorDropdown() { 
  const floorSelect = document.getElementById('hotelAssetFloor');
  floorSelect.innerHTML = '<option value="">Select Floor</option>';
  
  const floors = [...new Set(allRooms.map(r => r.floor))].sort((a, b) => a - b);
  
  floors.forEach(floor => {
    const option = document.createElement('option');
    option.value = floor;
    option.textContent = floor;
    floorSelect.appendChild(option);
  });
}

function updateHotelAssetRoomDropdown() { 
  const floorSelect = document.getElementById('hotelAssetFloor');
  const roomSelect = document.getElementById('hotelAssetRoom');
  const selectedFloor = floorSelect.value;
  
  roomSelect.innerHTML = '<option value="">Select Room</option>';
  if (!selectedFloor) return;
  
  const rooms = allRooms.filter(r => r.floor.toString() === selectedFloor);
  
  rooms.forEach(room => {
    const option = document.createElement('option');
    option.value = room.id; // The value is the crm.rooms.RoomID
    option.textContent = room.room; // The text is the RoomNumber
    roomSelect.appendChild(option);
  });
}

function populateHotelAssetTypeDropdown() { 
    const typeSelect = document.getElementById('hotelAssetType');
    while (typeSelect.options.length > 1) {
        typeSelect.remove(1);
    }
    
    hotelAssetsTypes.forEach(type => { 
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeSelect.appendChild(option);
    });
}