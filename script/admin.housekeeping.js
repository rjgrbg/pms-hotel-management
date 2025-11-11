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
    tbody.innerHTML = paginatedData.map(row => `
      <tr>
        <td>${row.floor}</td>
        <td>${row.room}</td>
        <td>${row.guest}</td>
        <td>${row.date}</td>
        <td>${row.requestTime}</td>
        <td>${row.lastCleaned}</td>
        <td><span class="statusBadge ${row.status}">${row.status === 'dirty' ? 'Dirty / Unoccupied' : 'Request Clean / Occupied'}</span></td>
        <td>${row.staff}</td>
      </tr>
    `).join('');
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
        <td>${row.guest}</td>
        <td>${row.date}</td>
        <td>${row.requestedTime}</td>
        <td>${row.completedTime}</td>
        <td>${row.staff}</td>
        <td><span class="statusBadge cleaned">${row.status === 'cleaned' ? 'Cleaned' : row.status}</span></td>
        <td>${row.remarks}</td>
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

// ===== COMBINED LINENS & AMENITIES RENDER FUNCTION =====
function renderHKLinensAmenitiesTable(data = hkLinensAmenitiesData) {
  const tbody = document.getElementById('hkLinensAmenitiesTableBody');
  if (!tbody) return;
  const state = paginationState.housekeepingLinensAmenities;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);
  
  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => {
      const statusClass = row.status === 'cleaned' ? 'cleaned' : 
                          row.status === 'stocked' ? 'cleaned' : 
                          row.status === 'pending' ? 'pending' : row.status;
      const statusText = row.status === 'cleaned' ? 'Cleaned' :
                         row.status === 'stocked' ? 'Stocked' :
                         row.status === 'pending' ? 'Pending' : row.status;
      return `
        <tr>
          <td>${row.floor}</td>
          <td>${row.room}</td>
          <td>${row.types}</td>
          <td>${row.items}</td>
          <td>${row.timeDate}</td>
          <td><span class="statusBadge ${statusClass}">${statusText}</span></td>
          <td>${row.remarks}</td>
        </tr>
      `;
    }).join('');
  }
  
  const recordCount = document.getElementById('hkLinensAmenitiesRecordCount');
  if (recordCount) recordCount.textContent = data.length;
  renderPaginationControls('hk-linens-amenities-tab', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderHKLinensAmenitiesTable(data);
  });
}

// ===== HOUSEKEEPING (REQUESTS) FILTERS =====
function initHKRequestFilters() {
    document.getElementById('hkSearchInput')?.addEventListener('input', (e) => {
      const search = e.target.value.toLowerCase();
      const filtered = hkData.filter(row => 
        row.guest.toLowerCase().includes(search) ||
        row.staff.toLowerCase().includes(search) ||
        row.room.toString().includes(search)
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

    document.getElementById('statusFilter')?.addEventListener('change', (e) => {
      const status = e.target.value;
      const filtered = status ? hkData.filter(row => row.status === status) : hkData;
      paginationState.housekeeping.currentPage = 1;
      renderHKTable(filtered);
    });

    document.getElementById('hkRefreshBtn')?.addEventListener('click', () => {
      document.getElementById('hkSearchInput').value = '';
      document.getElementById('floorFilter').value = '';
      document.getElementById('roomFilter').value = '';
      document.getElementById('statusFilter').value = '';
      
      hkData = [...housekeepingRequests];
      paginationState.housekeeping.currentPage = 1;
      renderHKTable(hkData);
    });

    document.getElementById('hkDownloadBtn')?.addEventListener('click', () => {
      const headers = ['Floor', 'Room', 'Guest', 'Date', 'Request Time', 'Last Cleaned', 'Status', 'Staff In Charge'];
      const csvContent = [
        headers.join(','),
        ...hkData.map(row => [row.floor, row.room, row.guest, row.date, row.requestTime, row.lastCleaned, row.status === 'dirty' ? 'Dirty / Unoccupied' : 'Request Clean / Occupied', row.staff].join(','))
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

// ===== COMBINED LINENS & AMENITIES FILTERS =====
function initHKLinensAmenitiesFilters() {
    document.getElementById('linensAmenitiesSearchInput')?.addEventListener('input', (e) => {
      const search = e.target.value.toLowerCase();
      const filtered = hkLinensAmenitiesData.filter(row => 
        row.items.toLowerCase().includes(search) ||
        row.types.toLowerCase().includes(search) ||
        row.room.toString().includes(search) ||
        row.remarks.toLowerCase().includes(search)
      );
      paginationState.housekeepingLinensAmenities.currentPage = 1;
      renderHKLinensAmenitiesTable(filtered);
    });

    document.getElementById('floorFilterLinensAmenities')?.addEventListener('change', (e) => {
      const floor = e.target.value;
      const filtered = floor ? hkLinensAmenitiesData.filter(row => row.floor.toString() === floor) : hkLinensAmenitiesData;
      paginationState.housekeepingLinensAmenities.currentPage = 1;
      renderHKLinensAmenitiesTable(filtered);
    });

    document.getElementById('roomFilterLinensAmenities')?.addEventListener('change', (e) => {
      const room = e.target.value;
      const filtered = room ? hkLinensAmenitiesData.filter(row => row.room.toString() === room) : hkLinensAmenitiesData;
      paginationState.housekeepingLinensAmenities.currentPage = 1;
      renderHKLinensAmenitiesTable(filtered);
    });

    document.getElementById('typeFilterLinensAmenities')?.addEventListener('change', (e) => {
      const type = e.target.value;
      const filtered = type ? hkLinensAmenitiesData.filter(row => row.types === type) : hkLinensAmenitiesData;
      paginationState.housekeepingLinensAmenities.currentPage = 1;
      renderHKLinensAmenitiesTable(filtered);
    });

    document.getElementById('statusFilterLinensAmenities')?.addEventListener('change', (e) => {
      const status = e.target.value;
      const filtered = status ? hkLinensAmenitiesData.filter(row => row.status === status) : hkLinensAmenitiesData;
      paginationState.housekeepingLinensAmenities.currentPage = 1;
      renderHKLinensAmenitiesTable(filtered);
    });

    document.getElementById('linensAmenitiesRefreshBtn')?.addEventListener('click', () => {
      document.getElementById('linensAmenitiesSearchInput').value = '';
      document.getElementById('floorFilterLinensAmenities').value = '';
      document.getElementById('roomFilterLinensAmenities').value = '';
      document.getElementById('typeFilterLinensAmenities').value = '';
      document.getElementById('statusFilterLinensAmenities').value = '';
      
      hkLinensAmenitiesData = [...housekeepingLinens, ...housekeepingAmenities];
      paginationState.housekeepingLinensAmenities.currentPage = 1;
      renderHKLinensAmenitiesTable(hkLinensAmenitiesData);
    });

    document.getElementById('linensAmenitiesDownloadBtn')?.addEventListener('click', () => {
      const headers = ['Floor', 'Room', 'Types', 'Items', 'Time/Date', 'Status', 'Remarks'];
      const csvContent = [
        headers.join(','),
        ...hkLinensAmenitiesData.map(row => [row.floor, row.room, row.types, row.items, row.timeDate, row.status, row.remarks].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `housekeeping-linens-amenities-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
}