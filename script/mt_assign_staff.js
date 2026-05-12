// ===== MAINTENANCE TASK DETAILS PAGE SCRIPT =====

// --- GLOBALS ---
let CURRENT_REQUEST_ID = null;
let CURRENT_ROOM_ID = null;
let CURRENT_ISSUE_TYPE = null;
let usedItems = []; 
let usedFurnitureItems = [];
let usedElectricalItems = [];
let allAvailableItems = [];
let allFurnitureItems = [];
let allElectricalItems = [];

// --- DOM ELEMENTS ---
const roomValue = document.getElementById('room-value');
const roomTypeValue = document.getElementById('room-type-value');
const dateValue = document.getElementById('date-value');
const requestTimeValue = document.getElementById('request-time-value');
const statusValue = document.getElementById('status-value');
const issueTypeValue = document.getElementById('issue-type-value'); 

const remarksTextarea = document.querySelector('.remarks-textarea');

const inProgressBtn = document.getElementById('inProgressBtn');
const doneBtn = document.getElementById('doneBtn');

const modalBackdrop = document.getElementById('modalBackdrop');
const modalCancel = document.getElementById('modalCancel');
const modalSave = document.getElementById('modalSave');

const toast = document.getElementById('toast');

// View Containers
const taskContent = document.getElementById('task-content');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');

// Inventory Elements (Equipment)
const inventorySelect = document.getElementById('inventory-select');
const inventoryQty = document.getElementById('inventory-qty');
const addItemBtn = document.getElementById('add-item-btn');
const selectedItemsList = document.getElementById('selected-items-list');
const searchInput = document.getElementById('inventory-search');

// Furniture & Fixtures Elements
const furnitureSection = document.getElementById('furniture-section');
const furnitureSelect = document.getElementById('furniture-select');
const selectedFurnitureList = document.getElementById('selected-furniture-list');

// Electrical & Lighting Elements
const electricalSection = document.getElementById('electrical-section');
const electricalSelect = document.getElementById('electrical-select');
const selectedElectricalList = document.getElementById('selected-electrical-list');

// ===== PAGE INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('Maintenance Details page loaded');

  // 1. Get request_id from URL
  const urlParams = new URLSearchParams(window.location.search);
  const requestId = urlParams.get('request_id');

  if (!requestId) {
    showErrorView('No Request ID provided in the URL.');
    return;
  }

  CURRENT_REQUEST_ID = requestId;
  
  // 2. Fetch task details from API
  fetchTaskDetails(CURRENT_REQUEST_ID);

  // 3. Setup event listeners
  setupEventListeners();
});

/**
 * Fetch task details from the backend
 */
async function fetchTaskDetails(requestId) {
  showLoadingView();
  try {
    const response = await fetch(`api_staff_task.php?action=get_task_details&request_id=${requestId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();

    if (result.status === 'success') {
      initializePageData(result.data);
      showTaskView();
    } else {
      showErrorView(result.message || 'This task is completed, cancelled, or no longer exists.');
    }
  } catch (error) {
    console.error('Error fetching task details:', error);
    showErrorView('Could not load task details. Please check your connection.');
  }
}

/**
 * Fill the HTML fields with data from the API
 */
function initializePageData(data) {
  roomValue.textContent = data.RoomNumber || 'N/A';
  roomTypeValue.textContent = data.RoomType || 'N/A';
  dateValue.textContent = data.DateRequested || 'N/A';
  requestTimeValue.textContent = data.TimeRequested || 'N/A';
  statusValue.textContent = data.Status || 'N/A';
  issueTypeValue.textContent = data.IssueType || 'N/A'; 
  
  // Store issue type, room ID and update sections
  CURRENT_ROOM_ID = data.RoomID || null;
  CURRENT_ISSUE_TYPE = data.IssueType || '';
  
  // Fetch equipment inventory assigned to this room
  if (allAvailableItems.length === 0) {
    fetchMaintenanceInventory(CURRENT_ROOM_ID);
  }
  
  updateInventorySectionVisibility(CURRENT_ISSUE_TYPE);
  
  remarksTextarea.value = data.Remarks || '';
  
  // Reset Visibility
  inProgressBtn.style.display = '';
  inProgressBtn.disabled = false;
  doneBtn.disabled = false;
  remarksTextarea.disabled = false;

  // Set button states based on status
  if (data.Status === 'In Progress') {
    inProgressBtn.style.display = 'none'; 
  } else if (data.Status === 'Completed') {
    inProgressBtn.disabled = true;
    doneBtn.disabled = true;
    inProgressBtn.textContent = 'Task Completed';
    doneBtn.textContent = 'Task Completed';
    remarksTextarea.disabled = true; 
    inProgressBtn.style.display = ''; 
  }
}

// ===== INVENTORY SECTION VISIBILITY & MANAGEMENT =====
function updateInventorySectionVisibility(issueType) {
  if (furnitureSection) {
    furnitureSection.style.display = (issueType && issueType.includes('Furniture & Fixtures')) ? 'block' : 'none';
  }
  
  if (electricalSection) {
    electricalSection.style.display = (issueType && issueType.includes('Electrical & Lighting')) ? 'block' : 'none';
  }
  
  if (issueType && issueType.includes('Furniture & Fixtures')) {
    if (allFurnitureItems.length === 0) {
      fetchInventoryByType('Furniture & Fixtures', 'furniture', CURRENT_ROOM_ID);
    }
  }
  
  if (issueType && issueType.includes('Electrical & Lighting')) {
    if (allElectricalItems.length === 0) {
      fetchInventoryByType('Electrical & Lighting', 'electrical', CURRENT_ROOM_ID);
    }
  }
}

async function fetchInventoryByType(itemType, category, roomId) {
  try {
    let url = `api_staff_task.php?action=get_inventory&item_type=${encodeURIComponent(itemType)}`;
    if (roomId) {
      url += `&room_id=${roomId}`;
    }
    const response = await fetch(url);
    const result = await response.json();

    if (Array.isArray(result)) {
      let itemsToUse = result;
      if (category === 'furniture') {
        allFurnitureItems = itemsToUse;
        if (furnitureSelect) {
          renderCategoryDropdown(furnitureSelect, allFurnitureItems, 'furniture');
        }
      } else if (category === 'electrical') {
        allElectricalItems = itemsToUse;
        if (electricalSelect) {
          renderCategoryDropdown(electricalSelect, allElectricalItems, 'electrical');
        }
      }
    }
  } catch (err) {
    console.error(`Failed to load ${category} inventory:`, err);
  }
}

function renderCategoryDropdown(selectElement, itemsToRender, category = null) {
  if (!selectElement) return;
  selectElement.innerHTML = '<option value="">-- Select an item to add --</option>';
  
  const grouped = {};
  itemsToRender.forEach(item => {
    const cat = item.Category || 'Other';
    if (!grouped[cat]) {
      grouped[cat] = [];
    }
    grouped[cat].push(item);
  });
  
  Object.keys(grouped).sort().forEach(catName => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = catName;
    
    grouped[catName].forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.ItemID;
      opt.dataset.name = item.ItemName;
      opt.dataset.max = item.ItemQuantity;
      if ((category === 'electrical' || category === 'furniture') && item.room_item_id) {
        opt.dataset.roomItemId = item.room_item_id;
      }
      opt.textContent = `${item.ItemName} (${item.ItemQuantity}${category === 'electrical' ? ' in room' : ''})`;
      optgroup.appendChild(opt);
    });
    
    selectElement.appendChild(optgroup);
  });
}

// ===== EVENT LISTENER SETUP =====
function setupEventListeners() {
    inProgressBtn.addEventListener('click', () => {
        updateTaskStatus('In Progress');
    });

    doneBtn.addEventListener('click', () => {
        modalBackdrop.style.display = 'flex';
    });

    modalCancel.addEventListener('click', () => {
        modalBackdrop.style.display = 'none';
    });

    modalSave.addEventListener('click', async () => {
        modalSave.disabled = true;
        modalSave.textContent = 'Saving...';
        await updateTaskStatus('Completed');
        modalSave.disabled = false;
        modalSave.textContent = 'Save';
    });

    modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
            modalBackdrop.style.display = 'none';
        }
    });
}

function showToast(message, type = 'success') {
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast toast-${type} toast-visible`;
    setTimeout(() => {
        toast.classList.remove('toast-visible');
    }, 3000);
}

async function updateTaskStatus(newStatus) {
    const taskData = {
    request_id: CURRENT_REQUEST_ID,
    status: newStatus,
    remarks: remarksTextarea.value,
    used_items: usedItems,
    used_furniture: usedFurnitureItems,
    used_electrical: usedElectricalItems
  };

  try {
    const response = await fetch('api_staff_task.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update_task_status',
        data: taskData
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.status === 'success') {
      showToast(`✅ Task status updated to ${newStatus}`, 'success');
      
      if (newStatus === 'Completed') {
         modalBackdrop.style.display = 'none';
         setTimeout(() => {
             window.location.reload();
         }, 1500);
      } else {
         fetchTaskDetails(CURRENT_REQUEST_ID);
      }
    } else {
      showToast(`⚠️ Error: ${result.message}`, 'error');
    }
  } catch (error) {
    console.error('Error updating task status:', error);
    showToast('Error: Could not connect to server to update status.', 'error');
  }
}

// ===== VIEW CONTROLS =====
function showLoadingView() {
    if (taskContent) taskContent.style.display = 'none';
    if (errorState) errorState.style.display = 'none';
    if (loadingState) loadingState.style.display = 'block';
}

function showErrorView(message) {
    if (taskContent) taskContent.style.display = 'none';
    if (loadingState) loadingState.style.display = 'none';
    if (errorMessage) errorMessage.textContent = message;
    if (errorState) errorState.style.display = 'block';
}

function showTaskView() {
    if (loadingState) loadingState.style.display = 'none';
    if (errorState) errorState.style.display = 'none';
    if (taskContent) taskContent.style.display = 'block';
}

// ===== INVENTORY LOGIC =====
async function fetchMaintenanceInventory(roomId = null) {
    try {
        let url = 'api_staff_task.php?action=get_inventory&item_type=Equipment';
        const response = await fetch(url);
        const result = await response.json();

        if (Array.isArray(result)) {
            allAvailableItems = result;
            renderInventoryDropdown(allAvailableItems);
        } else {
            if(inventorySelect) inventorySelect.innerHTML = '<option value="">No equipment available</option>';
        }
    } catch (err) {
        console.error('Failed to load inventory:', err);
        if(inventorySelect) inventorySelect.innerHTML = '<option value="">Error loading items</option>';
    }
}

function renderInventoryDropdown(itemsToRender) {
    if (!inventorySelect) return;
    inventorySelect.innerHTML = '<option value="">-- Select an item to add --</option>';
    
    const grouped = {};
    itemsToRender.forEach(item => {
        const cat = item.Category || 'Other';
        if (!grouped[cat]) {
            grouped[cat] = [];
        }
        grouped[cat].push(item);
    });
    
    Object.keys(grouped).sort().forEach(catName => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = catName;
        
        grouped[catName].forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.ItemID;
            opt.dataset.name = item.ItemName;
            opt.dataset.max = item.ItemQuantity;
            opt.textContent = `${item.ItemName} (${item.ItemQuantity} in stock)`;
            optgroup.appendChild(opt);
        });
        
        inventorySelect.appendChild(optgroup);
    });
}

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredItems = allAvailableItems.filter(item => 
            item.ItemName.toLowerCase().includes(searchTerm)
        );
        renderInventoryDropdown(filteredItems);
    });
}

if (addItemBtn) {
    addItemBtn.addEventListener('click', () => {
        if (!inventorySelect || !inventoryQty) return;

        const itemId = inventorySelect.value;
        if (!itemId) return showToast('Please select an item.', 'error');

        const selectedOption = inventorySelect.options[inventorySelect.selectedIndex];
        const itemName = selectedOption.dataset.name;
        const maxQty = parseInt(selectedOption.dataset.max);
        const qty = parseInt(inventoryQty.value);

        if (qty <= 0) return showToast('Quantity must be at least 1.', 'error');
        if (qty > maxQty) return showToast(`Only ${maxQty} in stock!`, 'error');

        const existing = usedItems.find(i => i.id === itemId);
        if (existing) {
            if (existing.qty + qty > maxQty) return showToast(`Cannot exceed stock limit of ${maxQty}.`, 'error');
            existing.qty += qty;
        } else {
            usedItems.push({ id: itemId, name: itemName, qty: qty });
        }

        searchInput.value = '';
        renderInventoryDropdown(allAvailableItems);
        inventorySelect.value = '';
        inventoryQty.value = 1;
        renderUsedItems();
    });
}

function renderUsedItems() {
    if(!selectedItemsList) return;
    selectedItemsList.innerHTML = '';
    usedItems.forEach((item, index) => {
        const li = document.createElement('li');
        li.style.cssText = "display: flex; justify-content: space-between; padding: 8px; background: #fff; border: 1px solid #eee; margin-bottom: 5px; border-radius: 4px;";
        li.innerHTML = `
            <span><strong>${item.qty}x</strong> ${item.name}</span>
            <button type="button" onclick="removeUsedItem(${index})" style="color: #dc3545; background: none; border: none; cursor: pointer;"><i class="fas fa-times"></i></button>
        `;
        selectedItemsList.appendChild(li);
    });
}

window.removeUsedItem = function(index) {
    usedItems.splice(index, 1);
    renderUsedItems();
};

// ===== FURNITURE & FIXTURES HANDLING =====
function renderUsedFurniture() {
    if (!selectedFurnitureList) return;
    selectedFurnitureList.innerHTML = '';
    usedFurnitureItems.forEach((item, index) => {
        const li = document.createElement('li');
        li.style.cssText = "display: flex; justify-content: space-between; padding: 8px; background: #fff; border: 1px solid #eee; margin-bottom: 5px; border-radius: 4px;";
        li.innerHTML = `
            <span>${item.name}</span>
            <button type="button" onclick="removeUsedFurniture(${index})" style="color: #dc3545; background: none; border: none; cursor: pointer;"><i class="fas fa-times"></i></button>
        `;
        selectedFurnitureList.appendChild(li);
    });
}

window.removeUsedFurniture = function(index) {
    usedFurnitureItems.splice(index, 1);
    renderUsedFurniture();
};

if (furnitureSelect) {
    furnitureSelect.addEventListener('change', (e) => {
        const itemId = e.target.value;
        if (!itemId) return; 
        
        const selectedOption = e.target.options[e.target.selectedIndex];
        const itemName = selectedOption.dataset.name;
        const roomItemId = selectedOption.dataset.roomItemId;
        
        const existing = usedFurnitureItems.find(i => i.id === itemId);
        if (!existing) {
            usedFurnitureItems.push({ id: itemId, name: itemName, qty: 1, room_item_id: roomItemId });
            renderUsedFurniture();
            showToast(`✓ Added: ${itemName}`, 'success');
        } else {
            showToast(`✓ Already selected: ${itemName}`, 'success');
        }
        e.target.value = '';
    });
}

// ===== ELECTRICAL & LIGHTING HANDLING =====
function renderUsedElectrical() {
    if (!selectedElectricalList) return;
    selectedElectricalList.innerHTML = '';
    usedElectricalItems.forEach((item, index) => {
        const li = document.createElement('li');
        li.style.cssText = "display: flex; justify-content: space-between; padding: 8px; background: #fff; border: 1px solid #eee; margin-bottom: 5px; border-radius: 4px;";
        li.innerHTML = `
            <span>${item.name}</span>
            <button type="button" onclick="removeUsedElectrical(${index})" style="color: #dc3545; background: none; border: none; cursor: pointer;"><i class="fas fa-times"></i></button>
        `;
        selectedElectricalList.appendChild(li);
    });
}

window.removeUsedElectrical = function(index) {
    usedElectricalItems.splice(index, 1);
    renderUsedElectrical();
};

if (electricalSelect) {
    electricalSelect.addEventListener('change', (e) => {
        const itemId = e.target.value;
        if (!itemId) return; 
        
        const selectedOption = e.target.options[e.target.selectedIndex];
        const itemName = selectedOption.dataset.name;
        const roomItemId = selectedOption.dataset.roomItemId;
        
        const existing = usedElectricalItems.find(i => i.id === itemId);
        if (!existing) {
            usedElectricalItems.push({ id: itemId, name: itemName, qty: 1, room_item_id: roomItemId });
            renderUsedElectrical();
            showToast(`✓ Added: ${itemName}`, 'success');
        } else {
            showToast(`✓ Already selected: ${itemName}`, 'success');
        }
        e.target.value = '';
    });
}