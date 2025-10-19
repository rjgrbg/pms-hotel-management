// ===== USE SHARED DATA =====
// Reference the shared data from shared-data.js
let hkData = [...housekeepingRequests];
let hkHistData = [...housekeepingHistory];
let mtData = [...maintenanceHistory];
let dashData = dashboardStats;

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

// ===== HOUSEKEEPING TAB NAVIGATION (within housekeeping page) =====
const hkTabBtns = document.querySelectorAll('[data-admin-tab]');

hkTabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.getAttribute('data-admin-tab');
    
    // Remove active class from all HK tab buttons
    hkTabBtns.forEach(b => b.classList.remove('active'));
    
    // Remove active class from all HK tab contents
    const hkReqTab = document.getElementById('hk-requests-tab');
    const hkHistTab = document.getElementById('hk-history-tab');
    if (hkReqTab) hkReqTab.classList.remove('active');
    if (hkHistTab) hkHistTab.classList.remove('active');

    // Add active class to clicked button and corresponding tab
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
    window.location.href = '/login';
  });
}

if (logoutModal) {
  logoutModal.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      logoutModal.style.display = 'none';
    }
  });
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('Admin page loaded - initializing with shared data');
  console.log('HK Data:', hkData);
  console.log('HK History Data:', hkHistData);
  console.log('MT Data:', mtData);
  
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
});