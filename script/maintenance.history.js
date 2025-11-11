// ===== HISTORY TAB FUNCTIONS =====

// --- REMOVED: DOMContentLoaded listener ---

/**
 * Main function to filter data, update pagination, and render the table
 */
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
function renderHistoryTable() {
    const tbody = document.getElementById('historyTableBody');
    const recordCountEl = document.getElementById('historyRecordCount');
    const paginationControlsContainerId = 'historyPaginationControls';
    const state = paginationState.history; // Get pagination state for history

    if (!tbody || !recordCountEl) return;

    // Get total pages and current page data
    const totalPages = getTotalPages(filteredHistory.length, state.itemsPerPage);
    if (state.currentPage > totalPages) {
        state.currentPage = Math.max(1, totalPages);
    }
    const paginatedData = paginateData(filteredHistory, state.currentPage, state.itemsPerPage);

    // Render table rows
    if (paginatedData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No history records found.</td></tr>'; // Colspan is 9
    } else {
        tbody.innerHTML = paginatedData.map(h => {
            return `
                <tr>
                    <td>${h.floor ?? 'N/A'}</td>
                    <td>${h.room ?? 'N/A'}</td>
                    <td>${h.issueType ?? 'N/A'}</td>
                    <td>${h.date ?? 'N/A'}</td>
                    <td>${h.requestedTime ?? 'N/A'}</td>
                    <td>${h.completedTime ?? 'N/A'}</td>
                    <td>${h.staff ?? 'N/A'}</td>
                    <td><span class="statusBadge ${h.status?.toLowerCase()}">${h.status ?? 'N/A'}</span></td>
                    <td>${h.remarks ?? ''}</td>
                </tr>
            `;
        }).join('');
    }

    // Update record count and render pagination controls
    recordCountEl.textContent = filteredHistory.length;
    renderPaginationControls(paginationControlsContainerId, totalPages, state.currentPage, (page) => {
        state.currentPage = page;
        renderHistoryTable(); // Re-render table for the new page
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

/**
 * Downloads the *filtered* history data as a PDF
 */
function downloadHistoryPDF() {
    if (filteredHistory.length === 0) {
        alert("No history data to export based on current filters.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Define the headers
    const headers = [
        ['Floor', 'Room', 'Type', 'Date', 'Requested', 'Completed', 'Staff', 'Status', 'Remarks']
    ];

    // Map the filtered data to match the headers
    // This uses the already filtered and sorted `filteredHistory` array
    const bodyData = filteredHistory.map(h => [
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

    // Add a title
    doc.setFontSize(18);
    doc.text("Maintenance History Report", 14, 22);

    // Add the table
    doc.autoTable({
        startY: 30,
        head: headers,
        body: bodyData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] }, // Blue header
        styles: { fontSize: 8 },
        columnStyles: {
            2: { cellWidth: 30 }, // Type
            8: { cellWidth: 40 }  // Remarks
        }
    });

    // Save the PDF
    doc.save('maintenance-history.pdf');
}