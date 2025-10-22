// ===== USE SHARED DATA =====
const requestsData = [
  { floor: 1, room: 101, issue: 'Leaky Faucet', date: '2025-10-19', requestTime: '10:30 AM', priority: 'High', status: 'pending', staff: 'Not Assigned' },
  { floor: 1, room: 102, issue: 'AC Not Working', date: '2025-10-19', requestTime: '11:15 AM', priority: 'Urgent', status: 'urgent', staff: 'Not Assigned' },
  { floor: 2, room: 201, issue: 'Broken Door Lock', date: '2025-10-19', requestTime: '09:45 AM', priority: 'High', status: 'pending', staff: 'Anna Martinez' },
  { floor: 2, room: 202, issue: 'Electrical Outlet Damaged', date: '2025-10-19', requestTime: '12:00 PM', priority: 'Urgent', status: 'urgent', staff: 'Not Assigned' },
];

const staffData = [
  { id: 1, name: 'Anna Martinez', assigned: false },
  { id: 2, name: 'James Wilson', assigned: true },
  { id: 3, name: 'Sofia Rodriguez', assigned: false },
  { id: 4, name: 'Michael Brown', assigned: false },
  { id: 5, name: 'Emma Davis', assigned: true },
  { id: 6, name: 'Oliver Taylor', assigned: false },
];

const historyData = [
  { floor: 1, room: 101, issue: 'Leaky Faucet', date: '2025-10-18', requestedTime: '2:00 PM', completedTime: '3:00 PM', staff: 'Anna Martinez', status: 'repaired', remarks: 'Replaced faucet washer' },
  { floor: 1, room: 102, issue: 'Light Fixture Broken', date: '2025-10-18', requestedTime: '3:15 PM', completedTime: '4:30 PM', staff: 'James Wilson', status: 'repaired', remarks: 'Replaced bulb and fixture' },
  { floor: 2, room: 201, issue: 'Door Handle Stuck', date: '2025-10-18', requestedTime: '1:00 PM', completedTime: '2:00 PM', staff: 'Sofia Rodriguez', status: 'repaired', remarks: 'Applied lubricant' },
  { floor: 2, room: 202, issue: 'Shower Head Low Pressure', date: '2025-10-17', requestedTime: '10:00 AM', completedTime: '11:15 AM', staff: 'Michael Brown', status: 'repaired', remarks: 'Cleaned aerator' },
  { floor: 1, room: 103, issue: 'Wall Paint Chipped', date: '2025-10-17', requestedTime: '4:00 PM', completedTime: '5:00 PM', staff: 'Emma Davis', status: 'repaired', remarks: 'Touch up paint applied' },
];

// Store filtered data
let filteredRequests = [...requestsData];
let filteredStaff = [...staffData];
let filteredHistory = [...historyData];
let selectedStaffId = null;
let currentRequestIndex = null;

// ===== TAB NAVIGATION =====
const tabBtns = document.querySelectorAll('.tabBtn');
const tabContents = document.querySelectorAll('.tabContent');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.getAttribute('data-tab');
    
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

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
  
  tbody.innerHTML = data.map((req, index) => `
    <tr>
      <td>${req.floor}</td>
      <td>${req.room}</td>
      <td>${req.issue}</td>
      <td>${req.date}</td>
      <td>${req.requestTime}</td>
      <td>${req.priority}</td>
      <td><span class="statusBadge ${req.status}">${req.status === 'pending' ? 'Pending' : 'Urgent'}</span></td>
      <td>${req.staff === 'Not Assigned' ? '<button class="assignBtn" data-index="' + index + '">Assign Staff</button>' : req.staff}</td>
    </tr>
  `).join('');
  
  document.querySelectorAll('.assignBtn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      currentRequestIndex = parseInt(e.target.getAttribute('data-index'));
      showStaffModal();
    });
  });
}

function renderStaffList(data = filteredStaff) {
  const staffList = document.getElementById('staffList');
  
  if (data.length === 0) {
    staffList.innerHTML = '<div style="text-align: center; padding: 20px; color: #dcc8b0;">No staff members found</div>';
    return;
  }
  
  staffList.innerHTML = data.map(staff => `
    <div class="staffListItem ${staff.assigned ? 'assigned' : ''}" data-staff-id="${staff.id}">
      <div class="staffListName">${staff.name}</div>
      <span class="staffListStatus ${staff.assigned ? 'assigned' : 'available'}">${staff.assigned ? 'Assigned' : 'Available'}</span>
    </div>
  `).join('');
  
  document.querySelectorAll('.staffListItem').forEach(item => {
    if (!item.classList.contains('assigned')) {
      item.addEventListener('click', (e) => {
        document.querySelectorAll('.staffListItem').forEach(i => i.classList.remove('selected'));
        
        item.classList.add('selected');
        selectedStaffId = parseInt(item.getAttribute('data-staff-id'));
        
        document.getElementById('confirmStaffBtn').disabled = false;
      });
    }
  });
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

function filterStaffInModal() {
  const search = document.getElementById('staffModalSearchInput').value.toLowerCase();
  
  filteredStaff = staffData.filter(staff => 
    staff.name.toLowerCase().includes(search)
  );
  
  renderStaffList(filteredStaff);
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

// ===== MODAL FUNCTIONS =====
const staffModal = document.getElementById('staffModal');
const assignModal = document.getElementById('assignModal');
const successModal = document.getElementById('successModal');

function showStaffModal() {
  selectedStaffId = null;
  document.getElementById('confirmStaffBtn').disabled = true;
  document.getElementById('staffModalSearchInput').value = '';
  filteredStaff = [...staffData];
  renderStaffList(filteredStaff);
  staffModal.style.display = 'flex';
}

function hideStaffModal() {
  staffModal.style.display = 'none';
}

function showAssignModal() {
  hideStaffModal();
  assignModal.style.display = 'flex';
}

function hideAssignModal() {
  assignModal.style.display = 'none';
}

function showSuccessModal() {
  hideAssignModal();
  successModal.style.display = 'flex';
}

function hideSuccessModal() {
  successModal.style.display = 'none';
}

// ===== MODAL EVENT LISTENERS =====
document.getElementById('closeStaffModalBtn').addEventListener('click', hideStaffModal);
document.getElementById('cancelStaffBtn').addEventListener('click', hideStaffModal);
document.getElementById('confirmStaffBtn').addEventListener('click', () => {
  if (selectedStaffId !== null) {
    showAssignModal();
  }
});

document.getElementById('staffModalSearchInput').addEventListener('input', filterStaffInModal);

document.getElementById('closeAssignBtn').addEventListener('click', hideAssignModal);
document.getElementById('cancelAssignBtn').addEventListener('click', hideAssignModal);
document.getElementById('confirmAssignBtn').addEventListener('click', () => {
  const selectedStaff = staffData.find(s => s.id === selectedStaffId);
  if (selectedStaff && currentRequestIndex !== null) {
    requestsData[currentRequestIndex].staff = selectedStaff.name;
    selectedStaff.assigned = true;
    filterRequests();
  }
  
  showSuccessModal();
});

document.getElementById('closeSuccessBtn').addEventListener('click', hideSuccessModal);
document.getElementById('okayBtn').addEventListener('click', hideSuccessModal);

staffModal.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    hideStaffModal();
  }
});

assignModal.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    hideAssignModal();
  }
});

successModal.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    hideSuccessModal();
  }
});


// ===== PROFILE BUTTON =====
const profileBtn = document.getElementById('profileBtn');
        const sidebar = document.getElementById('profile-sidebar');
        const closeBtn = document.getElementById('sidebar-close-btn');

        // 2. Add an event listener to the profile icon
        // When clicked, add the 'active' class to the sidebar to show it
        profileBtn.addEventListener('click', () => {
            sidebar.classList.add('active');
        });

        // 3. Add an event listener to the close button
        // When clicked, remove the 'active' class from the sidebar to hide it
        closeBtn.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });


                  // ===== LOGOUT FUNCTIONALITY =====
            const logoutBtn = document.getElementById('logoutBtn');
            const logoutModal = document.getElementById('logoutModal');
            const closeLogoutBtn = document.getElementById('closeLogoutBtn');
            const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
            const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

            // Helper function to handle hiding the modal
            const hideModal = () => {
                if (logoutModal) {
                    logoutModal.style.display = 'none';
                }
            };

            // Helper function to handle showing the modal
            const showModal = () => {
                if (logoutModal) {
                    // Use 'flex' (or 'block' if your CSS requires it) to make the modal visible
                    logoutModal.style.display = 'flex'; 
                }
            };

            // --- 1. OPEN MODAL ---
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault(); // Good practice for a link
                    showModal();
                });
            }

            // --- 2. CLOSE MODAL (X and CANCEL buttons) ---
            if (closeLogoutBtn) {
                closeLogoutBtn.addEventListener('click', hideModal);
            }
            if (cancelLogoutBtn) {
                cancelLogoutBtn.addEventListener('click', hideModal);
            }

            // --- 3. CLOSE MODAL (Clicking Backdrop) ---
            if (logoutModal) {
                logoutModal.addEventListener('click', (e) => {
                    // e.target is the specific element clicked
                    // e.currentTarget is the element the listener is attached to (logoutModal)
                    // If they are the same, it means the backdrop was clicked
                    if (e.target === e.currentTarget) {
                        hideModal();
                    }
                });
            }

            // --- 4. CONFIRM LOGOUT ---
            if (confirmLogoutBtn) {
                confirmLogoutBtn.addEventListener('click', () => {
                    console.log('Logout confirmed - redirecting to login page');
                    // Perform the actual redirect or API call here
                    window.location.href = '/logout.php'; 
                });
            }
// ===== SEARCH INPUTS =====
document.getElementById('searchInput').addEventListener('input', filterRequests);
document.getElementById('historySearchInput').addEventListener('input', filterHistory);

// ===== FILTER DROPDOWNS =====
document.getElementById('floorFilter').addEventListener('change', filterRequests);
document.getElementById('roomFilter').addEventListener('change', filterRequests);
document.getElementById('statusFilter').addEventListener('change', filterRequests);
document.getElementById('floorFilterHistory').addEventListener('change', filterHistory);
document.getElementById('roomFilterHistory').addEventListener('change', filterHistory);
document.getElementById('dateFilterHistory').addEventListener('change', (e) => {
  console.log('Date filter:', e.target.value);
});

// ===== REFRESH BUTTON =====
document.getElementById('refreshBtn').addEventListener('click', () => {
  document.getElementById('floorFilter').value = '';
  document.getElementById('roomFilter').value = '';
  document.getElementById('statusFilter').value = '';
  document.getElementById('searchInput').value = '';
  
  filteredRequests = [...requestsData];
  renderRequestsTable(filteredRequests);
  
  alert('Data refreshed!');
});

// ===== DOWNLOAD BUTTON - REQUESTS PAGE =====
const downloadBtnRequests = document.getElementById('downloadBtnRequests');
if (downloadBtnRequests) {
  downloadBtnRequests.addEventListener('click', () => {
    const headers = ['Floor', 'Room', 'Issue Type', 'Date', 'Request Time', 'Priority', 'Status', 'Staff In Charge'];
    const csvContent = [
      headers.join(','),
      ...filteredRequests.map(req => 
        [req.floor, req.room, req.issue, req.date, req.requestTime, req.priority, req.status === 'pending' ? 'Pending' : 'Urgent', req.staff].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maintenance-requests-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  });
}

// ===== DOWNLOAD BUTTON - HISTORY PAGE =====
document.getElementById('downloadBtn').addEventListener('click', () => {
  const headers = ['Floor', 'Room', 'Issue Type', 'Date', 'Requested Time', 'Completed Time', 'Staff In Charge', 'Status', 'Remarks'];
  const csvContent = [
    headers.join(','),
    ...filteredHistory.map(hist => 
      [hist.floor, hist.room, hist.issue, hist.date, hist.requestedTime, hist.completedTime, hist.staff, hist.status, hist.remarks].join(',')
    )
  ].join('\n');
  
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
filteredRequests = [...requestsData];
filteredHistory = [...historyData];
renderRequestsTable(filteredRequests);
renderHistoryTable(filteredHistory);