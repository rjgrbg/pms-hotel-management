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

// Helper function to get the right CSS class
function getHkHistoryStatusClass(status) {
    switch (status) {
        case 'In Progress':
            return 'in-progress';
        case 'Completed':
            return 'completed';
        case 'Cancelled':
            return 'cancelled';
        default:
            return '';
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
        // --- THIS IS THE FIX ---
        const statusClass = getHkHistoryStatusClass(row.status);

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

    document.getElementById('hkDownloadBtn')?.addEventListener('click', () => {
      // Updated headers to match the table
      const headers = ['Floor', 'Room', 'Date', 'Request Time', 'Last Clean', 'Status', 'Staff In Charge'];
      const csvContent = [
        headers.join(','),
        ...hkData.map(row => [
          row.floor, 
          row.room, 
          row.date, 
          row.requestTime, 
          row.lastClean, 
          formatStatus(row.status), 
          row.staff
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `housekeeping-requests-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
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

    document.getElementById('hkHistDownloadBtn')?.addEventListener('click', () => {
      const headers = ['Floor', 'Room', 'Task', 'Date', 'Requested Time', 'Completed Time', 'Staff In Charge', 'Status', 'Remarks'];
      const csvContent = [
        headers.join(','),
        ...hkHistData.map(row => [
          row.floor,
          row.room,
          `"${row.issueType.replace(/"/g, '""')}"`, // Handle commas in issueType
          row.date,
          row.requestedTime,
          row.completedTime,
          row.staff,
          row.status,
          `"${(row.remarks || '').replace(/"/g, '""')}"` // Handle commas in remarks
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `housekeeping-history-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
}