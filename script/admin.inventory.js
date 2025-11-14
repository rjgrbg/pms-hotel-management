// =============================================
// === NEW FUNCTIONS TO FETCH INVENTORY DATA ===
// =============================================

async function fetchAndRenderInventory() {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Loading inventory items...</td></tr>';
    
    // Using 'inventory_actions.php' as defined in your original files
    const result = await apiCall('get_inventory', {}, 'GET', 'inventory_actions.php');
    
    if (result && !result.error && Array.isArray(result) && result.length > 0) {
        inventoryDataList = result; // Populate the global variable
        renderInventoryTable(inventoryDataList);

        // === MODIFICATION: UPDATE DASHBOARD STATS ===
        try {
            const totalItems = inventoryDataList.length;
            const lowStock = inventoryDataList.filter(item => item.ItemStatus === 'Low Stock').length;
            const outOfStock = inventoryDataList.filter(item => item.ItemStatus === 'Out of Stock').length;

            // --- CORRECTED INDEXES ---
            updateStatCard(3, totalItems); // Total Items
            updateStatCard(4, lowStock); // Low Stock
            updateStatCard(5, outOfStock); // Out of Stock
        } catch (e) {
            console.error("Failed to update dashboard from inventory:", e);
        }
        // === END MODIFICATION ===

    } else if (result && !result.error && Array.isArray(result) && result.length === 0) {
        inventoryDataList = [];
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No inventory items found.</td></tr>';
        const recordCount = document.getElementById('inventoryRecordCount');
        if (recordCount) recordCount.textContent = 0;
        renderPaginationControls('inv-items-tab', 0, 1, () => {});

        // === MODIFICATION: UPDATE DASHBOARD STATS (EMPTY) ===
        // --- CORRECTED INDEXES ---
        updateStatCard(3, 0);
        updateStatCard(4, 0);
        updateStatCard(5, 0);
        // === END MODIFICATION ===

    } else {
        inventoryDataList = [];
        const errorMsg = result ? (result.error || 'Unknown error') : 'Unknown error';
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #c33;">Failed to load data: ${errorMsg}</td></tr>`;
        const recordCount = document.getElementById('inventoryRecordCount');
        if (recordCount) recordCount.textContent = 0;
        renderPaginationControls('inv-items-tab', 0, 1, () => {});

        // === MODIFICATION: UPDATE DASHBOARD STATS (ERROR) ===
        // --- CORRECTED INDEXES ---
        updateStatCard(3, 0);
        updateStatCard(4, 0);
        updateStatCard(5, 0);
        // === END MODIFICATION ===
    }
    // Initialize filters *after* data is fetched
    initInventoryFilters();
}

async function fetchAndRenderInventoryHistory() {
    const tbody = document.getElementById('invHistTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">Loading inventory history...</td></tr>';
    
    const result = await apiCall('get_history', {}, 'GET', 'inventory_actions.php');
    
    if (result && !result.error && Array.isArray(result) && result.length > 0) {
        inventoryHistoryDataList = result; // Populate the global variable
        renderInventoryHistoryTable(inventoryHistoryDataList);
    } else if (result && !result.error && Array.isArray(result) && result.length === 0) {
        inventoryHistoryDataList = [];
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No history records found.</td></tr>';
        const recordCount = document.getElementById('invHistRecordCount');
        if (recordCount) recordCount.textContent = 0;
        renderPaginationControls('inv-history-tab', 0, 1, () => {});
    } else {
        inventoryHistoryDataList = [];
        const errorMsg = result ? (result.error || 'Unknown error') : 'Unknown error';
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 20px; color: #c33;">Failed to load data: ${errorMsg}</td></tr>`;
        const recordCount = document.getElementById('invHistRecordCount');
        if (recordCount) recordCount.textContent = 0;
        renderPaginationControls('inv-history-tab', 0, 1, () => {});
    }
    // Initialize filters *after* data is fetched
    initInventoryHistoryFilters();
}


// ===== INVENTORY RENDER FUNCTION =====
function renderInventoryTable(data = inventoryDataList) {
  const tbody = document.getElementById('inventoryTableBody');
  if (!tbody) return;
  const state = paginationState.inventory;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);

  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => {
      // Use the correct keys from inventory_actions.php
      const statusText = row.ItemStatus === 'In Stock' ? 'In Stock' : 
                         row.ItemStatus === 'Low Stock' ? 'Low Stock' : 'Out of Stock';
      const statusClass = row.ItemStatus.toLowerCase().replace(' ', '-');
      
      return `
        <tr>
          <td>${row.ItemID}</td>
          <td>${row.ItemName}</td>
          <td>${row.Category}</td>
          <td>${row.ItemQuantity !== undefined && row.ItemQuantity !== null ? row.ItemQuantity : '-'}</td>
          <td>${row.ItemDescription || 'N/A'}</td>
          <td><span class="statusBadge ${statusClass}">${statusText}</span></td>
          <td>${row.DateofStockIn}</td>
        </tr>
      `;
    }).join('');
  }
  
  const recordCount = document.getElementById('inventoryRecordCount');
  if (recordCount) recordCount.textContent = data.length;
  renderPaginationControls('inv-items-tab', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderInventoryTable(data);
  });
}

// ===== INVENTORY FILTERS =====
function initInventoryFilters() {
    document.getElementById('inventorySearchInput')?.addEventListener('input', (e) => {
      const search = e.target.value.toLowerCase();
      const filtered = inventoryDataList.filter(row => 
        row.ItemName.toLowerCase().includes(search) ||
        row.Category.toLowerCase().includes(search) ||
        (row.ItemDescription && row.ItemDescription.toLowerCase().includes(search))
      );
      paginationState.inventory.currentPage = 1;
      renderInventoryTable(filtered);
    });

    document.getElementById('inventoryCategoryFilter')?.addEventListener('change', (e) => {
      const category = e.target.value;
      const filtered = category ? inventoryDataList.filter(row => row.Category === category) : inventoryDataList;
      paginationState.inventory.currentPage = 1;
      renderInventoryTable(filtered);
    });

    document.getElementById('inventoryStatusFilter')?.addEventListener('change', (e) => {
      const status = e.target.value;
      // Map keys correctly
      const statusMap = {
          'in-stock': 'In Stock',
          'low-stock': 'Low Stock',
          'out-of-stock': 'Out of Stock'
      };
      const mappedStatus = statusMap[status];
      const filtered = mappedStatus ? inventoryDataList.filter(row => row.ItemStatus === mappedStatus) : inventoryDataList;
      paginationState.inventory.currentPage = 1;
      renderInventoryTable(filtered);
    });

    document.getElementById('inventoryRefreshBtn')?.addEventListener('click', () => {
      document.getElementById('inventorySearchInput').value = '';
      document.getElementById('inventoryCategoryFilter').value = '';
      document.getElementById('inventoryStatusFilter').value = '';
      
      // Re-fetch data instead of using static array
      paginationState.inventory.currentPage = 1;
      fetchAndRenderInventory();
    });

    document.getElementById('inventoryDownloadBtn')?.addEventListener('click', () => {
      const headers = ['ID', 'Name', 'Category', 'Quantity', 'Description', 'Status', 'Stock In Date'];
      
      // Use correct data keys
      const csvContent = [
        headers.join(','),
        ...inventoryDataList.map(row => [
            row.ItemID, 
            row.ItemName, 
            row.Category, 
            row.ItemQuantity, 
            row.ItemDescription || '', 
            row.ItemStatus, 
            row.DateofStockIn
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
}

// =============================================
// === FUNCTIONS FOR INVENTORY HISTORY ===
// =============================================

function renderInventoryHistoryTable(data = inventoryHistoryDataList) {
  const tbody = document.getElementById('invHistTableBody');
  if (!tbody) return;
  const state = paginationState.inventoryHistory;
  const totalPages = getTotalPages(data.length, state.itemsPerPage);
  const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);

  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(row => {
        let quantityChangeText = row.QuantityChange;
        let changeClass = '';
        const changeAmount = parseInt(row.QuantityChange, 10);
        
        if (changeAmount > 0) {
          quantityChangeText = `+${changeAmount}`;
          changeClass = 'text-success'; 
        } else if (changeAmount < 0) {
          quantityChangeText = `${changeAmount}`;
          changeClass = 'text-danger';
        } else {
           quantityChangeText = '0';
        }
        
        const oldQty = (row.OldQuantity === null || row.OldQuantity === undefined) ? 'N/A' : row.OldQuantity;
        const newQty = (row.NewQuantity === null || row.NewQuantity === undefined) ? 'N/A' : row.NewQuantity;
        const stockInDate = row.DateofStockIn || 'N/A';
        
        return `
          <tr>
            <td>${row.InvLogID}</td>
            <td>${row.ItemName}</td>
            <td>${row.Category}</td>
            <td>${oldQty}</td>
            <td class="${changeClass}">${quantityChangeText}</td>
            <td>${newQty}</td>
            <td>${row.ItemStatus}</td>
            <td>${stockInDate}</td>
            <td>${row.PerformedBy}</td>
          </tr>
        `;
    }).join('');
  }
  
  const recordCount = document.getElementById('invHistRecordCount');
  if (recordCount) recordCount.textContent = data.length;
  renderPaginationControls('inv-history-tab', totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderInventoryHistoryTable(data);
  });
}

function initInventoryHistoryFilters() {
    document.getElementById('invHistSearchInput')?.addEventListener('input', (e) => {
      const search = e.target.value.toLowerCase();
      const filtered = inventoryHistoryDataList.filter(row => 
        (row.ItemName && row.ItemName.toLowerCase().includes(search)) ||
        (row.Category && row.Category.toLowerCase().includes(search)) ||
        (row.PerformedBy && row.PerformedBy.toLowerCase().includes(search))
      );
      paginationState.inventoryHistory.currentPage = 1;
      renderInventoryHistoryTable(filtered);
    });

    document.getElementById('invHistCategoryFilter')?.addEventListener('change', (e) => {
      const category = e.target.value;
      const filtered = category ? inventoryHistoryDataList.filter(row => row.Category === category) : inventoryHistoryDataList;
      paginationState.inventoryHistory.currentPage = 1;
      renderInventoryHistoryTable(filtered);
    });

    document.getElementById('invHistActionFilter')?.addEventListener('change', (e) => {
      const action = e.target.value;
      const filtered = action ? inventoryHistoryDataList.filter(row => row.ActionType === action) : inventoryHistoryDataList;
      paginationState.inventoryHistory.currentPage = 1;
      renderInventoryHistoryTable(filtered);
    });

    document.getElementById('invHistRefreshBtn')?.addEventListener('click', () => {
      document.getElementById('invHistSearchInput').value = '';
      document.getElementById('invHistCategoryFilter').value = '';
      document.getElementById('invHistActionFilter').value = '';
      
      // Re-fetch data instead of using static array
      paginationState.inventoryHistory.currentPage = 1;
      fetchAndRenderInventoryHistory();
    });

    document.getElementById('invHistDownloadBtn')?.addEventListener('click', () => {
      const headers = ['Log ID', 'Name', 'Category', 'Old Qty', 'Change', 'New Qty', 'Status', 'Stock In', 'Performed By'];
      const csvContent = [
        headers.join(','),
        ...inventoryHistoryDataList.map(row => [
            row.InvLogID, 
            row.ItemName, 
            row.Category, 
            row.OldQuantity, 
            row.QuantityChange, 
            row.NewQuantity, 
            row.ItemStatus, 
            row.DateofStockIn || 'N/A', 
            row.PerformedBy
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-history-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
}