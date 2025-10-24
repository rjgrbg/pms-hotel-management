document.addEventListener('DOMContentLoaded', () => {

  // ===== DUMMY DATA (Replace with data from your database) =====
  // This data would typically be fetched from your server via PHP.
  const inventoryData = [
    { id: 1, name: 'Standard Pillow', category: 'room amenities', quantity: 150, description: 'Cotton pillows for guest rooms.', status: 'in stock', damage: 2, stockInDate: '2025-10-01', stockOutDate: null },
    { id: 2, name: 'LED Light Bulb', category: 'electrical', quantity: 8, description: 'Energy-efficient 60W equivalent bulbs.', status: 'low stock', damage: 0, stockInDate: '2025-09-15', stockOutDate: null },
    { id: 3, name: 'All-Purpose Cleaner', category: 'cleaning solution', quantity: 25, description: 'Concentrated cleaning solution for surfaces.', status: 'in stock', damage: 0, stockInDate: '2025-10-10', stockOutDate: null },
    { id: 4, name: 'Wooden Hanger', category: 'furniture & fixtures', quantity: 0, description: 'Set of 5 wooden hangers.', status: 'out of stock', damage: 10, stockInDate: '2025-08-20', stockOutDate: '2025-10-22' },
    { id: 5, name: 'Bath Towel', category: 'room amenities', quantity: 45, description: 'Large white cotton bath towels.', status: 'low stock', damage: 5, stockInDate: '2025-09-28', stockOutDate: null },
    { id: 6, name: 'Desk Chair', category: 'furniture & fixtures', quantity: 30, description: 'Standard desk chair for guest rooms.', status: 'in stock', damage: 1, stockInDate: '2025-09-05', stockOutDate: null }
  ];

  const historyData = [
    { id: 4, name: 'Wooden Hanger', category: 'furniture & fixtures', quantity: 0, quantityChange: -50, status: 'out of stock', damage: 10, stockInDate: '2025-08-20', stockOutDate: '2025-10-22', actionType: 'Stock Out', performedBy: 'Admin User' },
    { id: 3, name: 'All-Purpose Cleaner', category: 'cleaning solution', quantity: 25, quantityChange: 30, status: 'in stock', damage: 0, stockInDate: '2025-10-10', stockOutDate: null, actionType: 'Stock In', performedBy: 'Admin User' },
    { id: 1, name: 'Standard Pillow', category: 'room amenities', quantity: 150, quantityChange: 5, status: 'in stock', damage: 2, stockInDate: '2025-10-01', stockOutDate: null, actionType: 'Damage Report', performedBy: 'Jane Doe' }
  ];

  // ===== GLOBAL VARIABLES =====
  let filteredInventory = [...inventoryData];
  let filteredHistory = [...historyData];
  let currentEditItemId = null;

  // ===== TAB NAVIGATION =====
  const tabBtns = document.querySelectorAll('.tabBtn');
  const tabContents = document.querySelectorAll('.tabContent');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');

      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });

  // ===== RENDER FUNCTIONS =====
  function renderInventoryTable(data = filteredInventory) {
    const tbody = document.getElementById('requestsTableBody');
    if (!tbody) return;

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="no-data-cell">No inventory items found</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(item => `
      <tr>
        <td>${item.id}</td>
        <td>${item.name}</td>
        <td>${item.category}</td>
        <td>${item.quantity}</td>
        <td>${item.description}</td>
        <td><span class="status-badge status-${item.status.replace(/\s+/g, '-')}">${item.status}</span></td>
        <td>${item.damage}</td>
        <td>${item.stockInDate}</td>
        <td>${item.stockOutDate || 'N/A'}</td>
        <td><button class="edit-btn" data-id="${item.id}">Edit</button></td>
      </tr>
    `).join('');
    
    // Add event listeners for the new Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = parseInt(e.target.dataset.id);
            openEditModal(itemId);
        });
    });
  }

  function renderHistoryTable(data = filteredHistory) {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="11" class="no-data-cell">No history found</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(hist => `
      <tr>
        <td>${hist.id}</td>
        <td>${hist.name}</td>
        <td>${hist.category}</td>
        <td>${hist.quantity}</td>
        <td><span class="${hist.quantityChange > 0 ? 'positive' : 'negative'}">${hist.quantityChange}</span></td>
        <td><span class="status-badge status-${hist.status.replace(/\s+/g, '-')}">${hist.status}</span></td>
        <td>${hist.damage}</td>
        <td>${hist.stockInDate}</td>
        <td>${hist.stockOutDate || 'N/A'}</td>
        <td>${hist.actionType}</td>
        <td>${hist.performedBy}</td>
      </tr>
    `).join('');
    
    document.getElementById('recordCount').textContent = data.length;
  }
  
  // ===== FILTER & SEARCH FUNCTIONS =====
  function filterInventory() {
    const category = document.getElementById('floorFilter').value;
    const status = document.getElementById('roomFilter').value;
    const search = document.getElementById('searchInput').value.toLowerCase();

    filteredInventory = inventoryData.filter(item => {
      const matchCategory = !category || item.category.toLowerCase() === category.toLowerCase();
      const matchStatus = !status || item.status.toLowerCase() === status.toLowerCase();
      const matchSearch = !search || item.name.toLowerCase().includes(search) || item.id.toString().includes(search);
      return matchCategory && matchStatus && matchSearch;
    });

    renderInventoryTable(filteredInventory);
  }

  function filterHistory() {
    const category = document.getElementById('floorFilterHistory').value;
    const status = document.getElementById('roomFilterHistory').value;
    const search = document.getElementById('historySearchInput').value.toLowerCase();

    filteredHistory = historyData.filter(hist => {
      const matchCategory = !category || hist.category.toLowerCase() === category.toLowerCase();
      const matchStatus = !status || hist.status.toLowerCase() === status.toLowerCase();
      const matchSearch = !search || hist.name.toLowerCase().includes(search) || hist.id.toString().includes(search) || hist.performedBy.toLowerCase().includes(search);
      return matchCategory && matchStatus && matchSearch;
    });

    renderHistoryTable(filteredHistory);
  }

  // ===== MODAL MANAGEMENT =====
  const addItemModal = document.getElementById('add-item-modal');
  const confirmationModal = document.getElementById('confirmation-modal');
  const successModal = document.getElementById('success-modal');
  const editItemModal = document.getElementById('edit-item-modal');
  const deleteConfirmModal = document.getElementById('delete-confirm-modal');
  
  // Placeholder for a button to open the "Add Item" modal
  // You should add a button with id="addItemBtn" to your HTML
  const addItemBtn = document.getElementById('addItemBtn');
  if(addItemBtn) {
      addItemBtn.addEventListener('click', () => addItemModal.style.display = 'flex');
  }

  // Close Modals
  document.getElementById('modal-close-btn').addEventListener('click', () => addItemModal.style.display = 'none');
  document.getElementById('confirm-cancel-btn').addEventListener('click', () => confirmationModal.style.display = 'none');
  document.getElementById('success-okay-btn').addEventListener('click', () => successModal.style.display = 'none');
  document.getElementById('edit-modal-close-btn').addEventListener('click', () => editItemModal.style.display = 'none');
  document.getElementById('delete-cancel-btn').addEventListener('click', () => deleteConfirmModal.style.display = 'none');
  
  // Add Item Logic
  document.getElementById('add-item-form').addEventListener('submit', (e) => {
    e.preventDefault();
    confirmationModal.style.display = 'flex';
  });

  document.getElementById('confirm-add-btn').addEventListener('click', () => {
    // In a real app, you would send this data to the server
    const newItem = {
        id: Date.now(), // Use a temporary unique ID
        name: document.getElementById('item-name').value,
        category: document.getElementById('item-category').value,
        quantity: parseInt(document.getElementById('item-quantity').value),
        description: document.getElementById('item-description').value,
        status: 'in stock',
        damage: 0,
        stockInDate: document.getElementById('stock-in-date').value,
        stockOutDate: null,
    };
    inventoryData.unshift(newItem); // Add to the beginning of the array
    filterInventory(); // Re-render the table
    
    confirmationModal.style.display = 'none';
    successModal.style.display = 'flex';
    document.getElementById('add-item-form').reset();
  });

  // Edit Item Logic
  function openEditModal(itemId) {
    const item = inventoryData.find(i => i.id === itemId);
    if (!item) return;
    
    currentEditItemId = itemId;
    document.getElementById('edit-item-id').textContent = item.id;
    document.getElementById('edit-item-name').value = item.name;
    document.getElementById('edit-item-category').value = item.category;
    document.getElementById('edit-item-description').value = item.description;
    document.getElementById('edit-item-add-stock').value = 0; // Reset stock adjustment
    document.getElementById('edit-item-status').value = item.status;
    
    editItemModal.style.display = 'flex';
  }
  
  // Stock adjustment buttons in Edit Modal
  document.getElementById('stock-subtract-btn').addEventListener('click', () => {
    const input = document.getElementById('edit-item-add-stock');
    input.value = parseInt(input.value) - 1;
  });
  document.getElementById('stock-add-btn').addEventListener('click', () => {
    const input = document.getElementById('edit-item-add-stock');
    input.value = parseInt(input.value) + 1;
  });

  document.getElementById('edit-item-form').addEventListener('submit', (e) => {
      e.preventDefault();
      // Find the item and update its properties
      const itemIndex = inventoryData.findIndex(i => i.id === currentEditItemId);
      if (itemIndex > -1) {
          const stockChange = parseInt(document.getElementById('edit-item-add-stock').value);
          inventoryData[itemIndex].name = document.getElementById('edit-item-name').value;
          inventoryData[itemIndex].category = document.getElementById('edit-item-category').value;
          inventoryData[itemIndex].description = document.getElementById('edit-item-description').value;
          inventoryData[itemIndex].quantity += stockChange;
          inventoryData[itemIndex].status = document.getElementById('edit-item-status').value;
          
          // Add to history if stock changed
          if(stockChange !== 0) {
              historyData.unshift({
                  ...inventoryData[itemIndex],
                  quantityChange: stockChange,
                  actionType: stockChange > 0 ? 'Stock In' : 'Stock Out',
                  performedBy: 'Admin User' // Replace with actual user
              });
              renderHistoryTable();
          }
      }
      filterInventory();
      editItemModal.style.display = 'none';
      alert('Item updated successfully!');
  });

  // Delete Item Logic
  document.getElementById('edit-modal-delete-btn').addEventListener('click', () => {
      deleteConfirmModal.style.display = 'flex';
  });

  document.getElementById('delete-confirm-btn').addEventListener('click', () => {
    const itemIndex = inventoryData.findIndex(i => i.id === currentEditItemId);
    if (itemIndex > -1) {
        inventoryData.splice(itemIndex, 1);
    }
    filterInventory();
    deleteConfirmModal.style.display = 'none';
    editItemModal.style.display = 'none';
    alert('Item deleted successfully!');
  });


  // ===== PROFILE & LOGOUT =====
  // This part of your code was already well-structured.
  const profileBtn = document.getElementById('profileBtn');
  const sidebar = document.getElementById('profile-sidebar');
  const closeBtn = document.getElementById('sidebar-close-btn');

  if(profileBtn && sidebar && closeBtn) {
    profileBtn.addEventListener('click', () => sidebar.classList.add('active'));
    closeBtn.addEventListener('click', () => sidebar.classList.remove('active'));
  }

  const logoutBtn = document.getElementById('logoutBtn');
  const logoutModal = document.getElementById('logoutModal');
  const closeLogoutBtn = document.getElementById('closeLogoutBtn');
  const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
  const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

  if (logoutBtn) {
      logoutBtn.addEventListener('click', () => logoutModal.style.display = 'flex');
  }
  if (closeLogoutBtn) {
      closeLogoutBtn.addEventListener('click', () => logoutModal.style.display = 'none');
  }
  if (cancelLogoutBtn) {
      cancelLogoutBtn.addEventListener('click', () => logoutModal.style.display = 'none');
  }
  if (confirmLogoutBtn) {
      confirmLogoutBtn.addEventListener('click', () => {
          window.location.href = 'logout.php';
      });
  }
  if (logoutModal) {
      logoutModal.addEventListener('click', (e) => {
          if (e.target === e.currentTarget) {
              logoutModal.style.display = 'none';
          }
      });
  }

  // ===== EVENT LISTENERS for FILTERS =====
  document.getElementById('searchInput').addEventListener('input', filterInventory);
  document.getElementById('floorFilter').addEventListener('change', filterInventory);
  document.getElementById('roomFilter').addEventListener('change', filterInventory);

  document.getElementById('historySearchInput').addEventListener('input', filterHistory);
  document.getElementById('floorFilterHistory').addEventListener('change', filterHistory);
  document.getElementById('roomFilterHistory').addEventListener('change', filterHistory);
  
  // ===== REFRESH BUTTON =====
  document.getElementById('refreshBtn').addEventListener('click', () => {
    document.getElementById('floorFilter').value = '';
    document.getElementById('roomFilter').value = '';
    document.getElementById('searchInput').value = '';
    
    filteredInventory = [...inventoryData];
    renderInventoryTable();
    
    alert('Data refreshed!');
  });
  
  // ===== DOWNLOAD CSV BUTTONS =====
  function downloadCSV(data, headers, filename) {
      const csvContent = [
          headers.join(','),
          ...data.map(row => 
              headers.map(header => {
                  // Normalize header key (e.g., "Stock In Date" -> "stockInDate")
                  const key = header.charAt(0).toLowerCase() + header.slice(1).replace(/\s+/g, '');
                  return row[key];
              }).join(',')
          )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
  }

  const downloadBtnRequests = document.getElementById('downloadBtnRequests');
  if (downloadBtnRequests) {
      downloadBtnRequests.addEventListener('click', () => {
          const headers = ['ID', 'Name', 'Category', 'Quantity', 'Description', 'Status', 'Damage', 'Stock In Date', 'Stock Out Date'];
          downloadCSV(filteredInventory, headers, 'inventory-stocks');
      });
  }
  
  const downloadBtnHistory = document.getElementById('downloadBtn');
  if (downloadBtnHistory) {
      downloadBtnHistory.addEventListener('click', () => {
          const headers = ['ID', 'Name', 'Category', 'Quantity', 'Quantity Change', 'Status', 'Damage', 'Stock In Date', 'Stock Out Date', 'Action Type', 'Performed By'];
          downloadCSV(filteredHistory, headers, 'inventory-history');
      });
  }

  // ===== INITIAL RENDER =====
  renderInventoryTable();
  renderHistoryTable();
});