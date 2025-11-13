// ===== HISTORY TAB FUNCTIONS =====

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
            (h.issueType && h.issueType.toLowerCase().includes(search)) || // MODIFIED to taskType
            (h.staff && h.staff.toLowerCase().includes(search)) ||
            (h.status && h.status.toLowerCase().includes(search));
        
        return matchFloor && matchRoom && matchDate && matchSearch;
    });

    renderHistoryTable();
}

/**
 * Renders the history table with pagination
 */
function renderHistoryTable() {
    const tbody = document.getElementById('historyTableBody');
    const recordCountEl = document.getElementById('historyRecordCount');
    const paginationControlsContainerId = 'historyPaginationControls';
    const state = paginationState.history;

    if (!tbody || !recordCountEl) return;

    const totalPages = getTotalPages(filteredHistory.length, state.itemsPerPage);
    if (state.currentPage > totalPages) {
        state.currentPage = Math.max(1, totalPages);
    }
    const paginatedData = paginateData(filteredHistory, state.currentPage, state.itemsPerPage);

    recordCountEl.textContent = filteredHistory.length;

    if (paginatedData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">No history found matching filters.</td></tr>';
    } else {
        tbody.innerHTML = paginatedData.map(h => `
            <tr>
                <td>${h.floor ?? 'N/A'}</td>
                <td>${h.room ?? 'N/A'}</td>
                <td>${h.issueType ?? 'N/A'}</td> <td>${h.date ?? 'N/A'}</td>
                <td>${h.requestedTime ?? 'N/A'}</td>
                <td>${h.completedTime ?? 'N/A'}</td>
                <td>${h.staff ?? 'N/A'}</td>
                <td><span class="statusBadge ${h.status?.toLowerCase()}">${h.status ?? 'N/A'}</span></td>
                <td title="${h.remarks || ''}">${h.remarks ? h.remarks.substring(0, 50) + '...' : ''}</td>
            </tr>
        `).join('');
    }

    renderPaginationControls(paginationControlsContainerId, totalPages, state.currentPage, (page) => {
        state.currentPage = page;
        renderHistoryTable();
    });
}

/**
 * Resets history filters and re-renders
 */
function handleRefreshHistory() {
    console.log("Refreshing history data...");
    document.getElementById('floorFilterHistory').value = '';
    document.getElementById('roomFilterHistory').value = '';
    document.getElementById('dateFilterHistory').value = '';
    document.getElementById('historySearchInput').value = '';

    updateHistoryRoomFilterOptions();
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
        ['Floor', 'Room', 'Task', 'Date', 'Requested', 'Completed', 'Staff', 'Status', 'Remarks'] // MODIFIED
    ];

    // Map the filtered data to match the headers
    const bodyData = filteredHistory.map(h => [
        h.floor ?? 'N/A',
        h.room ?? 'N/A',
        h.issueType ?? 'N/A', // MODIFIED (was issueType)
        h.date ?? 'N/A',
        h.requestedTime ?? 'N/A',
        h.completedTime ?? 'N/A',
        h.staff ?? 'N/A',
        h.status ?? 'N/A',
        h.remarks ?? ''
    ]);

    // Add a title
    doc.setFontSize(18);
    doc.text("Housekeeping History Report", 14, 22); // MODIFIED

    // Add the table
    doc.autoTable({
        startY: 30,
        head: headers,
        body: bodyData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
        didParseCell: (data) => {
            // Truncate remarks
            if (data.column.dataKey === 8) { // 8 is the index for Remarks
                if (data.cell.raw) {
                    data.cell.text = data.cell.raw.substring(0, 30) + (data.cell.raw.length > 30 ? '...' : '');
                }
            }
        }
    });

    doc.save(`housekeeping-history-${new Date().toISOString().split('T')[0]}.pdf`); // MODIFIED
}