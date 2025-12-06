/**
 * USER LOGS MODULE JAVASCRIPT
 * Features: Filters, Toast Notification, Landscape PDF Export
 * Fix: Uses .onclick/.onchange to prevent multiple listeners
 */

// ==========================================
// 1. GLOBAL HELPERS (Toast & PDF)
// ==========================================

// --- INJECT TOAST CSS ---
const logsToastStyle = document.createElement("style");
logsToastStyle.textContent = `
    .toast-success {
        position: fixed; top: 20px; right: 20px; background-color: #28a745; color: white;
        padding: 12px 24px; border-radius: 5px; box-shadow: 0 4px 6px rgba(0,0,0,0.15);
        z-index: 99999; font-family: 'Segoe UI', sans-serif; font-size: 14px;
        opacity: 0; transform: translateY(-20px); transition: opacity 0.3s ease, transform 0.3s ease;
        pointer-events: none;
    }
    .toast-visible { opacity: 1; transform: translateY(0); }
`;
document.head.appendChild(logsToastStyle);

// --- SHOW TOAST FUNCTION ---
function showLogsToast(message) {
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
function downloadLogsPDF(headers, data, title, filename) {
    if (typeof downloadData === 'function') {
        downloadData(headers, data, title, filename);
    } else {
        console.error('Download utility not loaded');
        alert('Download feature is not available. Please refresh the page.');
    }
}

// ==========================================
// 2. DATA FETCHING & RENDERING
// ==========================================

async function fetchAndRenderUserLogs() {
    if (!logsTableBody) return;
    logsTableBody.innerHTML = '<tr><td colspan="12">Loading user logs...</td></tr>';
    
    const result = await apiCall('fetch_user_logs', {}, 'GET', 'user_actions.php');
    
    if (result.success && result.data && result.data.length > 0) {
        userLogsDataList = result.data; 
        
        paginationState.userLogs.currentPage = 1;
        renderUserLogsTable(userLogsDataList);
        
        const recordCount = document.getElementById('logsRecordCount');
        if (recordCount) recordCount.textContent = userLogsDataList.length;

    } else if (result.success) {
        userLogsDataList = []; 
        logsTableBody.innerHTML = '<tr><td colspan="12" style="text-align: center; padding: 40px; color: #999;">No logs found.</td></tr>';
        document.getElementById('logsRecordCount').textContent = 0;
        renderPaginationControls('user-logs-tab', 0, 1, () => {});
    } else {
        logsTableBody.innerHTML = `<tr><td colspan="12" style="text-align: center; padding: 40px; color: #c33;">Failed to load logs: ${result.message || 'Unknown error'}</td></tr>`;
        document.getElementById('logsRecordCount').textContent = 0;
        renderPaginationControls('user-logs-tab', 0, 1, () => {});
    }
    
    // Re-initialize filters to ensure they work with new data
    initUserLogsFilters();
}

function renderUserLogsTable(data) {
  if (!logsTableBody) return;
  const tbody = logsTableBody;
  const state = paginationState.userLogs;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);
  
  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="12" style="text-align: center; padding: 40px; color: #999;">No logs found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => {
      const roleName = ACCOUNT_TYPE_MAP[row.AccountType] || row.AccountType;
      const actionClass = row.ActionType.toLowerCase().replace(/ /g, '-');

      return `
        <tr>
          <td>${row.LogID}</td>
          <td>${row.Lname}</td>
          <td>${row.Fname}</td>
          <td>${row.Mname || ''}</td>
          <td>${roleName}</td>
          <td>${row.Shift}</td>
          <td>${row.Username}</td>
          <td>${row.EmailAddress}</td>
          <td><span class="actionBadge ${actionClass}">${row.ActionType}</span></td>
          <td>${row.Timestamp}</td>
        </tr>
      `;
    }).join('');
  }
  
  const recordCount = document.getElementById('logsRecordCount');
  if (recordCount) recordCount.textContent = data.length;
  renderPaginationControls('user-logs-tab', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderUserLogsTable(data);
  });
}

// ==========================================
// 3. FILTERS & EVENTS (FIXED)
// ==========================================

function initUserLogsFilters() {
    const searchInput = document.getElementById('logsSearchInput');
    const roleFilter = document.getElementById('logsRoleFilter');
    const shiftFilter = document.getElementById('logsShiftFilter');
    const refreshBtn = document.getElementById('logsRefreshBtn');
    const downloadBtn = document.getElementById('logsDownloadBtn');

    // --- Central Filter Function ---
    function applyFilters() {
        const search = searchInput.value.toLowerCase();
        const role = roleFilter.value;
        const shift = shiftFilter.value;

        const filtered = userLogsDataList.filter(row => {
            // Search Check (checks multiple fields)
            const matchesSearch = !search || (
                (row.Username && row.Username.toLowerCase().includes(search)) ||
                (row.Fname && row.Fname.toLowerCase().includes(search)) ||
                (row.Lname && row.Lname.toLowerCase().includes(search)) ||
                (row.EmailAddress && row.EmailAddress.toLowerCase().includes(search)) ||
                (row.UserID && row.UserID.toString().includes(search))
            );
            
            // Dropdown Checks
            const matchesRole = !role || row.AccountType === role;
            const matchesShift = !shift || row.Shift === shift;

            return matchesSearch && matchesRole && matchesShift;
        });

        paginationState.userLogs.currentPage = 1;
        renderUserLogsTable(filtered);
        return filtered; // Return for PDF
    }

    // --- Use .oninput/.onchange to prevent duplicate listeners ---
    if (searchInput) searchInput.oninput = applyFilters;
    if (roleFilter) roleFilter.onchange = applyFilters;
    if (shiftFilter) shiftFilter.onchange = applyFilters;

    // --- Refresh Button ---
    if (refreshBtn) {
        refreshBtn.onclick = () => {
            if(searchInput) searchInput.value = '';
            if(roleFilter) roleFilter.value = '';
            if(shiftFilter) shiftFilter.value = '';
            
            fetchAndRenderUserLogs();
            showLogsToast("User Logs refreshed successfully!");
        };
    }

    // --- Download Button (Landscape PDF) ---
    if (downloadBtn) {
        downloadBtn.onclick = () => {
            const filteredData = applyFilters();
            
            if (filteredData.length === 0) {
                alert("No data to download");
                return;
            }

            const headers = ['Log ID', 'Full Name', 'Role', 'Shift', 'Username', 'Action', 'Timestamp'];
            const body = filteredData.map(row => {
                const fullName = `${row.Lname}, ${row.Fname}`;
                const roleName = ACCOUNT_TYPE_MAP[row.AccountType] || row.AccountType;
                return [
                    row.LogID,
                    fullName,
                    roleName,
                    row.Shift,
                    row.Username,
                    row.ActionType,
                    row.Timestamp
                ];
            });

            downloadData(headers, body, 'User Logs Report', 'user_logs');
        };
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('user-logs-page')) {
        fetchAndRenderUserLogs();
    }
});