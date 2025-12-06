/**
 * DOWNLOAD UTILITIES MODULE
 * Provides reusable download functionality for PDF and Excel exports
 */

// ==========================================
// 1. MODAL HTML INJECTION
// ==========================================

function injectDownloadModal() {
    if (document.getElementById('downloadFormatModal')) return; // Already injected

    const modalHTML = `
        <div class="modalBackdrop" id="downloadFormatModal" style="display: none;">
            <div class="downloadFormatModal">
                <button class="closeBtn" id="closeDownloadFormatBtn">×</button>
                <div class="modalIcon">
                    <img src="assets/icons/download-icon.png" alt="Download" style="width: 60px; height: 60px; filter: brightness(0) saturate(100%) invert(74%) sepia(54%) saturate(2154%) hue-rotate(343deg) brightness(101%) contrast(98%);" />
                </div>
                <h2>Choose Download Format</h2>
                <p>Select the format you want to download the data in:</p>
                <div class="downloadFormatButtons">
                    <button class="downloadFormatBtn pdfBtn" id="downloadPdfBtn">
                        <i class="fas fa-file-pdf"></i>
                        <span>PDF</span>
                    </button>
                    <button class="downloadFormatBtn excelBtn" id="downloadExcelBtn">
                        <i class="fas fa-file-excel"></i>
                        <span>Excel</span>
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// ==========================================
// 2. MODAL STYLES INJECTION
// ==========================================

function injectDownloadModalStyles() {
    if (document.getElementById('downloadModalStyles')) return; // Already injected

    const styles = document.createElement('style');
    styles.id = 'downloadModalStyles';
    styles.textContent = `
        .downloadFormatModal {
            background: rgb(72, 12, 27);
            border-radius: 12px;
            padding: 30px;
            width: 90%;
            max-width: 450px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            position: relative;
            text-align: center;
            animation: modalSlideIn 0.3s ease;
        }

        .downloadFormatModal .modalIcon {
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
        }

        .downloadFormatModal h2 {
            color: rgb(252, 160, 55);
            margin: 15px 0 10px 0;
            font-size: 20px;
        }

        .downloadFormatModal p {
            color: white;
            margin-bottom: 25px;
        }

        .downloadFormatButtons {
            display: flex;
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
        }

        .downloadFormatBtn {
            flex: 1;
            min-width: 150px;
            padding: 20px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            font-size: 16px;
            font-weight: 600;
        }

        .downloadFormatBtn i {
            font-size: 48px;
        }

        .downloadFormatBtn.pdfBtn {
            color: #dc3545;
        }

        .downloadFormatBtn.pdfBtn:hover {
            border-color: #dc3545;
            background: rgba(220, 53, 69, 0.2);
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(220, 53, 69, 0.3);
        }

        .downloadFormatBtn.excelBtn {
            color: #28a745;
        }

        .downloadFormatBtn.excelBtn:hover {
            border-color: #28a745;
            background: rgba(40, 167, 69, 0.2);
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(40, 167, 69, 0.3);
        }

        .downloadFormatModal .closeBtn {
            position: absolute;
            top: 15px;
            right: 15px;
            background: none;
            border: none;
            font-size: 28px;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.2s;
        }

        .downloadFormatModal .closeBtn:hover {
            color: #fff;
        }

        @keyframes modalSlideIn {
            from {
                transform: scale(0.8);
                opacity: 0;
            }
            to {
                transform: scale(1);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(styles);
}

// ==========================================
// 3. SHOW DOWNLOAD MODAL
// ==========================================

function showDownloadModal(onPdfClick, onExcelClick) {
    injectDownloadModalStyles();
    injectDownloadModal();

    const modal = document.getElementById('downloadFormatModal');
    const backdrop = modal;
    const closeBtn = document.getElementById('closeDownloadFormatBtn');
    const pdfBtn = document.getElementById('downloadPdfBtn');
    const excelBtn = document.getElementById('downloadExcelBtn');

    // Close handlers
    const closeModal = () => {
        modal.style.display = 'none';
        // Remove event listeners to prevent memory leaks
        closeBtn.onclick = null;
        backdrop.onclick = null;
        pdfBtn.onclick = null;
        excelBtn.onclick = null;
    };

    // Clear any previous handlers
    closeBtn.onclick = null;
    backdrop.onclick = null;
    pdfBtn.onclick = null;
    excelBtn.onclick = null;

    // Set new handlers
    closeBtn.onclick = closeModal;
    backdrop.onclick = (e) => {
        if (e.target === backdrop) closeModal();
    };

    // Format selection handlers
    pdfBtn.onclick = () => {
        closeModal();
        if (onPdfClick) onPdfClick();
    };

    excelBtn.onclick = () => {
        closeModal();
        if (onExcelClick) onExcelClick();
    };

    // Show modal AFTER setting up all handlers
    modal.style.display = 'flex';
}

// ==========================================
// 4. PDF EXPORT FUNCTION
// ==========================================

function exportToPDF(headers, data, title, filename) {
    if (!window.jspdf) {
        alert("PDF Library not loaded. Please refresh the page.");
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape

    // Header
    doc.setFontSize(18);
    doc.setTextColor(72, 12, 27); // #480c1b
    doc.text(title, 14, 20);
    
    // Date
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

    // Table
    doc.autoTable({
        head: [headers],
        body: data,
        startY: 35,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3, overflow: 'linebreak', textColor: 50 },
        headStyles: { fillColor: '#480c1b', textColor: '#ffffff', fontStyle: 'bold', halign: 'center' },
        margin: { top: 35 }
    });

    doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ==========================================
// 5. EXCEL EXPORT FUNCTION
// ==========================================

function exportToExcel(headers, data, title, filename) {
    try {
        // Create title and date rows
        const currentDate = new Date().toLocaleDateString();
        const titleRow = [title];
        const dateRow = [`Generated: ${currentDate}`];
        const emptyRow = [];
        
        // Create worksheet data with title, date, empty row, headers, and data
        const wsData = [
            titleRow,
            dateRow,
            emptyRow,
            headers,
            ...data
        ];
        
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Set column widths
        const colWidths = headers.map((_, idx) => {
            const maxLength = Math.max(
                headers[idx] ? headers[idx].length : 10,
                ...data.map(row => String(row[idx] || '').length)
            );
            return { wch: Math.min(maxLength + 2, 50) };
        });
        ws['!cols'] = colWidths;

        // Merge cells for title (row 1)
        const titleMerge = { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } };
        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push(titleMerge);

        // Merge cells for date (row 2)
        const dateMerge = { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } };
        ws['!merges'].push(dateMerge);

        // Style title row (A1)
        if (ws['A1']) {
            ws['A1'].s = {
                font: { bold: true, sz: 16, color: { rgb: "480c1b" } },
                alignment: { horizontal: "center", vertical: "center" },
                fill: { fgColor: { rgb: "FFFFFF" } }
            };
        }

        // Style date row (A2)
        if (ws['A2']) {
            ws['A2'].s = {
                font: { sz: 11, color: { rgb: "666666" } },
                alignment: { horizontal: "center", vertical: "center" }
            };
        }

        // Style header row (row 4)
        const headerRowNum = 3; // 0-indexed, so row 4
        for (let C = 0; C < headers.length; C++) {
            const cellAddress = XLSX.utils.encode_cell({ r: headerRowNum, c: C });
            if (!ws[cellAddress]) continue;
            ws[cellAddress].s = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "480c1b" } },
                alignment: { horizontal: "center", vertical: "center" },
                border: {
                    top: { style: "thin", color: { rgb: "000000" } },
                    bottom: { style: "thin", color: { rgb: "000000" } },
                    left: { style: "thin", color: { rgb: "000000" } },
                    right: { style: "thin", color: { rgb: "000000" } }
                }
            };
        }

        // Style data rows with borders and alternating colors
        for (let R = headerRowNum + 1; R < headerRowNum + 1 + data.length; R++) {
            const isEvenRow = (R - headerRowNum) % 2 === 0;
            for (let C = 0; C < headers.length; C++) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                if (!ws[cellAddress]) continue;
                ws[cellAddress].s = {
                    alignment: { horizontal: "left", vertical: "center" },
                    fill: { fgColor: { rgb: isEvenRow ? "F9F9F9" : "FFFFFF" } },
                    border: {
                        top: { style: "thin", color: { rgb: "DDDDDD" } },
                        bottom: { style: "thin", color: { rgb: "DDDDDD" } },
                        left: { style: "thin", color: { rgb: "DDDDDD" } },
                        right: { style: "thin", color: { rgb: "DDDDDD" } }
                    }
                };
            }
        }

        // Set row heights
        if (!ws['!rows']) ws['!rows'] = [];
        ws['!rows'][0] = { hpt: 30 }; // Title row
        ws['!rows'][1] = { hpt: 20 }; // Date row
        ws['!rows'][3] = { hpt: 25 }; // Header row

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, title.substring(0, 31)); // Sheet name max 31 chars

        // Generate Excel file and trigger download
        XLSX.writeFile(wb, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
        console.error('Excel export error:', error);
        alert('Failed to export to Excel. Make sure the XLSX library is loaded.');
    }
}

// ==========================================
// 6. MAIN DOWNLOAD FUNCTION WITH MODAL
// ==========================================

function downloadData(headers, data, title, filename) {
    if (!data || data.length === 0) {
        alert("No data available to download based on current filters.");
        return;
    }

    showDownloadModal(
        () => exportToPDF(headers, data, title, filename),
        () => exportToExcel(headers, data, title, filename)
    );
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { downloadData, exportToPDF, exportToExcel, showDownloadModal };
}
