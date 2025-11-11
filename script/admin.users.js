// ===== USER MANAGEMENT FUNCTIONS =====
async function fetchAndRenderUsers() {
    const usersTableBody = document.getElementById('usersTableBody');
    if (!usersTableBody) return;
        
    console.log('Fetching users...');
    usersTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Loading users...</td></tr>';
        
    try {
        const result = await apiCall('fetch_users', {}, 'GET', 'user_actions.php');
        console.log('User fetch result:', result);
                
        if (result.success && result.data && result.data.length > 0) {
            usersData = result.data;
            console.log('Users data loaded:', usersData);
            updateDashboardFromUsers(usersData);
                        
            paginationState.users.currentPage = 1;
            renderUsersTable(usersData);
            const recordCount = document.getElementById('usersRecordCount');
            if (recordCount) recordCount.textContent = usersData.length;
        } else if (result.success && (!result.data || result.data.length === 0)) {
            usersTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">No users found.</td></tr>';
            const recordCount = document.getElementById('usersRecordCount');
            if (recordCount) recordCount.textContent = 0;
            updateDashboardFromUsers([]); 
            renderPaginationControls('user-management-tab', 0, 1, () => {});
        } else {
            usersTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: #c33;">Failed to load users: ${result.message || 'Unknown error'}</td></tr>`;
            const recordCount = document.getElementById('usersRecordCount');
            if (recordCount) recordCount.textContent = 0;
            updateDashboardFromUsers([]);
            renderPaginationControls('user-management-tab', 0, 1, () => {});
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        usersTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #c33;">Network error. Please refresh the page.</td></tr>';
    }
}


function renderUsersTable(data) {
  if (!usersTableBody) return;
  console.log('Rendering users table with data:', data);
  const tbody = usersTableBody;
  const state = paginationState.users;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);
  
  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => {
      const fullName = `${row.Lname}, ${row.Fname}${row.Mname ? ' ' + row.Mname.charAt(0) + '.' : ''}`;
      const roleName = ACCOUNT_TYPE_MAP[row.AccountType] || row.AccountType;

      return `
        <tr>
          <td>${row.Username}</td>
          <td>${fullName}</td>
          <td><span class="statusBadge ${row.AccountType}">${roleName}</td>
          <td>${row.EmailAddress}</td>
          <td>${row.Shift}</td>
          <td>
            <div class="actionButtons">
              <button class="actionBtn editUserBtn" data-user-data='${JSON.stringify(row).replace(/'/g, "&apos;")}'>
                <img src="assets/icons/edit-icon.png" alt="Edit" />
              </button>
              <button class="actionBtn deleteUserBtn" data-user-id="${row.UserID}" data-username="${row.Username}">
                <img src="assets/icons/delete-icon.png" alt="Delete" />
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.editUserBtn').forEach(btn => {
        btn.addEventListener('click', handleEditUserClick);
    });
    tbody.querySelectorAll('.deleteUserBtn').forEach(btn => {
        btn.addEventListener('click', handleDeleteUserClick);
    });
  }
  
  const recordCount = document.getElementById('usersRecordCount');
  if (recordCount) recordCount.textContent = data.length;
  renderPaginationControls('user-management-tab', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderUsersTable(data);
  });
}

// ===== USER MODAL HANDLERS =====
function handleAddUserClick() {
    hideFormMessage(true);
    userModalTitle.textContent = 'Add New User';
    employeeIdForm.style.display = 'block';
    userEditForm.style.display = 'none';
    employeeIdForm.reset();
    userModal.style.display = 'flex';
}

async function handleEmployeeIdFormSubmit(e) {
    e.preventDefault();
    hideFormMessage(true);
        
    const employeeId = document.getElementById('employeeId').value.trim();
        
    if (!employeeId) {
        showFormMessage('Please enter an Employee ID.', 'error', true);
        return;
    }
    console.log('Looking up employee:', employeeId);
        
    const lookupBtn = document.getElementById('lookupEmployeeBtn');
    const originalText = lookupBtn.textContent;
    lookupBtn.disabled = true;
    lookupBtn.textContent = 'ADDING...';
        
    try {
        const result = await apiCall('add_employee_by_id', { employeeId: employeeId }, 'POST', 'user_actions.php');
        console.log('Add employee result:', result);
        
        if (result.success) {
            showFormMessage(result.message || 'Employee added successfully!', 'success', true);
            document.getElementById('employeeIdForm').reset();
            await fetchAndRenderUsers();
                        
            setTimeout(() => {
                document.getElementById('userModal').style.display = 'none';
                hideFormMessage(true);
            }, 2000);
        } else {
            showFormMessage(result.message || 'Failed to add employee.', 'error', true);
        }
    } catch (error) {
        console.error('Error adding employee:', error);
        showFormMessage('An unexpected error occurred. Please try again.', 'error', true);
    } finally {
        lookupBtn.disabled = false;
        lookupBtn.textContent = originalText;
    }
}

function handleEditUserClick(event) {
    hideFormMessage(true);
    const user = JSON.parse(event.currentTarget.dataset.userData);
    
    userModalTitle.textContent = 'Edit User: ' + user.Username;
    employeeIdForm.style.display = 'none';
    userEditForm.style.display = 'block';
    
    document.getElementById('editUserFullName').textContent = `${user.Lname}, ${user.Fname}${user.Mname ? ' ' + user.Mname.charAt(0) + '.' : ''}`;
    document.getElementById('editUserEmployeeId').textContent = `Employee ID: ${user.EmployeeID || 'N/A'}`; 
    
    editUserIdInput.value = user.UserID;
    userUsernameInput.value = user.Username;
    userAccountTypeInput.value = user.AccountType;
    userShiftInput.value = user.Shift;
    
    const userPasswordInput = document.getElementById('userPassword');
    if (userPasswordInput) userPasswordInput.value = '';

    userModal.style.display = 'flex';
}

async function handleUserEditFormSubmit(e) {
    e.preventDefault();
    hideFormMessage(true);
    
    const userID = document.getElementById('editUserId').value;
    
    const data = {
        userID: userID,
        username: userUsernameInput.value.trim(),
        password: document.getElementById('userPassword') ? document.getElementById('userPassword').value : '',
        accountType: userAccountTypeInput.value,
        shift: userShiftInput.value
    };
    
    if (!data.username || !data.accountType || !data.shift) {
        showFormMessage('Please fill in all required fields (Username, Account Type, Shift).', 'error', true); 
        return;
    }
    
    console.log('Updating user data:', data);
        
    const saveBtn = document.getElementById('saveUserBtn');
   const originalText = saveBtn.textContent;
   saveBtn.disabled = true;
    saveBtn.textContent = 'UPDATING...';
        
    try {
        const result = await apiCall('edit_user', data, 'POST', 'user_actions.php');
        console.log('User update result:', result);
        
        if (result.success) {
           showFormMessage(result.message || 'User updated successfully!', 'success', true);
            await fetchAndRenderUsers();
                        
            setTimeout(() => {
                document.getElementById('userModal').style.display = 'none';
                hideFormMessage(true);
            }, 2000);
        } else {
            showFormMessage(result.message || 'Failed to update user.', 'error', true);
        }
    } catch (error) {
        console.error('Error updating user:', error);
        showFormMessage('An unexpected error occurred. Please try again.', 'error', true);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
}

// ===== DELETE USER HANDLERS =====
window.userToDeleteID = null;

function handleDeleteUserClick(event) {
    window.userToDeleteID = event.currentTarget.dataset.userId;
    const username = event.currentTarget.dataset.username;
    document.getElementById('deleteUserText').textContent = `Are you sure you want to delete user "${username}"? This action cannot be undone.`;
    document.getElementById('deleteUserModal').style.display = 'flex';
}

async function confirmUserDelete() {
    const userToDeleteID = window.userToDeleteID;
    if (!userToDeleteID) return;
    
    const confirmBtn = document.getElementById('confirmDeleteUserBtn');
    const originalText = confirmBtn.textContent;
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'DELETING...';
    
    try {
        const data = { userID: userToDeleteID };
        const result = await apiCall('delete_user', data, 'POST', 'user_actions.php');
        
        if (result.success) {
            document.getElementById('deleteUserModal').style.display = 'none';
            await fetchAndRenderUsers();
            alert('User deleted successfully!'); 
        } else {
            alert(result.message || 'Failed to delete user');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('An unexpected error occurred. Please try again.');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
        window.userToDeleteID = null;
    }
}

// ===== USER FILTERS =====
function initUserFilters() {
    document.getElementById('usersSearchInput')?.addEventListener('input', (e) => {
      const search = e.target.value.toLowerCase();
      const filtered = usersData.filter(row => 
        row.Username.toLowerCase().includes(search) ||
        row.Fname.toLowerCase().includes(search) ||
        row.Lname.toLowerCase().includes(search) ||
        row.EmailAddress.toLowerCase().includes(search)
      );
      paginationState.users.currentPage = 1;
      renderUsersTable(filtered);
    });

    document.getElementById('usersRoleFilter')?.addEventListener('change', (e) => {
      const role = e.target.value;
      const filtered = role ? usersData.filter(row => row.AccountType === role) : usersData;
      paginationState.users.currentPage = 1;
      renderUsersTable(filtered);
    });

    document.getElementById('usersShiftFilter')?.addEventListener('change', (e) => {
      const shift = e.target.value;
      const filtered = shift ? usersData.filter(row => row.Shift === shift) : usersData;
      paginationState.users.currentPage = 1;
      renderUsersTable(filtered);
    });

    document.getElementById('usersRefreshBtn')?.addEventListener('click', async () => {
      document.getElementById('usersSearchInput').value = '';
      document.getElementById('usersRoleFilter').value = '';
      document.getElementById('usersShiftFilter').value = '';
      
      const refreshBtn = document.getElementById('usersRefreshBtn');
      const originalHTML = refreshBtn.innerHTML;
      refreshBtn.disabled = true;
      refreshBtn.innerHTML = '<img src="assets/icons/refresh-icon.png" alt="Syncing" style="animation: spin 1s linear infinite;" />';
      
      try {
        const syncResult = await apiCall('sync_users_from_hris', {}, 'POST', 'user_actions.php');
        
        if (syncResult.success) {
          console.log('HRIS Sync:', syncResult.message);
          showSyncNotification(syncResult.message, 'success');
        } else {
          console.warn('HRIS Sync Warning:', syncResult.message);
          showSyncNotification(syncResult.message, 'warning');
        }
        
        await fetchAndRenderUsers();
        
      } catch (error) {
        console.error('Sync error:', error);
        showSyncNotification('Failed to sync with HRIS', 'error');
      } finally {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = originalHTML;
      }
    });

    document.getElementById('usersDownloadBtn')?.addEventListener('click', () => {
      const headers = ['Username', 'Full Name', 'Role', 'Email', 'Shift', 'Birthday', 'Address'];
      const csvContent = [
        headers.join(','),
        ...usersData.map(row => {
          const fullName = `${row.Lname} ${row.Fname}${row.Mname ? ' ' + row.Mname : ''}`;
          const roleName = ACCOUNT_TYPE_MAP[row.AccountType] || row.AccountType;
          return [row.Username, fullName, roleName, row.EmailAddress, row.Shift, row.Birthday, row.Address].join(',');
        })
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
}

// ===== SYNC NOTIFICATION =====
function showSyncNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `syncNotification ${type}`;
  notification.textContent = message;
  
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background-color: ${type === 'success' ? '#5cb85c' : type === 'warning' ? '#ff9500' : '#c9302c'};
    color: white;
    padding: 15px 20px;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 10000;
    font-size: 13px;
    font-weight: 600;
    animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s;
    max-width: 350px;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function initSyncAnimations() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    const notificationStyle = document.createElement('style');
    notificationStyle.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes fadeOut {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(notificationStyle);
}