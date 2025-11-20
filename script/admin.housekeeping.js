// ===== HOUSEKEEPING RENDER FUNCTIONS =====

function renderHKTable(data = hkData) {
  const tbody = document.getElementById('hkTableBody');
  if (!tbody) return;
  
  const state = paginationState.housekeeping;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);

  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => {
      const statusClass = getStatusClass(row.status);
      const statusText = formatStatus(row.status);
      
      // --- FIX: Escape HTML on all fields ---
      return `
      <tr>
        <td>${escapeHtml(row.floor)}</td>
        <td>${escapeHtml(row.room)}</td>
        <td>${escapeHtml(row.date)}</td>
        <td>${escapeHtml(row.requestTime)}</td>
        <td>${escapeHtml(row.lastClean)}</td>
        <td><span class="statusBadge ${statusClass}">${escapeHtml(statusText)}</span></td>
        <td>${escapeHtml(row.staff)}</td>
      </tr>
    `}).join('');
  }
  
  const recordCount = document.getElementById('hkRecordCount');
  if (recordCount) recordCount.textContent = data.length;
  
  renderPaginationControls('hk-requests-tab', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderHKTable(data);
  });
}

// Helper function to get the right CSS class
function getHkHistoryStatusClass(status) {
    switch (status) {
        case 'In Progress': return 'in-progress';
        case 'Completed': return 'completed';
        case 'Cancelled': return 'cancelled';
        default: return '';
    }
}

function renderHKHistTable(data = hkHistData) {
  const tbody = document.getElementById('hkHistTableBody');
  if (!tbody) return;
  
  const state = paginationState.housekeepingHistory;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);
  
  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => {
        const statusClass = getHkHistoryStatusClass(row.status);

        // --- FIX: Handle Remarks (Truncate & Escape) ---
        const rawRemarks = row.remarks ?? '';
        const safeFullRemarks = escapeHtml(rawRemarks); // For tooltip
        
        // Truncate first, then escape (prevents huge text issues)
        const truncatedRaw = rawRemarks.length > 30 ? rawRemarks.substring(0, 30) + '...' : rawRemarks;
        const safeDisplayRemarks = escapeHtml(truncatedRaw) || 'N/A';

        return `
          <tr>
            <td>${escapeHtml(row.floor)}</td>
            <td>${escapeHtml(row.room)}</td>
            <td>${escapeHtml(row.issueType)}</td>
            <td>${escapeHtml(row.date)}</td>
            <td>${escapeHtml(row.requestedTime)}</td>
            <td>${escapeHtml(row.completedTime)}</td>
            <td>${escapeHtml(row.staff)}</td>
            <td><span class="statusBadge ${statusClass}">${escapeHtml(row.status)}</span></td>
            <td title="${safeFullRemarks}">${safeDisplayRemarks}</td>
          </tr>
        `;
    }).join('');
  }
  
  const recordCount = document.getElementById('hkHistRecordCount');
  if (recordCount) recordCount.textContent = data.length;
  
  renderPaginationControls('hk-history-tab', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderHKHistTable(data);
  });
}


// ===== HELPER FUNCTIONS (can be moved to utils or admin.js) =====
// Ensure these helpers are defined, either here or in admin.utils.js
if (typeof getStatusClass !== 'function') {
    function getStatusClass(status) {
        switch (status) {
            case 'Available': return 'available';
            case 'Needs Cleaning': return 'needs-cleaning'; // Use the specific class
            case 'Pending': return 'pending';
            case 'In Progress': return 'in-progress';
            case 'Needs Maintenance': return 'needs-maintenance'; // <<< THIS IS THE FIX
            default: return 'available';
        }
    }
}

if (typeof formatStatus !== 'function') {
    function formatStatus(status) {
        if (status === 'Needs Cleaning' || status === 'Needs Maintenance') return status;
        return (status || '').replace(/([A-Z])/g, ' $1').trim(); // e.g., "In Progress"
    }
}

/**
 * HOUSEKEEPING MODULE JAVASCRIPT
 * Features: DB Filters, Dependent Dropdowns, PDF Export, Toast Notifications
 * Fix: Uses .onclick to prevent multiple downloads
 * Style: Landscape PDF, Custom Header Color (#480c1b), Auto-fit columns
 */

// ==========================================
// 1. GLOBAL STATE & UTILITIES
// ==========================================

let globalRoomList = []; // Store raw data for local filtering

// Helper: Toast Notification
function showRefreshToast(message) {
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

// Helper: Fetch Data
async function fetchAndPopulateFilters() {
    try {
        const response = await fetch('fetch_filters.php'); 
        const data = await response.json();

        if (data.floors && data.rooms) {
            globalRoomList = data.rooms; 

            // Populate Request Tab
            populateSelect('hkfloorFilter', data.floors, 'Floor');
            populateSelect('hkroomFilter', data.rooms, 'Room');

            // Populate History Tab
            populateSelect('floorFilterHkHist', data.floors, 'Floor');
            populateSelect('roomFilterHkHist', data.rooms, 'Room');
        }
    } catch (error) {
        console.error('Error loading DB filters:', error);
    }
}

// Helper: Populate Dropdowns
function populateSelect(elementId, data, defaultText) {
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

// Helper: Generate PDF (LANDSCAPE & FIT DATA)
function downloadPDF(headers, data, title, filename) {
    if (!window.jspdf) {
        alert("PDF Library not loaded. Please check your <script> tags.");
        return;
    }

    const { jsPDF } = window.jspdf;
    // 'l' means Landscape, 'mm' means millimeters, 'a4' is paper size
    const doc = new jsPDF('l', 'mm', 'a4');

    // Header Title
    doc.setFontSize(18);
    doc.setTextColor(72, 12, 27); // #480c1b
    doc.text(title, 14, 20);
    
    // Date
    doc.setFontSize(11);
    doc.setTextColor(100); 
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

    // Table Generation
    doc.autoTable({
        head: [headers],
        body: data,
        startY: 35,
        theme: 'grid',
        // Styles to ensure data fits
        styles: { 
            fontSize: 10,           // Slightly smaller font to fit more columns
            cellPadding: 3,         // Adequate padding
            overflow: 'linebreak',  // Wrap long text instead of cutting it off
            textColor: 50
        },
        // Header Styles (Your Custom Colors)
        headStyles: { 
            fillColor: '#480c1b', 
            textColor: '#ffffff', 
            fontStyle: 'bold',
            halign: 'center'        // Center align headers
        },
        // Specific column tweaks (optional, ensures Room column isn't too wide)
        columnStyles: {
            0: { cellWidth: 'auto' }, // Floor
            1: { cellWidth: 'auto' }, // Room
            // Status column usually benefits from being bold
            5: { fontStyle: 'bold' }
        },
        margin: { top: 35 }
    });

    doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ==========================================
// 2. REQUESTS TAB LOGIC
// ==========================================

function initHKRequestFilters() {
    fetchAndPopulateFilters(); 

    const searchInput = document.getElementById('hkSearchInput');
    const floorSelect = document.getElementById('hkfloorFilter');
    const roomSelect = document.getElementById('hkroomFilter');
    const refreshBtn = document.getElementById('hkRefreshBtn');
    const downloadBtn = document.getElementById('hkDownloadBtn');

    // --- Filter Function ---
    function applyHKRequestFilters() {
        const searchValue = searchInput.value.toLowerCase();
        const selectedFloor = floorSelect.value;
        const selectedRoom = roomSelect.value;

        const filtered = hkData.filter(row => {
            const matchesSearch = row.room.toLowerCase().includes(searchValue) ||
                                  (row.staff && row.staff.toLowerCase().includes(searchValue));
            const matchesFloor = selectedFloor === "" || row.floor.toString() === selectedFloor;
            const matchesRoom = selectedRoom === "" || row.room.toString() === selectedRoom;

            return matchesSearch && matchesFloor && matchesRoom;
        });

        paginationState.housekeeping.currentPage = 1;
        renderHKTable(filtered);
        
        if(document.getElementById('hkRecordCount')) {
            document.getElementById('hkRecordCount').innerText = filtered.length;
        }
    }

    // --- Dependent Dropdown ---
    if (floorSelect) {
        floorSelect.onchange = (e) => {
            const selectedFloor = e.target.value;
            roomSelect.value = ""; 

            if (selectedFloor === "") {
                populateSelect('hkroomFilter', globalRoomList, 'Room');
            } else {
                const filteredRooms = globalRoomList.filter(r => r.floor_num == selectedFloor);
                populateSelect('hkroomFilter', filteredRooms, 'Room');
            }
            applyHKRequestFilters();
        };
    }

    // --- Inputs ---
    if (searchInput) searchInput.oninput = applyHKRequestFilters;
    if (roomSelect) roomSelect.onchange = applyHKRequestFilters;

    // --- Refresh Button ---
    if (refreshBtn) {
        refreshBtn.onclick = () => {
            searchInput.value = '';
            floorSelect.value = '';
            roomSelect.value = ''; 
            populateSelect('hkroomFilter', globalRoomList, 'Room');
            
            hkData = [...(initialHkRequestsData || [])];
            applyHKRequestFilters();
            showRefreshToast("Requests refreshed successfully!");
        };
    }

    // --- Download Button ---
    if (downloadBtn) {
        downloadBtn.onclick = () => {
            const headers = ['Floor', 'Room', 'Date', 'Req Time', 'Last Clean', 'Status', 'Staff'];
            const tableData = hkData.map(row => [
                row.floor, 
                row.room, 
                row.date, 
                row.requestTime, 
                row.lastClean, 
                typeof formatStatus === 'function' ? formatStatus(row.status) : row.status, 
                row.staff
            ]);
            
            downloadPDF(headers, tableData, "Housekeeping Requests", "housekeeping_requests");
        };
    }
}

// ==========================================
// 3. HISTORY TAB LOGIC
// ==========================================

function initHKHistoryFilters() {
    const searchInput = document.getElementById('hkHistSearchInput');
    const floorSelect = document.getElementById('floorFilterHkHist');
    const roomSelect = document.getElementById('roomFilterHkHist');
    const dateInput = document.getElementById('dateFilterHkHist');
    const refreshBtn = document.getElementById('hkHistRefreshBtn');
    const downloadBtn = document.getElementById('hkHistDownloadBtn');

    // --- Filter Function ---
    function applyHKHistoryFilters() {
        const searchValue = searchInput.value.toLowerCase();
        const selectedFloor = floorSelect.value;
        const selectedRoom = roomSelect.value;
        const selectedDate = dateInput.value; 

        const filtered = hkHistData.filter(row => {
            const matchesSearch = row.room.toLowerCase().includes(searchValue) ||
                                  (row.staff && row.staff.toLowerCase().includes(searchValue)) ||
                                  row.issueType.toLowerCase().includes(searchValue);
            const matchesFloor = selectedFloor === "" || row.floor.toString() === selectedFloor;
            const matchesRoom = selectedRoom === "" || row.room.toString() === selectedRoom;
            
            let matchesDate = true;
            if (selectedDate) {
                const [y, m, d] = selectedDate.split('-');
                const formattedInput = `${m}.${d}.${y}`; 
                matchesDate = row.date === formattedInput;
            }

            return matchesSearch && matchesFloor && matchesRoom && matchesDate;
        });

        paginationState.housekeepingHistory.currentPage = 1;
        renderHKHistTable(filtered);

        if(document.getElementById('hkHistRecordCount')) {
            document.getElementById('hkHistRecordCount').innerText = filtered.length;
        }
    }

    // --- Dependent Dropdown ---
    if (floorSelect) {
        floorSelect.onchange = (e) => {
            const selectedFloor = e.target.value;
            roomSelect.value = ""; 

            if (selectedFloor === "") {
                populateSelect('roomFilterHkHist', globalRoomList, 'Room');
            } else {
                const filteredRooms = globalRoomList.filter(r => r.floor_num == selectedFloor);
                populateSelect('roomFilterHkHist', filteredRooms, 'Room');
            }
            applyHKHistoryFilters();
        };
    }

    // --- Inputs ---
    if (searchInput) searchInput.oninput = applyHKHistoryFilters;
    if (roomSelect) roomSelect.onchange = applyHKHistoryFilters;
    if (dateInput) dateInput.onchange = applyHKHistoryFilters;

    // --- Refresh Button ---
    if (refreshBtn) {
        refreshBtn.onclick = () => {
            searchInput.value = '';
            floorSelect.value = '';
            roomSelect.value = '';
            dateInput.value = '';
            populateSelect('roomFilterHkHist', globalRoomList, 'Room');
            
            hkHistData = [...(initialHkHistoryData || [])];
            applyHKHistoryFilters();
            showRefreshToast("History refreshed successfully!");
        };
    }

    // --- Download Button ---
    if (downloadBtn) {
        downloadBtn.onclick = () => {
            // Expanded headers for History to utilize Landscape mode
            const headers = ['Floor', 'Room', 'Task', 'Date', 'Req Time', 'Comp Time', 'Staff', 'Status', 'Remarks'];
            const tableData = hkHistData.map(row => [
                row.floor,
                row.room,
                row.issueType,
                row.date,
                row.requestedTime,
                row.completedTime,
                row.staff,
                row.status,
                row.remarks || '' // Now including remarks since we have space!
            ]);
            
            downloadPDF(headers, tableData, "Housekeeping History Logs", "housekeeping_history");
        };
    }
}

// ==========================================
// 4. INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('housekeeping-page')) {
        initHKRequestFilters();
        initHKHistoryFilters();
    }
});