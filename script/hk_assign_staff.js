// ===== HOUSEKEEPING TASK DETAILS PAGE SCRIPT =====

// --- GLOBALS ---
let CURRENT_TASK_ID = null;
let usedItems = []; 
let allAvailableItems = []; // NEW: Array to hold items for searching

// --- DOM ELEMENTS ---
const elements = {
    taskIdInput: document.getElementById('task-id'),
    roomNumber: document.getElementById('room-number'),
    dateRequested: document.getElementById('date-requested'),
    timeRequested: document.getElementById('time-requested'),
    taskType: document.getElementById('task-type'),
    currentStatus: document.getElementById('current-status'),
    remarksTextarea: document.getElementById('remarks-textarea'),
    inProgressBtn: document.getElementById('inProgressBtn'),
    doneBtn: document.getElementById('doneBtn'),
    modalBackdrop: document.getElementById('modalBackdrop'),
    modalCancel: document.getElementById('modalCancel'),
    modalSave: document.getElementById('modalSave'),
    successModal: document.getElementById('successModal'),
    okaySuccessBtn: document.getElementById('okaySuccessBtn'),
    loadingState: document.getElementById('loading-state'),
    errorState: document.getElementById('error-state'),
    errorMessage: document.getElementById('error-message'),
    taskContent: document.getElementById('task-content'),
    toast: document.getElementById('toast'), // Fixed comma!
    
    // NEW: Inventory Elements
    inventorySelect: document.getElementById('inventory-select'),
    inventoryQty: document.getElementById('inventory-qty'),
    addItemBtn: document.getElementById('add-item-btn'),
    selectedItemsList: document.getElementById('selected-items-list')
};

// ===== PAGE INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('Housekeeping Details page loaded');

  // 1. Get task_id from URL
  const urlParams = new URLSearchParams(window.location.search);
  const taskId = urlParams.get('task_id');

  if (!taskId) {
    showErrorView('Task ID not provided in the URL.', elements);
    return;
  }

  CURRENT_TASK_ID = taskId;
  elements.taskIdInput.value = taskId;
  
  // 2. Fetch task details from API
  fetchTaskDetails(CURRENT_TASK_ID, elements);
  
  // 3. Add Event Listeners
  addEventListeners(elements);
});

/**
 * Fetch task details from the new housekeeping API
 */
async function fetchTaskDetails(taskId, elements) {
    showLoadingView(elements);
    try {
        const response = await fetch(`api_hk_task.php?action=get_task_details&task_id=${taskId}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const result = await response.json();

        if (result.status === 'success') {
            populateTaskDetails(result.data, elements);
            showTaskView(elements);
        } else {
            showErrorView(result.message || 'Could not load task details.', elements);
        }
    } catch (error) {
        console.error('Fetch error:', error);
        showErrorView('An error occurred while fetching task details.', elements);
    }
}

/**
 * Populate the HTML with data from the API
 */
function populateTaskDetails(data, elements) {
    elements.roomNumber.textContent = data.RoomNumber || 'N/A';
    elements.dateRequested.textContent = data.DateRequested || 'N/A';
    elements.timeRequested.textContent = data.TimeRequested || 'N/A';
    elements.taskType.textContent = data.TaskType || 'N/A';
    elements.currentStatus.textContent = data.Status || 'N/A';

    // FIXED: Safety check prevents crashing if the remarks box is missing
    if (elements.remarksTextarea) {
        elements.remarksTextarea.value = data.Remarks || '';
        elements.remarksTextarea.disabled = false;
    }

    // Reset button visibility
    elements.inProgressBtn.style.display = ''; 
    elements.inProgressBtn.disabled = false;
    elements.doneBtn.disabled = false;

    if (data.Status === 'In Progress') {
        elements.inProgressBtn.style.display = 'none';
        
    } else if (data.Status === 'Completed') {
        elements.inProgressBtn.disabled = true;
        elements.doneBtn.disabled = true;
        if (elements.remarksTextarea) elements.remarksTextarea.disabled = true;
        elements.inProgressBtn.textContent = 'Task Completed';
        elements.inProgressBtn.style.display = ''; 
    }
}

/**
 * Add listeners for all buttons and modals
 */
function addEventListeners(elements) {
    // --- In Progress Button ---
    elements.inProgressBtn.addEventListener('click', () => {
        console.log('Setting status to In Progress...');
        updateTaskStatus('In Progress', elements);
    });

    // --- Done Button (opens modal) ---
    elements.doneBtn.addEventListener('click', () => {
        elements.modalBackdrop.style.display = 'flex';
    });

    // --- Modal Cancel Button ---
    elements.modalCancel.addEventListener('click', () => {
        elements.modalBackdrop.style.display = 'none';
    });

    // --- Modal Save Button (marks as Done) ---
    elements.modalSave.addEventListener('click', () => {
        console.log('Setting status to Completed...');
        updateTaskStatus('Completed', elements);
    });

    // --- Modal Backdrop (closes modal) ---
    elements.modalBackdrop.addEventListener('click', (e) => {
        if (e.target === elements.modalBackdrop) {
            elements.modalBackdrop.style.display = 'none';
        }
    });

    // --- Success Modal OK Button (Legacy) ---
    if (elements.okaySuccessBtn) {
        elements.okaySuccessBtn.addEventListener('click', () => {
            elements.successModal.style.display = 'none';
        });
    }
}

/**
 * Show Toast Notification
 */
function showToast(message, type = 'success') {
    if (!elements.toast) return;

    elements.toast.textContent = message;
    elements.toast.className = `toast toast-${type} toast-visible`;

    setTimeout(() => {
        elements.toast.classList.remove('toast-visible');
    }, 3000);
}

/**
 * Send the status update to the backend
 */
async function updateTaskStatus(newStatus, elements) {
 const taskData = {
    task_id: CURRENT_TASK_ID, 
    status: newStatus,
    // FIXED: Safely grab the text value
    remarks: elements.remarksTextarea ? elements.remarksTextarea.value : '', 
    used_items: usedItems 
  };

  // Disable buttons while processing
  elements.inProgressBtn.disabled = true;
  elements.doneBtn.disabled = true;

  try {
    const response = await fetch('api_hk_task.php', { 
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
      elements.currentStatus.textContent = newStatus;
      
      if (newStatus === 'Completed') {
         elements.modalBackdrop.style.display = 'none';
         elements.remarksTextarea.disabled = true;
         
         setTimeout(() => {
             window.location.reload();
         }, 1500);

      } else if (newStatus === 'In Progress') {
         // *** HIDE In Progress button immediately ***
         elements.inProgressBtn.style.display = 'none'; 
         elements.doneBtn.disabled = false; // Re-enable done button
      }
    } else {
      showToast(`⚠️ Error: ${result.message}`, 'error');
      // Re-enable buttons if error
      elements.inProgressBtn.disabled = false;
      elements.doneBtn.disabled = false;
    }
  } catch (error) {
    console.error('Update task status error:', error);
    showToast('Error: Could not connect to server to update status.', 'error');
    // Re-enable buttons if error
    elements.inProgressBtn.disabled = false;
    elements.doneBtn.disabled = false;
  }
}

// ===== VIEW CONTROLS =====

function showLoadingView(elements) {
    if (elements.taskContent) elements.taskContent.style.display = 'none';
    if (elements.errorState) elements.errorState.style.display = 'none';
    if (elements.loadingState) elements.loadingState.style.display = 'block';
}

function showErrorView(message, elements) {
    if (elements.taskContent) elements.taskContent.style.display = 'none';
    if (elements.loadingState) elements.loadingState.style.display = 'none';
    if (elements.errorMessage) elements.errorMessage.textContent = message;
    if (elements.errorState) elements.errorState.style.display = 'block';
}

function showTaskView(elements) {
    if (elements.loadingState) elements.loadingState.style.display = 'none';
    if (elements.errorState) elements.errorState.style.display = 'none';
    if (elements.taskContent) elements.taskContent.style.display = 'block';
}
// ===== NEW: INVENTORY LOGIC =====

async function fetchHousekeepingInventory() {
    try {
        const response = await fetch('api_hk_task.php?action=get_inventory');
        const result = await response.json();

        if (!result.error && Array.isArray(result)) {
            allAvailableItems = result.filter(item => 
                item.is_archived == 0 && 
                item.ItemQuantity > 0 &&
                (
                    item.Category === 'Cleaning Chemicals' || 
                    item.Category === 'Cleaning Tools' || 
                    item.Category === 'Linens & Fabrics' || 
                    item.Category === 'Refreshments' || 
                    item.Category === 'Stationary' || 
                    item.Category === 'Toiletries' ||
                    item.ItemType === 'Consumables'
                )
            );
            renderInventoryDropdown(allAvailableItems);
        } else {
            if(elements.inventorySelect) elements.inventorySelect.innerHTML = '<option value="">Failed to load items</option>';
        }
    } catch (err) {
        console.error('Failed to load inventory:', err);
        if(elements.inventorySelect) elements.inventorySelect.innerHTML = '<option value="">Error loading items</option>';
    }
}

// Function to draw the native dropdown
function renderInventoryDropdown(itemsToRender) {
    if (!elements.inventorySelect) return;
    elements.inventorySelect.innerHTML = '<option value="">Select Item...</option>';
    
    itemsToRender.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.ItemID;
        opt.dataset.name = item.ItemName;
        opt.dataset.max = item.ItemQuantity;
        opt.textContent = `${item.ItemName} (Stock: ${item.ItemQuantity})`;
        elements.inventorySelect.appendChild(opt);
    });
}

// Live Search Filter
const searchInput = document.getElementById('inventory-search');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        // Filter the array
        const filteredItems = allAvailableItems.filter(item => 
            item.ItemName.toLowerCase().includes(searchTerm)
        );
        // Redraw the standard dropdown
        renderInventoryDropdown(filteredItems);
    });
}

// Add Item Button Logic
const addItemBtn = document.getElementById('add-item-btn');
if (addItemBtn) {
    addItemBtn.addEventListener('click', () => {
        const select = elements.inventorySelect;
        const qtyInput = elements.inventoryQty;

        if (!select || !qtyInput) return;

        const itemId = select.value;
        if (!itemId) return showToast('Please select an item.', 'error');

        const selectedOption = select.options[select.selectedIndex];
        const itemName = selectedOption.dataset.name;
        const maxQty = parseInt(selectedOption.dataset.max);
        const qty = parseInt(qtyInput.value);

        if (qty <= 0) return showToast('Quantity must be at least 1.', 'error');
        if (qty > maxQty) return showToast(`Only ${maxQty} in stock!`, 'error');

        const existing = usedItems.find(i => i.id === itemId);
        if (existing) {
            if (existing.qty + qty > maxQty) return showToast(`Cannot exceed stock limit of ${maxQty}.`, 'error');
            existing.qty += qty;
        } else {
            usedItems.push({ id: itemId, name: itemName, qty: qty });
        }

        // Reset the form
        searchInput.value = '';
        renderInventoryDropdown(allAvailableItems); // Reset dropdown to full list
        select.value = '';
        qtyInput.value = 1;
        renderUsedItems();
    });
}

// Render the List below
function renderUsedItems() {
    if(!elements.selectedItemsList) return;
    elements.selectedItemsList.innerHTML = '';
    usedItems.forEach((item, index) => {
        const li = document.createElement('li');
        li.style.cssText = "display: flex; justify-content: space-between; padding: 8px; background: #fff; border: 1px solid #eee; margin-bottom: 5px; border-radius: 4px;";
        li.innerHTML = `
            <span><strong>${item.qty}x</strong> ${item.name}</span>
            <button type="button" onclick="removeUsedItem(${index})" style="color: #dc3545; background: none; border: none; cursor: pointer;"><i class="fas fa-times"></i></button>
        `;
        elements.selectedItemsList.appendChild(li);
    });
}

window.removeUsedItem = function(index) {
    usedItems.splice(index, 1);
    renderUsedItems();
};

document.addEventListener('DOMContentLoaded', fetchHousekeepingInventory);


