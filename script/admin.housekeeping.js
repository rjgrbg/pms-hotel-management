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
      return `
      <tr>
        <td>${row.floor}</td>
        <td>${row.room}</td>
        <td>${row.date}</td>
        <td>${row.requestTime}</td>
        <td>${row.lastClean}</td>
        <td><span class="statusBadge ${statusClass}">${statusText}</span></td>
        <td>${row.staff}</td>
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

function renderHKHistTable(data = hkHistData) {
  const tbody = document.getElementById('hkHistTableBody');
  if (!tbody) return;
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
        <td>${row.issueType}</td>
        <td>${row.date}</td>
        <td>${row.requestedTime}</td>
        <td>${row.completedTime}</td>
        <td>${row.staff}</td>
        <td><span class="statusBadge ${row.status === 'Completed' ? 'completed' : 'cancelled'}">${row.status}</span></td>
        <td>${row.remarks || 'N/A'}</td>
      </tr>
    `).join('');
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


// ===== HOUSEKEEPING (REQUESTS) FILTERS =====
function initHKRequestFilters() {
    document.getElementById('hkSearchInput')?.addEventListener('input', (e) => {
      const search = e.target.value.toLowerCase();
      const filtered = hkData.filter(row => 
        row.room.toLowerCase().includes(search) ||
        (row.staff && row.staff.toLowerCase().includes(search))
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

    document.getElementById('hkRefreshBtn')?.addEventListener('click', () => {
      document.getElementById('hkSearchInput').value = '';
      document.getElementById('floorFilter').value = '';
      document.getElementById('roomFilter').value = '';
      
      // Reset data from the initial PHP-loaded array
      hkData = [...(initialHkRequestsData || [])];
      paginationState.housekeeping.currentPage = 1;
      renderHKTable(hkData);
    });

    // === MODIFIED FOR PDF DOWNLOAD ===
    document.getElementById('hkDownloadBtn')?.addEventListener('click', () => {
      // 1. Get filter values
      const search = document.getElementById('hkSearchInput').value.toLowerCase();
      const floor = document.getElementById('floorFilter').value;
      const room = document.getElementById('roomFilter').value;

      // 2. Filter data
      const filteredData = hkData.filter(row => {
          const searchMatch = !search || row.room.toLowerCase().includes(search) || (row.staff && row.staff.toLowerCase().includes(search));
          const floorMatch = !floor || row.floor.toString() === floor;
          const roomMatch = !room || row.room.toString() === room;
          return searchMatch && floorMatch && roomMatch;
      });

      // 3. Define PDF headers and body
      const headers = ['Floor', 'Room', 'Date', 'Request Time', 'Last Clean', 'Status', 'Staff In Charge'];
      const body = filteredData.map(row => [
          row.floor,
          row.room,
          row.date,
          row.requestTime,
          row.lastClean,
          formatStatus(row.status),
          row.staff
      ]);

      // 4. Call helper
      generatePdfReport(
          'Housekeeping Requests Report',
          `housekeeping-requests-${new Date().toISOString().split('T')[0]}.pdf`,
          headers,
          body
      );
    });
}

// ===== HOUSEKEEPING HISTORY FILTERS =====
function initHKHistoryFilters() {
    document.getElementById('hkHistSearchInput')?.addEventListener('input', (e) => {
      const search = e.target.value.toLowerCase();
      const filtered = hkHistData.filter(row => 
        row.room.toLowerCase().includes(search) ||
        (row.staff && row.staff.toLowerCase().includes(search)) ||
        row.issueType.toLowerCase().includes(search)
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
    
    document.getElementById('dateFilterHkHist')?.addEventListener('change', (e) => {
        const date = e.target.value; // Format: YYYY-MM-DD
        if (!date) {
            renderHKHistTable(hkHistData); // Reset if date is cleared
            return;
        }
        
        // Convert YYYY-MM-DD to MM.DD.YYYY to match our data format
        const [y, m, d] = date.split('-');
        const formattedDate = `${m}.${d}.${y}`;
        
        const filtered = hkHistData.filter(row => row.date === formattedDate);
        paginationState.housekeepingHistory.currentPage = 1;
        renderHKHistTable(filtered);
    });

    document.getElementById('hkHistRefreshBtn')?.addEventListener('click', () => {
      document.getElementById('hkHistSearchInput').value = '';
      document.getElementById('floorFilterHkHist').value = '';
      document.getElementById('roomFilterHkHist').value = '';
      document.getElementById('dateFilterHkHist').value = '';
      
      // Reset data from the initial PHP-loaded array
      hkHistData = [...(initialHkHistoryData || [])];
      paginationState.housekeepingHistory.currentPage = 1;
      renderHKHistTable(hkHistData);
    });

    // === MODIFIED FOR PDF DOWNLOAD ===
    document.getElementById('hkHistDownloadBtn')?.addEventListener('click', () => {
      // 1. Get filter values
      const search = document.getElementById('hkHistSearchInput').value.toLowerCase();
      const floor = document.getElementById('floorFilterHkHist').value;
      const room = document.getElementById('roomFilterHkHist').value;
      const date = document.getElementById('dateFilterHkHist').value; // YYYY-MM-DD
      
      let formattedDate = '';
      if (date) {
          const [y, m, d] = date.split('-');
          formattedDate = `${m}.${d}.${y}`; // Convert to MM.DD.YYYY
      }

      // 2. Filter data
      const filteredData = hkHistData.filter(row => {
          const searchMatch = !search || row.room.toLowerCase().includes(search) || (row.staff && row.staff.toLowerCase().includes(search)) || row.issueType.toLowerCase().includes(search);
          const floorMatch = !floor || row.floor.toString() === floor;
          const roomMatch = !room || row.room.toString() === room;
          const dateMatch = !formattedDate || row.date === formattedDate;
          return searchMatch && floorMatch && roomMatch && dateMatch;
      });

      // 3. Define PDF headers and body
      const headers = ['Floor', 'Room', 'Task', 'Date', 'Requested', 'Completed', 'Staff', 'Status', 'Remarks'];
      const body = filteredData.map(row => [
          row.floor,
          row.room,
          row.issueType,
          row.date,
          row.requestedTime,
          row.completedTime,
          row.staff,
          row.status,
          row.remarks || 'N/A'
      ]);

      // 4. Call helper
      generatePdfReport(
          'Housekeeping History Report',
          `housekeeping-history-${new Date().toISOString().split('T')[0]}.pdf`,
          headers,
          body
      );
    });
}