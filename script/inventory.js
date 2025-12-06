function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Dropdown toggle function
window.toggleActionDropdown = function(event) {
    event.stopPropagation();
    const button = event.currentTarget;
    const dropdown = button.nextElementSibling;
    const isOpen = dropdown.classList.contains('show');
    
    // Close all other dropdowns
    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
        menu.classList.remove('show');
    });
    
    // Toggle current dropdown
    if (!isOpen) {
        // Get button position
        const rect = button.getBoundingClientRect();
        const dropdownHeight = 80; // Approximate height of dropdown
        const spaceBelow = window.innerHeight - rect.bottom;
        
        // Position dropdown
        if (spaceBelow < dropdownHeight) {
            // Open upward
            dropdown.style.bottom = (window.innerHeight - rect.top) + 'px';
            dropdown.style.top = 'auto';
        } else {
            // Open downward
            dropdown.style.top = (rect.bottom + 4) + 'px';
            dropdown.style.bottom = 'auto';
        }
        dropdown.style.left = (rect.right - 120) + 'px'; // Align to right of button
        
        dropdown.classList.add('show');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', (event) => {
    if (!event.target.closest('.action-dropdown')) {
        document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
            menu.classList.remove('show');
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
  // ======================================================
  // === 1. INJECT TOAST CSS STYLES
  // ======================================================
  const style = document.createElement('style');
  style.innerHTML = `
    .toast-notification {
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #28a745; /* Green Background */
      color: white;
      padding: 12px 24px;
      border-radius: 5px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.15);
      z-index: 9999;
      opacity: 0;
      transform: translateY(-20px);
      transition: all 0.3s ease-in-out;
      font-family: 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .toast-notification.show {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);

  // ======================================================
  // === GLOBAL VARIABLES
  // ======================================================
  let allInventoryData = [];
  let allHistoryData = [];
  let currentEditItemId = null;

  // Pagination State
  let currentPages = {
    requests: 1,
    history: 1
  };
  const rowsPerPage = 10;

  // Sorting State
  let sortState = {
    requests: {
      column: 'ItemName',
      direction: 'asc'
    },
    history: {
      column: 'DateofRelease',
      direction: 'desc'
    }
  };

  // ======================================================
  // === ELEMENT SELECTORS
  // ======================================================
  const requestsTableBody = document.getElementById('requestsTableBody');
  const historyTableBody = document.getElementById('historyTableBody');

  const tabBtns = document.querySelectorAll('.tabBtn');
  const tabContents = document.querySelectorAll('.tabContent');

  // Filter & Search Selectors
  const categoryFilter = document.getElementById('floorFilter');
  const statusFilter = document.getElementById('roomFilter');
  const searchInput = document.getElementById('searchInput');

  const categoryFilterHistory = document.getElementById('floorFilterHistory');
  const statusFilterHistory = document.getElementById('roomFilterHistory');
  const searchInputHistory = document.getElementById('historySearchInput');

  // Buttons
  const refreshBtn = document.getElementById('refreshBtn');
  const refreshBtnHistory = document.getElementById('refreshBtnHistory');
  const downloadBtnRequests = document.getElementById('downloadBtnRequests');
  const downloadBtnHistory = document.getElementById('downloadBtn');

  // Modals
  const addItemModal = document.getElementById('add-item-modal');
  const confirmationModal = document.getElementById('confirmation-modal');
  const successModal = document.getElementById('success-modal');
  const editItemModal = document.getElementById('edit-item-modal');
  const deleteConfirmModal = document.getElementById('delete-confirm-modal');
  const restoreConfirmModal = document.getElementById('restore-confirm-modal'); 

  // Forms & Inputs
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
  const editItemThresholdInput = document.getElementById('edit-item-threshold'); 

  const editModalCancelBtn = document.getElementById('edit-modal-cancel-btn');

  const deleteCancelBtn = document.getElementById('delete-cancel-btn');
  const deleteConfirmBtn = document.getElementById('delete-confirm-btn');
  const deleteModalCloseBtn = document.getElementById('delete-modal-close-btn');

  const restoreCancelBtn = document.getElementById('restore-cancel-btn');
  const restoreConfirmBtn = document.getElementById('restore-confirm-btn');
  const restoreModalCloseBtn = document.getElementById('restore-modal-close-btn');

  // Sidebar / Auth
  const profileBtn = document.getElementById('profileBtn');
  const sidebar = document.getElementById('profile-sidebar');
  const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
  const logoutBtn = document.getElementById('logoutBtn');
  const logoutModal = document.getElementById('logoutModal');
  const closeLogoutBtn = document.getElementById('closeLogoutBtn');
  const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
  const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

// ======================================================
  // === HELPER FUNCTIONS (Toast & Modals)
  // ======================================================

  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.innerText = message;
    toast.style.fontFamily = "'Segoe UI', sans-serif";
    toast.style.fontSize = '14px';
    
    if (type === 'error') {
        toast.style.backgroundColor = '#dc3545';
    } else {
        toast.style.backgroundColor = '#28a745';
    }
    
    toast.style.color = 'white';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '5px';
    toast.style.boxShadow = '0 4px 6px rgba(0,0,0,0.15)';
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.zIndex = '99999';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.pointerEvents = 'none';

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px)';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  };

  const showModal = (modal) => {
    if (modal) {
      if (modal.classList.contains('modalBackdrop')) {
        modal.style.display = 'flex';
      } else if (modal.classList.contains('modal-overlay') ||
        modal.classList.contains('modal-overlay-confirm') ||
        modal.classList.contains('modal-overlay-success')) {
        modal.classList.add('show-modal');
      }
    }
  };

  const hideModal = (modal) => {
    if (modal) {
      if (modal.classList.contains('modalBackdrop')) {
        modal.style.display = 'none';
      } else if (modal.classList.contains('modal-overlay') ||
        modal.classList.contains('modal-overlay-confirm') ||
        modal.classList.contains('modal-overlay-success')) {
        modal.classList.remove('show-modal');
      }
    }
  };

  const handleError = (message) => {
    console.error(message);
    alert(message);
  };

  // ======================================================
  // === PAGINATION & SORTING FUNCTIONS
  // ======================================================

  function setupPagination(totalItems, containerId, currentPage) {
    const paginationContainer = document.getElementById(containerId);
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';
    const totalPages = Math.ceil(totalItems / rowsPerPage);

    const recordsInfo = document.createElement('span');
    recordsInfo.className = 'paginationInfo';

    let start, end;
    if (totalItems === 0) {
      start = 0;
      end = 0;
    } else {
      start = (currentPage - 1) * rowsPerPage + 1;
      end = Math.min(start + rowsPerPage - 1, totalItems);
    }

    recordsInfo.textContent = `Displaying ${start}-${end} of ${totalItems} Records`;
    paginationContainer.appendChild(recordsInfo);

    if (totalPages <= 1) {
      return;
    }

    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'paginationControls';

    const prevButton = document.createElement('button');
    prevButton.className = 'paginationBtn';
    prevButton.innerHTML = '&lt;';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
      if (containerId.includes('stocks')) currentPages.requests--;
      if (containerId.includes('history')) currentPages.history--;
      renderInventoryTable();
      renderHistoryTable();
    });
    controlsDiv.appendChild(prevButton);

    const pageNumbers = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      pageNumbers.push(1);
      if (currentPage > 3) pageNumbers.push('...');
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      if (currentPage <= 2) end = 3;
      if (currentPage >= totalPages - 1) start = totalPages - 2;
      for (let i = start; i <= end; i++) pageNumbers.push(i);
      if (currentPage < totalPages - 2) pageNumbers.push('...');
      pageNumbers.push(totalPages);
    }

    pageNumbers.forEach(num => {
      if (num === '...') {
        const span = document.createElement('span');
        span.className = 'paginationDots';
        span.textContent = '...';
        controlsDiv.appendChild(span);
      } else {
        const button = document.createElement('button');
        button.className = 'paginationBtn';
        button.textContent = num;
        if (num === currentPage) button.classList.add('active');
        button.addEventListener('click', () => {
          if (containerId.includes('stocks')) currentPages.requests = num;
          if (containerId.includes('history')) currentPages.history = num;
          renderInventoryTable();
          renderHistoryTable();
        });
        controlsDiv.appendChild(button);
      }
    });

    const nextButton = document.createElement('button');
    nextButton.className = 'paginationBtn';
    nextButton.innerHTML = '&gt;';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
      if (containerId.includes('stocks')) currentPages.requests++;
      if (containerId.includes('history')) currentPages.history++;
      renderInventoryTable();
      renderHistoryTable();
    });
    controlsDiv.appendChild(nextButton);

    paginationContainer.appendChild(controlsDiv);
  }

  function parseDateWhen(dateStr, defaultVal) {
    if (!dateStr) return defaultVal;
    try {
      return new Date(dateStr).getTime();
    } catch (e) {
      return defaultVal;
    }
  }

  function sortData(data, column, direction) {
    data.sort((a, b) => {
      let valA = a[column];
      let valB = b[column];

      if (column === 'ItemID' || column === 'ItemQuantity' ||
        column === 'InvLogID' || column === 'QuantityChange' ||
        column === 'OldQuantity' || column === 'NewQuantity') {
        valA = parseFloat(valA) || 0;
        valB = parseFloat(valB) || 0;
      }

      if (column === 'DateofStockIn' || column === 'DateofRelease') {
        valA = parseDateWhen(valA, null);
        valB = parseDateWhen(valB, null);
      }

      if (typeof valA === 'string') {
        valA = (valA || "").toLowerCase();
        valB = (valB || "").toLowerCase();
      }

      if (valA === null || valA === undefined) valA = direction === 'asc' ? Infinity : -Infinity;
      if (valB === null || valB === undefined) valB = direction === "asc" ? Infinity : -Infinity;

      let comparison = 0;
      if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }

      return direction === 'asc' ? comparison : -comparison;
    });
  }

  function updateSortHeaders(tabId, {
    column,
    direction
  }) {
    const tab = document.getElementById(tabId);
    if (!tab) return;

    tab.querySelectorAll('th.sortable').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
    });

    const activeHeader = tab.querySelector(`th[data-sort="${column}"]`);
    if (activeHeader) {
      activeHeader.classList.add(direction === 'asc' ? 'sort-asc' : 'sort-desc');
    }
  }

  // ======================================================
  // === DATA FETCHING
  // ======================================================

  function populateFilterDropdown(data, dropdown) {
      if (!dropdown) return;
      
      const currentValue = dropdown.value;
      
      const categories = [...new Set(data.map(item => item.Category))].filter(c => c).sort();

      while (dropdown.options.length > 1) {
          dropdown.remove(1);
      }

      categories.forEach(cat => {
          const option = document.createElement('option');
          option.value = cat;
          option.textContent = cat;
          dropdown.appendChild(option);
      });
      
      dropdown.value = currentValue;
  }

  async function fetchInventory() {
    try {
      // Show loading
      if(requestsTableBody) {
          requestsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Loading items...</td></tr>';
      }

      const response = await fetch('inventory_actions.php?action=get_inventory');
      if (!response.ok) throw new Error('Network response was not ok.');
      const items = await response.json();

      if (items.error) {
        handleError(items.error);
        allInventoryData = [];
      } else {
        allInventoryData = items;
        renderInventoryTable();
        populateFilterDropdown(allInventoryData, categoryFilter);
      }
    } catch (error) {
      handleError('Error fetching inventory: ' + error.message);
      requestsTableBody.innerHTML =
        '<tr><td colspan="7" class="no-data-cell">Error loading data.</td></tr>'; 
    }
  }

  async function fetchHistory() {
    try {
      // Show loading
      if(historyTableBody) {
          historyTableBody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">Loading history...</td></tr>';
      }

      const response = await fetch('inventory_actions.php?action=get_history');
      if (!response.ok) throw new Error('Network response was not ok.');
      const logs = await response.json();

      if (logs.error) {
        handleError(logs.error);
        allHistoryData = [];
      } else {
        allHistoryData = logs;
        renderHistoryTable();
        populateFilterDropdown(allHistoryData, categoryFilterHistory);
      }
    } catch (error) {
      handleError('Error fetching history: ' + error.message);
      historyTableBody.innerHTML =
        '<tr><td colspan="9" class="no-data-cell">Error loading data.</td></tr>';
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

      addCategorySelect.innerHTML = '<option value="" disabled selected>Select a category</option>';
      editCategorySelect.innerHTML = '';

      categories.forEach((category) => {
        if (category.is_archived != 1) {
            const optionForForm = document.createElement('option');
            optionForForm.value = category.ItemCategoryID;
            optionForForm.textContent = category.ItemCategoryName;

            addCategorySelect.appendChild(optionForForm.cloneNode(true));
            editCategorySelect.appendChild(optionForForm.cloneNode(true));
        }
      });
    } catch (error) {
      handleError('Error fetching categories: ' + error.message);
    }
  }

  // ======================================================
  // === RENDER & FILTER FUNCTIONS
  // ======================================================

 function renderInventoryTable() {
    const category = categoryFilter.value.toLowerCase();
    const status = statusFilter.value.toLowerCase();
    const search = searchInput.value.toLowerCase();

    const filteredData = allInventoryData.filter((item) => {
      const itemIsArchived = parseInt(item.is_archived) === 1;
      
      if (status === 'archived') {
          if (!itemIsArchived) return false; 
      } else {
          if (itemIsArchived) return false; 
          
          if (status && item.ItemStatus.toLowerCase() !== status) return false;
      }

      const matchCategory = !category || item.Category.toLowerCase() === category;
      const matchSearch =
        !search ||
        item.ItemName.toLowerCase().includes(search) ||
        item.ItemID.toString().includes(search);

      return matchCategory && matchSearch;
    });

    const { column, direction } = sortState.requests;
    sortData(filteredData, column, direction);

    const page = currentPages.requests;
    const totalItems = filteredData.length;
    setupPagination(totalItems, 'pagination-stocks', page);

    if (totalItems === 0) {
      requestsTableBody.innerHTML =
        '<tr><td colspan="7" class="no-data-cell">No inventory items found</td></tr>'; 
      return;
    }

    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    requestsTableBody.innerHTML = paginatedData
      .map((item) => {
        const badgeClass = item.ItemStatus.toLowerCase().replace(/\s+/g, '-');
        const isArchived = parseInt(item.is_archived) === 1;
        
        let actionButtons = '';
        
        // Three-dot dropdown menu
        if (isArchived) {
            actionButtons = `
                <div class="action-dropdown">
                    <button class="action-dots-btn" onclick="toggleActionDropdown(event)">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="dropdown-menu">
                        <button class="dropdown-item restore-btn" data-id="${item.ItemID}">
                            <i class="fas fa-trash-restore"></i> Restore
                        </button>
                    </div>
                </div>
            `;
        } else {
            actionButtons = `
                <div class="action-dropdown">
                    <button class="action-dots-btn" onclick="toggleActionDropdown(event)">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="dropdown-menu">
                        <button class="dropdown-item edit-btn" data-id="${item.ItemID}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="dropdown-item delete delete-btn" data-id="${item.ItemID}">
                            <i class="fas fa-archive"></i> Archive
                        </button>
                    </div>
                </div>
            `;
        }

        return `
        <tr>
          <td>${escapeHtml(item.ItemName)}</td>
          <td>${escapeHtml(item.Category)}</td>
          <td>${escapeHtml(item.ItemQuantity)}</td>
          <td>${escapeHtml(item.ItemDescription || 'N/A')}</td>
          <td><span class="statusBadge ${badgeClass}">${escapeHtml(item.ItemStatus)}</span></td>
          <td>${escapeHtml(item.DateofStockIn)}</td>
          <td class="action-cell">
              ${actionButtons}
          </td>
        </tr>
      `;
      })
      .join('');

    updateSortHeaders('requests-tab', sortState.requests);

    // --- UPDATED LISTENERS: use e.currentTarget to safely get dataset ---
    document.querySelectorAll('#requestsTableBody .edit-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const itemId = parseInt(e.currentTarget.dataset.id);
          const itemToEdit = allInventoryData.find((i) => i.ItemID == itemId);
          if (itemToEdit) openEditModal(itemToEdit);
        });
      });

    document.querySelectorAll('#requestsTableBody .delete-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const itemId = parseInt(e.currentTarget.dataset.id);
          currentEditItemId = itemId;
          showModal(deleteConfirmModal);
        });
      });
      
    document.querySelectorAll('#requestsTableBody .restore-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const itemId = parseInt(e.currentTarget.dataset.id);
          currentEditItemId = itemId; 
          showModal(restoreConfirmModal);
        });
      });
  }

function renderHistoryTable() {
    const category = categoryFilterHistory.value.toLowerCase();
    const status = statusFilterHistory.value.toLowerCase();
    const search = searchInputHistory.value.toLowerCase();

    const filteredData = allHistoryData.filter((log) => {
      const matchCategory =
        !category || (log.Category && log.Category.toLowerCase() === category);
      const matchStatus = !status || (log.ItemStatus && log.ItemStatus.toLowerCase() === status);
      const matchSearch =
        !search ||
        (log.ItemName && log.ItemName.toLowerCase().includes(search)) ||
        (log.InvLogID && log.InvLogID.toString().includes(search)) ||
        (log.PerformedBy && log.PerformedBy.toLowerCase().includes(search));
      return matchCategory && matchStatus && matchSearch;
    });

    const { column, direction } = sortState.history;
    sortData(filteredData, column, direction);

    const page = currentPages.history;
    const totalItems = filteredData.length;
    setupPagination(totalItems, 'pagination-history', page);

    if (totalItems === 0) {
      historyTableBody.innerHTML =
        '<tr><td colspan="9" class="no-data-cell">No history found</td></tr>';
      return;
    }

    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    historyTableBody.innerHTML = paginatedData
      .map(
        (log) => {
          let quantityChangeText = log.QuantityChange;
          let changeClass = '';
          const changeAmount = parseInt(log.QuantityChange, 10);

          if (changeAmount > 0) {
            quantityChangeText = `+${changeAmount}`;
            changeClass = 'text-success';
          } else if (changeAmount < 0) {
            quantityChangeText = `${changeAmount}`;
            changeClass = 'text-danger';
          } else {
            quantityChangeText = '0';
          }

          const oldQty = (log.OldQuantity === null || log.OldQuantity === undefined) ? 'N/A' : log.OldQuantity;
          const newQty = (log.NewQuantity === null || log.NewQuantity === undefined) ? 'N/A' : log.NewQuantity;

          return `
            <tr>
              <td>${escapeHtml(log.InvLogID)}</td>
              <td>${escapeHtml(log.ItemName)}</td>
              <td>${escapeHtml(log.Category)}</td>
              <td>${escapeHtml(oldQty)}</td>
              <td class="${changeClass}">${escapeHtml(quantityChangeText)}</td>
              <td>${escapeHtml(newQty)}</td>
              <td>${escapeHtml(log.ItemStatus)}</td>
              <td>${escapeHtml(log.DateofStockIn || 'N/A')}</td>
              <td>${escapeHtml(log.PerformedBy)}</td>
            </tr>
          `;
        }
      )
      .join('');

    updateSortHeaders('history-tab', sortState.history);
  }

  // ======================================================
  // === MODAL & FORM LOGIC
  // ======================================================

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
    formData.append('low_stock_threshold', document.getElementById('item-threshold').value); // Append Threshold
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
        document.getElementById('item-threshold').value = 10; 
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

  function openEditModal(item) {
    currentEditItemId = item.ItemID;
    editItemIdSpan.textContent = item.ItemID;
    editItemIdInput.value = item.ItemID;
    document.getElementById('edit-item-name').value = item.ItemName;
    editCategorySelect.value = item.ItemCategoryID;
    document.getElementById('edit-item-description').value = item.ItemDescription;
    editItemThresholdInput.value = item.LowStockThreshold || 10; 
    editStockInput.value = '';
    document.getElementById('edit-item-current-qty').textContent = item.ItemQuantity;

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
    formData.append('low_stock_threshold', editItemThresholdInput.value); 
    const stockToAdd = editStockInput.value || 0;
    formData.append('stock_adjustment', stockToAdd);

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
        showToast('Item archived successfully.', 'success'); 
      } else {
        throw new Error(result.error || 'Failed to delete item.');
      }
    } catch (error) {
      handleError('Error archiving item: ' + error.message);
    }
  });

  // ======================================================
  // === EVENT LISTENERS
  // ======================================================

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      tabBtns.forEach((b) => b.classList.remove('active'));
      tabContents.forEach((content) => content.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`${tabName}-tab`).classList.add('active');

      currentPages.requests = 1;
      currentPages.history = 1;
    });
  });

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

  if (deleteModalCloseBtn)
    deleteModalCloseBtn.addEventListener('click', () => hideModal(deleteConfirmModal));

  if (editModalCancelBtn) {
    editModalCancelBtn.addEventListener('click', () => {
      hideModal(editItemModal);
    });
  }

  if (restoreCancelBtn) restoreCancelBtn.addEventListener('click', () => hideModal(restoreConfirmModal));
  if (restoreModalCloseBtn) restoreModalCloseBtn.addEventListener('click', () => hideModal(restoreConfirmModal));

  if (restoreConfirmBtn) {
      restoreConfirmBtn.addEventListener('click', async () => {
        if (!currentEditItemId) return;

        const formData = new FormData();
        formData.append('item_id', currentEditItemId);

        try {
          const response = await fetch('inventory_actions.php?action=restore_item', {
            method: 'POST',
            body: formData,
          });
          const result = await response.json();

          hideModal(restoreConfirmModal);

          if (result.success) {
            fetchInventory();
            fetchHistory();
            showToast('Item restored successfully.', 'success');
          } else {
            throw new Error(result.error || 'Failed to restore item.');
          }
        } catch (error) {
          handleError('Error restoring item: ' + error.message);
        }
      });
  }

  if (profileBtn && sidebar && sidebarCloseBtn) {
    profileBtn.addEventListener('click', () => sidebar.classList.add('active'));
    sidebarCloseBtn.addEventListener('click', () =>
      sidebar.classList.remove('active')
    );
  }

  if (logoutBtn)
    logoutBtn.addEventListener('click', () => showModal(logoutModal));
  if (closeLogoutBtn)
    closeLogoutBtn.addEventListener('click', () => hideModal(logoutModal));
  if (cancelLogoutBtn)
    cancelLogoutBtn.addEventListener('click', () => hideModal(logoutModal));

  if (confirmLogoutBtn) {
    confirmLogoutBtn.addEventListener('click', () => {
      window.location.href = 'logout.php';
    });
  }
  if (logoutModal) {
    logoutModal.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        hideModal(logoutModal);
      }
    });
  }

  if (searchInput) searchInput.addEventListener('input', () => {
    currentPages.requests = 1;
    renderInventoryTable();
  });
  if (categoryFilter) categoryFilter.addEventListener('change', () => {
    currentPages.requests = 1;
    renderInventoryTable();
  });
  if (statusFilter) statusFilter.addEventListener('change', () => {
    currentPages.requests = 1;
    renderInventoryTable();
  });

  if (searchInputHistory) searchInputHistory.addEventListener('input', () => {
    currentPages.history = 1;
    renderHistoryTable();
  });
  if (categoryFilterHistory) categoryFilterHistory.addEventListener('change', () => {
    currentPages.history = 1;
    renderHistoryTable();
  });
  if (statusFilterHistory) statusFilterHistory.addEventListener('change', () => {
    currentPages.history = 1;
    renderHistoryTable();
  });

  if (refreshBtn) {
    // UPDATED REFRESH LOGIC FOR INVENTORY ITEMS
    refreshBtn.addEventListener('click', async () => {
      categoryFilter.value = '';
      statusFilter.value = '';
      searchInput.value = '';
      currentPages.requests = 1;
      
      // Also reload data from server to be "just like in admin"
      await fetchCategories();
      await fetchInventory(); 
      showToast('Data refreshed successfully!');
    });
  }

  if (refreshBtnHistory) {
    // UPDATED REFRESH LOGIC FOR HISTORY
    refreshBtnHistory.addEventListener('click', async () => {
      categoryFilterHistory.value = '';
      statusFilterHistory.value = '';
      searchInputHistory.value = '';
      currentPages.history = 1;
      
      await fetchHistory();
      showToast('History data refreshed!');
    });
  }


  if (downloadBtnRequests) {
    downloadBtnRequests.addEventListener('click', () => {
      const category = categoryFilter.value.toLowerCase();
      const status = statusFilter.value.toLowerCase();
      const search = searchInput.value.toLowerCase();
      const filteredData = allInventoryData.filter((item) => {
        const matchCategory = !category || item.Category.toLowerCase() === category;
        const matchStatus = !status || item.ItemStatus.toLowerCase() === status;
        const matchSearch = !search || item.ItemName.toLowerCase().includes(search) || item.ItemID.toString().includes(search);
        return matchCategory && matchStatus && matchSearch;
      });

      const {
        column,
        direction
      } = sortState.requests;
      sortData(filteredData, column, direction);

      const headers = ['ID', 'Name', 'Category', 'Qty', 'Description', 'Status', 'Stock In'];
      const tableData = filteredData.map(item => [
        item.ItemID, item.ItemName, item.Category, item.ItemQuantity, 
        item.ItemDescription || '', item.ItemStatus, item.DateofStockIn || 'N/A'
      ]);

      if (typeof downloadData === 'function') {
        downloadData(headers, tableData, 'Inventory Stocks Report', 'inventory-stocks');
      } else {
        alert('Download utility not available. Please refresh the page.');
      }
    });
  }

  if (downloadBtnHistory) {
    downloadBtnHistory.addEventListener('click', () => {
      const category = categoryFilterHistory.value.toLowerCase();
      const status = statusFilterHistory.value.toLowerCase();
      const search = searchInputHistory.value.toLowerCase();
      const filteredData = allHistoryData.filter((log) => {
        const matchCategory = !category || (log.Category && log.Category.toLowerCase() === category);
        const matchStatus = !status || (log.ItemStatus && log.ItemStatus.toLowerCase() === status);
        const matchSearch = !search ||
          (log.ItemName && log.ItemName.toLowerCase().includes(search)) ||
          (log.InvLogID && log.InvLogID.toString().includes(search)) ||
          (log.PerformedBy && log.PerformedBy.toLowerCase().includes(search));
        return matchCategory && matchStatus && matchSearch;
      });

      const {
        column,
        direction
      } = sortState.history;
      sortData(filteredData, column, direction);

      const headers = ['Log ID', 'Name', 'Category', 'Old Qty', 'Change', 'New Qty', 'Status', 'Stock In', 'Performed By'];
      const tableData = filteredData.map(log => [
        log.InvLogID, log.ItemName, log.Category, log.OldQuantity, 
        log.QuantityChange, log.NewQuantity, log.ItemStatus, 
        log.DateofStockIn || 'N/A', log.PerformedBy
      ]);

      if (typeof downloadData === 'function') {
        downloadData(headers, tableData, 'Inventory History Report', 'inventory-history');
      } else {
        alert('Download utility not available. Please refresh the page.');
      }
    });
  }

  const accountDetailsLink = document.getElementById('account-details-link');
  if (accountDetailsLink) {
    accountDetailsLink.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Account Details modal not implemented in this module.');
    });
  }

  function setupSortListeners() {
    document.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const column = th.dataset.sort;
        const activeTab = document.querySelector('.tabBtn.active').getAttribute('data-tab');
        const stateKey = activeTab === 'requests' ? 'requests' : 'history';

        if (!sortState[stateKey]) return;

        const currentSort = sortState[stateKey];
        let direction = 'asc';

        if (currentSort.column === column) {
          direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        }

        sortState[stateKey] = {
          column,
          direction
        };

        currentPages[stateKey] = 1;

        if (activeTab === 'requests') {
          renderInventoryTable();
        } else {
          renderHistoryTable();
        }
      });
    });
  }

  async function initializePage() {
    try {
      setupSortListeners();
      await fetchCategories();
      await fetchInventory();
      fetchHistory();
    } catch (error) {
      handleError("A critical error occurred while loading the page: " + error.message);
    }
  }

  initializePage();
});