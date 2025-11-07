document.addEventListener('DOMContentLoaded', () => {
  // ===== GLOBAL VARIABLES =====
  let allInventoryData = [];
  let allHistoryData = [];
  let currentEditItemId = null;

  // ===== ELEMENT SELECTORS =====
  // Tables
  const requestsTableBody = document.getElementById('requestsTableBody');
  const historyTableBody = document.getElementById('historyTableBody');
  const recordCountSpan = document.getElementById('recordCount'); // This ID seems to be from an old version in your HTML

  // Tabs
  const tabBtns = document.querySelectorAll('.tabBtn');
  const tabContents = document.querySelectorAll('.tabContent');

  // Filters (Stocks Tab)
  const categoryFilter = document.getElementById('floorFilter');
  const statusFilter = document.getElementById('roomFilter');
  const searchInput = document.getElementById('searchInput');

  // Filters (History Tab)
  const categoryFilterHistory = document.getElementById('floorFilterHistory');
  const statusFilterHistory = document.getElementById('roomFilterHistory');
  const searchInputHistory = document.getElementById('historySearchInput');

  // Buttons
  const refreshBtn = document.getElementById('refreshBtn');
  const downloadBtnRequests = document.getElementById('downloadBtnRequests');
  const downloadBtnHistory = document.getElementById('downloadBtn');

  // --- Modals ---
  const addItemModal = document.getElementById('add-item-modal');
  const confirmationModal = document.getElementById('confirmation-modal');
  const successModal = document.getElementById('success-modal');
  const editItemModal = document.getElementById('edit-item-modal');
  const deleteConfirmModal = document.getElementById('delete-confirm-modal');

  // --- Modal Buttons & Forms ---
  const addItemBtn = document.getElementById('addItemBtn');
  const addItemForm = document.getElementById('add-item-form');
  const addCategorySelect = document.getElementById('item-category');
  const addModalCloseBtn = document.getElementById('modal-close-btn');

  const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
  const confirmAddBtn = document.getElementById('confirm-add-btn');
  const successOkayBtn = document.getElementById('success-okay-btn');

  const editItemForm = document.getElementById('edit-item-form');
  const editModalCloseBtn = document.getElementById('edit-modal-close-btn');
  const editCategorySelect = document.getElementById('edit-item-category');
  const editItemIdSpan = document.getElementById('edit-item-id');
  const editItemIdInput = document.getElementById('edit-item-id-input'); 
  const editStockInput = document.getElementById('edit-item-add-stock');
  
  // === CHANGE 1: This is now the CANCEL button in the edit modal ===
  const editModalCancelBtn = document.getElementById('edit-modal-cancel-btn');

  const deleteCancelBtn = document.getElementById('delete-cancel-btn');
  const deleteConfirmBtn = document.getElementById('delete-confirm-btn');
  // === CHANGE 2: Added new 'X' button for delete modal ===
  const deleteModalCloseBtn = document.getElementById('delete-modal-close-btn');

  // --- Profile & Logout ---
  const profileBtn = document.getElementById('profileBtn');
  const sidebar = document.getElementById('profile-sidebar');
  const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
  const logoutBtn = document.getElementById('logoutBtn');
  const logoutModal = document.getElementById('logoutModal');
  const closeLogoutBtn = document.getElementById('closeLogoutBtn');
  const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
  const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

  // ======================================================
  // === HELPER FUNCTIONS
  // ======================================================

  const showModal = (modal) => {
    if (modal) modal.classList.add('show-modal');
  };

  const hideModal = (modal) => {
    if (modal) modal.classList.remove('show-modal');
  };

  const handleError = (message) => {
    console.error(message);
    alert(message);
  };

  // ======================================================
  // === DATA FETCHING (Connecting to inventory_actions.php)
  // ======================================================

  async function fetchInventory() {
    try {
      const response = await fetch('inventory_actions.php?action=get_inventory');
      if (!response.ok) throw new Error('Network response was not ok.');
      const items = await response.json();

      if (items.error) {
        handleError(items.error);
        allInventoryData = [];
      } else {
        allInventoryData = items;
        renderInventoryTable();
      }
    } catch (error) {
      handleError('Error fetching inventory: ' + error.message);
      requestsTableBody.innerHTML =
        '<tr><td colspan="10" class="no-data-cell">Error loading data.</td></tr>';
    }
  }

  async function fetchHistory() {
    try {
      const response = await fetch('inventory_actions.php?action=get_history');
      if (!response.ok) throw new Error('Network response was not ok.');
      const logs = await response.json();

      if (logs.error) {
        handleError(logs.error);
        allHistoryData = [];
      } else {
        allHistoryData = logs;
        renderHistoryTable();
      }
    } catch (error) {
      handleError('Error fetching history: ' + error.message);
      historyTableBody.innerHTML =
        '<tr><td colspan="11" class="no-data-cell">Error loading data.</td></tr>';
    }
  }

  async function fetchCategories() {
    try {
      const response = await fetch('inventory_actions.php?action=get_categories');
      if (!response.ok) throw new Error('Network response was not ok.');
      const categories = await response.json();

      if (categories.error) {
        handleError(categories.error);
        return;
      }

      addCategorySelect.innerHTML =
        '<option value="" disabled selected>Select a category</option>';
      editCategorySelect.innerHTML = '';

      categories.forEach((category) => {
        const option = document.createElement('option');
        option.value = category.ItemCategoryID;
        option.textContent = category.ItemCategoryName;

        addCategorySelect.appendChild(option.cloneNode(true));
        editCategorySelect.appendChild(option.cloneNode(true));
      });
    } catch (error) {
      handleError('Error fetching categories: ' + error.message);
    }
  }
  
  // ======================================================
  // === RENDER & FILTER FUNCTIONS
  // ======================================================

  /**
   * Filters and re-renders the INVENTORY table based on global data.
   */
  function renderInventoryTable() {
    const category = categoryFilter.value.toLowerCase();
    const status = statusFilter.value.toLowerCase();
    const search = searchInput.value.toLowerCase();

    const filteredData = allInventoryData.filter((item) => {
      const matchCategory =
        !category || item.Category.toLowerCase() === category;
      const matchStatus =
        !status || item.ItemStatus.toLowerCase() === status;
      const matchSearch =
        !search ||
        item.ItemName.toLowerCase().includes(search) ||
        item.ItemID.toString().includes(search);
      return matchCategory && matchStatus && matchSearch;
    });

    if (filteredData.length === 0) {
      requestsTableBody.innerHTML =
        '<tr><td colspan="10" class="no-data-cell">No inventory items found</td></tr>';
      return;
    }

    requestsTableBody.innerHTML = filteredData
      .map((item) => {
        const badgeClass = item.ItemStatus.toLowerCase().replace(/\s+/g, '-');

        return `
        <tr>
          <td>${item.ItemID}</td>
          <td>${item.ItemName}</td>
          <td>${item.Category}</td>
          <td>${item.ItemQuantity}</td>
          <td>${item.ItemDescription || 'N/A'}</td>
          
          <td><span class="statusBadge ${
            badgeClass === 'in-stock'
              ? 'cleaned'
              : badgeClass === 'low-stock'
              ? 'dirty'
              : 'request'
          }">${item.ItemStatus}</span></td>
          
          <td>${item.DamageItem}</td>
          <td>${item.DateofStockIn}</td>
          <td>${item.DateofStockOut || 'N/A'}</td>
          <td class="action-cell">
              <button class="action-btn edit-btn" data-id="${
                item.ItemID
              }">Edit</button>
              <button class="action-btn delete-btn" data-id="${
                item.ItemID
              }">Delete</button>
          </td>
        </tr>
      `;
      })
      .join('');

    // Add event listeners for the new buttons
    document
      .querySelectorAll('#requestsTableBody .edit-btn')
      .forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const itemId = parseInt(e.target.dataset.id);
          const itemToEdit = allInventoryData.find((i) => i.ItemID == itemId);
          if (itemToEdit) {
            openEditModal(itemToEdit);
          }
        });
      });

    document
      .querySelectorAll('#requestsTableBody .delete-btn')
      .forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const itemId = parseInt(e.target.dataset.id);
          currentEditItemId = itemId;
          showModal(deleteConfirmModal);
        });
      });
  }

  /**
   * Filters and re-renders the HISTORY table based on global data.
   */
  function renderHistoryTable() {
    const category = categoryFilterHistory.value.toLowerCase();
    const status = statusFilterHistory.value.toLowerCase();
    const search = searchInputHistory.value.toLowerCase();

    const filteredData = allHistoryData.filter((log) => {
      const matchCategory =
        !category || log.Category.toLowerCase() === category;
      const matchStatus = !status || log.ItemStatus.toLowerCase() === status;
      const matchSearch =
        !search ||
        log.ItemName.toLowerCase().includes(search) ||
        log.InvLogID.toString().includes(search) ||
        log.PerformedBy.toLowerCase().includes(search);
      return matchCategory && matchStatus && matchSearch;
    });

    if (filteredData.length === 0) {
      historyTableBody.innerHTML =
        '<tr><td colspan="11" class="no-data-cell">No history found</td></tr>';
      // recordCountSpan.textContent = 0; // This ID doesn't seem to exist for history
      return;
    }

    historyTableBody.innerHTML = filteredData
      .map(
        (log) => `
      <tr>
        <td>${log.InvLogID}</td>
        <td>${log.ItemName}</td>
        <td>${log.Category}</td>
        <td>${log.ItemQuantity}</td>
        <td>${log.QuantityChange}</td>
        <td>${log.ItemStatus}</td>
        <td>${log.DamageItem}</td>
        <td>${log.DateofStockIn || 'N/A'}</td>
        <td>${log.DateofStockOut || 'N/A'}</td>
        <td>${log.ActionType}</td>
        <td>${log.PerformedBy}</td>
      </tr>
    `
      )
      .join('');

    // recordCountSpan.textContent = filteredData.length; // This ID doesn't seem to exist for history
  }

  // ======================================================
  // === MODAL & FORM LOGIC
  // ======================================================

  // --- Add Item Flow ---
  addItemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (addItemForm.checkValidity()) {
      showModal(confirmationModal);
    } else {
      addItemForm.reportValidity();
    }
  });

  confirmAddBtn.addEventListener('click', async () => {
    const formData = new FormData();
    formData.append('name', document.getElementById('item-name').value);
    formData.append(
      'category_id',
      document.getElementById('item-category').value
    );
    formData.append(
      'description',
      document.getElementById('item-description').value
    );
    formData.append('quantity', document.getElementById('item-quantity').value);
    formData.append(
      'stock_in_date',
      document.getElementById('stock-in-date').value
    );

    try {
      const response = await fetch('inventory_actions.php?action=add_item', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      hideModal(confirmationModal);

      if (result.success) {
        showModal(successModal);
        addItemForm.reset();
        hideModal(addItemModal);
        fetchInventory();
        fetchHistory();
      } else {
        throw new Error(result.error || 'Failed to add item.');
      }
    } catch (error) {
      handleError('Error adding item: ' + error.message);
    }
  });

  // --- Edit Item Flow ---
  function openEditModal(item) {
    currentEditItemId = item.ItemID;
    editItemIdSpan.textContent = item.ItemID;
    editItemIdInput.value = item.ItemID; 
    document.getElementById('edit-item-name').value = item.ItemName;
    editCategorySelect.value = item.ItemCategoryID;
    document.getElementById('edit-item-description').value = item.ItemDescription;
    // === CHANGE 3: RESTORED status logic ===
    document.getElementById('edit-item-status').value = item.ItemStatus;
    editStockInput.value = 0;

    showModal(editItemModal);
  }

  editItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentEditItemId) return;

    const formData = new FormData();
    formData.append('item_id', currentEditItemId); 
    formData.append('name', document.getElementById('edit-item-name').value);
    formData.append('category_id', editCategorySelect.value);
    formData.append(
      'description',
      document.getElementById('edit-item-description').value
    );
    formData.append('stock_adjustment', editStockInput.value);
    // === CHANGE 3: RESTORED status logic ===
    formData.append('status', document.getElementById('edit-item-status').value);

    try {
      const response = await fetch('inventory_actions.php?action=update_item', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (result.success) {
        hideModal(editItemModal);
        fetchInventory();
        fetchHistory();
      } else {
        throw new Error(result.error || 'Failed to update item.');
      }
    } catch (error) {
      handleError('Error updating item: ' + error.message);
    }
  });

  // --- Delete Item Flow (from main table) ---
  deleteConfirmBtn.addEventListener('click', async () => {
    if (!currentEditItemId) return;

    const formData = new FormData();
    formData.append('item_id', currentEditItemId);

    try {
      const response = await fetch('inventory_actions.php?action=delete_item', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      hideModal(deleteConfirmModal);
      hideModal(editItemModal);

      if (result.success) {
        fetchInventory();
        fetchHistory();
      } else {
        throw new Error(result.error || 'Failed to delete item.');
      }
    } catch (error) {
      handleError('Error deleting item: ' + error.message);
    }
  });

  // ======================================================
  // === EVENT LISTENERS
  // ======================================================

  // --- Tab Navigation ---
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      tabBtns.forEach((b) => b.classList.remove('active'));
      tabContents.forEach((content) => content.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });

  // --- Modal Close Buttons ---
  if (addItemBtn)
    addItemBtn.addEventListener('click', () => showModal(addItemModal));
  if (addModalCloseBtn)
    addModalCloseBtn.addEventListener('click', () => hideModal(addItemModal));
  if (confirmCancelBtn)
    confirmCancelBtn.addEventListener('click', () => hideModal(confirmationModal));
  if (successOkayBtn)
    successOkayBtn.addEventListener('click', () => hideModal(successModal));
  
  if (editModalCloseBtn)
    editModalCloseBtn.addEventListener('click', () => hideModal(editItemModal)); 
  
  if (deleteCancelBtn)
    deleteCancelBtn.addEventListener('click', () => hideModal(deleteConfirmModal));
  
  // === CHANGE 2: Added listener for new 'X' button ===
  if (deleteModalCloseBtn)
    deleteModalCloseBtn.addEventListener('click', () => hideModal(deleteConfirmModal));

  // === CHANGE 1: This listener is for the white 'CANCEL' button in the edit modal ===
  if (editModalCancelBtn) {
    editModalCancelBtn.addEventListener('click', () => {
      hideModal(editItemModal);
    });
  }

  // --- Profile & Logout ---
  if (profileBtn && sidebar && sidebarCloseBtn) {
    profileBtn.addEventListener('click', () => sidebar.classList.add('active'));
    sidebarCloseBtn.addEventListener('click', () =>
      sidebar.classList.remove('active')
    );
  }

  if (logoutBtn)
    logoutBtn.addEventListener('click', () => (logoutModal.style.display = 'flex'));
  if (closeLogoutBtn)
    closeLogoutBtn.addEventListener('click', () => (logoutModal.style.display = 'none'));
  if (cancelLogoutBtn)
    cancelLogoutBtn.addEventListener('click', () => (logoutModal.style.display = 'none'));
  
  // === CHANGE 4: Pointed to logout.php ===
  if (confirmLogoutBtn) {
    confirmLogoutBtn.addEventListener('click', () => {
      window.location.href = 'logout.php'; // Updated to logout.php
    });
  }
  if (logoutModal) {
    logoutModal.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        logoutModal.style.display = 'none';
      }
    });
  }

  // --- Filters ---
  if (searchInput) searchInput.addEventListener('input', renderInventoryTable);
  if (categoryFilter)
    categoryFilter.addEventListener('change', renderInventoryTable);
  if (statusFilter) statusFilter.addEventListener('change', renderInventoryTable);

  if (searchInputHistory)
    searchInputHistory.addEventListener('input', renderHistoryTable);
  if (categoryFilterHistory)
    categoryFilterHistory.addEventListener('change', renderHistoryTable);
  if (statusFilterHistory)
    statusFilterHistory.addEventListener('change', renderHistoryTable);

  // --- Refresh Button ---
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      categoryFilter.value = '';
      statusFilter.value = '';
      searchInput.value = '';
      fetchInventory(); 
      alert('Data refreshed!');
    });
  }

  // --- Download CSV Buttons ---
  function downloadCSV(data, headersMap, filename) {
    const headers = Object.keys(headersMap);
    const keys = Object.values(headersMap);

    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        keys
          .map((key) => {
            let val = row[key];
            if (val === null || val === undefined) {
              val = "N/A";
            }
            if (typeof val === 'string') {
              val = val.replace(/"/g, '""');
              if (val.includes(',')) {
                val = `"${val}"`;
              }
            }
            return val;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (downloadBtnRequests) {
    downloadBtnRequests.addEventListener('click', () => {
      const headersMap = {
        'ID': 'ItemID',
        'Name': 'ItemName',
        'Category': 'Category',
        'Quantity': 'ItemQuantity',
        'Description': 'ItemDescription',
        'Status': 'ItemStatus',
        'Damage': 'DamageItem',
        'Stock In Date': 'DateofStockIn',
        'Stock Out Date': 'DateofStockOut',
      };
      const category = categoryFilter.value.toLowerCase();
      const status = statusFilter.value.toLowerCase();
      const search = searchInput.value.toLowerCase();
      const filteredData = allInventoryData.filter((item) => {
          const matchCategory = !category || item.Category.toLowerCase() === category;
          const matchStatus = !status || item.ItemStatus.toLowerCase() === status;
          const matchSearch = !search || item.ItemName.toLowerCase().includes(search) || item.ItemID.toString().includes(search);
          return matchCategory && matchStatus && matchSearch;
      });
      downloadCSV(filteredData, headersMap, 'inventory-stocks');
    });
  }

  if (downloadBtnHistory) {
    downloadBtnHistory.addEventListener('click', () => {
      const headersMap = {
        'Log ID': 'InvLogID',
        'Name': 'ItemName',
        'Category': 'Category',
        'Current Quantity': 'ItemQuantity',
        'Quantity Change': 'QuantityChange',
        'Status': 'ItemStatus',
        'Damage': 'DamageItem',
        'Stock In Date': 'DateofStockIn',
        'Stock Out Date': 'DateofStockOut',
        'Action': 'ActionType',
        'Performed By': 'PerformedBy',
      };
      const category = categoryFilterHistory.value.toLowerCase();
      const status = statusFilterHistory.value.toLowerCase();
      const search = searchInputHistory.value.toLowerCase();
      const filteredData = allHistoryData.filter((log) => {
          const matchCategory = !category || log.Category.toLowerCase() === category;
          const matchStatus = !status || log.ItemStatus.toLowerCase() === status;
          const matchSearch = !search || log.ItemName.toLowerCase().includes(search) || log.InvLogID.toString().includes(search) || log.PerformedBy.toLowerCase().includes(search);
          return matchCategory && matchStatus && matchSearch;
      });
      downloadCSV(filteredData, headersMap, 'inventory-history');
    });
  }

  // ======================================================
  // === INITIAL PAGE LOAD
  // ======================================================
  
  async function initializePage() {
    try {
      await fetchCategories();
      await fetchInventory();
      fetchHistory();
    } catch (error) {
      handleError("A critical error occurred while loading the page: " + error.message);
    }
  }
  
  initializePage();
});