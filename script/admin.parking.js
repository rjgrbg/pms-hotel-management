// ===== PARKING HISTORY FUNCTIONS =====

// === NEW FUNCTION ===
async function fetchAndRenderParkingDashboard() {
    // This function specifically fetches data for the dashboard cards.
    // It calls 'getDashboardData' from the parking_api.php
    const result = await apiCall('getDashboardData', {}, 'GET', 'parking_api.php');
    
    if (result && result.success && result.cards) {
        // Use the corrected indexes from admin.dashboard.js
        updateStatCard(6, result.cards.total || 0);
        updateStatCard(7, result.cards.occupied || 0);
        updateStatCard(8, result.cards.available || 0);
    } else {
        // On error or failure, set dashboard cards to 0
        updateStatCard(6, 0);
        updateStatCard(7, 0);
        updateStatCard(8, 0);
        console.error("Failed to load parking dashboard data:", result ? result.error : "Unknown error");
    }
}
// === END NEW FUNCTION ===


async function loadParkingAreaFilters() {
    const areaFilter = document.getElementById('parkingAreaFilter');
    if (!areaFilter) return;

    areaFilter.innerHTML = '<option value="all">All Areas</option>';
    
    const result = await apiCall('getParkingAreas', {}, 'GET', 'parking_api.php');
    
    if (result.success && result.areas) {
        result.areas.forEach(area => {
            const option = document.createElement('option');
            option.value = area.AreaName;
            option.textContent = area.AreaName;
            areaFilter.appendChild(option);
        });
    } else {
        console.warn("Could not load parking area filters.");
    }
}

async function fetchAndRenderParkingHistory() {
    const tbody = document.getElementById('parkingHistoryTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">Loading parking history...</td></tr>';
    
    const result = await apiCall('getHistory', {}, 'GET', 'parking_api.php');
    
    if (result.success && result.history && result.history.length > 0) {
        parkingHistoryDataList = result.history;
        paginationState.parkingHistory.currentPage = 1;
        renderParkingHistoryTable(parkingHistoryDataList);
    } else if (result.success) {
        parkingHistoryDataList = [];
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No history records found.</td></tr>';
        const recordCount = document.getElementById('parkingHistoryRecordCount');
        if (recordCount) recordCount.textContent = 0;
        renderPaginationControls('parking-page', 0, 1, () => {});
    } else {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 20px; color: #c33;">Failed to load data: ${result.error || 'Unknown error'}</td></tr>`;
        const recordCount = document.getElementById('parkingHistoryRecordCount');
        if (recordCount) recordCount.textContent = 0;
        renderPaginationControls('parking-page', 0, 1, () => {});
    }
}

function renderParkingHistoryTable(data) {
  const tbody = document.getElementById('parkingHistoryTableBody');
  if (!tbody) return;
  const state = paginationState.parkingHistory;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);

  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => `
      <tr>
        <td>${row.SlotName}</td>
        <td>${row.PlateNumber}</td>
        <td>${row.RoomNumber || 'N/A'}</td>
        <td>${row.GuestName || 'N/A'}</td>
        <td>${row.VehicleType}</td>
        <td>${row.VehicleCategory}</td>
        <td>${row.ParkingTime}</td>
        <td>${row.EntryDateTime}</td>
        <td>${row.ExitDateTime}</td>
      </tr>
    `).join('');
  }
  
  const recordCount = document.getElementById('parkingHistoryRecordCount');
  if (recordCount) recordCount.textContent = data.length;
  renderPaginationControls('parking-page', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderParkingHistoryTable(data);
  });
}

// ===== PARKING HISTORY FILTERS =====
function initParkingFilters() {
    document.getElementById('parkingHistorySearchInput')?.addEventListener('input', (e) => {
      const search = e.target.value.toLowerCase();
      const filtered = parkingHistoryDataList.filter(row => 
        (row.PlateNumber && row.PlateNumber.toLowerCase().includes(search)) ||
        (row.GuestName && row.GuestName.toLowerCase().includes(search)) ||
        (row.RoomNumber && row.RoomNumber.toLowerCase().includes(search)) ||
        (row.SlotName && row.SlotName.toLowerCase().includes(search))
      );
      paginationState.parkingHistory.currentPage = 1;
      renderParkingHistoryTable(filtered);
    });

    document.getElementById('parkingAreaFilter')?.addEventListener('change', (e) => {
      const area = e.target.value;
      const filtered = (area === 'all') 
        ? parkingHistoryDataList 
        : parkingHistoryDataList.filter(row => row.AreaName === area);
      paginationState.parkingHistory.currentPage = 1;
      renderParkingHistoryTable(filtered);
    });

    document.getElementById('parkingHistoryRefreshBtn')?.addEventListener('click', () => {
      document.getElementById('parkingHistorySearchInput').value = '';
      document.getElementById('parkingAreaFilter').value = 'all';
      fetchAndRenderParkingHistory();
      // Also refresh dashboard stats
      fetchAndRenderParkingDashboard();
    });

    document.getElementById('parkingHistoryDownloadBtn')?.addEventListener('click', () => {
      const search = document.getElementById('parkingHistorySearchInput').value.toLowerCase();
      const area = document.getElementById('parkingAreaFilter').value;
      
      const filteredData = parkingHistoryDataList
        .filter(row => (area === 'all') ? true : row.AreaName === area)
        .filter(row => 
          (!search) ? true : (
            (row.PlateNumber && row.PlateNumber.toLowerCase().includes(search)) ||
            (row.GuestName && row.GuestName.toLowerCase().includes(search)) ||
            (row.RoomNumber && row.RoomNumber.toLowerCase().includes(search)) ||
            (row.SlotName && row.SlotName.toLowerCase().includes(search))
          )
        );

      if (filteredData.length === 0) {
          alert('No data to download.');
          return;
      }
      
      if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined' || typeof window.jspdf.jsPDF.autoTable === 'undefined') {
          alert('PDF generation library (jspdf) is not loaded. Please ensure you added the script tags to admin.php');
          console.error('jsPDF or jsPDF-autoTable is not loaded.');
          return;
      }

      try {
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF(); 

          doc.setFontSize(18);
          doc.text("Parking History Report", 14, 22);
          doc.setFontSize(11);
          doc.setTextColor(100);
          doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
          
          const head = [[
              'Slot', 'Plate #', 'Room', 'Name', 'Vehicle Type', 'Category',
              'Parking Time', 'Entry', 'Exit'
          ]];

          const body = filteredData.map(v => [
              v.SlotName, v.PlateNumber, v.RoomNumber || 'N/A', v.GuestName || 'N/A',
              v.VehicleType, v.VehicleCategory, v.ParkingTime, v.EntryDateTime, v.ExitDateTime
          ]);

          doc.autoTable({
              head: head,
              body: body,
              startY: 35,
              headStyles: { fillColor: [72, 12, 27] }, // #480c1b
              styles: { fontSize: 8, cellPadding: 2 },
              alternateRowStyles: { fillColor: [245, 245, 245] },
              columnStyles: {
                  0: { cellWidth: 15 }, 1: { cellWidth: 20 }, 2: { cellWidth: 12 },
                  3: { cellWidth: 'auto' }, 4: { cellWidth: 'auto' }, 5: { cellWidth: 'auto' },
                  6: { cellWidth: 20 }, 7: { cellWidth: 30 }, 8: { cellWidth: 30 }
              }
          });

          doc.save('Parking-History-Report.pdf');

      } catch (e) {
          console.error("Error generating PDF:", e);
          alert('An error occurred while generating the PDF. See console for details.');
      }
    });
}