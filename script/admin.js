// ===== USE SHARED DATA =====
let hkData = [...housekeepingRequests];
let hkHistData = [...housekeepingHistory];
let mtData = [...maintenanceHistory];
let roomData = typeof roomsData !== 'undefined' ? [...roomsData] : [];
let parkingDataList = typeof parkingData !== 'undefined' ? [...parkingData] : [];
let inventoryDataList = typeof inventoryData !== 'undefined' ? [...inventoryData] : [];
let dashData = dashboardStats;

console.log('Data Loaded:', { roomData, parkingDataList, inventoryDataList });

// ===== UPDATE DASHBOARD FUNCTIONS =====
function updateDashboardStats(data) {
  const hkm = data.housekeepingMaintenance || dashboardStats.housekeepingMaintenance;
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

// ===== RENDER FUNCTIONS =====
function renderHKTable(data = hkData) {
  const tbody = document.getElementById('hkTableBody');
  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
    return;
  }
  
  tbody.innerHTML = data.map(row => `
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
  
  document.getElementById('hkRecordCount').textContent = data.length;
}

function renderHKHistTable(data = hkHistData) {
  const tbody = document.getElementById('hkHistTableBody');
  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
    return;
  }
  
  tbody.innerHTML = data.map(row => `
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
  
  document.getElementById('hkHistRecordCount').textContent = data.length;
}

function renderMTTable(data = mtData) {
  const tbody = document.getElementById('mtTableBody');
  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
    return;
  }
  
  tbody.innerHTML = data.map(row => `
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
  
  document.getElementById('mtRecordCount').textContent = data.length;
}

function renderRoomsTable(data = roomData) {
  const tbody = document.getElementById('roomsTableBody');
  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
    return;
  }
  
  tbody.innerHTML = data.map((row, index) => `
    <tr>
      <td>${row.floor}</td>
      <td>${row.room}</td>
      <td>${row.type}</td>
      <td>${row.guests}</td>
      <td>${row.rate}</td>
      <td><span class="statusBadge ${row.status}">${row.status.charAt(0).toUpperCase() + row.status.slice(1)}</span></td>
      <td>
        <div class="actionButtons">
          <button class="actionBtn editBtn" onclick="editRoom(${index})">
            <img src="assets/icons/edit-icon.png" alt="Edit" />
          </button>
          <button class="actionBtn deleteBtn" onclick="deleteRoom(${index})">
            <img src="assets/icons/delete-icon.png" alt="Delete" />
          </button>
        </div>
      </td>
    </tr>
  `).join('');
  
  document.getElementById('roomsRecordCount').textContent = data.length;
}

function renderParkingTable(data = parkingDataList) {
  const tbody = document.getElementById('parkingTableBody');
  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
    return;
  }
  
  tbody.innerHTML = data.map(row => `
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
  
  document.getElementById('parkingRecordCount').textContent = data.length;
}

function renderInventoryTable(data = inventoryDataList) {
  const tbody = document.getElementById('inventoryTableBody');
  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
    return;
  }
  
  tbody.innerHTML = data.map(row => {
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
  
  document.getElementById('inventoryRecordCount').textContent = data.length;
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

// ===== HOUSEKEEPING FILTERS =====
document.getElementById('hkSearchInput')?.addEventListener('input', (e) => {
  const search = e.target.value.toLowerCase();
  const filtered = hkData.filter(row => 
    row.guest.toLowerCase().includes(search) ||
    row.staff.toLowerCase().includes(search) ||
    row.room.toString().includes(search)
  );
  renderHKTable(filtered);
});

document.getElementById('floorFilter')?.addEventListener('change', (e) => {
  const floor = e.target.value;
  const filtered = floor ? hkData.filter(row => row.floor.toString() === floor) : hkData;
  renderHKTable(filtered);
});

document.getElementById('roomFilter')?.addEventListener('change', (e) => {
  const room = e.target.value;
  const filtered = room ? hkData.filter(row => row.room.toString() === room) : hkData;
  renderHKTable(filtered);
});

document.getElementById('statusFilter')?.addEventListener('change', (e) => {
  const status = e.target.value;
  const filtered = status ? hkData.filter(row => row.status === status) : hkData;
  renderHKTable(filtered);
});

document.getElementById('hkRefreshBtn')?.addEventListener('click', () => {
  document.getElementById('hkSearchInput').value = '';
  document.getElementById('floorFilter').value = '';
  document.getElementById('roomFilter').value = '';
  document.getElementById('statusFilter').value = '';
  hkData = [...housekeepingRequests];
  renderHKTable(hkData);
  alert('Housekeeping requests refreshed!');
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

// ===== HOUSEKEEPING HISTORY FILTERS =====
document.getElementById('hkHistSearchInput')?.addEventListener('input', (e) => {
  const search = e.target.value.toLowerCase();
  const filtered = hkHistData.filter(row => 
    row.guest.toLowerCase().includes(search) ||
    row.staff.toLowerCase().includes(search) ||
    row.room.toString().includes(search)
  );
  renderHKHistTable(filtered);
});

document.getElementById('floorFilterHkHist')?.addEventListener('change', (e) => {
  const floor = e.target.value;
  const filtered = floor ? hkHistData.filter(row => row.floor.toString() === floor) : hkHistData;
  renderHKHistTable(filtered);
});

document.getElementById('roomFilterHkHist')?.addEventListener('change', (e) => {
  const room = e.target.value;
  const filtered = room ? hkHistData.filter(row => row.room.toString() === room) : hkHistData;
  renderHKHistTable(filtered);
});

document.getElementById('hkHistRefreshBtn')?.addEventListener('click', () => {
  document.getElementById('hkHistSearchInput').value = '';
  document.getElementById('floorFilterHkHist').value = '';
  document.getElementById('roomFilterHkHist').value = '';
  hkHistData = [...housekeepingHistory];
  renderHKHistTable(hkHistData);
  alert('Housekeeping history refreshed!');
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

// ===== MAINTENANCE FILTERS =====
document.getElementById('mtSearchInput')?.addEventListener('input', (e) => {
  const search = e.target.value.toLowerCase();
  const filtered = mtData.filter(row => 
    row.issue.toLowerCase().includes(search) ||
    row.staff.toLowerCase().includes(search) ||
    row.room.toString().includes(search)
  );
  renderMTTable(filtered);
});

document.getElementById('mtFloorFilter')?.addEventListener('change', (e) => {
  const floor = e.target.value;
  const filtered = floor ? mtData.filter(row => row.floor.toString() === floor) : mtData;
  renderMTTable(filtered);
});

document.getElementById('mtRoomFilter')?.addEventListener('change', (e) => {
  const room = e.target.value;
  const filtered = room ? mtData.filter(row => row.room.toString() === room) : mtData;
  renderMTTable(filtered);
});

document.getElementById('mtStatusFilter')?.addEventListener('change', (e) => {
  const status = e.target.value;
  const filtered = status ? mtData.filter(row => row.status === status) : mtData;
  renderMTTable(filtered);
});

document.getElementById('mtRefreshBtn')?.addEventListener('click', () => {
  document.getElementById('mtSearchInput').value = '';
  document.getElementById('mtFloorFilter').value = '';
  document.getElementById('mtRoomFilter').value = '';
  document.getElementById('mtStatusFilter').value = '';
  mtData = [...maintenanceHistory];
  renderMTTable(mtData);
  alert('Maintenance data refreshed!');
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

// ===== PARKING FILTERS =====
document.getElementById('parkingSearchInput')?.addEventListener('input', (e) => {
  const search = e.target.value.toLowerCase();
  const filtered = parkingDataList.filter(row => 
    row.plateNumber.toLowerCase().includes(search) ||
    row.guestName.toLowerCase().includes(search) ||
    row.vehicleType.toLowerCase().includes(search) ||
    row.slotNumber.toLowerCase().includes(search)
  );
  renderParkingTable(filtered);
});

document.getElementById('parkingLevelFilter')?.addEventListener('change', (e) => {
  const level = e.target.value;
  const filtered = level ? parkingDataList.filter(row => row.level.toString() === level) : parkingDataList;
  renderParkingTable(filtered);
});

document.getElementById('parkingBlockFilter')?.addEventListener('change', (e) => {
  const block = e.target.value;
  const filtered = block ? parkingDataList.filter(row => row.block === block) : parkingDataList;
  renderParkingTable(filtered);
});

document.getElementById('parkingStatusFilter')?.addEventListener('change', (e) => {
  const status = e.target.value;
  const filtered = status ? parkingDataList.filter(row => row.status === status) : parkingDataList;
  renderParkingTable(filtered);
});

document.getElementById('parkingRefreshBtn')?.addEventListener('click', () => {
  document.getElementById('parkingSearchInput').value = '';
  document.getElementById('parkingLevelFilter').value = '';
  document.getElementById('parkingBlockFilter').value = '';
  document.getElementById('parkingStatusFilter').value = '';
  parkingDataList = [...parkingData];
  renderParkingTable(parkingDataList);
  alert('Parking data refreshed!');
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

// ===== INVENTORY FILTERS =====
document.getElementById('inventorySearchInput')?.addEventListener('input', (e) => {
  const search = e.target.value.toLowerCase();
  const filtered = inventoryDataList.filter(row => 
    row.name.toLowerCase().includes(search) ||
    row.category.toLowerCase().includes(search) ||
    row.description.toLowerCase().includes(search)
  );
  renderInventoryTable(filtered);
});

document.getElementById('inventoryCategoryFilter')?.addEventListener('change', (e) => {
  const category = e.target.value;
  const filtered = category ? inventoryDataList.filter(row => row.category === category) : inventoryDataList;
  renderInventoryTable(filtered);
});

document.getElementById('inventoryStatusFilter')?.addEventListener('change', (e) => {
  const status = e.target.value;
  const filtered = status ? inventoryDataList.filter(row => row.status === status) : inventoryDataList;
  renderInventoryTable(filtered);
});

document.getElementById('inventoryRefreshBtn')?.addEventListener('click', () => {
  document.getElementById('inventorySearchInput').value = '';
  document.getElementById('inventoryCategoryFilter').value = '';
  document.getElementById('inventoryStatusFilter').value = '';
  inventoryDataList = [...inventoryData];
  renderInventoryTable(inventoryDataList);
  alert('Inventory data refreshed!');
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

// ===== ROOMS FILTERS =====
document.getElementById('roomsSearchInput')?.addEventListener('input', (e) => {
  const search = e.target.value.toLowerCase();
  const filtered = roomData.filter(row => 
    row.type.toLowerCase().includes(search) ||
    row.room.toString().includes(search) ||
    row.status.toLowerCase().includes(search)
  );
  renderRoomsTable(filtered);
});

document.getElementById('roomsFloorFilter')?.addEventListener('change', (e) => {
  const floor = e.target.value;
  const filtered = floor ? roomData.filter(row => row.floor.toString() === floor) : roomData;
  renderRoomsTable(filtered);
});

document.getElementById('roomsRoomFilter')?.addEventListener('change', (e) => {
  const room = e.target.value;
  const filtered = room ? roomData.filter(row => row.room.toString() === room) : roomData;
  renderRoomsTable(filtered);
});

document.getElementById('roomsTypeFilter')?.addEventListener('change', (e) => {
  const type = e.target.value;
  const filtered = type ? roomData.filter(row => row.type === type) : roomData;
  renderRoomsTable(filtered);
});

document.getElementById('roomsStatusFilter')?.addEventListener('change', (e) => {
  const status = e.target.value;
  const filtered = status ? roomData.filter(row => row.status === status) : roomData;
  renderRoomsTable(filtered);
});

document.getElementById('roomsRefreshBtn')?.addEventListener('click', () => {
  document.getElementById('roomsSearchInput').value = '';
  document.getElementById('roomsFloorFilter').value = '';
  document.getElementById('roomsRoomFilter').value = '';
  document.getElementById('roomsTypeFilter').value = '';
  document.getElementById('roomsStatusFilter').value = '';
  roomData = [...roomsData];
  renderRoomsTable(roomData);
  alert('Rooms data refreshed!');
});

document.getElementById('roomsDownloadBtn')?.addEventListener('click', () => {
  const headers = ['Floor', 'Room', 'Type', 'No. Guests', 'Rate', 'Status'];
  const csvContent = [
    headers.join(','),
    ...roomData.map(row => [row.floor, row.room, row.type, row.guests, row.rate, row.status].join(','))
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
    logoutModal.style.display = 'flex';
  });
}

if (closeLogoutBtn) {
  closeLogoutBtn.addEventListener('click', () => {
    logoutModal.style.display = 'none';
  });
}

if (cancelLogoutBtn) {
  cancelLogoutBtn.addEventListener('click', () => {
    logoutModal.style.display = 'none';
  });
}

if (confirmLogoutBtn) {
  confirmLogoutBtn.addEventListener('click', () => {
    console.log('Logout confirmed - redirecting to login page');
    window.location.href = '/logout.php'; // adjusted to logout.php
  });
}

if (logoutModal) {
  logoutModal.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      logoutModal.style.display = 'none';
    }
  });
}

// ===== ROOM MANAGEMENT FUNCTIONS =====
let editingRoomIndex = -1;

// Add Room Button
document.getElementById('addRoomBtn')?.addEventListener('click', () => {
  editingRoomIndex = -1;
  document.getElementById('roomModalTitle').textContent = 'Add New Room';
  document.getElementById('roomForm').reset();
  document.getElementById('roomModal').style.display = 'flex';
});

// Edit Room Function (called from table)
window.editRoom = function(index) {
  editingRoomIndex = index;
  const room = roomData[index];
  
  document.getElementById('roomModalTitle').textContent = 'Edit Room';
  document.getElementById('roomFloor').value = room.floor;
  document.getElementById('roomNumber').value = room.room;
  document.getElementById('roomType').value = room.type;
  document.getElementById('roomGuests').value = room.guests;
  document.getElementById('roomRate').value = room.rate;
  document.getElementById('roomStatus').value = room.status;
  
  document.getElementById('roomModal').style.display = 'flex';
};

// Delete Room Function (called from table)
window.deleteRoom = function(index) {
  editingRoomIndex = index;
  const room = roomData[index];
  document.getElementById('deleteRoomText').textContent = 
    `Are you sure you want to delete Room ${room.room} (${room.type})? This action cannot be undone.`;
  document.getElementById('deleteRoomModal').style.display = 'flex';
};

// Save Room Form
document.getElementById('roomForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const roomObj = {
    floor: parseInt(document.getElementById('roomFloor').value),
    room: parseInt(document.getElementById('roomNumber').value),
    type: document.getElementById('roomType').value,
    guests: document.getElementById('roomGuests').value,
    rate: document.getElementById('roomRate').value,
    status: document.getElementById('roomStatus').value
  };
  
  if (editingRoomIndex >= 0) {
    // Update existing room
    roomData[editingRoomIndex] = roomObj;
    alert('Room updated successfully!');
  } else {
    // Add new room
    roomData.push(roomObj);
    alert('Room added successfully!');
  }
  
  // Update global data
  if (window.appData) {
    window.appData.rooms = roomData;
  }
  
  renderRoomsTable(roomData);
  document.getElementById('roomModal').style.display = 'none';
  document.getElementById('roomForm').reset();
});

// Confirm Delete Room
document.getElementById('confirmDeleteBtn')?.addEventListener('click', () => {
  if (editingRoomIndex >= 0) {
    const deletedRoom = roomData[editingRoomIndex];
    roomData.splice(editingRoomIndex, 1);
    
    // Update global data
    if (window.appData) {
      window.appData.rooms = roomData;
    }
    
    alert(`Room ${deletedRoom.room} deleted successfully!`);
    renderRoomsTable(roomData);
  }
  document.getElementById('deleteRoomModal').style.display = 'none';
});

// Close Room Modal
document.getElementById('closeRoomModalBtn')?.addEventListener('click', () => {
  document.getElementById('roomModal').style.display = 'none';
});

document.getElementById('cancelRoomBtn')?.addEventListener('click', () => {
  document.getElementById('roomModal').style.display = 'none';
});

// Close Delete Modal
document.getElementById('closeDeleteModalBtn')?.addEventListener('click', () => {
  document.getElementById('deleteRoomModal').style.display = 'none';
});

document.getElementById('cancelDeleteBtn')?.addEventListener('click', () => {
  document.getElementById('deleteRoomModal').style.display = 'none';
});

// Close modals on backdrop click
document.getElementById('roomModal')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    document.getElementById('roomModal').style.display = 'none';
  }
});

document.getElementById('deleteRoomModal')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    document.getElementById('deleteRoomModal').style.display = 'none';
  }
});

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('Admin page loaded - initializing with shared data');
  console.log('HK Data:', hkData);
  console.log('HK History Data:', hkHistData);
  console.log('MT Data:', mtData);
  console.log('Rooms Data:', roomData);
  console.log('Parking Data:', parkingDataList);
  console.log('Inventory Data:', inventoryDataList);
  
  const dashboardLink = document.querySelector('[data-page="dashboard"]');
  if (dashboardLink) {
    dashboardLink.classList.add('active');
  }
  const dashboardPage = document.getElementById('dashboard-page');
  if (dashboardPage) {
    dashboardPage.classList.add('active');
  }

  updateDashboardStats(dashData);
  renderHKTable(hkData);
  renderHKHistTable(hkHistData);
  renderMTTable(mtData);
  renderRoomsTable(roomData);
  renderParkingTable(parkingDataList);
  renderInventoryTable(inventoryDataList);
});