document.addEventListener('DOMContentLoaded', () => {
  // ===== GLOBAL VARIABLES =====
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
      requests: { column: 'ItemName', direction: 'asc' },
      history: { column: 'DateofRelease', direction: 'desc' }
  };

  // ===== ELEMENT SELECTORS =====
  const requestsTableBody = document.getElementById('requestsTableBody');
  const historyTableBody = document.getElementById('historyTableBody');

  const tabBtns = document.querySelectorAll('.tabBtn');
  const tabContents = document.querySelectorAll('.tabContent');

  const categoryFilter = document.getElementById('floorFilter');
  const statusFilter = document.getElementById('roomFilter');
  const searchInput = document.getElementById('searchInput');

  const categoryFilterHistory = document.getElementById('floorFilterHistory');
  const statusFilterHistory = document.getElementById('roomFilterHistory');
  const searchInputHistory = document.getElementById('historySearchInput');

  const refreshBtn = document.getElementById('refreshBtn');
  // ==== MODIFICATION: Added History Refresh Button Selector ====
  const refreshBtnHistory = document.getElementById('refreshBtnHistory');
  const downloadBtnRequests = document.getElementById('downloadBtnRequests');
  const downloadBtnHistory = document.getElementById('downloadBtn');

  const addItemModal = document.getElementById('add-item-modal');
  const confirmationModal = document.getElementById('confirmation-modal');
  const successModal = document.getElementById('success-modal');
  const editItemModal = document.getElementById('edit-item-modal');
  const deleteConfirmModal = document.getElementById('delete-confirm-modal');

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
    if (modal) {
        if (modal.classList.contains('modalBackdrop')) {
            modal.style.display = 'flex';
        } 
        else if (modal.classList.contains('modal-overlay') || 
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
        } 
        else if (modal.classList.contains('modal-overlay') || 
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

          // DamageItem removed from this list
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
          if (valB === null || valB === undefined) valB = direction ==="asc" ? Infinity : -Infinity;

          let comparison = 0;
          if (valA > valB) {
              comparison = 1;
          } else if (valA < valB) {
              comparison = -1;
          }

          return direction === 'asc' ? comparison : -comparison;
      });
  }

  function updateSortHeaders(tabId, { column, direction }) {
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
      // Colspan updated to 8
      requestsTableBody.innerHTML =
        '<tr><td colspan="8" class="no-data-cell">Error loading data.</td></tr>';
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
      // Colspan updated to 9
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

    const { column, direction } = sortState.requests;
    sortData(filteredData, column, direction);

    const page = currentPages.requests;
    const totalItems = filteredData.length;
    setupPagination(totalItems, 'pagination-stocks', page);

    if (totalItems === 0) {
      // Colspan updated to 8
      requestsTableBody.innerHTML =
        '<tr><td colspan="8" class="no-data-cell">No inventory items found</td></tr>';
      return;
    }

    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    requestsTableBody.innerHTML = paginatedData
      .map((item) => {
        const badgeClass = item.ItemStatus.toLowerCase().replace(/\s+/g, '-');

        // Damage <td> has been removed from this template.
        return `
        <tr>
          <td>${item.ItemID}</td>
          <td>${item.ItemName}</td>
          <td>${item.Category}</td>
          <td>${item.ItemQuantity}</td>
          <td>${item.ItemDescription || 'N/A'}</td>
          
          <td><span class="statusBadge ${badgeClass}">${item.ItemStatus}</span></td>
          
          <td>${item.DateofStockIn}</td>
          <td class="action-cell">
              <button class="action-btn edit-btn" data-id="${item.ItemID}">Edit</button>
              <button class="action-btn delete-btn" data-id="${item.ItemID}">Delete</button>
          </td>
        </tr>
      `;
      })
      .join('');

    updateSortHeaders('requests-tab', sortState.requests);

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
      // Colspan is 9
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

          // DamageItem <td> was never here, so this is correct.
          return `
            <tr>
              <td>${log.InvLogID}</td>
              <td>${log.ItemName}</td>
              <td>${log.Category}</td>
              <td>${oldQty}</td>
              <td class="${changeClass}">${quantityChangeText}</td>
              <td>${newQty}</td>
              <td>${log.ItemStatus}</td>
              <td>${log.DateofStockIn || 'N/A'}</td>
              <td>${log.PerformedBy}</td>
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

  // This function populates the edit modal with the item's data
  function openEditModal(item) {
    currentEditItemId = item.ItemID;
    editItemIdSpan.textContent = item.ItemID;
    editItemIdInput.value = item.ItemID; 
    document.getElementById('edit-item-name').value = item.ItemName;
    editCategorySelect.value = item.ItemCategoryID;
    document.getElementById('edit-item-description').value = item.ItemDescription;
    
    // Set "Add Stock" value to empty string to show placeholder
    editStockInput.value = '';

    // Populate the read-only current quantity field
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
    // Use .value or default to 0 if empty
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
    refreshBtn.addEventListener('click', () => {
      categoryFilter.value = '';
      statusFilter.value = '';
      searchInput.value = '';
      currentPages.requests = 1;
      fetchInventory(); 
      alert('Data refreshed!');
    });
  }

  // ==== MODIFICATION: Added Event Listener for History Refresh Button ====
  if (refreshBtnHistory) {
    refreshBtnHistory.addEventListener('click', () => {
      categoryFilterHistory.value = '';
      statusFilterHistory.value = '';
      searchInputHistory.value = '';
      currentPages.history = 1;
      fetchHistory(); 
      alert('History data refreshed!');
    });
  }

  function downloadPDF(data, headers, bodyKeys, title, filename) {
      if (data.length === 0) {
          alert('No data to download.');
          return;
      }
      
      try {
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF({ orientation: 'landscape' });

          doc.setFontSize(18);
          doc.text(title, 14, 22);
          doc.setFontSize(11);
          doc.setTextColor(100);
          doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

          const body = data.map(row => bodyKeys.map(key => row[key] || 'N/A'));

          doc.autoTable({
              head: [headers],
              body: body,
              startY: 35,
              headStyles: { fillColor: [72, 12, 27] },
              styles: { fontSize: 8, cellPadding: 2 },
              alternateRowStyles: { fillColor: [245, 245, 245] }
          });

          doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
      } catch (e) {
          console.error("Error generating PDF:", e);
          alert("Error generating PDF. Please ensure you are online to load the PDF library.");
      }
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
      
      const { column, direction } = sortState.requests;
      sortData(filteredData, column, direction);

      // 'Dmg' and 'DamageItem' removed from headers and keys
      const headers = ['ID', 'Name', 'Category', 'Qty', 'Description', 'Status', 'Stock In'];
      const bodyKeys = ['ItemID', 'ItemName', 'Category', 'ItemQuantity', 'ItemDescription', 'ItemStatus', 'DateofStockIn'];
      
      downloadPDF(filteredData, headers, bodyKeys, 'Inventory Stocks Report', 'inventory-stocks');
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
      
      const { column, direction } = sortState.history;
      sortData(filteredData, column, direction);
      
      // DamageItem was never in this report, so it's correct
      const headers = ['Log ID', 'Name', 'Category', 'Old Qty', 'Change', 'New Qty', 'Status', 'Stock In', 'Performed By'];
      const bodyKeys = ['InvLogID', 'ItemName', 'Category', 'OldQuantity', 'QuantityChange', 'NewQuantity', 'ItemStatus', 'DateofStockIn', 'PerformedBy'];
      
      downloadPDF(filteredData, headers, bodyKeys, 'Inventory History Report', 'inventory-history');
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
              
              sortState[stateKey] = { column, direction };

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