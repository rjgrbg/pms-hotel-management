// ===== HOUSEKEEPING RENDER FUNCTIONS =====

function renderHKTable(data = hkData) {
  const tbody = document.getElementById('hkTableBody');
  if (!tbody) return;
  
  const state = paginationState.housekeeping;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);

  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => {
      const statusClass = getStatusClass(row.status);
      const statusText = formatStatus(row.status);
      
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
        const rawRemarks = row.remarks ?? '';
        const safeFullRemarks = escapeHtml(rawRemarks);
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

// Ensure helpers exist
if (typeof getStatusClass !== 'function') {
    function getStatusClass(status) {
        switch (status) {
            case 'Available': return 'available';
            case 'Needs Cleaning': return 'needs-cleaning';
            case 'Pending': return 'pending';
            case 'In Progress': return 'in-progress';
            case 'Needs Maintenance': return 'needs-maintenance';
            default: return 'available';
        }
    }
}

if (typeof formatStatus !== 'function') {
    function formatStatus(status) {
        if (status === 'Needs Cleaning' || status === 'Needs Maintenance') return status;
        return (status || '').replace(/([A-Z])/g, ' $1').trim();
    }
}

// ==========================================
// 1. GLOBAL STATE & UTILITIES
// ==========================================

let globalRoomList = [];

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

async function fetchAndPopulateFilters() {
    try {
        const response = await fetch('fetch_filters.php'); 
        const data = await response.json();

        if (data.floors && data.rooms) {
            globalRoomList = data.rooms; 
            populateSelect('hkfloorFilter', data.floors, 'Floor');
            populateSelect('hkroomFilter', data.rooms, 'Room');
            populateSelect('floorFilterHkHist', data.floors, 'Floor');
            populateSelect('roomFilterHkHist', data.rooms, 'Room');
        }
    } catch (error) {
        console.error('Error loading DB filters:', error);
    }
}

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

function downloadPDF(headers, data, title, filename) {
    if (!window.jspdf) {
        alert("PDF Library not loaded.");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(18);
    doc.setTextColor(72, 12, 27);
    doc.text(title, 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100); 
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.autoTable({
        head: [headers],
        body: data,
        startY: 35,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3, overflow: 'linebreak', textColor: 50 },
        headStyles: { fillColor: '#480c1b', textColor: '#ffffff', fontStyle: 'bold', halign: 'center' },
        columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 'auto' }, 5: { fontStyle: 'bold' } },
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

    // Store filtered data for download
    let filteredRequests = [...hkData];

    function applyHKRequestFilters() {
        const searchValue = searchInput.value.toLowerCase();
        const selectedFloor = floorSelect.value;
        const selectedRoom = roomSelect.value;

        filteredRequests = hkData.filter(row => {
            const matchesSearch = row.room.toLowerCase().includes(searchValue) ||
                                  (row.staff && row.staff.toLowerCase().includes(searchValue));
            const matchesFloor = selectedFloor === "" || row.floor.toString() === selectedFloor;
            const matchesRoom = selectedRoom === "" || row.room.toString() === selectedRoom;
            return matchesSearch && matchesFloor && matchesRoom;
        });

        paginationState.housekeeping.currentPage = 1;
        renderHKTable(filteredRequests);
    }

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

    if (searchInput) searchInput.oninput = applyHKRequestFilters;
    if (roomSelect) roomSelect.onchange = applyHKRequestFilters;

    // --- REFRESH WITH LOADING & SERVER FETCH ---
    if (refreshBtn) {
        refreshBtn.onclick = async () => {
            // 1. Reset Filters
            searchInput.value = '';
            floorSelect.value = '';
            roomSelect.value = ''; 
            populateSelect('hkroomFilter', globalRoomList, 'Room');
            
            // 2. Show Loading
            const tbody = document.getElementById('hkTableBody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Loading requests...</td></tr>';

            // 3. Fetch Fresh Data
            try {
                const response = await fetch('api_housekeeping.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'get_all_tasks' })
                });
                const result = await response.json();

                if (result.status === 'success') {
                    hkData = result.data; // Update global data
                    applyHKRequestFilters();
                    showRefreshToast("Requests refreshed successfully!");
                } else {
                    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #dc3545;">Error: ${result.message}</td></tr>`;
                }
            } catch (error) {
                console.error("Refresh failed:", error);
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #dc3545;">Network Error</td></tr>';
            }
        };
    }

    if (downloadBtn) {
        downloadBtn.onclick = () => {
            if (filteredRequests.length === 0) {
                alert("No data available to download based on current filters.");
                return;
            }
            const headers = ['Floor', 'Room', 'Date', 'Req Time', 'Last Clean', 'Status', 'Staff'];
            const tableData = filteredRequests.map(row => [
                row.floor, row.room, row.date, row.requestTime, row.lastClean, 
                typeof formatStatus === 'function' ? formatStatus(row.status) : row.status, row.staff
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
    const startDateInput = document.getElementById('startDateFilterHkHist');
    const endDateInput = document.getElementById('endDateFilterHkHist');
    const refreshBtn = document.getElementById('hkHistRefreshBtn');
    const downloadBtn = document.getElementById('hkHistDownloadBtn');

    // Store filtered data for download
    let filteredHistory = [...hkHistData];

    function applyHKHistoryFilters() {
        const searchValue = searchInput.value.toLowerCase();
        const selectedFloor = floorSelect.value;
        const selectedRoom = roomSelect.value;
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;

        filteredHistory = hkHistData.filter(row => {
            const matchesSearch = row.room.toLowerCase().includes(searchValue) ||
                                  (row.staff && row.staff.toLowerCase().includes(searchValue)) ||
                                  row.issueType.toLowerCase().includes(searchValue);
            const matchesFloor = selectedFloor === "" || row.floor.toString() === selectedFloor;
            const matchesRoom = selectedRoom === "" || row.room.toString() === selectedRoom;
            
            // Date Range Logic
            let matchesDate = true;
            if (startDate || endDate) {
                if (!row.date || row.date === 'N/A') {
                    matchesDate = false;
                } else {
                    const [m, d, y] = row.date.split('.');
                    const rowDate = new Date(y, m - 1, d);

                    if (startDate) {
                        const [sy, sm, sd] = startDate.split('-');
                        const start = new Date(sy, sm - 1, sd);
                        if (rowDate < start) matchesDate = false;
                    }
                    if (endDate && matchesDate) {
                        const [ey, em, ed] = endDate.split('-');
                        const end = new Date(ey, em - 1, ed);
                        if (rowDate > end) matchesDate = false;
                    }
                }
            }

            return matchesSearch && matchesFloor && matchesRoom && matchesDate;
        });

        paginationState.housekeepingHistory.currentPage = 1;
        renderHKHistTable(filteredHistory);
    }

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

    if (searchInput) searchInput.oninput = applyHKHistoryFilters;
    if (roomSelect) roomSelect.onchange = applyHKHistoryFilters;
    if (startDateInput) startDateInput.onchange = applyHKHistoryFilters;
    if (endDateInput) endDateInput.onchange = applyHKHistoryFilters;

    // --- REFRESH WITH LOADING & SERVER FETCH ---
    if (refreshBtn) {
        refreshBtn.onclick = async () => {
            searchInput.value = '';
            floorSelect.value = '';
            roomSelect.value = '';
            startDateInput.value = '';
            endDateInput.value = '';
            populateSelect('roomFilterHkHist', globalRoomList, 'Room');
            
            const tbody = document.getElementById('hkHistTableBody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">Loading history...</td></tr>';

            try {
                const response = await fetch('api_housekeeping.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'get_all_history' })
                });
                const result = await response.json();

                if (result.status === 'success') {
                    hkHistData = result.data;
                    applyHKHistoryFilters();
                    showRefreshToast("History refreshed successfully!");
                } else {
                    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 20px; color: #dc3545;">Error: ${result.message}</td></tr>`;
                }
            } catch (error) {
                console.error("Refresh failed:", error);
                tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px; color: #dc3545;">Network Error</td></tr>';
            }
        };
    }

    if (downloadBtn) {
        downloadBtn.onclick = () => {
            if (filteredHistory.length === 0) {
                alert("No data available to download based on current filters.");
                return;
            }
            const headers = ['Floor', 'Room', 'Task', 'Date', 'Req Time', 'Comp Time', 'Staff', 'Status', 'Remarks'];
            const tableData = filteredHistory.map(row => [
                row.floor, row.room, row.issueType, row.date, row.requestedTime, 
                row.completedTime, row.staff, row.status, row.remarks || ''
            ]);
            downloadPDF(headers, tableData, "Housekeeping History Logs", "housekeeping_history");
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('housekeeping-page')) {
        initHKRequestFilters();
        initHKHistoryFilters();
    }
});