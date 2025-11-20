// ===== MAINTENANCE RENDER FUNCTIONS =====
function renderMTRequestsTable(data = mtRequestsData) {
  const tbody = document.getElementById('mtRequestsTableBody');
  if (!tbody) return;
  const state = paginationState.maintenance;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);
  
  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => {
      const statusClass = getStatusClass(row.status);
      const statusText = formatStatus(row.status);
      return `
        <tr>
          <td>${row.floor}</td>
          <td>${row.room}</td>
          <td>${row.date}</td>
          <td>${row.requestTime}</td>
          <td>${row.lastMaintenance}</td>
          <td><span class="statusBadge ${statusClass}">${statusText}</span></td>
          <td>${row.staff}</td>
        </tr>
      `;
    }).join('');
  }
  
  const recordCount = document.getElementById('mtRequestsRecordCount');
  if (recordCount) recordCount.textContent = data.length;
  renderPaginationControls('mt-requests-tab', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderMTRequestsTable(data);
  });
}

// Helper function to get the right CSS class
function getMtHistoryStatusClass(status) {
    switch (status) {
        case 'In Progress':
            return 'in-progress'; 
        case 'Completed':
            return 'cleaned'; // You used 'cleaned' for maintenance, so we keep it
        case 'Cancelled':
            return 'cancelled';
        default:
            return ''; 
    }
}

function renderMTHistTable(data = mtHistData) {
  const tbody = document.getElementById('mtHistTableBody');
  if (!tbody) return;
  const state = paginationState.maintenanceHistory;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);
  
  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => {
        // --- THIS IS THE FIX ---
        const statusClass = getMtHistoryStatusClass(row.status);
        
        return `
          <tr>
            <td>${row.floor}</td>
            <td>${row.room}</td>
            <td>${row.issueType}</td>
            <td>${row.date}</td>
            <td>${row.requestedTime}</td>
            <td>${row.completedTime}</td>
            <td>${row.staff}</td>
            <td><span class="statusBadge ${statusClass}">${row.status}</span></td>
            <td>${row.remarks || 'N/A'}</td>
          </tr>
        `;
    }).join('');
  }
  
  const recordCount = document.getElementById('mtHistRecordCount');
  if (recordCount) recordCount.textContent = data.length;
  renderPaginationControls('mt-history-tab', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderMTHistTable(data);
  });
}

/**
 * MAINTENANCE MODULE JAVASCRIPT
 * Features: DB Filters, Dependent Dropdowns, Landscape PDF Export, Green Toast
 */

// ==========================================
// 1. GLOBAL STATE & HELPERS
// ==========================================

// Store raw room data for local filtering
let globalMTRoomList = []; 

// --- Toast Notification Helper ---
function showMTToast(message) {
    const existingToast = document.querySelector('.toast-success');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-success';
    toast.innerText = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('toast-visible');
    });

    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- Fetch Data Helper ---
async function fetchMTFilters() {
    try {
        // Reuse the same PHP file since Rooms/Floors are likely the same
        const response = await fetch('fetch_filters.php'); 
        const data = await response.json();

        if (data.floors && data.rooms) {
            globalMTRoomList = data.rooms; 

            // Populate Request Tab Dropdowns
            populateMTSelect('mtFloorFilter', data.floors, 'Floor');
            populateMTSelect('mtRoomFilter', data.rooms, 'Room');

            // Populate History Tab Dropdowns
            populateMTSelect('mtFloorFilterHist', data.floors, 'Floor');
            populateMTSelect('mtRoomFilterHist', data.rooms, 'Room');
        }
    } catch (error) {
        console.error('Error loading Maintenance filters:', error);
    }
}

// --- Populate Select Helper ---
function populateMTSelect(elementId, data, defaultText) {
    const select = document.getElementById(elementId);
    if (!select) return;

    const currentVal = select.value;
    select.innerHTML = `<option value="">${defaultText}</option>`;

    data.forEach(item => {
        const option = document.createElement('option');
        if (typeof item === 'object') {
            option.value = item.room_num; 
            option.textContent = `Room ${item.room_num}`;
            option.dataset.floor = item.floor_num; 
        } else {
            option.value = item;
            option.textContent = `Floor ${item}`;
        }
        select.appendChild(option);
    });
    
    if (currentVal) select.value = currentVal;
}

// --- PDF Generator Helper (Landscape) ---
function downloadMTPDF(headers, data, title, filename) {
    if (!window.jspdf) {
        alert("PDF Library not loaded. Please check your <script> tags.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape

    // Header
    doc.setFontSize(18);
    doc.setTextColor(72, 12, 27); // #480c1b
    doc.text(title, 14, 20);
    
    // Date
    doc.setFontSize(11);
    doc.setTextColor(100); 
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

    // Table
    doc.autoTable({
        head: [headers],
        body: data,
        startY: 35,
        theme: 'grid',
        styles: { 
            fontSize: 10,
            cellPadding: 3,
            overflow: 'linebreak',
            textColor: 50
        },
        headStyles: { 
            fillColor: '#480c1b', // Custom Color
            textColor: '#ffffff', 
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { cellWidth: 'auto' }, // Floor
            1: { cellWidth: 'auto' }, // Room
            // Status usually at index 5 or 7 depending on table
        }
    });

    doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ==========================================
// 2. REQUESTS TAB LOGIC
// ==========================================

function initMTRequestFilters() {
    fetchMTFilters(); // Load DB Data

    const searchInput = document.getElementById('mtSearchInput');
    const floorSelect = document.getElementById('mtFloorFilter');
    const roomSelect = document.getElementById('mtRoomFilter');
    const refreshBtn = document.getElementById('mtRefreshBtn');
    const downloadBtn = document.getElementById('mtDownloadBtn');

    // --- Central Filter Function ---
    function applyMTRequestFilters() {
        const searchValue = searchInput.value.toLowerCase();
        const selectedFloor = floorSelect.value;
        const selectedRoom = roomSelect.value;

        const filtered = mtRequestsData.filter(row => {
            const matchesSearch = row.room.toLowerCase().includes(searchValue) ||
                                  (row.staff && row.staff.toLowerCase().includes(searchValue));
            const matchesFloor = selectedFloor === "" || row.floor.toString() === selectedFloor;
            const matchesRoom = selectedRoom === "" || row.room.toString() === selectedRoom;

            return matchesSearch && matchesFloor && matchesRoom;
        });

        paginationState.maintenance.currentPage = 1;
        renderMTRequestsTable(filtered);
        
        if(document.getElementById('mtRequestsRecordCount')) {
            document.getElementById('mtRequestsRecordCount').innerText = filtered.length;
        }
    }

    // --- Dependent Dropdown (Floor -> Room) ---
    if (floorSelect) {
        floorSelect.onchange = (e) => {
            const selectedFloor = e.target.value;
            roomSelect.value = ""; 

            if (selectedFloor === "") {
                populateMTSelect('mtRoomFilter', globalMTRoomList, 'Room');
            } else {
                const filteredRooms = globalMTRoomList.filter(r => r.floor_num == selectedFloor);
                populateMTSelect('mtRoomFilter', filteredRooms, 'Room');
            }
            applyMTRequestFilters();
        };
    }

    // --- Inputs ---
    if (searchInput) searchInput.oninput = applyMTRequestFilters;
    if (roomSelect) roomSelect.onchange = applyMTRequestFilters;

    // --- Refresh ---
    if (refreshBtn) {
        refreshBtn.onclick = () => {
            searchInput.value = '';
            floorSelect.value = '';
            roomSelect.value = ''; 
            populateMTSelect('mtRoomFilter', globalMTRoomList, 'Room');
            
            // Reset to initial PHP data
            mtRequestsData = [...(initialMtRequestsData || [])];
            applyMTRequestFilters();
            showMTToast("Maintenance Requests refreshed!");
        };
    }

    // --- Download PDF ---
    if (downloadBtn) {
        downloadBtn.onclick = () => {
            const headers = ['Floor', 'Room', 'Date', 'Req Time', 'Last Maint', 'Status', 'Staff'];
            const tableData = mtRequestsData.map(row => [
                row.floor, 
                row.room, 
                row.date, 
                row.requestTime, 
                row.lastMaintenance, 
                typeof formatStatus === 'function' ? formatStatus(row.status) : row.status, 
                row.staff
            ]);
            
            downloadMTPDF(headers, tableData, "Maintenance Requests", "maintenance_requests");
        };
    }
}

// ==========================================
// 3. HISTORY TAB LOGIC
// ==========================================

function initMTHistoryFilters() {
    const searchInput = document.getElementById('mtHistSearchInput');
    const floorSelect = document.getElementById('mtFloorFilterHist');
    const roomSelect = document.getElementById('mtRoomFilterHist');
    const dateInput = document.getElementById('dateFilterMtHist');
    const refreshBtn = document.getElementById('mtHistRefreshBtn');
    const downloadBtn = document.getElementById('mtHistDownloadBtn');

    // --- Central Filter Function ---
    function applyMTHistoryFilters() {
        const searchValue = searchInput.value.toLowerCase();
        const selectedFloor = floorSelect.value;
        const selectedRoom = roomSelect.value;
        const selectedDate = dateInput.value; 

        const filtered = mtHistData.filter(row => {
            const matchesSearch = row.room.toLowerCase().includes(searchValue) ||
                                  (row.staff && row.staff.toLowerCase().includes(searchValue)) ||
                                  row.issueType.toLowerCase().includes(searchValue);
            
            const matchesFloor = selectedFloor === "" || row.floor.toString() === selectedFloor;
            const matchesRoom = selectedRoom === "" || row.room.toString() === selectedRoom;
            
            let matchesDate = true;
            if (selectedDate) {
                // Convert YYYY-MM-DD to MM.DD.YYYY
                const [y, m, d] = selectedDate.split('-');
                const formattedInput = `${m}.${d}.${y}`; 
                matchesDate = row.date === formattedInput;
            }

            return matchesSearch && matchesFloor && matchesRoom && matchesDate;
        });

        paginationState.maintenanceHistory.currentPage = 1;
        renderMTHistTable(filtered);

        if(document.getElementById('mtHistRecordCount')) {
            document.getElementById('mtHistRecordCount').innerText = filtered.length;
        }
    }

    // --- Dependent Dropdown ---
    if (floorSelect) {
        floorSelect.onchange = (e) => {
            const selectedFloor = e.target.value;
            roomSelect.value = ""; 

            if (selectedFloor === "") {
                populateMTSelect('mtRoomFilterHist', globalMTRoomList, 'Room');
            } else {
                const filteredRooms = globalMTRoomList.filter(r => r.floor_num == selectedFloor);
                populateMTSelect('mtRoomFilterHist', filteredRooms, 'Room');
            }
            applyMTHistoryFilters();
        };
    }

    // --- Inputs ---
    if (searchInput) searchInput.oninput = applyMTHistoryFilters;
    if (roomSelect) roomSelect.onchange = applyMTHistoryFilters;
    if (dateInput) dateInput.onchange = applyMTHistoryFilters;

    // --- Refresh ---
    if (refreshBtn) {
        refreshBtn.onclick = () => {
            searchInput.value = '';
            floorSelect.value = '';
            roomSelect.value = '';
            dateInput.value = '';
            populateMTSelect('mtRoomFilterHist', globalMTRoomList, 'Room');
            
            mtHistData = [...(initialMtHistoryData || [])];
            applyMTHistoryFilters();
            showMTToast("Maintenance History refreshed!");
        };
    }

    // --- Download PDF ---
    if (downloadBtn) {
        downloadBtn.onclick = () => {
            const headers = ['Floor', 'Room', 'Type', 'Date', 'Req Time', 'Comp Time', 'Staff', 'Status', 'Remarks'];
            const tableData = mtHistData.map(row => [
                row.floor,
                row.room,
                row.issueType,
                row.date,
                row.requestedTime,
                row.completedTime,
                row.staff,
                row.status,
                row.remarks || ''
            ]);
            
            downloadMTPDF(headers, tableData, "Maintenance History Logs", "maintenance_history");
        };
    }
}

// ==========================================
// 4. INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Only run if we are on the maintenance page
    if(document.getElementById('maintenance-page')) {
        initMTRequestFilters();
        initMTHistoryFilters();
    }
});