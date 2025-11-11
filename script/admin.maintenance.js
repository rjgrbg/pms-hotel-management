// ===== MAINTENANCE RENDER FUNCTIONS =====
function renderMTRequestsTable(data = mtRequestsData) {
  const tbody = document.getElementById('mtRequestsTableBody');
  if (!tbody) return;
  const state = paginationState.maintenance;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);
  
  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => {
      const statusClass = row.status === 'pending' ? 'pending' : row.status === 'in-progress' ? 'request' : row.status;
      const statusText = row.status === 'in-progress' ? 'In Progress' : row.status.charAt(0).toUpperCase() + row.status.slice(1);
      return `
        <tr>
          <td>${row.floor}</td>
          <td>${row.room}</td>
          <td>${row.issue}</td>
          <td>${row.date}</td>
          <td>${row.requestedTime}</td>
          <td>${row.completedTime}</td>
          <td><span class="statusBadge ${statusClass}">${statusText}</span></td>
          <td>${row.staff}</td>
          <td>${row.remarks}</td>
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

function renderMTHistTable(data = mtHistData) {
  const tbody = document.getElementById('mtHistTableBody');
  if (!tbody) return;
  const state = paginationState.maintenanceHistory;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);
  
  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => `
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
  }
  
  const recordCount = document.getElementById('mtHistRecordCount');
  if (recordCount) recordCount.textContent = data.length;
  renderPaginationControls('mt-history-tab', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderMTHistTable(data);
  });
}

function renderMTAppliancesTable(data = mtAppliancesData) {
  const tbody = document.getElementById('mtAppliancesTableBody');
  if (!tbody) return;
  const state = paginationState.maintenanceAppliances;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);
  
  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => `
      <tr>
        <td>${row.floor}</td>
        <td>${row.room}</td>
        <td>${row.installedDate}</td>
        <td>${row.types}</td>
        <td>${row.items}</td>
        <td>${row.lastMaintained}</td>
        <td>${row.remarks}</td>
      </tr>
    `).join('');
  }
  
  const recordCount = document.getElementById('mtAppliancesRecordCount');
  if (recordCount) recordCount.textContent = data.length;
  renderPaginationControls('mt-appliances-tab', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderMTAppliancesTable(data);
  });
}

// ===== MAINTENANCE (REQUESTS) FILTERS =====
function initMTRequestFilters() {
    document.getElementById('mtSearchInput')?.addEventListener('input', (e) => {
      const search = e.target.value.toLowerCase();
      const filtered = mtRequestsData.filter(row => 
        row.issue.toLowerCase().includes(search) ||
        row.staff.toLowerCase().includes(search) ||
        row.room.toString().includes(search)
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

    document.getElementById('mtStatusFilter')?.addEventListener('change', (e) => {
      const status = e.target.value;
      const filtered = status ? mtRequestsData.filter(row => row.status === status) : mtRequestsData;
      paginationState.maintenance.currentPage = 1;
      renderMTRequestsTable(filtered);
    });

    document.getElementById('mtRefreshBtn')?.addEventListener('click', () => {
      document.getElementById('mtSearchInput').value = '';
      document.getElementById('mtFloorFilter').value = '';
      document.getElementById('mtRoomFilter').value = '';
      document.getElementById('mtStatusFilter').value = '';
      
      mtRequestsData = [...maintenanceRequests];
      paginationState.maintenance.currentPage = 1;
      renderMTRequestsTable(mtRequestsData);
    });

    document.getElementById('mtDownloadBtn')?.addEventListener('click', () => {
      const headers = ['Floor', 'Room', 'Issue Type', 'Date', 'Requested Time', 'Completed Time', 'Status', 'Staff In Charge', 'Remarks'];
      const csvContent = [
        headers.join(','),
        ...mtRequestsData.map(row => [row.floor, row.room, row.issue, row.date, row.requestedTime, row.completedTime, row.status, row.staff, row.remarks].join(','))
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
        row.issue.toLowerCase().includes(search) ||
        row.staff.toLowerCase().includes(search) ||
        row.room.toString().includes(search)
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

    document.getElementById('mtHistRefreshBtn')?.addEventListener('click', () => {
      document.getElementById('mtHistSearchInput').value = '';
      document.getElementById('mtFloorFilterHist').value = '';
      document.getElementById('mtRoomFilterHist').value = '';
      
      mtHistData = [...maintenanceHistory];
      paginationState.maintenanceHistory.currentPage = 1;
      renderMTHistTable(mtHistData);
    });

    document.getElementById('mtHistDownloadBtn')?.addEventListener('click', () => {
      const headers = ['Floor', 'Room', 'Issue Type', 'Date', 'Requested Time', 'Completed Time', 'Status', 'Staff In Charge', 'Remarks'];
      const csvContent = [
        headers.join(','),
        ...mtHistData.map(row => [row.floor, row.room, row.issue, row.date, row.requestedTime, row.completedTime, row.status, row.staff, row.remarks].join(','))
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

// ===== MAINTENANCE APPLIANCES FILTERS =====
function initMTAppliancesFilters() {
    document.getElementById('appliancesSearchInput')?.addEventListener('input', (e) => {
      const search = e.target.value.toLowerCase();
      const filtered = mtAppliancesData.filter(row => 
        row.items.toLowerCase().includes(search) ||
        row.types.toLowerCase().includes(search) ||
        row.room.toString().includes(search)
      );
      paginationState.maintenanceAppliances.currentPage = 1;
      renderMTAppliancesTable(filtered);
    });

    document.getElementById('appFloorFilter')?.addEventListener('change', (e) => {
      const floor = e.target.value;
      const filtered = floor ? mtAppliancesData.filter(row => row.floor.toString() === floor) : mtAppliancesData;
      paginationState.maintenanceAppliances.currentPage = 1;
      renderMTAppliancesTable(filtered);
    });

    document.getElementById('appRoomFilter')?.addEventListener('change', (e) => {
      const room = e.target.value;
      const filtered = room ? mtAppliancesData.filter(row => row.room.toString() === room) : mtAppliancesData;
      paginationState.maintenanceAppliances.currentPage = 1;
      renderMTAppliancesTable(filtered);
    });

    document.getElementById('appTypeFilter')?.addEventListener('change', (e) => {
      const type = e.target.value;
      const filtered = type ? mtAppliancesData.filter(row => row.types === type) : mtAppliancesData;
      paginationState.maintenanceAppliances.currentPage = 1;
      renderMTAppliancesTable(filtered);
    });

    document.getElementById('appliancesRefreshBtn')?.addEventListener('click', () => {
      document.getElementById('appliancesSearchInput').value = '';
      document.getElementById('appFloorFilter').value = '';
      document.getElementById('appRoomFilter').value = '';
      document.getElementById('appTypeFilter').value = '';
      
      mtAppliancesData = [...maintenanceAppliances];
      paginationState.maintenanceAppliances.currentPage = 1;
      renderMTAppliancesTable(mtAppliancesData);
    });

    document.getElementById('appliancesDownloadBtn')?.addEventListener('click', () => {
      const headers = ['Floor', 'Room', 'Installed Date', 'Types', 'Items', 'Last Maintained', 'Remarks'];
      const csvContent = [
        headers.join(','),
        ...mtAppliancesData.map(row => [row.floor, row.room, row.installedDate, row.types, row.items, row.lastMaintained, row.remarks].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `maintenance-appliances-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
}