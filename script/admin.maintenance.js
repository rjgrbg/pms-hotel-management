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

// ===== MAINTENANCE (REQUESTS) FILTERS =====
function initMTRequestFilters() {
    document.getElementById('mtSearchInput')?.addEventListener('input', (e) => {
      const search = e.target.value.toLowerCase();
      const filtered = mtRequestsData.filter(row => 
        row.room.toLowerCase().includes(search) ||
        (row.staff && row.staff.toLowerCase().includes(search))
      );
      paginationState.maintenance.currentPage = 1;
      renderMTRequestsTable(filtered);
    });

    document.getElementById('mtFloorFilter')?.addEventListener('change', (e) => {
      const floor = e.target.value;
      const filtered = floor ? mtRequestsData.filter(row => row.floor.toString() === floor) : mtRequestsData;
      paginationState.maintenance.currentPage = 1;
      renderMTRequestsTable(filtered);
    });

    document.getElementById('mtRoomFilter')?.addEventListener('change', (e) => {
      const room = e.target.value;
      const filtered = room ? mtRequestsData.filter(row => row.room.toString() === room) : mtRequestsData;
      paginationState.maintenance.currentPage = 1;
      renderMTRequestsTable(filtered);
    });

    document.getElementById('mtRefreshBtn')?.addEventListener('click', () => {
      document.getElementById('mtSearchInput').value = '';
      document.getElementById('mtFloorFilter').value = '';
      document.getElementById('mtRoomFilter').value = '';
      
      // Reset data from the initial PHP-loaded array
      mtRequestsData = [...(initialMtRequestsData || [])];
      paginationState.maintenance.currentPage = 1;
      renderMTRequestsTable(mtRequestsData);
    });

    document.getElementById('mtDownloadBtn')?.addEventListener('click', () => {
      const headers = ['Floor', 'Room', 'Date', 'Request Time', 'Last Maintenance', 'Status', 'Staff In Charge'];
      const csvContent = [
        headers.join(','),
        ...mtRequestsData.map(row => [
            row.floor, 
            row.room, 
            row.date, 
            row.requestTime, 
            row.lastMaintenance, 
            formatStatus(row.status), 
            row.staff
        ].join(','))
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

// ===== MAINTENANCE HISTORY FILTERS =====
function initMTHistoryFilters() {
    document.getElementById('mtHistSearchInput')?.addEventListener('input', (e) => {
      const search = e.target.value.toLowerCase();
      const filtered = mtHistData.filter(row => 
        row.room.toLowerCase().includes(search) ||
        (row.staff && row.staff.toLowerCase().includes(search)) ||
        row.issueType.toLowerCase().includes(search)
      );
      paginationState.maintenanceHistory.currentPage = 1;
      renderMTHistTable(filtered);
    });

    document.getElementById('mtFloorFilterHist')?.addEventListener('change', (e) => {
      const floor = e.target.value;
      const filtered = floor ? mtHistData.filter(row => row.floor.toString() === floor) : mtHistData;
      paginationState.maintenanceHistory.currentPage = 1;
      renderMTHistTable(filtered);
    });

    document.getElementById('mtRoomFilterHist')?.addEventListener('change', (e) => {
      const room = e.target.value;
      const filtered = room ? mtHistData.filter(row => row.room.toString() === room) : mtHistData;
      paginationState.maintenanceHistory.currentPage = 1;
      renderMTHistTable(filtered);
    });
    
    document.getElementById('dateFilterMtHist')?.addEventListener('change', (e) => {
        const date = e.target.value; // Format: YYYY-MM-DD
        if (!date) {
            renderMTHistTable(mtHistData); // Reset if date is cleared
            return;
        }
        
        // Convert YYYY-MM-DD to MM.DD.YYYY to match our data format
        const [y, m, d] = date.split('-');
        const formattedDate = `${m}.${d}.${y}`;
        
        const filtered = mtHistData.filter(row => row.date === formattedDate);
        paginationState.maintenanceHistory.currentPage = 1;
        renderMTHistTable(filtered);
    });

    document.getElementById('mtHistRefreshBtn')?.addEventListener('click', () => {
      document.getElementById('mtHistSearchInput').value = '';
      document.getElementById('mtFloorFilterHist').value = '';
      document.getElementById('mtRoomFilterHist').value = '';
      document.getElementById('dateFilterMtHist').value = '';
      
      // Reset data from the initial PHP-loaded array
      mtHistData = [...(initialMtHistoryData || [])];
      paginationState.maintenanceHistory.currentPage = 1;
      renderMTHistTable(mtHistData);
    });

    document.getElementById('mtHistDownloadBtn')?.addEventListener('click', () => {
      const headers = ['Floor', 'Room', 'Type', 'Date', 'Requested Time', 'Completed Time', 'Staff In Charge', 'Status', 'Remarks'];
      const csvContent = [
        headers.join(','),
        ...mtHistData.map(row => [
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
      a.download = `maintenance-history-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
}