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
        <td>${row.issueType}</td>
        <td>${row.date}</td>
        <td>${row.requestedTime}</td>
        <td>${row.completedTime}</td>
        <td>${row.staff}</td>
        <td><span class="statusBadge ${row.status === 'Completed' ? 'cleaned' : 'cancelled'}">${row.status}</span></td>
        <td>${row.remarks || 'N/A'}</td>
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

    // === MODIFIED FOR PDF DOWNLOAD ===
    document.getElementById('mtDownloadBtn')?.addEventListener('click', () => {
      // 1. Get filter values
      const search = document.getElementById('mtSearchInput').value.toLowerCase();
      const floor = document.getElementById('mtFloorFilter').value;
      const room = document.getElementById('mtRoomFilter').value;

      // 2. Filter data
      const filteredData = mtRequestsData.filter(row => {
          const searchMatch = !search || row.room.toLowerCase().includes(search) || (row.staff && row.staff.toLowerCase().includes(search));
          const floorMatch = !floor || row.floor.toString() === floor;
          const roomMatch = !room || row.room.toString() === room;
          return searchMatch && floorMatch && roomMatch;
      });

      // 3. Define PDF headers and body
      const headers = ['Floor', 'Room', 'Date', 'Request Time', 'Last Maintenance', 'Status', 'Staff In Charge'];
      const body = filteredData.map(row => [
          row.floor,
          row.room,
          row.date,
          row.requestTime,
          row.lastMaintenance,
          formatStatus(row.status),
          row.staff
      ]);

      // 4. Call helper
      generatePdfReport(
          'Maintenance Requests Report',
          `maintenance-requests-${new Date().toISOString().split('T')[0]}.pdf`,
          headers,
          body
      );
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

    // === MODIFIED FOR PDF DOWNLOAD ===
    document.getElementById('mtHistDownloadBtn')?.addEventListener('click', () => {
      // 1. Get filter values
      const search = document.getElementById('mtHistSearchInput').value.toLowerCase();
      const floor = document.getElementById('mtFloorFilterHist').value;
      const room = document.getElementById('mtRoomFilterHist').value;
      const date = document.getElementById('dateFilterMtHist').value; // YYYY-MM-DD
      
      let formattedDate = '';
      if (date) {
          const [y, m, d] = date.split('-');
          formattedDate = `${m}.${d}.${y}`; // Convert to MM.DD.YYYY
      }

      // 2. Filter data
      const filteredData = mtHistData.filter(row => {
          const searchMatch = !search || row.room.toLowerCase().includes(search) || (row.staff && row.staff.toLowerCase().includes(search)) || row.issueType.toLowerCase().includes(search);
          const floorMatch = !floor || row.floor.toString() === floor;
          const roomMatch = !room || row.room.toString() === room;
          const dateMatch = !formattedDate || row.date === formattedDate;
          return searchMatch && floorMatch && roomMatch && dateMatch;
      });

      // 3. Define PDF headers and body
      const headers = ['Floor', 'Room', 'Type', 'Date', 'Requested', 'Completed', 'Staff', 'Status', 'Remarks'];
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
          'Maintenance History Report',
          `maintenance-history-${new Date().toISOString().split('T')[0]}.pdf`,
          headers,
          body
      );
    });
}