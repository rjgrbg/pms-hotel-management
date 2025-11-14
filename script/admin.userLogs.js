// ===== USER LOGS FUNCTIONS =====
async function fetchAndRenderUserLogs() {
    if (!logsTableBody) return;
    console.log('Fetching user logs from database...');
    logsTableBody.innerHTML = '<tr><td colspan="12">Loading user logs...</td></tr>';
    
    // Call the new PHP action
    const result = await apiCall('fetch_user_logs', {}, 'GET', 'user_actions.php');
    
    if (result.success && result.data && result.data.length > 0) {
        userLogsDataList = result.data; // Update global var with REAL data
        console.log('User logs data loaded:', userLogsDataList);
        
        paginationState.userLogs.currentPage = 1;
        renderUserLogsTable(userLogsDataList);
        const recordCount = document.getElementById('logsRecordCount');
        if (recordCount) recordCount.textContent = userLogsDataList.length;

    } else if (result.success) {
        userLogsDataList = []; // Clear any mock data
        logsTableBody.innerHTML = '<tr><td colspan="12" style="text-align: center; padding: 40px; color: #999;">No logs found.</td></tr>';
        const recordCount = document.getElementById('logsRecordCount');
        if (recordCount) recordCount.textContent = 0;
        renderPaginationControls('user-logs-tab', 0, 1, () => {});
    } else {
        logsTableBody.innerHTML = `<tr><td colspan="12" style="text-align: center; padding: 40px; color: #c33;">Failed to load logs: ${result.message || 'Unknown error'}</td></tr>`;
        const recordCount = document.getElementById('logsRecordCount');
        if (recordCount) recordCount.textContent = 0;
        renderPaginationControls('user-logs-tab', 0, 1, () => {});
    }
}

function renderUserLogsTable(data) {
  if (!logsTableBody) return;
  console.log('Rendering user logs table with data:', data);
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
          <td>${row.UserID}</td>
          <td>${row.Lname}</td>
          <td>${row.Fname}</td>
          <td>${row.Mname}</td>
          <td>${row.AccountType}</td>
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

// ===== USER LOGS FILTERS =====
function initUserLogsFilters() {
    document.getElementById('logsSearchInput')?.addEventListener('input', (e) => {
      const search = e.target.value.toLowerCase();
      const filtered = userLogsDataList.filter(row => 
        (row.Username && row.Username.toLowerCase().includes(search)) ||
        (row.Fname && row.Fname.toLowerCase().includes(search)) ||
        (row.Lname && row.Lname.toLowerCase().includes(search)) ||
        (row.EmailAddress && row.EmailAddress.toLowerCase().includes(search)) ||
        (row.UserID && row.UserID.toString().includes(search))
      );
      paginationState.userLogs.currentPage = 1;
      renderUserLogsTable(filtered);
    });

    document.getElementById('logsRoleFilter')?.addEventListener('change', (e) => {
      const role = e.target.value;
      const filtered = role ? userLogsDataList.filter(row => row.AccountType === role) : userLogsDataList;
      paginationState.userLogs.currentPage = 1;
      renderUserLogsTable(filtered);
    });

    document.getElementById('logsShiftFilter')?.addEventListener('change', (e) => {
      const shift = e.target.value;
      const filtered = shift ? userLogsDataList.filter(row => row.Shift === shift) : userLogsDataList;
      paginationState.userLogs.currentPage = 1;
      renderUserLogsTable(filtered);
    });

    document.getElementById('logsRefreshBtn')?.addEventListener('click', () => {
      document.getElementById('logsSearchInput').value = '';
      document.getElementById('logsRoleFilter').value = '';
      document.getElementById('logsShiftFilter').value = '';
      
      fetchAndRenderUserLogs(); // This will now re-fetch from the database
    });

    // === MODIFIED FOR PDF DOWNLOAD ===
    document.getElementById('logsDownloadBtn')?.addEventListener('click', () => {
      // 1. Get filter values
      const search = document.getElementById('logsSearchInput').value.toLowerCase();
      const role = document.getElementById('logsRoleFilter').value;
      const shift = document.getElementById('logsShiftFilter').value;

      // 2. Filter data
      const filteredData = userLogsDataList.filter(row => {
          const searchMatch = !search || (row.Username && row.Username.toLowerCase().includes(search)) || (row.Fname && row.Fname.toLowerCase().includes(search)) || (row.Lname && row.Lname.toLowerCase().includes(search)) || (row.EmailAddress && row.EmailAddress.toLowerCase().includes(search)) || (row.UserID && row.UserID.toString().includes(search));
          const roleMatch = !role || row.AccountType === role;
          const shiftMatch = !shift || row.Shift === shift;
          return searchMatch && roleMatch && shiftMatch;
      });

      // 3. Define PDF headers and body
      const headers = ['Log ID', 'User ID', 'Full Name', 'Role', 'Shift', 'Username', 'Action', 'Timestamp'];
      const body = filteredData.map(row => {
          const fullName = `${row.Lname}, ${row.Fname}${row.Mname ? ' ' + row.Mname.charAt(0) + '.' : ''}`;
          const roleName = ACCOUNT_TYPE_MAP[row.AccountType] || row.AccountType;
          return [
              row.LogID,
              row.UserID,
              fullName,
              roleName,
              row.Shift,
              row.Username,
              row.ActionType,
              row.Timestamp
          ];
      });

      // 4. Call helper
      generatePdfReport(
          'User Logs Report',
          `user-logs-${new Date().toISOString().split('T')[0]}.pdf`,
          headers,
          body
      );
    });
}