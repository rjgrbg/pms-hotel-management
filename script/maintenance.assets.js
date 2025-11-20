// ===== RENDER HOTEL ASSETS TABLE (Renamed) =====
function renderHotelAssetsTable() {
  const tbody = document.getElementById('hotelAssetsTableBody');
  const recordCountEl = document.getElementById('hotelAssetsRecordCount');
  const paginationControlsContainerId = 'hotelAssetsPaginationControls';
  const state = paginationState.hotelAssets;

  if (!tbody || !recordCountEl) return;

  const totalPages = getTotalPages(filteredHotelAssets.length, state.itemsPerPage);
  if (state.currentPage > totalPages) {
    state.currentPage = Math.max(1, totalPages);
  }
  const paginatedData = paginateData(filteredHotelAssets, state.currentPage, state.itemsPerPage);

  if (paginatedData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No assets found matching filters.</td></tr>';
  } else {
    tbody.innerHTML = paginatedData.map(asset => `
      <tr data-asset-id="${asset.id}">
        <td>${asset.floor ?? 'N/A'}</td>
        <td>${asset.room ?? 'N/A'}</td>
        <td>${asset.installedDate ?? 'N/A'}</td>
        <td>${asset.type ?? 'N/A'}</td>
        <td>${asset.item ?? 'N/A'}</td>
        <td>${asset.lastMaintained ?? 'Never'}</td>
        <td><span class="statusBadge ${asset.status === 'Working' ? 'repaired' : (asset.status === 'Needs Repair' || asset.status === 'Out of Service') ? 'urgent' : 'maintenance'}">${asset.status ?? 'Unknown'}</span></td>
        <td>${asset.remarks ?? ''}</td>
        <td>
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <button class="actionIconBtn edit-asset-btn" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="actionIconBtn delete-asset-btn" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // Use event delegation for asset buttons
    tbody.removeEventListener('click', handleHotelAssetsTableClick); // Prevent duplicate listeners
    tbody.addEventListener('click', handleHotelAssetsTableClick);
  }

  recordCountEl.textContent = filteredHotelAssets.length;
  renderPaginationControls(paginationControlsContainerId, totalPages, state.currentPage, (page) => {
    state.currentPage = page;
    renderHotelAssetsTable();
  });
}

// --- NEW: Event handler for ALL clicks on Hotel Assets table body ---
function handleHotelAssetsTableClick(e) {
    const editBtn = e.target.closest('.edit-asset-btn');
    if (editBtn) {
        const assetId = editBtn.closest('tr').dataset.assetId;
        handleEditHotelAsset(assetId);
        return;
    }

    const deleteBtn = e.target.closest('.delete-asset-btn');
    if (deleteBtn) {
        const assetId = deleteBtn.closest('tr').dataset.assetId;
        handleDeleteHotelAsset(assetId);
        return;
    }
}

// ===== ASSETS FILTERING LOGIC =====
function applyHotelAssetsFiltersAndRender() { // Renamed
  const floor = document.getElementById('floorFilterHotelAssets')?.value || '';
  const room = document.getElementById('roomFilterHotelAssets')?.value || '';
  const type = document.getElementById('typeFilterHotelAssets')?.value || '';
  const search = document.getElementById('hotelAssetsSearchInput')?.value.toLowerCase() || '';
  
  filteredHotelAssets = currentHotelAssetsData.filter(asset => { // Renamed
    const matchFloor = !floor || asset.floor.toString() === floor;
    const matchRoom = !room || asset.room.toString() === room; 
    const matchType = !type || asset.type === type;
    const matchSearch = !search || 
        asset.item.toLowerCase().includes(search) || 
        asset.type.toLowerCase().includes(search) ||
        (asset.modelNumber && asset.modelNumber.toLowerCase().includes(search));
    return matchFloor && matchRoom && matchType && matchSearch;
  });

  paginationState.hotelAssets.currentPage = 1; // Renamed
  renderHotelAssetsTable(); // Renamed
}

function resetHotelAssetsFilters() { // Renamed
    document.getElementById('floorFilterHotelAssets').value = '';
    document.getElementById('roomFilterHotelAssets').value = '';
    document.getElementById('typeFilterHotelAssets').value = '';
    document.getElementById('hotelAssetsSearchInput').value = '';
    applyHotelAssetsFiltersAndRender();
}

// ===== ASSET FORM & ACTION HANDLING =====
async function handleAddHotelAssetSubmit(e) { // Renamed
  e.preventDefault();
  
  const assetId = document.getElementById('hotelAssetId').value;
  const isEdit = assetId !== '';
  const modalSubtext = document.getElementById('addHotelAssetModalSubtext');
  const submitBtn = document.getElementById('submitHotelAssetBtn');
  
  modalSubtext.textContent = 'Processing...';
  modalSubtext.classList.remove('modal-error-message');
  modalSubtext.style.color = '';
  submitBtn.disabled = true;

  let action, body;
  
  // Use the new API actions from my previous JS
  if (isEdit) {
    action = 'edit_asset';
    body = {
      action: action,
      assetId: assetId,
      roomId: document.getElementById('hotelAssetRoom').value,
      assetName: document.getElementById('hotelAssetName').value,
      assetType: document.getElementById('hotelAssetType').value,
      manufacturer: document.getElementById('hotelAssetManufacturer').value,
      modelNumber: document.getElementById('hotelAssetModelNumber').value,
      installedDate: document.getElementById('hotelAssetInstalledDate').value,
      status: document.getElementById('hotelAssetStatus').value,
      remarks: document.getElementById('hotelAssetRemarks').value,
    };
  } else {
    action = 'add_asset';
    body = {
      action: action,
      roomId: document.getElementById('hotelAssetRoom').value,
      assetName: document.getElementById('hotelAssetName').value, // Renamed
      assetType: document.getElementById('hotelAssetType').value, // Renamed
      manufacturer: document.getElementById('hotelAssetManufacturer').value,
      modelNumber: document.getElementById('hotelAssetModelNumber').value,
      installedDate: document.getElementById('hotelAssetInstalledDate').value,
      status: 'Working', // Default status for new
      remarks: ""
    };
  }
  
  try {
    const result = await handleApiCall(action, body);

    if (result.success) { // Use 'success' boolean
      hideAddHotelAssetModal();
      
      const updatedAsset = result.updatedAsset || result.newAsset; // Get asset data from response
      
      if (isEdit) {
        const index = currentHotelAssetsData.findIndex(app => app.id == updatedAsset.id);
        if (index !== -1) {
          currentHotelAssetsData[index] = updatedAsset;
        }
      } else {
        currentHotelAssetsData.push(updatedAsset);
      }

      // Update the Requests tab data visually
      const affectedRoomId = updatedAsset.roomId;
      const roomInRequests = currentRequestsData.find(room => room.id == affectedRoomId);

      if (roomInRequests) {
        const assetStatus = updatedAsset.status;
        if (assetStatus === 'Needs Repair' || assetStatus === 'Out of Service') {
            roomInRequests.status = 'Needs Maintenance';
        } else if (assetStatus === 'Working') {
            // Check if other assets in the same room are broken
            const otherBroken = currentHotelAssetsData.some(app => 
                app.roomId == affectedRoomId && 
                app.id != updatedAsset.id && 
                (app.status === 'Needs Repair' || app.status === 'Out of Service')
            );
            if (!otherBroken && (roomInRequests.status === 'Needs Maintenance' || roomInRequests.status === 'Pending')) {
                roomInRequests.status = 'Available';
                roomInRequests.date = 'N/A';
                roomInRequests.requestTime = 'N/A';
            }
        }
      }
      
      applyHotelAssetsFiltersAndRender();
      applyRequestFiltersAndRender(); 
      
      showSuccessModal(isEdit ? 'Asset Updated Successfully' : 'Asset Added Successfully');
      
    } else {
      console.error('API Error:', result.message);
      modalSubtext.textContent = result.message; 
      modalSubtext.classList.add('modal-error-message');
      modalSubtext.style.color = 'red';
    }
  } catch (error) {
    console.error('API Call Failed:', error);
    modalSubtext.textContent = error.message; 
    modalSubtext.classList.add('modal-error-message');
    modalSubtext.style.color = 'red';
  } finally {
    submitBtn.disabled = false;
  }
}

function handleEditHotelAsset(assetId) { // Renamed
  const asset = currentHotelAssetsData.find(a => a.id == assetId); 
  if (!asset) {
      console.error('Asset not found:', assetId);
      return;
  }
  currentHotelAssetId = assetId;
  showAddHotelAssetModal(true, asset);
}

function handleDeleteHotelAsset(assetId) { // Renamed
  currentHotelAssetId = assetId;
  showDeleteModal();
}

async function handleConfirmDelete() {
  if (!currentHotelAssetId) {
      console.error('No asset ID set!');
      return;
  }
  
  const assetToDelId = currentHotelAssetId;
  currentHotelAssetId = null;
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  
  confirmBtn.disabled = true;
  
  try {
    const result = await handleApiCall('delete_asset', { assetId: assetToDelId }); // Use assetId

    hideDeleteModal();

    if (result && result.success) { // Check for 'success' boolean
      const index = currentHotelAssetsData.findIndex(app => app.id == assetToDelId);
      if (index !== -1) {
        currentHotelAssetsData.splice(index, 1);
      }
      
      showSuccessModal('Asset Deleted Successfully');
      applyHotelAssetsFiltersAndRender();
      
    } else {
        alert(`Error deleting asset: ${result.message}`);
    }
  } catch (error) {
    console.error('Error in handleConfirmDelete:', error);
    hideDeleteModal();
    alert(`An error occurred: ${error.message}`);
  } finally {
      confirmBtn.disabled = false;
  }
}

// ===== ASSETS CSV DOWNLOAD =====
function downloadHotelAssetsCSV() { // Renamed
    if (filteredHotelAssets.length === 0) { // Renamed
        alert("No hotel asset data to export based on current filters."); // Renamed
        return;
    }
    const headers = ['Floor', 'Room', 'Installed Date', 'Types', 'Items', 'Last Maintained', 'Status', 'Remarks'];
    const csvContent = [
        headers.join(','),
        ...filteredHotelAssets.map(asset => // Renamed
            [
                asset.floor,
                asset.room,
                asset.installedDate,
                asset.type,
                `"${asset.item.replace(/"/g, '""')}"`,
                asset.lastMaintained,
                asset.status,
                `"${(asset.remarks || '').replace(/"/g, '""')}"`
             ].join(',')
        )
    ].join('\n');
    downloadCSV(csvContent, 'hotel-assets'); // Renamed
}