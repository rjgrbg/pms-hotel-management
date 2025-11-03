// ===== GLOBAL VARIABLES =====
let currentRequestsData = [];
let currentStaffData = [];
let currentHistoryData = [];
let currentLinensData = [];
let allRooms = [];
let linensTypes = [];
let amenitiesTypes = [];

let filteredRequests = [];
let filteredStaff = [];
let filteredHistory = [];
let filteredLinens = [];

let selectedStaffId = null;
let currentRequestId = null;
let currentSubTab = 'linens'; // 'linens' or 'amenities'
let currentItemId = null; // For edit/delete operations
let pendingAction = null; // For confirmation modal

// Pagination State
const paginationState = {
  requests: { currentPage: 1, itemsPerPage: 10 },
  history: { currentPage: 1, itemsPerPage: 10 },
  linens: { currentPage: 1, itemsPerPage: 10 }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  // Load data passed from PHP
  currentRequestsData = typeof initialRequestsData !== 'undefined' ? initialRequestsData : [];
  currentStaffData = typeof availableStaffData !== 'undefined' ? availableStaffData : [];
  currentLinensData = typeof initialLinensAmenitiesData !== 'undefined' ? initialLinensAmenitiesData : [];
  allRooms = typeof allRoomsData !== 'undefined' ? allRoomsData : [];
  linensTypes = typeof linensTypesData !== 'undefined' ? linensTypesData : [];
  amenitiesTypes = typeof amenitiesTypesData !== 'undefined' ? amenitiesTypesData : [];

  // Initial render
  applyRequestFiltersAndRender();
  applyLinensFiltersAndRender();

  // Setup event listeners
  setupEventListeners();
  populateStaticFilters();
  populateLinensFilters();
});

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
  // Tab Navigation
  const tabBtns = document.querySelectorAll('.tabBtn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      document.querySelectorAll('.tabBtn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tabContent').forEach(content => content.classList.remove('active'));
      btn.classList.add('active');
      const activeTab = document.getElementById(`${tabName}-tab`);
      if (activeTab) activeTab.classList.add('active');
    });
  });

  // Sub-tab Navigation (Linens/Amenities)
  const subTabBtns = document.querySelectorAll('.subTabBtn');
  subTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const subTab = btn.getAttribute('data-subtab');
      currentSubTab = subTab;
      document.querySelectorAll('.subTabBtn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyLinensFiltersAndRender();
      updateTypesFilter();
    });
  });

  // Request Filters
  document.getElementById('floorFilter')?.addEventListener('change', applyRequestFiltersAndRender);
  document.getElementById('roomFilter')?.addEventListener('change', applyRequestFiltersAndRender);
  document.getElementById('searchInput')?.addEventListener('input', applyRequestFiltersAndRender);
  document.getElementById('refreshBtn')?.addEventListener('click', resetRequestFilters);
  document.getElementById('downloadBtnRequests')?.addEventListener('click', downloadRequestsCSV);

  // Linens Filters
  document.getElementById('floorFilterLinens')?.addEventListener('change', applyLinensFiltersAndRender);
  document.getElementById('roomFilterLinens')?.addEventListener('change', applyLinensFiltersAndRender);
  document.getElementById('statusFilterLinens')?.addEventListener('change', applyLinensFiltersAndRender);
  document.getElementById('linensSearchInput')?.addEventListener('input', applyLinensFiltersAndRender);
  document.getElementById('linensRefreshBtn')?.addEventListener('click', resetLinensFilters);
  document.getElementById('linensDownloadBtn')?.addEventListener('click', downloadLinensCSV);

  // Add Item Button
  document.getElementById('addItemBtn')?.addEventListener('click', showAddItemModal);

  // Add/Edit Item Modal
  document.getElementById('closeAddItemBtn')?.addEventListener('click', hideAddItemModal);
  document.getElementById('cancelAddItemBtn')?.addEventListener('click', hideAddItemModal);
  document.getElementById('addItemForm')?.addEventListener('submit', handleAddItemSubmit);
  document.getElementById('itemFloor')?.addEventListener('change', updateRoomDropdown);

  // Confirmation Modal
  document.getElementById('cancelConfirmBtn')?.addEventListener('click', hideConfirmModal);
  document.getElementById('confirmActionBtn')?.addEventListener('click', handleConfirmAction);

  // Success Modal
  document.getElementById('closeSuccessBtn')?.addEventListener('click', hideSuccessModal);
  document.getElementById('okaySuccessBtn')?.addEventListener('click', hideSuccessModal);

  // Delete Modal
  document.getElementById('closeDeleteBtn')?.addEventListener('click', hideDeleteModal);
  document.getElementById('cancelDeleteBtn')?.addEventListener('click', hideDeleteModal);
  document.getElementById('confirmDeleteBtn')?.addEventListener('click', handleConfirmDelete);

  // Staff Modal
  document.getElementById('closeStaffModalBtn')?.addEventListener('click', hideStaffModal);
  document.getElementById('cancelStaffBtn')?.addEventListener('click', hideStaffModal);
  document.getElementById('staffModalSearchInput')?.addEventListener('input', filterStaffInModal);
  document.getElementById('staffModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) hideStaffModal();
  });

  // Profile Sidebar & Logout
  const profileBtn = document.getElementById('profileBtn');
  const sidebar = document.getElementById('profile-sidebar');
  const closeSidebarBtn = document.getElementById('sidebar-close-btn');
  profileBtn?.addEventListener('click', () => sidebar?.classList.add('active'));
  closeSidebarBtn?.addEventListener('click', () => sidebar?.classList.remove('active'));

  const logoutBtn = document.getElementById('logoutBtn');
  const logoutModal = document.getElementById('logoutModal');
  const closeLogoutBtn = document.getElementById('closeLogoutBtn');
  const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
  const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

  logoutBtn?.addEventListener('click', (e) => { e.preventDefault(); if(logoutModal) logoutModal.style.display = 'flex'; });
  closeLogoutBtn?.addEventListener('click', () => { if(logoutModal) logoutModal.style.display = 'none'; });
  cancelLogoutBtn?.addEventListener('click', () => { if(logoutModal) logoutModal.style.display = 'none'; });
  confirmLogoutBtn?.addEventListener('click', () => { window.location.href = 'logout.php'; });
  logoutModal?.addEventListener('click', (e) => { if (e.target === e.currentTarget) logoutModal.style.display = 'none'; });
}

// ===== PAGINATION UTILITIES =====
function paginateData(data, page, itemsPerPage) {
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return data.slice(startIndex, endIndex);
}

function getTotalPages(dataLength, itemsPerPage) {
  return Math.ceil(dataLength / itemsPerPage);
}

function renderPaginationControls(containerId, totalPages, currentPage, onPageChange) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  if (totalPages <= 1) return;

  // Previous Button
  const prevBtn = document.createElement('button');
  prevBtn.className = 'paginationBtn';
  prevBtn.textContent = '←';
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => onPageChange(currentPage - 1);
  container.appendChild(prevBtn);

  // Page Number Logic
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  if (startPage > 1) {
    const firstPageBtn = document.createElement('button');
    firstPageBtn.className = 'paginationBtn';
    firstPageBtn.textContent = '1';
    firstPageBtn.onclick = () => onPageChange(1);
    container.appendChild(firstPageBtn);
    if (startPage > 2) {
      const dots = document.createElement('span');
      dots.textContent = '...';
      dots.className = 'paginationDots';
      container.appendChild(dots);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `paginationBtn ${i === currentPage ? 'active' : ''}`;
    pageBtn.textContent = i;
    pageBtn.onclick = () => onPageChange(i);
    container.appendChild(pageBtn);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const dots = document.createElement('span');
      dots.textContent = '...';
      dots.className = 'paginationDots';
      container.appendChild(dots);
    }
    const lastPageBtn = document.createElement('button');
    lastPageBtn.className = 'paginationBtn';
    lastPageBtn.textContent = totalPages;
    lastPageBtn.onclick = () => onPageChange(totalPages);
    container.appendChild(lastPageBtn);
  }

  // Next Button
  const nextBtn = document.createElement('button');
  nextBtn.className = 'paginationBtn';
  nextBtn.textContent = '→';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => onPageChange(currentPage + 1);
  container.appendChild(nextBtn);
}

// ===== RENDER REQUESTS TABLE =====
function renderRequestsTable() {
  const tbody = document.getElementById('requestsTableBody');
  const recordCountEl = document.getElementById('requestsRecordCount');
  const paginationControlsContainerId = 'requestsPaginationControls';
  const state = paginationState.requests;

  if (!tbody || !recordCountEl) return;

  const totalPages = getTotalPages(filteredRequests.length, state.itemsPerPage);
  if (state.currentPage > totalPages) {
    state.currentPage = Math.max(1, totalPages);
  }

  const paginatedData = paginateData(filteredRequests, state.currentPage, state.itemsPerPage);

  if (paginatedData.length === 0 && state.currentPage === 1) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No rooms need cleaning or match filters.</td></tr>';
  } else if (paginatedData.length === 0 && state.currentPage > 1) {
    state.currentPage--;
    renderRequestsTable();
    return;
  } else {
    tbody.innerHTML = paginatedData.map(req => `
      <tr>
        <td>${req.floor ?? 'N/A'}</td>
        <td>${req.room ?? 'N/A'}</td>
        <td>${req.date ?? 'N/A'}</td>
        <td>${req.requestTime ?? 'N/A'}</td>
        <td>${req.lastCleaned ?? 'N/A'}</td>
        <td><span class="statusBadge needs-cleaning">Needs Cleaning</span></td>
        <td>
          <button class="assignBtn" data-room-id="${req.id}">Assign Staff</button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.assignBtn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        currentRequestId = parseInt(e.target.getAttribute('data-room-id'));
        showStaffModal();
      });
    });
  }

  recordCountEl.textContent = filteredRequests.length;
  renderPaginationControls(paginationControlsContainerId, totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderRequestsTable();
  });
}

// ===== RENDER LINENS & AMENITIES TABLE =====
function renderLinensTable() {
  const tbody = document.getElementById('linensTableBody');
  const recordCountEl = document.getElementById('linensRecordCount');
  const paginationControlsContainerId = 'linensPaginationControls';
  const state = paginationState.linens;

  if (!tbody || !recordCountEl) return;

  const totalPages = getTotalPages(filteredLinens.length, state.itemsPerPage);
  if (state.currentPage > totalPages) {
    state.currentPage = Math.max(1, totalPages);
  }

  const paginatedData = paginateData(filteredLinens, state.currentPage, state.itemsPerPage);

  if (paginatedData.length === 0 && state.currentPage === 1) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #999;">No items found matching filters.</td></tr>';
  } else if (paginatedData.length === 0 && state.currentPage > 1) {
    state.currentPage--;
    renderLinensTable();
    return;
  } else {
    tbody.innerHTML = paginatedData.map(item => `
      <tr>
        <td>${item.floor ?? 'N/A'}</td>
        <td>${item.room ?? 'N/A'}</td>
        <td>${item.type ?? 'N/A'}</td>
        <td>${item.item ?? 'N/A'}</td>
        <td>${item.lastCleaned ?? 'Never'}</td>
        <td><span class="statusBadge cleaned">Available</span></td>
        <td>${item.remarks ?? ''}</td>
        <td>
          <button class="actionIconBtn editBtn" data-item-id="${item.id}" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="actionIconBtn deleteBtn" data-item-id="${item.id}" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');

    // IMPORTANT: Add event listeners AFTER innerHTML is set
    const editButtons = tbody.querySelectorAll('.editBtn');
    const deleteButtons = tbody.querySelectorAll('.deleteBtn');

    editButtons.forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const itemId = parseInt(this.getAttribute('data-item-id'));
        console.log('Edit clicked for item:', itemId); // Debug log
        handleEditItem(itemId);
      });
    });

    deleteButtons.forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const itemId = parseInt(this.getAttribute('data-item-id'));
        console.log('Delete clicked for item:', itemId); // Debug log
        handleDeleteItem(itemId);
      });
    });
  }

  recordCountEl.textContent = filteredLinens.length;
  renderPaginationControls(paginationControlsContainerId, totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderLinensTable();
  });
}

// ===== RENDER STAFF LIST MODAL =====
function renderStaffList(staffToRender = filteredStaff) {
  const staffList = document.getElementById('staffList');
  if (!staffList) return;

  if (staffToRender.length === 0) {
    staffList.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No available staff found.</div>';
    return;
  }

  staffList.innerHTML = staffToRender.map(staff => `
    <div class="staffListItem ${staff.assigned ? 'assigned' : ''}" data-staff-id="${staff.id}">
      <div class="staffListName">${staff.name}</div>
      <span class="staffListStatus ${staff.assigned ? 'assigned' : 'available'}">${staff.assigned ? 'Assigned' : 'Available'}</span>
    </div>
  `).join('');
}

// ===== FILTERING LOGIC =====
function applyRequestFiltersAndRender() {
  const floor = document.getElementById('floorFilter')?.value || '';
  const room = document.getElementById('roomFilter')?.value || '';
  const search = document.getElementById('searchInput')?.value.toLowerCase() || '';

  filteredRequests = currentRequestsData.filter(req => {
    const matchFloor = !floor || req.floor.toString() === floor;
    const matchRoom = !room || req.room.toString() === room;
    const matchSearch = !search || req.room.toString().includes(search);

    return matchFloor && matchRoom && matchSearch;
  });

  paginationState.requests.currentPage = 1;
  renderRequestsTable();
  updateRoomFilterOptions();
}

function applyLinensFiltersAndRender() {
  const floor = document.getElementById('floorFilterLinens')?.value || '';
  const room = document.getElementById('roomFilterLinens')?.value || '';
  const status = document.getElementById('statusFilterLinens')?.value || '';
  const search = document.getElementById('linensSearchInput')?.value.toLowerCase() || '';

  filteredLinens = currentLinensData.filter(item => {
    const matchCategory = item.category.toLowerCase() === currentSubTab;
    const matchFloor = !floor || item.floor.toString() === floor;
    const matchRoom = !room || item.room.toString() === room;
    const matchStatus = !status; // Status filter logic can be added here
    const matchSearch = !search || item.item.toLowerCase().includes(search) || item.type.toLowerCase().includes(search);

    return matchCategory && matchFloor && matchRoom && matchStatus && matchSearch;
  });

  paginationState.linens.currentPage = 1;
  renderLinensTable();
  updateLinensRoomFilterOptions();
}

function filterStaffInModal() {
  const search = document.getElementById('staffModalSearchInput')?.value.toLowerCase() || '';
  filteredStaff = currentStaffData.filter(staff =>
    staff.name.toLowerCase().includes(search)
  );
  renderStaffList();
}

// ===== FILTER UTILITIES =====
function populateStaticFilters() {
  // Populate Floor filter for Requests
  const floorFilter = document.getElementById('floorFilter');
  const floors = [...new Set(currentRequestsData.map(r => r.floor))].sort((a, b) => a - b);
  if (floorFilter) {
    floors.forEach(f => {
      const option = document.createElement('option');
      option.value = f;
      option.textContent = f;
      floorFilter.appendChild(option);
    });
  }
  updateRoomFilterOptions();
}

function populateLinensFilters() {
  // Populate Floor filter
  const floorFilter = document.getElementById('floorFilterLinens');
  const floors = [...new Set(allRooms.map(r => r.floor))].sort((a, b) => a - b);
  if (floorFilter) {
    floors.forEach(f => {
      const option = document.createElement('option');
      option.value = f;
      option.textContent = f;
      floorFilter.appendChild(option);
    });
  }

  updateLinensRoomFilterOptions();
}

function updateRoomFilterOptions() {
  const floorFilter = document.getElementById('floorFilter');
  const roomFilter = document.getElementById('roomFilter');
  if (!roomFilter) return;

  const selectedFloor = floorFilter?.value;
  const currentRoomValue = roomFilter.value;

  roomFilter.innerHTML = '<option value="">Room</option>';

  const roomsToShow = selectedFloor
    ? currentRequestsData.filter(r => r.floor.toString() === selectedFloor)
    : currentRequestsData;

  const roomNumbers = [...new Set(roomsToShow.map(r => r.room))].sort((a, b) => a - b);

  roomNumbers.forEach(roomNum => {
    const option = document.createElement('option');
    option.value = roomNum;
    option.textContent = roomNum;
    roomFilter.appendChild(option);
  });

  if (roomNumbers.includes(parseInt(currentRoomValue))) {
    roomFilter.value = currentRoomValue;
  }
}

function updateLinensRoomFilterOptions() {
  const floorFilter = document.getElementById('floorFilterLinens');
  const roomFilter = document.getElementById('roomFilterLinens');
  if (!roomFilter) return;

  const selectedFloor = floorFilter?.value;
  const currentRoomValue = roomFilter.value;

  roomFilter.innerHTML = '<option value="">Room</option>';

  const roomsToShow = selectedFloor
    ? allRooms.filter(r => r.floor.toString() === selectedFloor)
    : allRooms;

  const roomNumbers = [...new Set(roomsToShow.map(r => r.room))].sort((a, b) => a - b);

  roomNumbers.forEach(roomNum => {
    const option = document.createElement('option');
    option.value = roomNum;
    option.textContent = roomNum;
    roomFilter.appendChild(option);
  });

  if (roomNumbers.includes(parseInt(currentRoomValue))) {
    roomFilter.value = currentRoomValue;
  }
}

function updateTypesFilter() {
  // This function is called when sub-tab changes
  // Types filter is now Status filter in the new design
}

function resetRequestFilters() {
  document.getElementById('floorFilter').value = '';
  document.getElementById('roomFilter').value = '';
  document.getElementById('searchInput').value = '';
  applyRequestFiltersAndRender();
}

function resetLinensFilters() {
  document.getElementById('floorFilterLinens').value = '';
  document.getElementById('roomFilterLinens').value = '';
  document.getElementById('statusFilterLinens').value = '';
  document.getElementById('linensSearchInput').value = '';
  applyLinensFiltersAndRender();
}

// ===== MODAL VISIBILITY =====
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

function showAddItemModal(isEdit = false, itemData = null) {
  const modal = document.getElementById('addItemModal');
  const modalTitle = document.getElementById('addItemModalTitle');
  const submitBtn = document.getElementById('submitItemBtn');
  
  if (isEdit && itemData) {
    modalTitle.textContent = 'Edit Item';
    submitBtn.textContent = 'UPDATE ITEM';
    
    document.getElementById('itemId').value = itemData.id;
    populateFloorDropdown();
    document.getElementById('itemFloor').value = itemData.floor;
    
    updateRoomDropdown();
    setTimeout(() => {
      const roomSelect = document.getElementById('itemRoom');
      const roomOption = Array.from(roomSelect.options).find(opt => opt.textContent == itemData.room);
      if (roomOption) {
        roomSelect.value = roomOption.value;
      }
    }, 50);
    
    document.getElementById('itemName').value = itemData.item;
    document.getElementById('itemType').value = itemData.type;
    
    if (itemData.lastCleaned && itemData.lastCleaned !== 'Never') {
      const date = new Date(itemData.lastCleaned);
      const dateStr = date.toISOString().split('T')[0];
      document.getElementById('itemLastReplaced').value = dateStr;
    }
  } else {
    modalTitle.textContent = 'Add Item';
    submitBtn.textContent = 'ADD ITEM';
    document.getElementById('itemId').value = '';
    document.getElementById('addItemForm').reset();
    populateFloorDropdown();
  }
  
  modal.style.display = 'flex';
}

function hideAddItemModal() {
  document.getElementById('addItemModal').style.display = 'none';
  document.getElementById('addItemForm').reset();
}

function showConfirmModal(title, text, actionText) {
  document.getElementById('confirmModalTitle').textContent = title;
  document.getElementById('confirmModalText').textContent = text;
  document.getElementById('confirmActionBtn').textContent = actionText;
  document.getElementById('confirmModal').style.display = 'flex';
}

function hideConfirmModal() {
  document.getElementById('confirmModal').style.display = 'none';
  pendingAction = null;
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
  currentItemId = null;
}

// ===== FORM HANDLING =====
function populateFloorDropdown() {
  const floorSelect = document.getElementById('itemFloor');
  floorSelect.innerHTML = '<option value="">Select Floor</option>';
  
  const floors = [...new Set(allRooms.map(r => r.floor))].sort((a, b) => a - b);
  floors.forEach(floor => {
    const option = document.createElement('option');
    option.value = floor;
    option.textContent = floor;
    floorSelect.appendChild(option);
  });
}

function updateRoomDropdown() {
  const floorSelect = document.getElementById('itemFloor');
  const roomSelect = document.getElementById('itemRoom');
  const selectedFloor = floorSelect.value;
  
  roomSelect.innerHTML = '<option value="">Select Room</option>';
  
  if (!selectedFloor) return;
  
  const rooms = allRooms.filter(r => r.floor.toString() === selectedFloor);
  rooms.forEach(room => {
    const option = document.createElement('option');
    option.value = room.id;
    option.textContent = room.room;
    roomSelect.appendChild(option);
  });
}

function handleAddItemSubmit(e) {
  e.preventDefault();
  
  const itemId = document.getElementById('itemId').value;
  const isEdit = itemId !== '';
  
  const formData = {
    id: itemId,
    roomId: document.getElementById('itemRoom').value,
    item: document.getElementById('itemName').value,
    type: document.getElementById('itemType').value,
    lastReplaced: document.getElementById('itemLastReplaced').value,
    category: currentSubTab
  };
  
  const room = allRooms.find(r => r.id.toString() === formData.roomId);
  if (!room) {
    alert('Please select a valid room');
    return;
  }
  
  formData.floor = room.floor;
  formData.room = room.room;
  
  pendingAction = {
    type: isEdit ? 'edit' : 'add',
    data: formData
  };
  
  hideAddItemModal();
  
  if (isEdit) {
    showConfirmModal(
      'Are you sure you want to update this item?',
      'Please review the details before confirming. Once updated, the changes will be reflected in the maintenance records.',
      'YES, UPDATE ITEM'
    );
  } else {
    showConfirmModal(
      'Are you sure you want to add this item?',
      'Please review the details before confirming. Once added, the item will be recorded and visible in the maintenance records.',
      'YES, ADD ITEM'
    );
  }
}

function handleConfirmAction() {
  if (!pendingAction) return;
  
  if (pendingAction.type === 'add') {
    const newItem = {
      id: Date.now(),
      roomId: parseInt(pendingAction.data.roomId),
      floor: pendingAction.data.floor,
      room: pendingAction.data.room,
      type: pendingAction.data.type,
      item: pendingAction.data.item,
      category: pendingAction.data.category,
      lastCleaned: pendingAction.data.lastReplaced || 'Never',
      remarks: ''
    };
    
    currentLinensData.push(newItem);
    
    hideConfirmModal();
    showSuccessModal('Item Added Successfully');
    applyLinensFiltersAndRender();
    
  } else if (pendingAction.type === 'edit') {
    const itemIndex = currentLinensData.findIndex(item => item.id.toString() === pendingAction.data.id);
    if (itemIndex !== -1) {
      currentLinensData[itemIndex] = {
        ...currentLinensData[itemIndex],
        roomId: parseInt(pendingAction.data.roomId),
        floor: pendingAction.data.floor,
        room: pendingAction.data.room,
        type: pendingAction.data.type,
        item: pendingAction.data.item,
        category: pendingAction.data.category,
        lastCleaned: pendingAction.data.lastReplaced || currentLinensData[itemIndex].lastCleaned
      };
      
      hideConfirmModal();
      showSuccessModal('Item Updated Successfully');
      applyLinensFiltersAndRender();
    }
  }
  
  pendingAction = null;
}

function handleEditItem(itemId) {
  const item = currentLinensData.find(i => i.id === itemId);
  if (!item) return;
  
  currentItemId = itemId;
  showAddItemModal(true, item);
}

function handleDeleteItem(itemId) {
  currentItemId = itemId;
  showDeleteModal();
}

function handleConfirmDelete() {
  if (!currentItemId) return;
  
  const itemIndex = currentLinensData.findIndex(item => item.id === currentItemId);
  if (itemIndex !== -1) {
    currentLinensData.splice(itemIndex, 1);
    hideDeleteModal();
    showSuccessModal('Item Deleted Successfully');
    applyLinensFiltersAndRender();
  }
}

// ===== CSV DOWNLOAD =====
function downloadRequestsCSV() {
  if (filteredRequests.length === 0) {
    alert("No request data to export based on current filters.");
    return;
  }
  const headers = ['Floor', 'Room', 'Date', 'Request Time', 'Last Cleaned', 'Status', 'Staff In Charge'];
  const csvContent = [
    headers.join(','),
    ...filteredRequests.map(req =>
      [
        req.floor,
        req.room,
        req.date,
        req.requestTime,
        req.lastCleaned,
        'Needs Cleaning',
        req.staff
      ].join(',')
    )
  ].join('\n');
  downloadCSV(csvContent, 'housekeeping-requests');
}

function downloadLinensCSV() {
  if (filteredLinens.length === 0) {
    alert("No linens/amenities data to export based on current filters.");
    return;
  }
  const headers = ['Floor', 'Room', 'Type', 'Items', 'Time/Date', 'Status', 'Remarks'];
  const csvContent = [
    headers.join(','),
    ...filteredLinens.map(item =>
      [
        item.floor,
        item.room,
        item.type,
        `"${item.item.replace(/"/g, '""')}"`,
        item.lastCleaned,
        'Available',
        `"${(item.remarks || '').replace(/"/g, '""')}"`
      ].join(',')
    )
  ].join('\n');
  downloadCSV(csvContent, `housekeeping-${currentSubTab}`);
}

function downloadCSV(csvContent, filenamePrefix) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}