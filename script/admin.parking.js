/**
 * PARKING HISTORY MODULE
 * Fix: Prevents multiple downloads by using .onclick instead of addEventListener
 */

// ==========================================
// 1. GLOBAL HELPERS (Toast & PDF)
// ==========================================

// --- INJECT TOAST CSS ---
const parkingToastStyle = document.createElement("style");
parkingToastStyle.textContent = `
    .toast-success {
        position: fixed; top: 20px; right: 20px; background-color: #28a745; color: white;
        padding: 12px 24px; border-radius: 5px; box-shadow: 0 4px 6px rgba(0,0,0,0.15);
        z-index: 99999; font-family: 'Segoe UI', sans-serif; font-size: 14px;
        opacity: 0; transform: translateY(-20px); transition: opacity 0.3s ease, transform 0.3s ease;
        pointer-events: none;
    }
    .toast-visible { opacity: 1; transform: translateY(0); }
`;
document.head.appendChild(parkingToastStyle);

// --- SHOW TOAST FUNCTION ---
function showParkingToast(message) {
    const existingToast = document.querySelector('.toast-success');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-success';
    toast.innerText = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('toast-visible'));
    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- LANDSCAPE PDF GENERATOR (DEPRECATED - Now using download-utils.js) ---
// This function is kept for backwards compatibility but downloads now use downloadData()
function downloadParkingPDF(headers, data, title, filename) {
    if (typeof downloadData === 'function') {
        downloadData(headers, data, title, filename);
    } else {
        console.error('Download utility not loaded');
        alert('Download feature is not available. Please refresh the page.');
    }
}

// ==========================================
// 2. DATA FETCHING FUNCTIONS
// ==========================================

async function fetchAndRenderParkingDashboard() {
    const result = await apiCall('getDashboardData', {}, 'GET', 'parking_api.php');
    
    if (result && result.success && result.cards) {
        updateStatCard(6, result.cards.total || 0);
        updateStatCard(7, result.cards.occupied || 0);
        updateStatCard(8, result.cards.available || 0);
    } else {
        updateStatCard(6, 0); updateStatCard(7, 0); updateStatCard(8, 0);
    }
}

async function loadParkingAreaFilters() {
    const areaFilter = document.getElementById('parkingAreaFilter');
    if (!areaFilter) return;

    // Save current selection before resetting
    const currentVal = areaFilter.value;

    areaFilter.innerHTML = '<option value="all">All Areas</option>';
    
    const result = await apiCall('getParkingAreas', {}, 'GET', 'parking_api.php');
    
    if (result.success && result.areas) {
        
        // --- FIX: Client-side deduplication of area names ---
        // 1. Extract all AreaNames
        const allAreaNames = result.areas.map(area => area.AreaName);
        // 2. Use a Set to filter for unique names
        const uniqueAreaNames = Array.from(new Set(allAreaNames));
        // --- END FIX ---

        // Iterate over unique names and create the dropdown options
        uniqueAreaNames.forEach(areaName => {
            const option = document.createElement('option');
            option.value = areaName;
            option.textContent = areaName;
            areaFilter.appendChild(option);
        });
    }
    
    // Restore selection if possible
    if (currentVal) areaFilter.value = currentVal;
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
    }
    
    // Re-init filters after data load to ensure logic is fresh
    initParkingFilters();
}

// ==========================================
// 3. RENDER TABLE
// ==========================================

function renderParkingHistoryTable(data) {
  const tbody = document.getElementById('parkingHistoryTableBody');
  if (!tbody) return;
  
  const state = paginationState.parkingHistory;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);

  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => {
        // --- FIX: Escape HTML on all fields ---
        return `
        <tr>
            <td>${escapeHtml(row.SlotName)}</td>
            <td>${escapeHtml(row.PlateNumber)}</td>
            <td>${escapeHtml(row.RoomNumber || 'N/A')}</td>
            <td>${escapeHtml(row.GuestName || 'N/A')}</td>
            <td>${escapeHtml(row.VehicleType)}</td>
            <td>${escapeHtml(row.VehicleCategory)}</td>
            <td>${escapeHtml(row.ParkingTime)}</td>
            <td>${escapeHtml(row.EntryDateTime)}</td>
            <td>${escapeHtml(row.ExitDateTime)}</td>
        </tr>
        `;
    }).join('');
  }
  
  const recordCount = document.getElementById('parkingHistoryRecordCount');
  if (recordCount) recordCount.textContent = data.length;
  
  renderPaginationControls('parking-page', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderParkingHistoryTable(data);
  });
}

// ==========================================
// 4. FILTERS & EVENTS (FIXED)
// ==========================================

function initParkingFilters() {
    // Load Areas for dropdown


    const searchInput = document.getElementById('parkingHistorySearchInput');
    const areaFilter = document.getElementById('parkingAreaFilter');
    const refreshBtn = document.getElementById('parkingHistoryRefreshBtn');
    const downloadBtn = document.getElementById('parkingHistoryDownloadBtn');

    // --- Central Filter Function ---
    function applyFilters() {
        const search = searchInput.value.toLowerCase();
        const area = areaFilter.value;

        const filtered = parkingHistoryDataList.filter(row => {
            // Area Filter
            const matchesArea = (area === 'all') || (row.AreaName === area);
            
            // Search Filter
            const matchesSearch = !search || (
                (row.PlateNumber && row.PlateNumber.toLowerCase().includes(search)) ||
                (row.GuestName && row.GuestName.toLowerCase().includes(search)) ||
                (row.RoomNumber && row.RoomNumber.toLowerCase().includes(search)) ||
                (row.SlotName && row.SlotName.toLowerCase().includes(search))
            );

            return matchesArea && matchesSearch;
        });

        paginationState.parkingHistory.currentPage = 1;
        renderParkingHistoryTable(filtered);
        return filtered; 
    }

    // --- FIX: Use .oninput/.onchange instead of addEventListener ---
    // This overwrites previous listeners, preventing duplicates.
    if (searchInput) searchInput.oninput = applyFilters;
    if (areaFilter) areaFilter.onchange = applyFilters;

    // --- FIX: Refresh Button ---
    if (refreshBtn) {
        refreshBtn.onclick = () => {
            searchInput.value = '';
            areaFilter.value = 'all';
            
            fetchAndRenderParkingHistory();
            fetchAndRenderParkingDashboard();
            
            showParkingToast("Parking History refreshed successfully!");
        };
    }

    // --- FIX: Download Button ---
    if (downloadBtn) {
        downloadBtn.onclick = () => {
            // Get current filtered data
            const filteredData = applyFilters();
            
            if (filteredData.length === 0) {
                alert("No data to download");
                return;
            }

            const headers = ['Slot', 'Plate #', 'Room', 'Name', 'Type', 'Category', 'Duration', 'Entry', 'Exit'];
            
            const tableData = filteredData.map(row => [
                row.SlotName,
                row.PlateNumber,
                row.RoomNumber || 'N/A',
                row.GuestName || 'N/A',
                row.VehicleType,
                row.VehicleCategory,
                row.ParkingTime,
                row.EntryDateTime,
                row.ExitDateTime
            ]);

            downloadData(headers, tableData, "Parking History Report", "parking_history");
        };
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('parking-page')) {
        fetchAndRenderParkingDashboard();
        fetchAndRenderParkingHistory();
        // initParkingFilters is called inside fetchAndRenderParkingHistory to ensure data is ready
    }
});