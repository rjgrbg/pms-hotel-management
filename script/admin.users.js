// ===== USER MANAGEMENT FUNCTIONS (Employee Code Lookup) =====

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
          <td><span class="statusBadge ${row.AccountType}">${roleName}</span></td>
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
    userModalTitle.textContent = 'Add User from Employee';
    
    // Show employee code form
    employeeCodeForm.style.display = 'block';
    userDetailsDisplay.style.display = 'none';
    
    // Reset form
    employeeCodeForm.reset();
    
    userModal.style.display = 'flex';
}

async function handleEmployeeCodeSubmit(e) {
    e.preventDefault();
    hideFormMessage(true);
    
    const employeeCode = document.getElementById('employeeCodeInput').value.trim();
    
    if (!employeeCode) {
        showFormMessage('Please enter an Employee Code.', 'error', true);
        return;
    }
    
    console.log('Looking up employee:', employeeCode);
    
    const lookupBtn = document.getElementById('lookupEmployeeBtn');
    const originalText = lookupBtn.textContent;
    lookupBtn.disabled = true;
    lookupBtn.textContent = 'ADDING...';
    
    try {
        const result = await apiCall('add_user_from_employee', { employeeCode: employeeCode }, 'POST', 'user_actions.php');
        console.log('Add user result:', result);
        
        if (result.success) {
            showFormMessage(result.message || 'User added successfully!', 'success', true);
            employeeCodeForm.reset();
            await fetchAndRenderUsers();
            
            setTimeout(() => {
                document.getElementById('userModal').style.display = 'none';
                hideFormMessage(true);
            }, 2000);
        } else {
            showFormMessage(result.message || 'Failed to add user.', 'error', true);
        }
    } catch (error) {
        console.error('Error adding user:', error);
        showFormMessage('An unexpected error occurred. Please try again.', 'error', true);
    } finally {
        lookupBtn.disabled = false;
        lookupBtn.textContent = originalText;
    }
}

function handleEditUserClick(event) {
    hideFormMessage(true);
    const user = JSON.parse(event.currentTarget.dataset.userData);
    
    userModalTitle.textContent = 'Change Password: ' + user.Username;
    
    // Hide employee code form, show details
    employeeCodeForm.style.display = 'none';
    userDetailsDisplay.style.display = 'block';
    
    // Fill in user data (read-only display)
    document.getElementById('displayEmployeeCode').textContent = user.EmployeeID || 'N/A';
    document.getElementById('displayFullName').textContent = `${user.Lname}, ${user.Fname}${user.Mname ? ' ' + user.Mname.charAt(0) + '.' : ''}`;
    document.getElementById('displayEmail').textContent = user.EmailAddress;
    document.getElementById('displayAccountType').textContent = ACCOUNT_TYPE_MAP[user.AccountType] || user.AccountType;
    document.getElementById('displayShift').textContent = user.Shift;
    document.getElementById('displayUsername').textContent = user.Username;
    
    // Set hidden user ID
    document.getElementById('editUserId').value = user.UserID;
    
    // Clear password field
    document.getElementById('newPassword').value = '';
    
    userModal.style.display = 'flex';
}

async function handlePasswordChangeSubmit(e) {
    e.preventDefault();
    hideFormMessage(true);
    
    const userID = document.getElementById('editUserId').value;
    const password = document.getElementById('newPassword').value.trim();
    
    if (!password) {
        showFormMessage('Please enter a new password.', 'error', true);
        return;
    }
    
    console.log('Updating password for user:', userID);
    
    const saveBtn = document.getElementById('savePasswordBtn');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = 'UPDATING...';
    
    try {
        const result = await apiCall('edit_user', { 
            userID: userID, 
            password: password 
        }, 'POST', 'user_actions.php');
        
        console.log('Password update result:', result);
        
        if (result.success) {
            showFormMessage('Password updated successfully!', 'success', true);
            await fetchAndRenderUsers();
            
            setTimeout(() => {
                document.getElementById('userModal').style.display = 'none';
                hideFormMessage(true);
            }, 2000);
        } else {
            showFormMessage(result.message || 'Failed to update password.', 'error', true);
        }
    } catch (error) {
        console.error('Error updating password:', error);
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
      
      await fetchAndRenderUsers();
    });

    // === MODIFIED FOR PDF DOWNLOAD ===
    document.getElementById('usersDownloadBtns')?.addEventListener('click', () => {
      // 1. Get filter values
      const search = document.getElementById('usersSearchInputs').value.toLowerCase();
      const role = document.getElementById('usersRoleFilter').value;
      const shift = document.getElementById('usersShiftFilter').value;

      // 2. Filter data
      const filteredData = usersData.filter(row => {
          const searchMatch = !search || row.Username.toLowerCase().includes(search) || row.Fname.toLowerCase().includes(search) || row.Lname.toLowerCase().includes(search) || row.EmailAddress.toLowerCase().includes(search);
          const roleMatch = !role || row.AccountType === role;
          const shiftMatch = !shift || row.Shift === shift;
          return searchMatch && roleMatch && shiftMatch;
      });

      // 3. Define PDF headers and body
      const headers = ['Employee Code', 'Username', 'Full Name', 'Role', 'Email', 'Shift'];
      const body = filteredData.map(row => {
          const fullName = `${row.Lname}, ${row.Fname}${row.Mname ? ' ' + row.Mname.charAt(0) + '.' : ''}`;
          const roleName = ACCOUNT_TYPE_MAP[row.AccountType] || row.AccountType;
          return [
              row.EmployeeID,
              row.Username,
              fullName,
              roleName,
              row.EmailAddress,
              row.Shift
          ];
      });

      // 4. Call helper
      generatePdfReport(
          'User Management Report',
          `users-${new Date().toISOString().split('T')[0]}.pdf`,
          headers,
          body
      );
    });
    /**
 * Generic helper function to generate a PDF report using jsPDF and autoTable.
 * @param {string} title - The main title of the report.
 * @param {string} filename - The filename for the downloaded PDF.
 * @param {string[]} headers - An array of header strings.
 * @param {Array<Array<string>>} body - An array of data rows.
 */
function generatePdfReport(title, filename, headers, body) {
    
    // 1. Check if there is data to download
    if (body.length === 0) {
        // Using alert() as a fallback. If you have showToast(), use that.
        alert('No data to download.');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        // Use 'portrait' (default) as 6 columns will fit
        const doc = new jsPDF(); 

        // 2. Add Title and Timestamp
        doc.setFontSize(18);
        doc.text(title, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

        // 3. Create the table
        doc.autoTable({
            head: [headers], // jsPDF-autoTable expects head to be an array of arrays
            body: body,
            startY: 35,
            headStyles: { fillColor: [72, 12, 27] }, // Using your maroon color
            styles: { fontSize: 8, cellPadding: 2 },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            // Set column widths for your 6 columns
            columnStyles: {
                0: { cellWidth: 20 }, // Username
                1: { cellWidth: 30 }, // Full Name
                2: { cellWidth: 40 }, // Role
                3: { cellWidth: 30 }, // Email
                4: { cellWidth: 40 }, // Shift
                5: { cellWidth: 20 }  // Employee Code
            }
        });

        // 4. Save the file
        doc.save(filename);

    } catch (e) {
        console.error("Error generating PDF:", e);
        alert('Error generating PDF. See console.');
    }
}
}