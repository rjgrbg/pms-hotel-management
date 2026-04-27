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
    history: 1,
    
  };
  const rowsPerPage = 10;

  // Sorting State
  let sortState = {
    requests: {
      column: 'ItemStatus', // Change default sort to Status
      direction: 'asc'      // 'asc' sorts 1 to 5 (Out of Stock -> Critical -> Threshold -> In Stock)
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
  const typeFilter = document.getElementById('typeFilter');     
  const typeFilterHistory = document.getElementById('typeFilterHistory');
  
  // FIX: Look for category/status IDs, fallback to floor/room if needed so it doesn't crash
  const categoryFilter = document.getElementById('categoryFilter') || document.getElementById('floorFilter');
  const statusFilter = document.getElementById('statusFilter') || document.getElementById('roomFilter');
  const searchInput = document.getElementById('searchInput');

  const categoryFilterHistory = document.getElementById('categoryFilterHistory') || document.getElementById('floorFilterHistory');
  const statusFilterHistory = document.getElementById('statusFilterHistory') || document.getElementById('roomFilterHistory');
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
    // Hide all open dropdowns when modal opens
    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
      menu.classList.remove('show');
    });
    
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
    // Remove the annoying double "Error: Error:" prefix if it exists
    const cleanMessage = message.replace('Error updating item: Error: ', 'Error: ');
    showToast(cleanMessage, 'error');
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

      // Number Sorting
      if (['ItemID', 'ItemQuantity', 'InvLogID', 'QuantityChange', 'OldQuantity', 'NewQuantity', 'UnitCost', 'TotalValue', 'StockLimit'].includes(column)) {
        valA = parseFloat(valA) || 0;
        valB = parseFloat(valB) || 0;
      }

      // Date Sorting
      if (['DateofStockIn', 'DateofRelease', 'ExpirationDate', 'RestockDate'].includes(column)) {
        valA = parseDateWhen(valA, null);
        valB = parseDateWhen(valB, null);
      }

      // === NEW: Custom Severity Sorting for Status ===
      if (column === 'ItemStatus') {
          const statusRank = {
              'out of stock': 1,
              'critical': 2,
              'low stock': 2, // Fallback for old data
              'threshold': 3,
              'in stock': 4,
              'archived': 5
          };
          valA = statusRank[(valA || '').toLowerCase()] || 99;
          valB = statusRank[(valB || '').toLowerCase()] || 99;
      } else if (typeof valA === 'string') {
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
      if (historyTableBody) {
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

        // ======================================================
        // === USE DATABASE VALUES FOR OLD & NEW QTY
        // ======================================================
        // The database query already calculates OldQuantity and NewQuantity
        // OldQuantity = quantity before the transaction
        // NewQuantity = cumulative quantity after the transaction
        allHistoryData.forEach(log => {
            log.calculatedOldQty = parseFloat(log.OldQuantity || 0);
            log.calculatedNewQty = parseFloat(log.NewQuantity || 0);
        });
        // ======================================================
        // === END FIX
        // ======================================================

        renderHistoryTable();
      }
    } catch (error) {
      handleError('Error fetching history: ' + error.message);
      historyTableBody.innerHTML =
        '<tr><td colspan="9" class="no-data-cell">Error loading data.</td></tr>';
    }
  }

  async function fetchCategories() {
      // Disabled: The new Smart Filter and fetchCategoryBudgets handle this perfectly now!
  }

  // ======================================================
  // === RENDER & FILTER FUNCTIONS
  // ======================================================

 function renderInventoryTable() {
    // FIX: Add safe checks (?) so it doesn't crash if an element is missing
    const type = typeFilter ? typeFilter.value.toLowerCase() : ''; 
    const category = categoryFilter ? categoryFilter.value.toLowerCase() : '';
    const status = statusFilter ? statusFilter.value.toLowerCase() : '';
    const search = searchInput ? searchInput.value.toLowerCase() : '';

    const filteredData = allInventoryData.filter((item) => {
      const itemIsArchived = parseInt(item.is_archived) === 1;
      // FIX: Add safety checks so blank database values don't crash the filters
      const itemStatus = item.ItemStatus ? item.ItemStatus.toLowerCase() : '';
      
      if (status === 'archived') {
          if (!itemIsArchived) return false; 
      } else {
          if (itemIsArchived) return false; 
          if (status && itemStatus !== status) return false;
      }

      const matchType = !type || (item.ItemType && item.ItemType.toLowerCase() === type); 
      const matchCategory = !category || (item.Category && item.Category.toLowerCase() === category);
      const matchSearch =
        !search ||
        (item.ItemName && item.ItemName.toLowerCase().includes(search)) ||
        (item.ItemID && item.ItemID.toString().includes(search));

      return matchType && matchCategory && matchSearch; 
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
        // === NEW DYNAMIC BADGE LOGIC ===
        let badgeClass = '';
        const statusLower = (item.ItemStatus || '').toLowerCase();
        if (statusLower === 'in stock') badgeClass = 'in-stock';
        else if (statusLower === 'out of stock') badgeClass = 'out-of-stock';
        else if (statusLower === 'critical' || statusLower === 'low stock') badgeClass = 'critical'; // Orange fallback for old data
        else if (statusLower === 'threshold') badgeClass = 'threshold'; // Yellow
        else if (statusLower === 'archived') badgeClass = 'archived';

        const isArchived = parseInt(item.is_archived) === 1;
        let actionButtons = '';

        if (isArchived) {
            actionButtons = `
                <div class="action-dropdown">
                    <button class="action-dots-btn" onclick="toggleActionDropdown(event)"><i class="fas fa-ellipsis-v"></i></button>
                    <div class="dropdown-menu">
                        <button class="dropdown-item restore-btn" data-id="${item.ItemID}"><i class="fas fa-trash-restore"></i> Restore</button>
                    </div>
                </div>`;
        } else {
            actionButtons = `
                <div class="action-dropdown">
                    <button class="action-dots-btn" onclick="toggleActionDropdown(event)"><i class="fas fa-ellipsis-v"></i></button>
                    <div class="dropdown-menu">
                        <button class="dropdown-item edit-btn" data-id="${item.ItemID}"><i class="fas fa-edit"></i> Edit</button>
                        <button class="dropdown-item delete delete-btn" data-id="${item.ItemID}"><i class="fas fa-archive"></i> Archive</button>
                    </div>
                </div>`;
        }

    return `
        <tr>  
          <td>${escapeHtml(item.ItemName)}</td>
          <td>${escapeHtml(item.ItemType || 'N/A')}</td>
          <td>${escapeHtml(item.Category)}</td>
          <td>${escapeHtml(item.ItemQuantity)}</td>
          <td>${item.ItemUnit ? escapeHtml(item.ItemUnit) : '<span style="color:#aaa;">N/A</span>'}</td>
          <td>₱${parseFloat(item.UnitCost || 0).toFixed(2)}</td>
          <td>₱${parseFloat(item.TotalValue || 0).toFixed(2)}</td>
          <td style="text-align: center;">${item.ExpirationDate ? escapeHtml(item.ExpirationDate) : '<span style="color:#aaa;">N/A</span>'}</td>
          <td style="text-align: center;">${item.RestockDate ? escapeHtml(item.RestockDate) : '<span style="color:#aaa;">N/A</span>'}</td>
          <td><span class="statusBadge ${badgeClass}">${escapeHtml(item.ItemStatus)}</span></td>
          <td class="action-cell">${actionButtons}</td>
        </tr>`;
      })
      .join('');
    
    updateSortHeaders('requests-tab', sortState.requests);

    // --- UPDATED LISTENERS: use e.currentTarget to safely get dataset ---
    
    // ADDED BACK: The Edit Button Listener
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
    // FIX: Add safe checks (?) 
    const type = typeFilterHistory ? typeFilterHistory.value.toLowerCase() : ''; 
    const category = categoryFilterHistory ? categoryFilterHistory.value.toLowerCase() : '';
    const status = statusFilterHistory ? statusFilterHistory.value.toLowerCase() : '';
    const search = searchInputHistory ? searchInputHistory.value.toLowerCase() : '';

    const filteredData = allHistoryData.filter((log) => {
      const matchType = !type || (log.ItemType && log.ItemType.toLowerCase() === type); // NEW
      const matchCategory = !category || (log.Category && log.Category.toLowerCase() === category);
      const matchStatus = !status || (log.ItemStatus && log.ItemStatus.toLowerCase() === status);
      const matchSearch =
        !search ||
        (log.ItemName && log.ItemName.toLowerCase().includes(search)) ||
        (log.InvLogID && log.InvLogID.toString().includes(search)) ||
        (log.PerformedBy && log.PerformedBy.toLowerCase().includes(search));
        
      return matchType && matchCategory && matchStatus && matchSearch; // UPDATED
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

          // === FIX: USE CALCULATED VALUES ===
          // Use the values we calculated in fetchHistory
          // If they don't exist (fallback), assume 0
          const oldQty = (log.calculatedOldQty !== undefined) ? log.calculatedOldQty : 0;
          const newQty = (log.calculatedNewQty !== undefined) ? log.calculatedNewQty : 0;
          // ==================================

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
// Handle Return Submission
  // Instantly update the budget display when picking a category
  // Instantly update the budget display and Auto-Select Type when picking a category
  document.getElementById('item-category')?.addEventListener('change', (e) => {
      const catId = e.target.value;
      const display = document.getElementById('add-modal-available-budget');
      if (display && categoryBudgets[catId] !== undefined) {
          display.textContent = '₱' + categoryBudgets[catId].toLocaleString('en-PH', {minimumFractionDigits: 2});
      }
      
      // --- NEW: Auto-select the Type! ---
      if (window.allSystemCategories) {
          const category = window.allSystemCategories.find(c => c.ItemCategoryID == catId);
          if (category && category.ItemType) {
              const typeDropdown = document.getElementById('item-type');
              if (typeDropdown.value !== category.ItemType) {
                  typeDropdown.value = category.ItemType; // Set the Type
                  if (typeof toggleAddExpiration === 'function') toggleAddExpiration(); // Trigger UI updates
              }
          }
      }
  });

  document.getElementById('edit-item-category')?.addEventListener('change', (e) => {
      const catId = e.target.value;
      const display = document.getElementById('edit-modal-available-budget');
      if (display && categoryBudgets[catId] !== undefined) {
          display.textContent = '₱' + categoryBudgets[catId].toLocaleString('en-PH', {minimumFractionDigits: 2});
      }
      
      // --- NEW: Auto-select the Type! ---
      if (window.allSystemCategories) {
          const category = window.allSystemCategories.find(c => c.ItemCategoryID == catId);
          if (category && category.ItemType) {
              const typeDropdown = document.getElementById('edit-item-type');
              if (typeDropdown.value !== category.ItemType) {
                  typeDropdown.value = category.ItemType; // Set the Type
                  if (typeof toggleEditExpiration === 'function') toggleEditExpiration(); // Trigger UI updates
              }
          }
      }
  });

 addItemForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // --- BUDGET HARD BLOCK ---
    const categoryId = document.getElementById('item-category').value;
    const qty = parseFloat(document.getElementById('item-quantity').value) || 0;
    const unitCost = parseFloat(document.getElementById('item-unit-cost').value) || 0;
    const totalPurchaseCost = qty * unitCost;
    const available = categoryBudgets[categoryId] || 0;

    if (totalPurchaseCost > available) {
        showToast(`Insufficient Budget! This purchase costs ₱${totalPurchaseCost.toLocaleString('en-PH', {minimumFractionDigits:2})}, but you only have ₱${available.toLocaleString('en-PH', {minimumFractionDigits:2})}.`, 'error');
        return; // PREVENTS MODAL FROM OPENING
    }
    // -------------------------

    if (addItemForm.checkValidity()) {
      // Check for duplicate item name (case-insensitive)
      const itemName = document.getElementById('item-name').value.trim().toLowerCase();
      const isDuplicate = allInventoryData.some(item => 
        item.ItemName.toLowerCase() === itemName && parseInt(item.is_archived) === 0
      );
      
      if (isDuplicate) {
        showToast('An item with this name already exists in the inventory.', 'error');
        return;
      }
      
      showModal(confirmationModal);
    } else {
      addItemForm.reportValidity();
    }
  });

  confirmAddBtn.addEventListener('click', async () => {
    // Prevent spam clicking
    if (confirmAddBtn.disabled) return;
    
    confirmAddBtn.disabled = true;
    confirmAddBtn.textContent = 'Adding...';
    
  const formData = new FormData();
    formData.append('name', document.getElementById('item-name').value);
    formData.append('type', document.getElementById('item-type').value);
    formData.append('category_id', document.getElementById('item-category').value);
    formData.append('description', document.getElementById('item-description').value);
    formData.append('quantity', document.getElementById('item-quantity').value);
    formData.append('unit', document.getElementById('item-unit').value);
    formData.append('unit_cost', document.getElementById('item-unit-cost').value);
    formData.append('stock_limit', document.getElementById('item-limit').value);
    formData.append('stock_in_date', document.getElementById('stock-in-date').value);
    formData.append('expiration_date', document.getElementById('item-expiration').value);

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
    } finally {
      // Re-enable button after request completes
      confirmAddBtn.disabled = false;
      confirmAddBtn.textContent = 'Confirm';
    }
  });

function openEditModal(item) {
    currentEditItemId = item.ItemID;
    editItemIdSpan.textContent = item.ItemID;
    editItemIdInput.value = item.ItemID;
    document.getElementById('edit-item-name').value = item.ItemName;
    document.getElementById('edit-item-type').value = item.ItemType || 'Consumables';
    
    // --- FIX: Filter the categories instantly to match the Type BEFORE setting the category! ---
    if(window.filterCategoriesByType) {
        window.filterCategoriesByType('edit-item-type', 'edit-item-category');
    }
    
    editCategorySelect.value = item.ItemCategoryID;
    document.getElementById('edit-item-description').value = item.ItemDescription;
    document.getElementById('edit-item-unit').value = item.ItemUnit || ''; 
    document.getElementById('edit-item-unit-cost').value = item.UnitCost || '0.00'; 
    document.getElementById('edit-item-limit').value = item.StockLimit || 1; 
    document.getElementById('edit-item-expiration').value = item.ExpirationDate || ''; 
    editStockInput.value = '';
    document.getElementById('edit-item-current-qty').textContent = item.ItemQuantity;
    
    // Trigger the toggle to show/hide the expiration field based on type
    if(typeof toggleEditExpiration === 'function') toggleEditExpiration(); 

    // Fetch the correct budget to display as soon as modal opens
    const editDisplay = document.getElementById('edit-modal-available-budget');
    if(editDisplay) {
        editDisplay.textContent = '₱' + (categoryBudgets[item.ItemCategoryID] || 0).toLocaleString('en-PH', {minimumFractionDigits: 2});
    }

    showModal(editItemModal);
  }

  let isSubmittingEdit = false;
  
  editItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // --- BUDGET HARD BLOCK FOR RESTOCK ---
    const categoryId = document.getElementById('edit-item-category').value;
    const stockAdjustment = parseFloat(document.getElementById('edit-item-add-stock').value) || 0;
    const unitCost = parseFloat(document.getElementById('edit-item-unit-cost').value) || 0;
    
    if (stockAdjustment > 0) {
        const totalRestockCost = stockAdjustment * unitCost;
        const available = categoryBudgets[categoryId] || 0;
        
        if (totalRestockCost > available) {
            showToast(`Insufficient Budget! Restocking costs ₱${totalRestockCost.toLocaleString('en-PH', {minimumFractionDigits:2})}, but you only have ₱${available.toLocaleString('en-PH', {minimumFractionDigits:2})}.`, 'error');
            return; // BLOCKS SUBMISSION
        }
    }
    // -------------------------------------

    // --- EXISTING VALIDATION CHECK ---
    if (!editItemForm.checkValidity()) {
        editItemForm.reportValidity();
        return;
    }
    // ... rest of the code remains exactly the same ...
    // ---------------------------------

    // Check for duplicate item name (case-insensitive, excluding current item)
    const itemName = document.getElementById('edit-item-name').value.trim().toLowerCase();
    const isDuplicate = allInventoryData.some(item => 
      item.ItemName.toLowerCase() === itemName && 
      parseInt(item.is_archived) === 0 && 
      item.ItemID !== currentEditItemId
    );
    
    if (isDuplicate) {
      showToast('An item with this name already exists in the inventory.', 'error');
      return;
    }

    if (!currentEditItemId || isSubmittingEdit) return;

    isSubmittingEdit = true;
    const submitBtn = editItemForm.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Updating...';
    }

   const formData = new FormData();
    formData.append('item_id', currentEditItemId);
    formData.append('name', document.getElementById('edit-item-name').value);
    formData.append('type', document.getElementById('edit-item-type').value);
    formData.append('category_id', editCategorySelect.value);
    formData.append('description', document.getElementById('edit-item-description').value);
    formData.append('unit', document.getElementById('edit-item-unit').value);
    formData.append('unit_cost', document.getElementById('edit-item-unit-cost').value);
    formData.append('stock_limit', document.getElementById('edit-item-limit').value);
    formData.append('expiration_date', document.getElementById('edit-item-expiration').value);
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
    } finally {
      isSubmittingEdit = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
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

  if (addItemBtn) {
    addItemBtn.addEventListener('click', () => {
        if(addItemForm) addItemForm.reset(); // Reset form
        
        // Reset the Smart Filter so it waits for you to pick a Type
        if(window.filterCategoriesByType) {
            window.filterCategoriesByType('item-type', 'item-category');
        }
        
        showModal(addItemModal);
    });
  }
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
// --- NEW: Smart Filter for the Main Tables ---
  function updateMainTabCategoryFilters(typeVal, categoryDropdownId) {
      const catSelect = document.getElementById(categoryDropdownId);
      if (!catSelect || !window.allSystemCategories) return;

      const currentCat = catSelect.value;
      while (catSelect.options.length > 1) { catSelect.remove(1); }

      let filtered = window.allSystemCategories.filter(c => c.is_archived == 0);
      if (typeVal) {
          filtered = filtered.filter(c => c.ItemType === typeVal); // Filter by Type
      }

      filtered.forEach(category => {
          const option = document.createElement('option');
          option.value = category.ItemCategoryName; 
          option.textContent = category.ItemCategoryName; // Perfectly clean text
          catSelect.appendChild(option);
      });

      catSelect.value = currentCat;
      if(catSelect.value !== currentCat) catSelect.value = "";
  }

  if (typeFilter) typeFilter.addEventListener('change', () => {
      currentPages.requests = 1;
      updateMainTabCategoryFilters(typeFilter.value, 'floorFilter');
      renderInventoryTable();
  });

  if (typeFilterHistory) typeFilterHistory.addEventListener('change', () => {
      currentPages.history = 1;
      updateMainTabCategoryFilters(typeFilterHistory.value, 'floorFilterHistory');
      renderHistoryTable();
  });
 if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      if (typeFilter) {
          typeFilter.value = ''; 
          updateMainTabCategoryFilters('', 'floorFilter'); // Instantly reset categories
      }
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
      if (typeFilterHistory) {
          typeFilterHistory.value = '';
          updateMainTabCategoryFilters('', 'floorFilterHistory'); // Instantly reset categories
      }
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
      fetchBudgetRequests(); // Load budgets on init
    } catch (error) {
      console.error("Critical error during initialization:", error);
    }
  }

 // ==========================================
  // === BUDGET REQUEST LOGIC ===
  // ==========================================
  let allBudgetRequests = [];
  const BUDGET_API_URL = 'inventory_actions.php';

  // Holds actual budget values from DB
  let categoryBudgets = {};

  const budgetModal = document.getElementById('budget-request-modal');
  const budgetForm = document.getElementById('budgetForm');
  const budgetCategory = document.getElementById('budget-category');
  const budgetAmount = document.getElementById('budget-amount');
  
  const globalCategorySelect = document.getElementById('globalBudgetCategorySelect');
  const globalBudgetDisplay = document.getElementById('global-available-budget');

  // 1. Fetch Categories & Real Available Budgets
  async function fetchCategoryBudgets() {
      try {
          const res = await fetch('inventory_actions.php?action=get_categories');
          const cats = await res.json();
          
          // --- NEW: FEED THE SMART FILTER ---
          window.allSystemCategories = cats;

          // Clear dropdowns
          const optionsHtml = '<option value="" disabled selected>Select Category...</option>';
          let realOptions = '';

          cats.forEach(c => {
              if (c.is_archived == 0) {
                  categoryBudgets[c.ItemCategoryID] = parseFloat(c.AvailableBudget || 0);
                  realOptions += `<option value="${c.ItemCategoryID}">${c.ItemCategoryName}</option>`;
              }
          });

          if(budgetCategory) budgetCategory.innerHTML = optionsHtml + realOptions;
          if(globalCategorySelect) {
              const currentVal = globalCategorySelect.value; 
              globalCategorySelect.innerHTML = '<option value="" selected>-- Select Category --</option>' + realOptions;
              globalCategorySelect.value = currentVal;
          }

          updateGlobalBudgetDisplay(globalCategorySelect ? globalCategorySelect.value : null);
          
          // --- NEW: TRIGGER THE FILTER FOR ADD/EDIT MODALS ON LOAD ---
          if (typeof window.filterCategoriesByType === 'function') {
              window.filterCategoriesByType('item-type', 'item-category');
              window.filterCategoriesByType('edit-item-type', 'edit-item-category');
          }

          // --- FIX: POPULATE MAIN TAB CATEGORIES ON LOAD ---
          if (typeof updateMainTabCategoryFilters === 'function') {
              updateMainTabCategoryFilters(typeFilter ? typeFilter.value : '', 'floorFilter');
              updateMainTabCategoryFilters(typeFilterHistory ? typeFilterHistory.value : '', 'floorFilterHistory');
          }

      } catch(e) { console.error("Error fetching budgets", e); }
  }

  // 2. Update the big Green Dashboard text
  function updateGlobalBudgetDisplay(catId) {
      if(globalBudgetDisplay && catId && categoryBudgets[catId] !== undefined) {
          globalBudgetDisplay.textContent = '₱' + categoryBudgets[catId].toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2});
      } else if (globalBudgetDisplay) {
          globalBudgetDisplay.textContent = '₱0.00';
      }
  }

  // Event Listeners for Dropdowns
  if(globalCategorySelect) {
      globalCategorySelect.addEventListener('change', () => {
          updateGlobalBudgetDisplay(globalCategorySelect.value);
      });
  }

  if(budgetCategory) {
      budgetCategory.addEventListener('change', () => {
          if(globalCategorySelect) {
              globalCategorySelect.value = budgetCategory.value;
              updateGlobalBudgetDisplay(budgetCategory.value);
          }
      });
  }

  // Connect the new Status Filter
  const budgetStatusFilter = document.getElementById('budgetStatusFilter');
  if(budgetStatusFilter) {
      budgetStatusFilter.addEventListener('change', () => {
          renderBudgetTable();
      });
  }

  // 3. Render the Logs Table & Pending Table cleanly separated
  async function fetchBudgetRequests() {
      try {
          const res = await fetch(`${BUDGET_API_URL}?action=get_budget_requests`);
          allBudgetRequests = await res.json();
          
          // --- RENDER LOGS TAB (History only: Purchased/Expenses) ---
          const logsTbody = document.getElementById('budgetLogsTableBody');
          if(logsTbody) {
              // Only show stock purchases in the logs
              const logData = allBudgetRequests.filter(req => req.Status.toLowerCase() === 'purchased');
              logsTbody.innerHTML = '';
              
              if(logData.length === 0) {
                  logsTbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No stock purchase logs found.</td></tr>';
              } else {
                  logData.forEach(req => {
                      const tr = document.createElement('tr');
                      
                      let itemName = req.Description || 'N/A';
                      let qty = "-";
                      let price = "-";
                      
                      // Extract Qty and Price from Remarks (New Format)
                      if (req.Remarks && req.Remarks.includes('QTY:')) {
                          const parts = req.Remarks.split('|');
                          qty = parts[0].replace('QTY:', '');
                          price = parseFloat(parts[1].replace('PRICE:', '')).toLocaleString('en-PH', {minimumFractionDigits:2});
                      } 
                      // Extract from Description (Fallback for tests you already did)
                      else if (itemName.includes('Stock Purchased:')) {
                          const match = itemName.match(/Stock Purchased: (.*?) \(Qty: (\d+) @ ₱([\d,.]+)\)/);
                          if (match) {
                              itemName = match[1];
                              qty = match[2];
                              price = match[3];
                          }
                      }

                      const rawAmount = parseFloat(req.TotalAmount) || 0;
                      const rawBalance = parseFloat(req.RemainingBudget) || 0;

                      tr.innerHTML = `
                          <td>#${req.RequestID}</td>
                          <td><strong>${escapeHtml(req.ItemCategory || req.CategoryName || 'Unknown')}</strong></td>
                          <td>${escapeHtml(itemName)}</td>
                          <td>${escapeHtml(qty)}</td>
                          <td>₱${price}</td>
                          <td style="color:#dc3545; font-weight:bold;">
                              - ₱${rawAmount.toLocaleString('en-PH', {minimumFractionDigits:2})}
                          </td>
                          <td style="color:#0056b3; font-weight:bold;">
                              ₱${rawBalance.toLocaleString('en-PH', {minimumFractionDigits:2})}
                          </td>
                          <td>${new Date(req.RequestDate).toLocaleDateString()}</td>
                      `;
                      logsTbody.appendChild(tr);
                  });
              }
          }
          
          // --- RENDER BUDGET REQUESTS TAB ---
          renderBudgetTable();
          
      } catch(e) { console.error('Error fetching budget logs:', e); }
  }

  function renderBudgetTable() {
      const tbody = document.getElementById('budgetTableBody');
      if (!tbody) return;

      // Show EVERYTHING EXCEPT "Purchased" in the Requests tab
      let filtered = allBudgetRequests.filter(req => req.Status.toLowerCase() !== 'purchased');
      
      // Apply the dropdown filter if it is selected
      const statusFilterVal = budgetStatusFilter ? budgetStatusFilter.value.toLowerCase() : '';
      if (statusFilterVal) {
          filtered = filtered.filter(req => req.Status.toLowerCase() === statusFilterVal);
      }

      if (filtered.length === 0) {
          tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #777;">No budget requests found.</td></tr>';
          return;
      }

      tbody.innerHTML = filtered.map(req => {
          let statusColor = '#856404';
          let statusBg = '#fff3cd';
          let actionBtns = '-';

          const status = req.Status.toLowerCase();
          if (status === 'accepted') { statusColor = '#155724'; statusBg = '#d4edda'; }
          else if (status === 'rejected') { statusColor = '#721c24'; statusBg = '#f8d7da'; }
          else if (status === 'cancelled') { statusColor = '#383d41'; statusBg = '#e2e3e5'; }
          else if (status === 'pending') {
              actionBtns = `
              <div style="display:flex; gap:5px; justify-content:center;">
                  <button class="cancel-budget-btn" data-id="${req.RequestID}" style="padding: 6px 10px; cursor: pointer; border: none; background: #dc3545; color: white; border-radius: 4px; font-weight: bold;" title="Cancel Request"><i class="fas fa-times"></i> Cancel</button>
              </div>`;
          }

          return `
              <tr>
                  <td>#${req.RequestID}</td>
                  <td><strong>${escapeHtml(req.ItemCategory || req.CategoryName || 'Unknown')}</strong></td>
                  <td>${escapeHtml(req.Description || 'N/A')}</td>
                  <td style="font-weight: bold; color: ${status === 'accepted' ? '#28a745' : '#d35400'};">
                      ${status === 'accepted' ? '+ ' : ''}₱${parseFloat(req.TotalAmount).toLocaleString('en-PH', {minimumFractionDigits:2})}
                  </td>
                  <td>${escapeHtml(req.RequestedByName || 'N/A')}</td>
                  <td>${req.RequestDate.split(' ')[0]}</td>
                  <td><span style="background:${statusBg}; color:${statusColor}; padding:4px 8px; border-radius:4px; text-transform: capitalize; font-weight:bold;">${req.Status}</span></td>
                  <td style="text-align:center;">${actionBtns}</td>
              </tr>
          `;
      }).join('');
  }

  // Open Modal logic
  if (document.getElementById('addBudgetBtn')) {
      document.getElementById('addBudgetBtn').addEventListener('click', () => {
          if(budgetForm) budgetForm.reset();
          if(globalCategorySelect && globalCategorySelect.value && budgetCategory) {
              budgetCategory.value = globalCategorySelect.value;
          }
          if(budgetModal) {
              budgetModal.style.display = 'flex';
              budgetModal.classList.add('show-modal');
          }
      });
  }

  if (document.getElementById('closeBudgetModal')) {
      document.getElementById('closeBudgetModal').addEventListener('click', () => {
          if(budgetModal) {
              budgetModal.style.display = 'none';
              budgetModal.classList.remove('show-modal');
          }
      });
  }

  // Temporary variable to hold form data while waiting for user confirmation
  let pendingBudgetSubmission = null;

  // 1. Intercept the form submission and show the Confirmation Modal
  if (budgetForm) {
      budgetForm.addEventListener('submit', (e) => {
          e.preventDefault();

          const categoryId = budgetCategory.value;
          const amount = parseFloat(budgetAmount.value);
          
          if(!categoryId) return alert("Please select a category.");

          const formData = new FormData();
          formData.append('category_id', categoryId); 
          formData.append('description', document.getElementById('budget-description').value);
          formData.append('requested_amount', amount); 
          formData.append('priority', document.getElementById('budget-priority').value);
          formData.append('remarks', document.getElementById('budget-remarks').value);

          // Save data and show the standard confirmation modal
          pendingBudgetSubmission = formData; 
          const confirmModal = document.getElementById('budget-confirm-modal');
          if(confirmModal) {
              confirmModal.style.display = 'flex';
              confirmModal.classList.add('show-modal');
          }
      });
  }

  // 2. The actual sending function (Fired after they click "Yes, Submit")
  async function processBudgetForm(formData) {
      try {
          const submitBtn = document.getElementById('submitBudgetBtn');
          if(submitBtn) submitBtn.textContent = 'Submitting...';

          const res = await fetch(`${BUDGET_API_URL}?action=add_budget_request`, { method: 'POST', body: formData });
          const data = await res.json();
          
          if (data.success) {
              if(budgetModal) {
                  budgetModal.style.display = 'none';
                  budgetModal.classList.remove('show-modal');
              }
              fetchCategoryBudgets(); // Refresh the Green Dashboard
              fetchBudgetRequests();  // Refresh the Table Logs
              showToast('Budget request submitted & logged successfully!', 'success');
          } else {
                      alert("Error: " + (data.message || 'Failed to cancel.'));
                  }
          if(submitBtn) submitBtn.textContent = 'Submit Request';
      } catch (error) { console.error(error); }
  }

  // 3. Modal Listeners for the Standard Confirmation
  const budgetConfirmBtn = document.getElementById('budget-confirm-btn');
  const budgetCancelBtn = document.getElementById('budget-cancel-btn');
  const budgetModalCloseBtn = document.getElementById('budget-modal-close-btn');
  const confirmModal = document.getElementById('budget-confirm-modal');

  function closeConfirmModal() {
      if(confirmModal) {
          confirmModal.style.display = 'none';
          confirmModal.classList.remove('show-modal');
      }
      pendingBudgetSubmission = null; // clear the temporary data
  }

  if(budgetCancelBtn) budgetCancelBtn.addEventListener('click', closeConfirmModal);
  if(budgetModalCloseBtn) budgetModalCloseBtn.addEventListener('click', closeConfirmModal);
  
  if(budgetConfirmBtn) {
      budgetConfirmBtn.addEventListener('click', async () => {
          if(pendingBudgetSubmission) {
              const dataToSubmit = pendingBudgetSubmission;
              closeConfirmModal(); // Hide modal
              await processBudgetForm(dataToSubmit); // Fire the save function!
          }
      });
  }

  // Open Modal from "Low Stock" quick-action button on the Table
  window.openBudgetModalFromItem = function(item) {
      if(budgetForm) budgetForm.reset();

      if(budgetCategory) budgetCategory.value = item.ItemCategoryID;
      if(globalCategorySelect) globalCategorySelect.value = item.ItemCategoryID;
      
      document.getElementById('budget-description').value = `Restock: ${item.ItemName}`;

      const needed = item.StockLimit - item.ItemQuantity;
      const qtyToBuy = needed > 0 ? needed : 1;
      
      if(budgetAmount) budgetAmount.value = (qtyToBuy * (item.UnitCost || 0)).toFixed(2);
      document.getElementById('budget-priority').value = (item.ItemQuantity === 0) ? 'High' : (item.ItemStatus === 'Critical' ? 'Medium' : 'Low');

      if(budgetModal) {
          budgetModal.style.display = 'flex';
          budgetModal.classList.add('show-modal');
      }
  };

  // Handle Cancel Button inside Budget Table
  document.getElementById('budgetTableBody')?.addEventListener('click', async (e) => {
      const cancelBtn = e.target.closest('.cancel-budget-btn');

      if (cancelBtn) {
          if (confirm('Are you sure you want to cancel this request? It will be removed from Finance.')) {
              const reqID = parseInt(cancelBtn.dataset.id);
              const formData = new FormData();
              formData.append('request_id', reqID);
              
              try {
                  const res = await fetch(`${BUDGET_API_URL}?action=delete_budget_request`, { method: 'POST', body: formData });
                  const data = await res.json();
                  if (data.success) {
                      fetchBudgetRequests();
                      showToast('Request cancelled.', 'success');
                  } else {
                      alert("Error: " + (data.message || 'Failed to cancel.'));
                  }
              } catch (err) { console.error(err); }
          }
      }
  });

  // Attach listeners to dynamically generated quick-action buttons inside the inventory table
  document.getElementById('requestsTableBody').addEventListener('click', (e) => {
      const budgetBtn = e.target.closest('.budget-quick-btn');
      if (budgetBtn) {
          const itemID = parseInt(budgetBtn.dataset.id);
          const item = allInventoryData.find(i => i.ItemID === itemID);
          if (item) {
             const hiddenId = document.getElementById('budget-request-id');
             if(hiddenId) hiddenId.value = '';
             window.openBudgetModalFromItem(item);
          }
      }
  });

 // Override initializePage to ensure our new budget function runs!
  const originalInit = initializePage;
  initializePage = async function() {
      await fetchCategoryBudgets(); // Run our new category fetcher!
      await originalInit();
  };

  initializePage();
});