// ===== SAMPLE DATA =====
const requestsData = [
  { floor: 1, room: 101, issue: 'Leaky Faucet', date: '2025-10-19', requestTime: '10:30 AM', priority: 'High', status: 'pending', staff: 'Not Assigned' },
  { floor: 1, room: 102, issue: 'AC Not Working', date: '2025-10-19', requestTime: '11:15 AM', priority: 'Urgent', status: 'urgent', staff: 'Not Assigned' },
  { floor: 2, room: 201, issue: 'Broken Door Lock', date: '2025-10-19', requestTime: '09:45 AM', priority: 'High', status: 'pending', staff: 'Juan Dela Cruz' },
  { floor: 2, room: 202, issue: 'Electrical Outlet Damaged', date: '2025-10-19', requestTime: '12:00 PM', priority: 'Urgent', status: 'urgent', staff: 'Not Assigned' },
];

const staffData = [
  { id: 1, name: 'Juan Dela Cruz', assigned: false },
  { id: 2, name: 'Carlos Rodriguez', assigned: true },
  { id: 3, name: 'Miguel Santos', assigned: false },
  { id: 4, name: 'Luis Martinez', assigned: false },
  { id: 5, name: 'Antonio Reyes', assigned: true },
  { id: 6, name: 'Roberto Garcia', assigned: false },
];

const historyData = [
  { floor: 1, room: 101, issue: 'Leaky Faucet', date: '2025-10-18', requestedTime: '2:00 PM', completedTime: '3:00 PM', staff: 'Juan Dela Cruz', status: 'repaired', remarks: 'Replaced faucet washer' },
  { floor: 1, room: 102, issue: 'Light Fixture Broken', date: '2025-10-18', requestedTime: '3:15 PM', completedTime: '4:30 PM', staff: 'Carlos Rodriguez', status: 'repaired', remarks: 'Replaced bulb and fixture' },
  { floor: 2, room: 201, issue: 'Door Handle Stuck', date: '2025-10-18', requestedTime: '1:00 PM', completedTime: '2:00 PM', staff: 'Miguel Santos', status: 'repaired', remarks: 'Applied lubricant' },
  { floor: 2, room: 202, issue: 'Shower Head Low Pressure', date: '2025-10-17', requestedTime: '10:00 AM', completedTime: '11:15 AM', staff: 'Luis Martinez', status: 'repaired', remarks: 'Cleaned aerator' },
  { floor: 1, room: 103, issue: 'Wall Paint Chipped', date: '2025-10-17', requestedTime: '4:00 PM', completedTime: '5:00 PM', staff: 'Antonio Reyes', status: 'repaired', remarks: 'Touch up paint applied' },
];

// Store filtered data
let filteredRequests = [...requestsData];
let filteredStaff = [...staffData];
let filteredHistory = [...historyData];

// ===== TAB NAVIGATION =====
const tabBtns = document.querySelectorAll('.tabBtn');
const tabContents = document.querySelectorAll('.tabContent');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.getAttribute('data-tab');
    
    // Remove active class from all tabs
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    // Add active class to clicked tab
    btn.classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
  });
});

// ===== RENDER FUNCTIONS =====
function renderRequestsTable(data = filteredRequests) {
  const tbody = document.getElementById('requestsTableBody');
  
  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #999;">No requests found</td></tr>';
    return;
  }
  
  tbody.innerHTML = data.map(req => `
    <tr>
      <td>${req.floor}</td>
      <td>${req.room}</td>
      <td>${req.issue}</td>
      <td>${req.date}</td>
      <td>${req.requestTime}</td>
      <td>${req.priority}</td>
      <td><span class="statusBadge ${req.status}">${req.status === 'pending' ? 'Pending' : 'Urgent'}</span></td>
      <td>${req.staff === 'Not Assigned' ? '<button class="assignBtn">Assign Staff</button>' : req.staff}</td>
    </tr>
  `).join('');
}

function renderStaffGrid(data = filteredStaff) {
  const grid = document.getElementById('staffGrid');
  
  if (data.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #999;">No staff members found</div>';
    return;
  }
  
  grid.innerHTML = data.map(staff => `
    <div class="staffCard">
      <div class="staffName">${staff.name}</div>
      <button class="staffAssignBtn ${staff.assigned ? 'assigned' : ''}">${staff.assigned ? 'ASSIGNED' : 'ASSIGN'}</button>
    </div>
  `).join('');
}

function renderHistoryTable(data = filteredHistory) {
  const tbody = document.getElementById('historyTableBody');
  
  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No history found</td></tr>';
    return;
  }
  
  tbody.innerHTML = data.map(hist => `
    <tr>
      <td>${hist.floor}</td>
      <td>${hist.room}</td>
      <td>${hist.issue}</td>
      <td>${hist.date}</td>
      <td>${hist.requestedTime}</td>
      <td>${hist.completedTime}</td>
      <td>${hist.staff}</td>
      <td><span class="statusBadge ${hist.status}">${hist.status === 'repaired' ? 'Repaired' : hist.status}</span></td>
      <td>${hist.remarks}</td>
    </tr>
  `).join('');
  
  // Update record count
  document.getElementById('recordCount').textContent = data.length;
}

// ===== FILTER FUNCTIONS =====
function filterRequests() {
  const floor = document.getElementById('floorFilter').value;
  const room = document.getElementById('roomFilter').value;
  const status = document.getElementById('statusFilter').value;
  const search = document.getElementById('searchInput').value.toLowerCase();
  
  filteredRequests = requestsData.filter(req => {
    const matchFloor = !floor || req.floor.toString() === floor;
    const matchRoom = !room || req.room.toString() === room;
    const matchStatus = !status || req.status === status;
    const matchSearch = !search || 
      req.issue.toLowerCase().includes(search) ||
      req.room.toString().includes(search) ||
      req.staff.toLowerCase().includes(search);
    
    return matchFloor && matchRoom && matchStatus && matchSearch;
  });
  
  renderRequestsTable(filteredRequests);
}

function filterStaff() {
  const search = document.getElementById('staffSearchInput').value.toLowerCase();
  
  filteredStaff = staffData.filter(staff => 
    staff.name.toLowerCase().includes(search)
  );
  
  renderStaffGrid(filteredStaff);
}

function filterHistory() {
  const floor = document.getElementById('floorFilterHistory').value;
  const room = document.getElementById('roomFilterHistory').value;
  const search = document.getElementById('historySearchInput').value.toLowerCase();
  
  filteredHistory = historyData.filter(hist => {
    const matchFloor = !floor || hist.floor.toString() === floor;
    const matchRoom = !room || hist.room.toString() === room;
    const matchSearch = !search || 
      hist.issue.toLowerCase().includes(search) ||
      hist.room.toString().includes(search) ||
      hist.staff.toLowerCase().includes(search);
    
    return matchFloor && matchRoom && matchSearch;
  });
  
  renderHistoryTable(filteredHistory);
}

// ===== MODALS =====
const assignModal = document.getElementById('assignModal');
const successModal = document.getElementById('successModal');
const closeAssignBtn = document.getElementById('closeAssignBtn');
const cancelAssignBtn = document.getElementById('cancelAssignBtn');
const confirmAssignBtn = document.getElementById('confirmAssignBtn');
const closeSuccessBtn = document.getElementById('closeSuccessBtn');
const okayBtn = document.getElementById('okayBtn');

// Close buttons
closeAssignBtn.addEventListener('click', () => {
  assignModal.style.display = 'none';
});

closeSuccessBtn.addEventListener('click', () => {
  successModal.style.display = 'none';
});

cancelAssignBtn.addEventListener('click', () => {
  assignModal.style.display = 'none';
});

// Confirm assign - show success modal
confirmAssignBtn.addEventListener('click', () => {
  assignModal.style.display = 'none';
  successModal.style.display = 'flex';
});

// Close success modal
okayBtn.addEventListener('click', () => {
  successModal.style.display = 'none';
});

// Close modal on backdrop click
assignModal.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    assignModal.style.display = 'none';
  }
});

successModal.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    successModal.style.display = 'none';
  }
});

// Assign buttons trigger modal
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('staffAssignBtn') || 
      e.target.classList.contains('assignBtn')) {
    assignModal.style.display = 'flex';
  }
});

// ===== PROFILE BUTTON =====
const profileBtn = document.getElementById('profileBtn');
if (profileBtn) {
  profileBtn.addEventListener('click', () => {
    console.log('Profile clicked');
    alert('Profile menu would open here');
  });
}

// ===== SEARCH INPUTS =====
document.getElementById('searchInput').addEventListener('input', filterRequests);
document.getElementById('staffSearchInput').addEventListener('input', filterStaff);
document.getElementById('historySearchInput').addEventListener('input', filterHistory);

// ===== FILTER DROPDOWNS =====
document.getElementById('floorFilter').addEventListener('change', filterRequests);
document.getElementById('roomFilter').addEventListener('change', filterRequests);
document.getElementById('statusFilter').addEventListener('change', filterRequests);
document.getElementById('floorFilterHistory').addEventListener('change', filterHistory);
document.getElementById('roomFilterHistory').addEventListener('change', filterHistory);
document.getElementById('dateFilterHistory').addEventListener('change', (e) => {
  console.log('Date filter:', e.target.value);
  // You can implement date filtering here when backend is ready
});

// ===== REFRESH BUTTON =====
document.getElementById('refreshBtn').addEventListener('click', () => {
  console.log('Refresh clicked - would fetch new data from backend');
  
  // Reset filters
  document.getElementById('floorFilter').value = '';
  document.getElementById('roomFilter').value = '';
  document.getElementById('statusFilter').value = '';
  document.getElementById('searchInput').value = '';
  
  // Re-render with original data
  filteredRequests = [...requestsData];
  renderRequestsTable(filteredRequests);
  
  // Show feedback
  alert('Data refreshed!');
});

// ===== DOWNLOAD BUTTON =====
document.getElementById('downloadBtn').addEventListener('click', () => {
  console.log('Download clicked - would generate report');
  
  // Create CSV content
  const headers = ['Floor', 'Room', 'Issue Type', 'Date', 'Requested Time', 'Completed Time', 'Staff In Charge', 'Status', 'Remarks'];
  const csvContent = [
    headers.join(','),
    ...filteredHistory.map(hist => 
      [hist.floor, hist.room, hist.issue, hist.date, hist.requestedTime, hist.completedTime, hist.staff, hist.status, hist.remarks].join(',')
    )
  ].join('\n');
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `maintenance-history-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
});

// ===== PAGINATION BUTTONS =====
document.querySelectorAll('.paginationBtn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    if (e.target.textContent === '←' || e.target.textContent === '→') {
      console.log('Navigation:', e.target.textContent);
      return;
    }
    
    document.querySelectorAll('.paginationBtn').forEach(b => {
      if (b.textContent !== '←' && b.textContent !== '→' && b.textContent !== '...') {
        b.classList.remove('active');
      }
    });
    
    e.target.classList.add('active');
    console.log('Page:', e.target.textContent);
  });
});

// ===== INITIAL RENDER =====
renderRequestsTable();
renderStaffGrid();
renderHistoryTable();