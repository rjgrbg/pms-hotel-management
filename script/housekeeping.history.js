// ===== HELPER FUNCTIONS =====

/**
 * Security Fix: Converts HTML characters to safe entities.
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

// ===== HISTORY TAB FUNCTIONS =====

/**
 * Main function to filter data, update pagination, and render the table
 */
function applyHistoryFiltersAndRender() {
    const floor = document.getElementById('floorFilterHistory')?.value || '';
    const room = document.getElementById('roomFilterHistory')?.value || '';
    
    // NEW: Get Start and End dates
    const startDateVal = document.getElementById('startDateFilterHistory')?.value || '';
    const endDateVal = document.getElementById('endDateFilterHistory')?.value || '';
    
    const search = document.getElementById('historySearchInput')?.value.toLowerCase() || '';

    // Filter the data
    filteredHistory = currentHistoryData.filter(h => {
        const matchFloor = !floor || (h.floor && h.floor.toString() === floor);
        const matchRoom = !room || (h.room && h.room.toString() === room);
        
        // NEW: Date Range Logic
        let matchDate = true;
        if (startDateVal || endDateVal) {
            // h.date format is MM.DD.YYYY e.g., "10.25.2023"
            if (!h.date || h.date === 'N/A') {
                matchDate = false;
            } else {
                const parts = h.date.split('.');
                // Create date object (Month is 0-indexed in JS)
                const rowDate = new Date(parts[2], parts[0] - 1, parts[1]);
                rowDate.setHours(0, 0, 0, 0);

                if (startDateVal) {
                    const start = new Date(startDateVal);
                    start.setHours(0, 0, 0, 0);
                    if (rowDate < start) matchDate = false;
                }
                if (endDateVal && matchDate) {
                    const end = new Date(endDateVal);
                    end.setHours(0, 0, 0, 0);
                    if (rowDate > end) matchDate = false;
                }
            }
        }

        const matchSearch = !search ||
            (h.room && h.room.toString().includes(search)) ||
            (h.issueType && h.issueType.toLowerCase().includes(search)) ||
            (h.staff && h.staff.toLowerCase().includes(search)) ||
            (h.status && h.status.toLowerCase().includes(search));
        
        return matchFloor && matchRoom && matchDate && matchSearch;
    });

    renderHistoryTable();
}

/**
 * Renders the history table with pagination and HTML escaping
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
        tbody.innerHTML = paginatedData.map(h => {
            // 1. Prepare Safe Data (Escape EVERYTHING)
            const safeFloor = escapeHtml(h.floor ?? 'N/A');
            const safeRoom = escapeHtml(h.room ?? 'N/A');
            const safeType = escapeHtml(h.issueType ?? 'N/A');
            const safeDate = escapeHtml(h.date ?? 'N/A');
            const safeReqTime = escapeHtml(h.requestedTime ?? 'N/A');
            const safeCompTime = escapeHtml(h.completedTime ?? 'N/A');
            const safeStaff = escapeHtml(h.staff ?? 'N/A');
            const safeStatus = escapeHtml(h.status ?? 'N/A');
            
            // 2. Handle Remarks:
            const rawRemarks = h.remarks ?? '';
            const safeFullRemarks = escapeHtml(rawRemarks);
            const truncatedRaw = rawRemarks.length > 50 ? rawRemarks.substring(0, 50) + '...' : rawRemarks;
            const safeDisplayRemarks = escapeHtml(truncatedRaw);

            // 3. Status Class (for coloring)
            const statusClass = h.status ? h.status.toLowerCase().replace(' ', '-') : '';

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
    
    // Reset both date inputs
    if(document.getElementById('startDateFilterHistory')) document.getElementById('startDateFilterHistory').value = '';
    if(document.getElementById('endDateFilterHistory')) document.getElementById('endDateFilterHistory').value = '';
    
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
        ['Floor', 'Room', 'Task', 'Date', 'Requested', 'Completed', 'Staff', 'Status', 'Remarks']
    ];

    // Map the filtered data to match the headers
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
    doc.text("Housekeeping History Report", 14, 22);

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

    doc.save(`housekeeping-history-${new Date().toISOString().split('T')[0]}.pdf`);
}