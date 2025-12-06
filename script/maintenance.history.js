// ===== HISTORY TAB FUNCTIONS =====

// --- REMOVED: DOMContentLoaded listener ---

/**
 * Main function to filter data, update pagination, and render the table
 */
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
function applyHistoryFiltersAndRender() {
    const floor = document.getElementById('floorFilterHistory')?.value || '';
    const room = document.getElementById('roomFilterHistory')?.value || '';
    const dateInput = document.getElementById('dateFilterHistory')?.value || '';
    const search = document.getElementById('historySearchInput')?.value.toLowerCase() || '';

    // Convert YYYY-MM-DD to MM.DD.YYYY to match PHP data format
    let formattedDate = '';
    if (dateInput) {
        const parts = dateInput.split('-');
        formattedDate = `${parts[1]}.${parts[2]}.${parts[0]}`;
    }

    // Filter the data
    filteredHistory = currentHistoryData.filter(h => {
        const matchFloor = !floor || (h.floor && h.floor.toString() === floor);
        const matchRoom = !room || (h.room && h.room.toString() === room);
        const matchDate = !formattedDate || (h.date && h.date === formattedDate);

        const matchSearch = !search ||
            (h.room && h.room.toString().includes(search)) ||
            (h.issueType && h.issueType.toLowerCase().includes(search)) ||
            (h.staff && h.staff.toLowerCase().includes(search)) ||
            (h.status && h.status.toLowerCase().includes(search)) ||
            (h.remarks && h.remarks.toLowerCase().includes(search));

        return matchFloor && matchRoom && matchDate && matchSearch;
    });

    // Reset to page 1 for any new filter, but only if it's not just a re-render
    if (paginationState.history.currentPage !== 1) {
        paginationState.history.currentPage = 1;
    }

    // Render the table and pagination
    renderHistoryTable();
}

/**
 * Renders the rows for the history table based on pagination
 */
/**
 * Renders the Maintenance History Table with HTML Escaping
 */
function renderMTHistTable(data = mtHistData) {
    const tbody = document.getElementById('mtHistTableBody');
    if (!tbody) return;
    
    const state = paginationState.maintenanceHistory;
    const totalPages = getTotalPages(data.length, state.itemsPerPage);
    
    // Safety check
    if (state.currentPage > totalPages) state.currentPage = Math.max(1, totalPages);
    
    const paginatedData = paginateData(data, state.currentPage, state.itemsPerPage);
  
    if (paginatedData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No records found</td></tr>';
    } else {
        tbody.innerHTML = paginatedData.map(row => {
            const statusClass = getMtHistoryStatusClass(row.status);
            
            // --- FIX: ESCAPE ALL DATA TO PREVENT LARGE TEXT/TAGS ---
            const safeFloor = escapeHtml(row.floor ?? 'N/A');
            const safeRoom = escapeHtml(row.room ?? 'N/A');
            const safeType = escapeHtml(row.issueType ?? 'N/A');
            const safeDate = escapeHtml(row.date ?? 'N/A');
            const safeReqTime = escapeHtml(row.requestedTime ?? 'N/A');
            const safeCompTime = escapeHtml(row.completedTime ?? 'N/A');
            const safeStaff = escapeHtml(row.staff ?? 'N/A');
            const safeStatus = escapeHtml(row.status ?? 'N/A');
            
            // Fix Remarks: Truncate and Escape
            const rawRemarks = row.remarks ?? '';
            const safeFullRemarks = escapeHtml(rawRemarks); 
            const truncatedRaw = rawRemarks.length > 30 ? rawRemarks.substring(0, 30) + '...' : rawRemarks;
            const safeDisplayRemarks = escapeHtml(truncatedRaw);

            return `
                <tr>
                    <td>${safeFloor}</td>
                    <td>${safeRoom}</td>
                    <td>${safeType}</td>
                    <td>${safeDate}</td>
                    <td>${safeReqTime}</td>
                    <td>${safeCompTime}</td>
                    <td>${safeStaff}</td>
                    <td><span class="statusBadge ${statusClass}">${safeStatus}</span></td>
                    <td title="${safeFullRemarks}">${safeDisplayRemarks}</td>
                </tr>
            `;
        }).join('');
    }
  
    const recordCount = document.getElementById('mtHistRecordCount');
    if (recordCount) recordCount.textContent = data.length;
    
    renderPaginationControls('mt-history-tab', totalPages, state.currentPage, (page) => {
        state.currentPage = page;
        renderMTHistTable(data);
    });
}
/**
 * Resets all history filters and re-renders the table
 */
function resetHistoryFilters() {
    document.getElementById('floorFilterHistory').value = '';
    document.getElementById('roomFilterHistory').value = '';
    document.getElementById('dateFilterHistory').value = '';
    document.getElementById('historySearchInput').value = '';

    // Re-apply filters (which are all empty) and render
    applyHistoryFiltersAndRender();
}


// Initialize download button handler
function initHistoryDownload() {
  const downloadBtn = document.getElementById('historyDownloadBtn');
  if (downloadBtn) {
    downloadBtn.onclick = () => {
      if (filteredHistory.length === 0) {
        alert('No data available to download');
        return;
      }
      const headers = ['Floor', 'Room', 'Type', 'Date', 'Requested Time', 'Completed Time', 'Staff', 'Status', 'Remarks'];
      const tableData = filteredHistory.map(h => [
        h.floor ?? 'N/A',
        h.room ?? 'N/A',
        h.issueType ?? 'N/A',
        h.date ?? 'N/A',
        h.requestedTime ?? 'N/A',
        h.completedTime ?? 'N/A',
        h.staff ?? 'N/A',
        h.status ?? 'N/A',
        h.remarks ?? ''
      ]);
      if (typeof downloadData === 'function') {
        downloadData(headers, tableData, 'Maintenance History Report', 'maintenance-history');
      } else {
        alert('Download utility not available. Please refresh the page.');
      }
    };
  }
}