// ===== MAINTENANCE RENDER FUNCTIONS =====
function renderMTRequestsTable(data = mtRequestsData) {
  const tbody = document.getElementById('mtRequestsTableBody');
  if (!tbody) return;
  const state = paginationState.maintenance;
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
          <td>${escapeHtml(row.lastMaintenance)}</td>
          <td><span class="statusBadge ${statusClass}">${escapeHtml(statusText)}</span></td>
          <td>${escapeHtml(row.staff)}</td>
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

function getMtHistoryStatusClass(status) {
    switch (status) {
        case 'In Progress': return 'in-progress'; 
        case 'Completed': return 'cleaned';
        case 'Cancelled': return 'cancelled';
        default: return ''; 
    }
}

function renderMTHistTable(data = mtHistData) {
    const tbody = document.getElementById('mtHistTableBody');
    if (!tbody) return;
    
    const state = paginationState.maintenanceHistory;
    const totalPages = getTotalPages(data.length, state.itemsPerPage);
    
    if (state.currentPage > totalPages) state.currentPage = Math.max(1, totalPages);
    
    const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);
  
    if (paginatedData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
    } else {
        tbody.innerHTML = paginatedData.map(row => {
            const statusClass = getMtHistoryStatusClass(row.status);
            const safeFloor = escapeHtml(row.floor ?? 'N/A');
            const safeRoom = escapeHtml(row.room ?? 'N/A');
            const safeType = escapeHtml(row.issueType ?? 'N/A');
            const safeDate = escapeHtml(row.date ?? 'N/A');
            const safeReqTime = escapeHtml(row.requestedTime ?? 'N/A');
            const safeCompTime = escapeHtml(row.completedTime ?? 'N/A');
            const safeStaff = escapeHtml(row.staff ?? 'N/A');
            const safeStatus = escapeHtml(row.status ?? 'N/A');
            
            const rawRemarks = row.remarks ?? '';
            const safeFullRemarks = escapeHtml(rawRemarks);
            const truncatedRaw = rawRemarks.length > 30 ? rawRemarks.substring(0, 30) + '...' : rawRemarks;
            const safeDisplayRemarks = escapeHtml(truncatedRaw);

            return `
                <tr>
                    <td>${safeFloor}</td>
                    <td>${safeRoom}</td>
                    <td>${safeType}</td>
                    <td>${safeDate}</td>
                    <td>${safeReqTime}</td>
                    <td>${safeCompTime}</td>
                    <td>${safeStaff}</td>
                    <td><span class="statusBadge ${statusClass}">${safeStatus}</span></td>
                    <td title="${safeFullRemarks}">${safeDisplayRemarks}</td>
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

// ==========================================
// 1. GLOBAL STATE & HELPERS
// ==========================================

let globalMTRoomList = []; 

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

async function fetchMTFilters() {
    try {
        const response = await fetch('fetch_filters.php'); 
        const data = await response.json();

        if (data.floors && data.rooms) {
            globalMTRoomList = data.rooms; 
            populateMTSelect('mtFloorFilter', data.floors, 'Floor');
            populateMTSelect('mtRoomFilter', data.rooms, 'Room');
            populateMTSelect('mtFloorFilterHist', data.floors, 'Floor');
            populateMTSelect('mtRoomFilterHist', data.rooms, 'Room');
        }
    } catch (error) {
        console.error('Error loading Maintenance filters:', error);
    }
}

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

function downloadMTPDF(headers, data, title, filename) {
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
        columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 'auto' } }
    });
    doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ==========================================
// 2. REQUESTS TAB LOGIC
// ==========================================

function initMTRequestFilters() {
    fetchMTFilters(); 

    const searchInput = document.getElementById('mtSearchInput');
    const floorSelect = document.getElementById('mtFloorFilter');
    const roomSelect = document.getElementById('mtRoomFilter');
    const refreshBtn = document.getElementById('mtRefreshBtn');
    const downloadBtn = document.getElementById('mtDownloadBtn');

    // Store filtered data for download
    let filteredRequests = [...mtRequestsData];

    function applyMTRequestFilters() {
        const searchValue = searchInput.value.toLowerCase();
        const selectedFloor = floorSelect.value;
        const selectedRoom = roomSelect.value;

        filteredRequests = mtRequestsData.filter(row => {
            const matchesSearch = row.room.toLowerCase().includes(searchValue) ||
                                  (row.staff && row.staff.toLowerCase().includes(searchValue));
            const matchesFloor = selectedFloor === "" || row.floor.toString() === selectedFloor;
            const matchesRoom = selectedRoom === "" || row.room.toString() === selectedRoom;
            return matchesSearch && matchesFloor && matchesRoom;
        });

        paginationState.maintenance.currentPage = 1;
        renderMTRequestsTable(filteredRequests);
    }

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

    if (searchInput) searchInput.oninput = applyMTRequestFilters;
    if (roomSelect) roomSelect.onchange = applyMTRequestFilters;

    // --- REFRESH WITH LOADING & SERVER FETCH ---
    if (refreshBtn) {
        refreshBtn.onclick = async () => {
            // 1. Reset Filters
            searchInput.value = '';
            floorSelect.value = '';
            roomSelect.value = ''; 
            populateMTSelect('mtRoomFilter', globalMTRoomList, 'Room');
            
            // 2. Show Loading
            const tbody = document.getElementById('mtRequestsTableBody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Loading requests...</td></tr>';

            // 3. Fetch Data
            try {
                const response = await fetch('api_maintenance.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'get_all_requests' })
                });
                const result = await response.json();

                if (result.status === 'success') {
                    mtRequestsData = result.data;
                    applyMTRequestFilters();
                    showMTToast("Maintenance Requests refreshed!");
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
            const headers = ['Floor', 'Room', 'Date', 'Req Time', 'Last Maint', 'Status', 'Staff'];
            const tableData = filteredRequests.map(row => [
                row.floor, row.room, row.date, row.requestTime, row.lastMaintenance, 
                typeof formatStatus === 'function' ? formatStatus(row.status) : row.status, row.staff
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
    const startDateInput = document.getElementById('startDateFilterMtHist');
    const endDateInput = document.getElementById('endDateFilterMtHist');
    const refreshBtn = document.getElementById('mtHistRefreshBtn');
    const downloadBtn = document.getElementById('mtHistDownloadBtn');

    // Store filtered data for download
    let filteredHistory = [...mtHistData];

    function applyMTHistoryFilters() {
        const searchValue = searchInput.value.toLowerCase();
        const selectedFloor = floorSelect.value;
        const selectedRoom = roomSelect.value;
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;

        filteredHistory = mtHistData.filter(row => {
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

        paginationState.maintenanceHistory.currentPage = 1;
        renderMTHistTable(filteredHistory);
    }

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

    if (searchInput) searchInput.oninput = applyMTHistoryFilters;
    if (roomSelect) roomSelect.onchange = applyMTHistoryFilters;
    if (startDateInput) startDateInput.onchange = applyMTHistoryFilters;
    if (endDateInput) endDateInput.onchange = applyMTHistoryFilters;

    // --- REFRESH WITH LOADING & SERVER FETCH ---
    if (refreshBtn) {
        refreshBtn.onclick = async () => {
            searchInput.value = '';
            floorSelect.value = '';
            roomSelect.value = '';
            startDateInput.value = '';
            endDateInput.value = '';
            populateMTSelect('mtRoomFilterHist', globalMTRoomList, 'Room');
            
            const tbody = document.getElementById('mtHistTableBody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">Loading history...</td></tr>';

            try {
                const response = await fetch('api_maintenance.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'get_all_history' })
                });
                const result = await response.json();

                if (result.status === 'success') {
                    mtHistData = result.data;
                    applyMTHistoryFilters();
                    showMTToast("Maintenance History refreshed!");
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
            const headers = ['Floor', 'Room', 'Type', 'Date', 'Req Time', 'Comp Time', 'Staff', 'Status', 'Remarks'];
            const tableData = filteredHistory.map(row => [
                row.floor, row.room, row.issueType, row.date, row.requestedTime, 
                row.completedTime, row.staff, row.status, row.remarks || ''
            ]);
            downloadMTPDF(headers, tableData, "Maintenance History Logs", "maintenance_history");
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('maintenance-page')) {
        initMTRequestFilters();
        initMTHistoryFilters();
    }
});