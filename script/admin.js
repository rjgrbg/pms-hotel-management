// ===== PAGINATION STATE =====
const paginationState = {
  rooms: { currentPage: 1, itemsPerPage: 10 },
  housekeeping: { currentPage: 1, itemsPerPage: 10 },
  housekeepingHistory: { currentPage: 1, itemsPerPage: 10 },
  maintenance: { currentPage: 1, itemsPerPage: 10 },
  parking: { currentPage: 1, itemsPerPage: 10 },
  inventory: { currentPage: 1, itemsPerPage: 10 }
};

// ===== USE SHARED DATA (Kept for other tabs) =====
let hkData = [...housekeepingRequests];
let hkHistData = [...housekeepingHistory];
let mtData = [...maintenanceHistory];
let roomData = []; // This will be replaced by live data from fetchAndRenderRooms()
let parkingDataList = typeof parkingData !== 'undefined' ? [...parkingData] : [];
let inventoryDataList = typeof inventoryData !== 'undefined' ? [...inventoryData] : [];
let dashData = dashboardStats;

console.log('Data Loaded:', { roomData, parkingDataList, inventoryDataList });

// --- Room Management DOM Elements ---
const roomsTableBody = document.getElementById('roomsTableBody');
const roomModal = document.getElementById('roomModal');
const closeRoomModalBtn = document.getElementById('closeRoomModalBtn');
const cancelRoomBtn = document.getElementById('cancelRoomBtn');
const roomForm = document.getElementById('roomForm');
const roomModalTitle = document.getElementById('roomModalTitle');
const deleteRoomModal = document.getElementById('deleteRoomModal');
const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// Form Inputs
const roomFloorInput = document.getElementById('roomFloor');
const roomNumberInput = document.getElementById('roomNumber');
const roomTypeInput = document.getElementById('roomType');
const roomGuestsInput = document.getElementById('roomGuests');
const roomRateInput = document.getElementById('roomRate');
const roomStatusInput = document.getElementById('roomStatus');

// ===== NEW: Filter Dropdown Elements =====
const roomsFloorFilter = document.getElementById('roomsFloorFilter');
const roomsRoomFilter = document.getElementById('roomsRoomFilter');

// Hidden field to store RoomID for editing/deleting
const hiddenRoomIdInput = document.createElement('input');
hiddenRoomIdInput.type = 'hidden';
hiddenRoomIdInput.id = 'editRoomId';
hiddenRoomIdInput.name = 'roomID';
roomForm.appendChild(hiddenRoomIdInput);

// ===== NEW: Form Message Element =====
let formMessage = document.getElementById('formMessage');
if (!formMessage) {
  formMessage = document.createElement('div');
  formMessage.id = 'formMessage';
  formMessage.className = 'formMessage';
  roomForm.insertBefore(formMessage, roomForm.firstChild);
}

// ===== UTILITY FUNCTIONS FOR FORM MESSAGES =====
function showFormMessage(message, type = 'error') {
  formMessage.textContent = message;
  formMessage.className = `formMessage ${type}`;
  formMessage.style.display = 'block';
  
  if (type === 'success') {
    setTimeout(() => {
      hideFormMessage();
    }, 3000);
  }
}

function hideFormMessage() {
  formMessage.style.display = 'none';
  formMessage.textContent = '';
  formMessage.className = 'formMessage';
}

// ===== PAGINATION UTILITY FUNCTIONS =====
function paginateData(data, page, itemsPerPage) {
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return data.slice(startIndex, endIndex);
}

function getTotalPages(dataLength, itemsPerPage) {
  return Math.ceil(dataLength / itemsPerPage);
}

function renderPaginationControls(containerId, totalPages, currentPage, onPageChange) {
  const container = document.querySelector(`#${containerId} .paginationControls`);
  if (!container) return;
  
  container.innerHTML = '';
  
  // Previous button
  const prevBtn = document.createElement('button');
  prevBtn.className = 'paginationBtn';
  prevBtn.textContent = '←';
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => onPageChange(currentPage - 1);
  container.appendChild(prevBtn);
  
  // Page numbers
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  if (startPage > 1) {
    const firstBtn = document.createElement('button');
    firstBtn.className = 'paginationBtn';
    firstBtn.textContent = '1';
    firstBtn.onclick = () => onPageChange(1);
    container.appendChild(firstBtn);
    
    if (startPage > 2) {
      const dots = document.createElement('span');
      dots.className = 'paginationDots';
      dots.textContent = '...';
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
      dots.className = 'paginationDots';
      dots.textContent = '...';
      container.appendChild(dots);
    }
    
    const lastBtn = document.createElement('button');
    lastBtn.className = 'paginationBtn';
    lastBtn.textContent = totalPages;
    lastBtn.onclick = () => onPageChange(totalPages);
    container.appendChild(lastBtn);
  }
  
  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.className = 'paginationBtn';
  nextBtn.textContent = '→';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => onPageChange(currentPage + 1);
  container.appendChild(nextBtn);
}

// ===== UTILITY FUNCTIONS FOR DB INTERACTION =====
async function apiCall(action, data = {}, method = 'GET') {
    const url = 'room_actions.php' + (method === 'GET' ? `?action=${action}` : '');
    const options = { method: method };

    if (method === 'POST') {
        const formData = new FormData();
        formData.append('action', action);
        for (const key in data) {
            formData.append(key, data[key]);
        }
        options.body = formData;
    }

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API Call Failed:', error);
        return { success: false, message: 'Room number already exist.' };
    }
}

// ===== MODIFIED FUNCTION: Fixes dashboard count =====
/**
 * Updates dashboard statistics based on room data
 */
function updateDashboardFromRooms(rooms) {
  const totalRooms = rooms.length;
  // Use Capitalized strings to match database
  const occupied = rooms.filter(r => r.Status === 'Occupied').length;
  const needsCleaning = rooms.filter(r => r.Status === 'Needs Cleaning').length;
  const maintenance = rooms.filter(r => r.Status === 'Maintenance').length;
  
  // Update the 4 stat cards in order
  updateStatCard(0, totalRooms);
  updateStatCard(1, occupied);
  updateStatCard(2, needsCleaning); // Correctly targets index 2
  updateStatCard(3, maintenance);
}

/**
 * Fetches rooms from the DB and updates the global roomData array and the table.
 */
async function fetchAndRenderRooms() {
    roomsTableBody.innerHTML = '<tr><td colspan="7">Loading rooms...</td></tr>';
    
    const result = await apiCall('fetch_rooms');
    roomsTableBody.innerHTML = ''; 

    if (result.success && result.data.length > 0) {
        roomData = result.data; 
        updateDashboardFromRooms(roomData);
        populateDynamicFilters(roomData); 
        
        // Reset to page 1 for new data fetch
        paginationState.rooms.currentPage = 1;
        renderRoomsTable(roomData); // Render the first page
        // No totalRecords in user's file, so we use roomData.length
        document.getElementById('roomsRecordCount').textContent = roomData.length;

    } else if (result.success && result.data.length === 0) {
         roomsTableBody.innerHTML = '<tr><td colspan="7">No rooms found.</td></tr>';
         document.getElementById('roomsRecordCount').textContent = 0;
         populateDynamicFilters([]); 
         updateDashboardFromRooms([]); 
         renderPaginationControls('rooms-page', 0, 1, () => {}); // Clear pagination
    } else {
         roomsTableBody.innerHTML = `<tr><td colspan="7">Failed to load data: ${result.message}</td></tr>`;
         document.getElementById('roomsRecordCount').textContent = 0;
         updateDashboardFromRooms([]);
         renderPaginationControls('rooms-page', 0, 1, () => {}); // Clear pagination
    }
}

// ===== NEW: DYNAMIC FILTER POPULATION FUNCTIONS =====
function populateDynamicFilters(data) {
    if (!roomsFloorFilter || !roomsRoomFilter) return;

    const floors = [...new Set(data.map(room => room.Floor))].sort((a, b) => a - b);
    
    roomsFloorFilter.innerHTML = '<option value="">Floor</option>';
    floors.forEach(floor => {
        const option = document.createElement('option');
        option.value = floor;
        option.textContent = floor;
        roomsFloorFilter.appendChild(option);
    });

    updateRoomFilterOptions(data);
}

function updateRoomFilterOptions(data, selectedFloor = '') {
    if (!roomsRoomFilter) return;

    let roomsOnFloor;
    if (selectedFloor) {
        roomsOnFloor = data.filter(room => room.Floor.toString() === selectedFloor);
    } else {
        roomsOnFloor = data; 
    }

    const roomNumbers = [...new Set(roomsOnFloor.map(room => room.Room))].sort((a, b) => a - b);
    
    const currentRoomValue = roomsRoomFilter.value;
    roomsRoomFilter.innerHTML = '<option value="">Room</option>';
    
    roomNumbers.forEach(roomNum => {
        const option = document.createElement('option');
        option.value = roomNum;
        option.textContent = roomNum;
        roomsRoomFilter.appendChild(option);
    });

    if (roomNumbers.includes(parseInt(currentRoomValue))) {
        roomsRoomFilter.value = currentRoomValue;
    }
}

// ===== ROOM CAPACITY MAPPING =====
const ROOM_CAPACITY_MAP = {
    'Standard Room': '1–2 guests',
    'Deluxe Room': '2–3 guests',
    'Suite': '2–4 guests',
    'Penthouse Suite': '4–6 guests',
};

// ===== ROOM MODAL INPUT LOGIC =====
function updateGuestCapacity() {
    const selectedType = roomTypeInput.value;
    roomGuestsInput.value = ROOM_CAPACITY_MAP[selectedType] || '';
}

function enforceFloorPrefix() {
    const floor = roomFloorInput.value;
    let room = roomNumberInput.value;

    if (!floor) {
        if (room.length > 0) {
             roomNumberInput.value = '';
        }
        return;
    }

    const floorPrefix = floor.toString();
    
    if (room.length > 0 && !room.startsWith(floorPrefix)) {
        roomNumberInput.value = floorPrefix;
    } else if (room.length === 0) {
        roomNumberInput.value = floorPrefix;
    }

    if (roomNumberInput.value.length > 3) {
        roomNumberInput.value = roomNumberInput.value.substring(0, 3);
    }
}

// ===== RENDER FUNCTIONS (NOW WITH PAGINATION) =====
function renderHKTable(data = hkData) {
  const tbody = document.getElementById('hkTableBody');
  const state = paginationState.housekeeping;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);

  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => `
      <tr>
        <td>${row.floor}</td>
        <td>${row.room}</td>
        <td>${row.guest}</td>
        <td>${row.date}</td>
        <td>${row.requestTime}</td>
        <td>${row.lastCleaned}</td>
        <td><span class="statusBadge ${row.status}">${row.status === 'dirty' ? 'Dirty / Unoccupied' : 'Request Clean / Occupied'}</span></td>
        <td>${row.staff}</td>
      </tr>
    `).join('');
  }
  
  document.getElementById('hkRecordCount').textContent = data.length;
  renderPaginationControls('hk-requests-tab', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderHKTable(data);
  });
}

function renderHKHistTable(data = hkHistData) {
  const tbody = document.getElementById('hkHistTableBody');
  const state = paginationState.housekeepingHistory;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);
  
  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => `
      <tr>
        <td>${row.floor}</td>
        <td>${row.room}</td>
        <td>${row.guest}</td>
        <td>${row.date}</td>
        <td>${row.requestedTime}</td>
        <td>${row.completedTime}</td>
        <td>${row.staff}</td>
        <td><span class="statusBadge cleaned">${row.status === 'cleaned' ? 'Cleaned' : row.status}</span></td>
        <td>${row.remarks}</td>
      </tr>
    `).join('');
  }
  
  document.getElementById('hkHistRecordCount').textContent = data.length;
  renderPaginationControls('hk-history-tab', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderHKHistTable(data);
  });
}

function renderMTTable(data = mtData) {
  const tbody = document.getElementById('mtTableBody');
  const state = paginationState.maintenance;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);
  
  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => `
      <tr>
        <td>${row.floor}</td>
        <td>${row.room}</td>
        <td>${row.issue}</td>
        <td>${row.date}</td>
        <td>${row.requestedTime}</td>
        <td>${row.completedTime}</td>
        <td><span class="statusBadge repaired">${row.status === 'repaired' ? 'Repaired' : row.status}</span></td>
        <td>${row.staff}</td>
        <td>${row.remarks}</td>
      </tr>
    `).join('');
  }
  
  document.getElementById('mtRecordCount').textContent = data.length;
  renderPaginationControls('maintenance-page', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderMTTable(data);
  });
}

// ===== MODIFIED FUNCTION: Fixes badges and uses pagination =====
function renderRoomsTable(data) {
  const tbody = document.getElementById('roomsTableBody');
  const state = paginationState.rooms;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);
  
  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => {
      // Create CSS-friendly class (e.g., "needs-cleaning")
      const statusClass = row.Status.toLowerCase().replace(/ /g, '-');
      // Create display-friendly text (e.g., "Needs Cleaning")
      const statusDisplay = row.Status.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');

      return `
        <tr>
          <td>${row.Floor}</td>
          <td>${row.Room}</td>
          <td>${row.Type}</td>
          <td>${row.NoGuests}</td>
          <td>$${parseFloat(row.Rate).toFixed(2)}</td>
          <td><span class="statusBadge ${statusClass}">${statusDisplay}</span></td>
          <td>
            <div class="actionButtons">
              <button class="actionBtn editBtn" data-room-data='${JSON.stringify(row)}'>
                <img src="assets/icons/edit-icon.png" alt="Edit" />
              </button>
              <button class="actionBtn deleteBtn" data-room-id="${row.RoomID}" data-room-number="${row.Room}">
                <img src="assets/icons/delete-icon.png" alt="Delete" />
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.editBtn').forEach(btn => {
        btn.addEventListener('click', handleEditClick);
    });
    tbody.querySelectorAll('.deleteBtn').forEach(btn => {
        btn.addEventListener('click', handleDeleteClick);
    });
  }
  
  document.getElementById('roomsRecordCount').textContent = data.length;
  renderPaginationControls('rooms-page', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderRoomsTable(data); // Re-render with new page
  });
}

function renderParkingTable(data = parkingDataList) {
  const tbody = document.getElementById('parkingTableBody');
  const state = paginationState.parking;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);

  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => `
      <tr>
        <td>${row.plateNumber}</td>
        <td>${row.room}</td>
        <td>${row.guestName}</td>
        <td>${row.vehicleType}</td>
        <td>${row.entryTime}</td>
        <td>${row.exitTime}</td>
        <td>${row.slotNumber}</td>
        <td><span class="statusBadge ${row.status}">${row.status.charAt(0).toUpperCase() + row.status.slice(1)}</span></td>
      </tr>
    `).join('');
  }
  
  document.getElementById('parkingRecordCount').textContent = data.length;
  renderPaginationControls('parking-page', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderParkingTable(data);
  });
}

function renderInventoryTable(data = inventoryDataList) {
  const tbody = document.getElementById('inventoryTableBody');
  const state = paginationState.inventory;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);

  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => {
      const statusText = row.status === 'in-stock' ? 'In Stock' : 
                           row.status === 'low-stock' ? 'Low Stock' : 'Out of Stock';
      return `
        <tr>
          <td>${row.id}</td>
          <td>${row.name}</td>
          <td>${row.category}</td>
          <td>${row.quantity !== undefined && row.quantity !== null ? row.quantity : '-'}</td>
          <td>${row.description}</td>
          <td><span class="statusBadge ${row.status}">${statusText}</span></td>
          <td>${row.damage}</td>
          <td>${row.stockInDate}</td>
          <td>${row.stockOutDate}</td>
        </tr>
      `;
    }).join('');
  }
  
  document.getElementById('inventoryRecordCount').textContent = data.length;
  renderPaginationControls('inventory-page', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderInventoryTable(data);
  });
}


// ===== DASHBOARD AND FILTER LOGIC =====
function updateDashboardStats(data) {
  const hkm = data.housekeepingMaintenance || dashboardStats.housekeepingMaintenance;
  // These will be overridden by fetchAndRenderRooms()
  updateStatCard(0, hkm.totalRooms);
  updateStatCard(1, hkm.occupied);
  updateStatCard(2, hkm.needsCleaning);
  updateStatCard(3, hkm.maintenanceRequests);

  const inventory = data.inventory || dashboardStats.inventory;
  updateStatCard(4, inventory.totalItems);
  updateStatCard(5, inventory.lowStock);
  updateStatCard(6, inventory.outOfStock);

  const parking = data.parking || dashboardStats.parking;
  updateStatCard(7, parking.totalSlots);
  updateStatCard(8, parking.occupied);
  updateStatCard(9, parking.vacant);
  updateStatCard(10, parking.reserved);

  const users = data.users || dashboardStats.users;
  updateStatCard(11, users.totalEmployees);
  updateStatCard(12, users.housekeeping);
  updateStatCard(13, users.maintenance);
  updateStatCard(14, users.parking);
}

function updateStatCard(index, value) {
  const statCards = document.querySelectorAll('.statValue');
  if (statCards[index]) {
    statCards[index].textContent = value || '0';
  }
}

// ===== PAGE NAVIGATION =====
const navLinks = document.querySelectorAll('.navLink');
const pages = document.querySelectorAll('.page');

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    
    navLinks.forEach(l => l.classList.remove('active'));
    pages.forEach(p => p.classList.remove('active'));
    
    link.classList.add('active');
    
    const pageName = link.getAttribute('data-page');
    const page = document.getElementById(`${pageName}-page`);
    
    if (page) {
      page.classList.add('active');
    }
  });
});

// ===== HOUSEKEEPING TAB NAVIGATION =====
const hkTabBtns = document.querySelectorAll('[data-admin-tab]');

hkTabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.getAttribute('data-admin-tab');
    
    hkTabBtns.forEach(b => b.classList.remove('active'));
    
    const hkReqTab = document.getElementById('hk-requests-tab');
    const hkHistTab = document.getElementById('hk-history-tab');
    if (hkReqTab) hkReqTab.classList.remove('active');
    if (hkHistTab) hkHistTab.classList.remove('active');

    btn.classList.add('active');
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) selectedTab.classList.add('active');
  });
});

// ===== HOUSEKEEPING FILTERS (Pagination added) =====
document.getElementById('hkSearchInput')?.addEventListener('input', (e) => {
  const search = e.target.value.toLowerCase();
  const filtered = hkData.filter(row => 
    row.guest.toLowerCase().includes(search) ||
    row.staff.toLowerCase().includes(search) ||
    row.room.toString().includes(search)
  );
  paginationState.housekeeping.currentPage = 1;
  renderHKTable(filtered);
});

document.getElementById('floorFilter')?.addEventListener('change', (e) => {
  const floor = e.target.value;
  const filtered = floor ? hkData.filter(row => row.floor.toString() === floor) : hkData;
  paginationState.housekeeping.currentPage = 1;
  renderHKTable(filtered);
});

document.getElementById('roomFilter')?.addEventListener('change', (e) => {
  const room = e.target.value;
  const filtered = room ? hkData.filter(row => row.room.toString() === room) : hkData;
  paginationState.housekeeping.currentPage = 1;
  renderHKTable(filtered);
});

document.getElementById('statusFilter')?.addEventListener('change', (e) => {
  const status = e.target.value;
  const filtered = status ? hkData.filter(row => row.status === status) : hkData;
  paginationState.housekeeping.currentPage = 1;
  renderHKTable(filtered);
});

document.getElementById('hkRefreshBtn')?.addEventListener('click', () => {
  document.getElementById('hkSearchInput').value = '';
  document.getElementById('floorFilter').value = '';
  document.getElementById('roomFilter').value = '';
  document.getElementById('statusFilter').value = '';
  hkData = [...housekeepingRequests];
  paginationState.housekeeping.currentPage = 1;
  renderHKTable(hkData);
});

document.getElementById('hkDownloadBtn')?.addEventListener('click', () => {
  const headers = ['Floor', 'Room', 'Guest', 'Date', 'Request Time', 'Last Cleaned', 'Status', 'Staff In Charge'];
  const csvContent = [
    headers.join(','),
    ...hkData.map(row => [row.floor, row.room, row.guest, row.date, row.requestTime, row.lastCleaned, row.status === 'dirty' ? 'Dirty / Unoccupied' : 'Request Clean / Occupied', row.staff].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `housekeeping-requests-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
});

// ===== HOUSEKEEPING HISTORY FILTERS (Pagination added) =====
document.getElementById('hkHistSearchInput')?.addEventListener('input', (e) => {
  const search = e.target.value.toLowerCase();
  const filtered = hkHistData.filter(row => 
    row.guest.toLowerCase().includes(search) ||
    row.staff.toLowerCase().includes(search) ||
    row.room.toString().includes(search)
  );
  paginationState.housekeepingHistory.currentPage = 1;
  renderHKHistTable(filtered);
});

document.getElementById('floorFilterHkHist')?.addEventListener('change', (e) => {
  const floor = e.target.value;
  const filtered = floor ? hkHistData.filter(row => row.floor.toString() === floor) : hkHistData;
  paginationState.housekeepingHistory.currentPage = 1;
  renderHKHistTable(filtered);
});

document.getElementById('roomFilterHkHist')?.addEventListener('change', (e) => {
  const room = e.target.value;
  const filtered = room ? hkHistData.filter(row => row.room.toString() === room) : hkHistData;
  paginationState.housekeepingHistory.currentPage = 1;
  renderHKHistTable(filtered);
});

document.getElementById('hkHistRefreshBtn')?.addEventListener('click', () => {
  document.getElementById('hkHistSearchInput').value = '';
  document.getElementById('floorFilterHkHist').value = '';
  document.getElementById('roomFilterHkHist').value = '';
  hkHistData = [...housekeepingHistory];
  paginationState.housekeepingHistory.currentPage = 1;
  renderHKHistTable(hkHistData);
});

document.getElementById('hkHistDownloadBtn')?.addEventListener('click', () => {
  const headers = ['Floor', 'Room', 'Guest', 'Date', 'Requested Time', 'Completed Time', 'Staff In Charge', 'Status', 'Remarks'];
  const csvContent = [
    headers.join(','),
    ...hkHistData.map(row => [row.floor, row.room, row.guest, row.date, row.requestedTime, row.completedTime, row.staff, row.status, row.remarks].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `housekeeping-history-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
});

// ===== MAINTENANCE FILTERS (Pagination added) =====
document.getElementById('mtSearchInput')?.addEventListener('input', (e) => {
  const search = e.target.value.toLowerCase();
  const filtered = mtData.filter(row => 
    row.issue.toLowerCase().includes(search) ||
    row.staff.toLowerCase().includes(search) ||
    row.room.toString().includes(search)
  );
  paginationState.maintenance.currentPage = 1;
  renderMTTable(filtered);
});

document.getElementById('mtFloorFilter')?.addEventListener('change', (e) => {
  const floor = e.target.value;
  const filtered = floor ? mtData.filter(row => row.floor.toString() === floor) : mtData;
  paginationState.maintenance.currentPage = 1;
  renderMTTable(filtered);
});

document.getElementById('mtRoomFilter')?.addEventListener('change', (e) => {
  const room = e.target.value;
  const filtered = room ? mtData.filter(row => row.room.toString() === room) : mtData;
  paginationState.maintenance.currentPage = 1;
  renderMTTable(filtered);
});

document.getElementById('mtStatusFilter')?.addEventListener('change', (e) => {
  const status = e.target.value;
  const filtered = status ? mtData.filter(row => row.status === status) : mtData;
  paginationState.maintenance.currentPage = 1;
  renderMTTable(filtered);
});

document.getElementById('mtRefreshBtn')?.addEventListener('click', () => {
  document.getElementById('mtSearchInput').value = '';
  document.getElementById('mtFloorFilter').value = '';
  document.getElementById('mtRoomFilter').value = '';
  document.getElementById('mtStatusFilter').value = '';
  mtData = [...maintenanceHistory];
  paginationState.maintenance.currentPage = 1;
  renderMTTable(mtData);
});

document.getElementById('mtDownloadBtn')?.addEventListener('click', () => {
  const headers = ['Floor', 'Room', 'Issue Type', 'Date', 'Requested Time', 'Completed Time', 'Status', 'Staff In Charge', 'Remarks'];
  const csvContent = [
    headers.join(','),
    ...mtData.map(row => [row.floor, row.room, row.issue, row.date, row.requestedTime, row.completedTime, row.status, row.staff, row.remarks].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `maintenance-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
});

// ===== PARKING FILTERS (Pagination added) =====
document.getElementById('parkingSearchInput')?.addEventListener('input', (e) => {
  const search = e.target.value.toLowerCase();
  const filtered = parkingDataList.filter(row => 
    row.plateNumber.toLowerCase().includes(search) ||
    row.guestName.toLowerCase().includes(search) ||
    row.vehicleType.toLowerCase().includes(search) ||
    row.slotNumber.toLowerCase().includes(search)
  );
  paginationState.parking.currentPage = 1;
  renderParkingTable(filtered);
});

document.getElementById('parkingLevelFilter')?.addEventListener('change', (e) => {
  const level = e.target.value;
  const filtered = level ? parkingDataList.filter(row => row.level.toString() === level) : parkingDataList;
  paginationState.parking.currentPage = 1;
  renderParkingTable(filtered);
});

document.getElementById('parkingBlockFilter')?.addEventListener('change', (e) => {
  const block = e.target.value;
  const filtered = block ? parkingDataList.filter(row => row.block === block) : parkingDataList;
  paginationState.parking.currentPage = 1;
  renderParkingTable(filtered);
});

document.getElementById('parkingStatusFilter')?.addEventListener('change', (e) => {
  const status = e.target.value;
  const filtered = status ? parkingDataList.filter(row => row.status === status) : parkingDataList;
  paginationState.parking.currentPage = 1;
  renderParkingTable(filtered);
});

document.getElementById('parkingRefreshBtn')?.addEventListener('click', () => {
  document.getElementById('parkingSearchInput').value = '';
  document.getElementById('parkingLevelFilter').value = '';
  document.getElementById('parkingBlockFilter').value = '';
  document.getElementById('parkingStatusFilter').value = '';
  parkingDataList = [...parkingData];
  paginationState.parking.currentPage = 1;
  renderParkingTable(parkingDataList);
});

document.getElementById('parkingDownloadBtn')?.addEventListener('click', () => {
  const headers = ['Plate Number', 'Room', 'Guest Name', 'Vehicle Type', 'Entry Time', 'Exit Time', 'Slot Number', 'Status'];
  const csvContent = [
    headers.join(','),
    ...parkingDataList.map(row => [row.plateNumber, row.room, row.guestName, row.vehicleType, row.entryTime, row.exitTime, row.slotNumber, row.status].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `parking-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
});

// ===== INVENTORY FILTERS (Pagination added) =====
document.getElementById('inventorySearchInput')?.addEventListener('input', (e) => {
  const search = e.target.value.toLowerCase();
  const filtered = inventoryDataList.filter(row => 
    row.name.toLowerCase().includes(search) ||
    row.category.toLowerCase().includes(search) ||
    row.description.toLowerCase().includes(search)
  );
  paginationState.inventory.currentPage = 1;
  renderInventoryTable(filtered);
});

document.getElementById('inventoryCategoryFilter')?.addEventListener('change', (e) => {
  const category = e.target.value;
  const filtered = category ? inventoryDataList.filter(row => row.category === category) : inventoryDataList;
  paginationState.inventory.currentPage = 1;
  renderInventoryTable(filtered);
});

document.getElementById('inventoryStatusFilter')?.addEventListener('change', (e) => {
  const status = e.target.value;
  const filtered = status ? inventoryDataList.filter(row => row.status === status) : inventoryDataList;
  paginationState.inventory.currentPage = 1;
  renderInventoryTable(filtered);
});

document.getElementById('inventoryRefreshBtn')?.addEventListener('click', () => {
  document.getElementById('inventorySearchInput').value = '';
  document.getElementById('inventoryCategoryFilter').value = '';
  document.getElementById('inventoryStatusFilter').value = '';
  inventoryDataList = [...inventoryData];
  paginationState.inventory.currentPage = 1;
  renderInventoryTable(inventoryDataList);
});

document.getElementById('inventoryDownloadBtn')?.addEventListener('click', () => {
  const headers = ['ID', 'Name', 'Category', 'Quantity', 'Description', 'Status', 'Damage', 'Stock In Date', 'Stock Out Date'];
  const csvContent = [
    headers.join(','),
    ...inventoryDataList.map(row => {
      const statusText = row.status === 'in-stock' ? 'In Stock' : 
                          row.status === 'low-stock' ? 'Low Stock' : 'Out of Stock';
      return [row.id, row.name, row.category, row.quantity, row.description, statusText, row.damage, row.stockInDate, row.stockOutDate].join(',');
    })
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
});

// ===== ROOMS FILTERS (Pagination added) =====
document.getElementById('roomsSearchInput')?.addEventListener('input', (e) => {
  const search = e.target.value.toLowerCase();
  const filtered = roomData.filter(row => 
    row.Type.toLowerCase().includes(search) ||
    row.Room.toString().includes(search) ||
    row.Status.toLowerCase().includes(search)
  );
  paginationState.rooms.currentPage = 1;
  renderRoomsTable(filtered);
});

roomsFloorFilter?.addEventListener('change', (e) => {
    const floor = e.target.value;
    updateRoomFilterOptions(roomData, floor);
    const filtered = floor ? roomData.filter(row => row.Floor.toString() === floor) : roomData;
    paginationState.rooms.currentPage = 1;
    renderRoomsTable(filtered);
});

roomsRoomFilter?.addEventListener('change', (e) => {
  const room = e.target.value;
  const floor = roomsFloorFilter.value;
  let dataToFilter = floor ? roomData.filter(row => row.Floor.toString() === floor) : roomData;
  const filtered = room ? dataToFilter.filter(row => row.Room.toString() === room) : dataToFilter;
  paginationState.rooms.currentPage = 1;
  renderRoomsTable(filtered);
});

document.getElementById('roomsTypeFilter')?.addEventListener('change', (e) => {
  const type = e.target.value;
  const filtered = type ? roomData.filter(row => row.Type === type) : roomData;
  paginationState.rooms.currentPage = 1;
  renderRoomsTable(filtered);
});

// ===== MODIFIED FUNCTION: Fixes status filter =====
document.getElementById('roomsStatusFilter')?.addEventListener('change', (e) => {
  const status = e.target.value; // This is "Needs Cleaning", "Available", etc.
  
  // This logic filters the data by the exact dropdown value.
  const filtered = status ? roomData.filter(row => row.Status === status) : roomData;
  
  paginationState.rooms.currentPage = 1;
  renderRoomsTable(filtered);
});

document.getElementById('roomsRefreshBtn')?.addEventListener('click', () => {
  document.getElementById('roomsSearchInput').value = '';
  document.getElementById('roomsFloorFilter').value = '';
  document.getElementById('roomsRoomFilter').value = '';
  document.getElementById('roomsTypeFilter').value = '';
  document.getElementById('roomsStatusFilter').value = '';
  
  fetchAndRenderRooms(); // Re-fetches data, re-populates filters, renders table
});

document.getElementById('roomsDownloadBtn')?.addEventListener('click', () => {
  const headers = ['Floor', 'Room', 'Type', 'No. Guests', 'Rate', 'Status'];
  const csvContent = [
    headers.join(','),
    ...roomData.map(row => [row.Floor, row.Room, row.Type, row.NoGuests, row.Rate, row.Status].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rooms-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
});

// ===== LOGOUT FUNCTIONALITY =====
const logoutBtn = document.getElementById('logoutBtn');
const logoutModal = document.getElementById('logoutModal');
const closeLogoutBtn = document.getElementById('closeLogoutBtn');
const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    if (logoutModal) logoutModal.style.display = 'flex'; 
  });
}

if (closeLogoutBtn) {
  closeLogoutBtn.addEventListener('click', () => {
    if (logoutModal) logoutModal.style.display = 'none'; 
  });
}

if (cancelLogoutBtn) {
  cancelLogoutBtn.addEventListener('click', () => {
    if (logoutModal) logoutModal.style.display = 'none'; 
  });
}

if (confirmLogoutBtn) {
  confirmLogoutBtn.addEventListener('click', () => {
    console.log('Logout confirmed - redirecting to logout script');
    window.location.href = 'logout.php'; 
  });
}

if (logoutModal) {
  logoutModal.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      logoutModal.style.display = 'none';
    }
  });
}


// ===== ROOM MODAL HANDLERS (UPDATED WITH DB LOGIC) =====
document.getElementById('addRoomBtn')?.addEventListener('click', () => {
    hideFormMessage(); 
    roomModalTitle.textContent = 'Add New Room';
    roomForm.reset();
    hiddenRoomIdInput.value = '';
    document.getElementById('saveRoomBtn').textContent = 'SAVE ROOM';
    roomModal.style.display = 'flex';
});

closeRoomModalBtn?.addEventListener('click', () => {
    roomModal.style.display = 'none';
    hideFormMessage();
});

cancelRoomBtn?.addEventListener('click', () => {
    roomModal.style.display = 'none';
    hideFormMessage();
});

// ===== MODIFIED FUNCTION: Fixes status selection in modal =====
function handleEditClick(event) {
    hideFormMessage(); 
    const room = JSON.parse(event.currentTarget.dataset.roomData);
    
    roomModalTitle.textContent = 'Edit Room ' + room.Room;
    document.getElementById('saveRoomBtn').textContent = 'UPDATE ROOM';
    
    hiddenRoomIdInput.value = room.RoomID;
    roomFloorInput.value = room.Floor;
    roomNumberInput.value = room.Room;
    roomTypeInput.value = room.Type;
    roomGuestsInput.value = room.NoGuests;
    roomRateInput.value = room.Rate;
    
    // Set dropdown value to the exact string from the database (e.g., "Needs Cleaning")
    // This now matches the <option> values in admin.php
    roomStatusInput.value = room.Status;

    roomModal.style.display = 'flex';
}

roomForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideFormMessage(); 
    
    const floor = roomFloorInput.value;
    const roomNum = roomNumberInput.value;
    if (!roomNum.startsWith(floor)) {
        showFormMessage(`Room Number (${roomNum}) must start with the selected Floor Number (${floor}).`, 'error');
        return;
    }

    const roomID = hiddenRoomIdInput.value;
    const action = roomID ? 'edit_room' : 'add_room';
    
    const data = {
        roomID: roomID,
        roomFloor: roomFloorInput.value,
        roomNumber: roomNumberInput.value,
        roomType: roomTypeInput.value,
        roomGuests: roomGuestsInput.value,
        roomRate: roomRateInput.value,
        roomStatus: roomStatusInput.value, // This now sends "Needs Cleaning"
    };

    const result = await apiCall(action, data, 'POST');

    if (result.success) {
        showFormMessage(result.message, 'success');
        roomForm.reset();
        await fetchAndRenderRooms(); // Refresh table, filters, and dashboard from DB
        
        setTimeout(() => {
            roomModal.style.display = 'none';
            hideFormMessage();
        }, 1500);
    } else {
        showFormMessage(result.message, 'error');
    }
});

// --- Delete Modal Handlers ---
let roomToDeleteID = null;

function handleDeleteClick(event) {
    roomToDeleteID = event.currentTarget.dataset.roomId;
    const roomNumber = event.currentTarget.dataset.roomNumber;
    document.getElementById('deleteRoomText').textContent = `Are you sure you want to delete Room ${roomNumber}? This action cannot be undone.`;
    deleteRoomModal.style.display = 'flex';
}

closeDeleteModalBtn?.addEventListener('click', () => deleteRoomModal.style.display = 'none');
cancelDeleteBtn?.addEventListener('click', () => deleteRoomModal.style.display = 'none');

confirmDeleteBtn?.addEventListener('click', async () => {
    if (!roomToDeleteID) return;

    const data = { roomID: roomToDeleteID };
    const result = await apiCall('delete_room', data, 'POST');

    if (result.success) {
        deleteRoomModal.style.display = 'none';
        await fetchAndRenderRooms(); // Refresh table, filters, and dashboard from DB
    } else {
        alert(result.message); 
    }
});

// Close modals on backdrop click
roomModal?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    roomModal.style.display = 'none';
    hideFormMessage();
  }
});

deleteRoomModal?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    deleteRoomModal.style.display = 'none';
  }
});

// ===== INITIALIZATION AND EVENT ATTACHMENT =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('Admin page loaded - initializing with shared data');
  
  roomTypeInput?.addEventListener('change', updateGuestCapacity);
  roomFloorInput?.addEventListener('change', enforceFloorPrefix);
  roomNumberInput?.addEventListener('input', enforceFloorPrefix);
  
  const dashboardLink = document.querySelector('[data-page="dashboard"]');
  if (dashboardLink) {
    dashboardLink.classList.add('active');
  }
  const dashboardPage = document.getElementById('dashboard-page');
  if (dashboardPage) {
    dashboardPage.classList.add('active');
  }

  updateDashboardStats(dashData); // Load static data first
  
  // Render tables with static data and pagination
  renderHKTable(hkData);
  renderHKHistTable(hkHistData);
  renderMTTable(mtData);
  renderParkingTable(parkingDataList);
  renderInventoryTable(inventoryDataList);
  
  // Fetch dynamic data for Rooms (which also updates dashboard stats)
  if(document.getElementById('rooms-page')) {
      fetchAndRenderRooms();
  }
});