// ===== UTILITY FUNCTIONS FOR FORM MESSAGES =====
function showFormMessage(message, type = 'error', isUserForm = false) {
    const msgElement = isUserForm ? document.getElementById('userFormMessage') : document.getElementById('roomFormMessage');
    if (!msgElement) return;
    msgElement.textContent = message;
    msgElement.className = `formMessage ${type}`;
    msgElement.style.display = 'block';
        
    if (type === 'success') {
        setTimeout(() => {
            hideFormMessage(isUserForm);
        }, 3000);
    }
}

function hideFormMessage(isUserForm = false) {
    const msgElement = isUserForm ? document.getElementById('userFormMessage') : document.getElementById('roomFormMessage');
    if (!msgElement) return;
    msgElement.style.display = 'none';
    msgElement.textContent = '';
    msgElement.className = 'formMessage';
}

// ===== API CALL FUNCTIONS =====
async function apiCall(action, data = {}, method = 'GET', endpoint = 'room_actions.php') {
    const url = endpoint;
    const options = {
         method: method,
        credentials: 'same-origin' // Include cookies for session
    };

    if (method === 'POST') {
        const formData = new FormData();
        formData.append('action', action);
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                formData.append(key, data[key]);
            }
        }
        options.body = formData;
    } else {
        // For GET requests, append action and data as query params
        const params = new URLSearchParams({ action: action, ...data });
        options.method = 'GET';
        return fetch(`${url}?${params.toString()}`, options) // Pass data in URL
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .catch(error => {
                console.error('API Call Failed:', error);
                return { success: false, message: 'Network error. Please check your connection.' };
            });
    }

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API Call Failed:', error);
        return { success: false, message: 'Network error. Please try again.' };
    }
}

// ===== PDF GENERATION HELPER =====
/**
 * Generates a PDF report using jspdf and jspdf-autotable.
 * @param {string} title - The main title of the report.
 * @param {string} filename - The desired output filename (e.g., "report.pdf").
 * @param {string[]} headers - An array of header strings for the table.
 * @param {Array<Array<string>>} bodyData - An array of arrays, where each inner array is a row.
 * @param {string} orientation - 'portrait' or 'landscape' (default: 'landscape').
 */
function generatePdfReport(title, filename, headers, bodyData, orientation = 'landscape') {
    
    // Check if the main jspdf object and its UMD-loaded parts are available
    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
        const errorMsg = 'PDF Library (jspdf.umd.min.js) failed to load. Please check your internet or ad blocker.';
        alert(errorMsg);
        console.error(errorMsg);
        return;
    }

    // Check for the UMD version of autoTable
    if (typeof window.jspdf.autoTable === 'undefined') {
        const errorMsg = 'PDF Plugin (jspdf-autotable.umd.min.js) failed to load. Please check your internet or ad blocker.';
        alert(errorMsg);
        console.error(errorMsg);
        return;
    }


    if (!bodyData || bodyData.length === 0) {
        alert('No data to download for the current filters.');
        return;
    }

    try {
        // --- THIS IS THE FIX for admin.utils.js ---
        // 1. Get the constructor and the autoTable function from the window.jspdf object
        const { jsPDF } = window.jspdf;
        const autoTable = window.jspdf.autoTable;

        // 2. Create a new document instance
        const doc = new jsPDF({
            orientation: orientation
        });

        doc.setFontSize(18);
        doc.text(title, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

        // 3. Call autoTable as a separate function (UMD style), passing the doc in
        autoTable(doc, {
            head: [headers],
            body: bodyData,
            startY: 35,
            headStyles: { fillColor: [72, 12, 27] }, // #480c1b (Theme color)
            styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { top: 35 }
        });
        // --- END OF FIX ---

        doc.save(filename);

    } catch (e) {
        console.error(`Error generating PDF for ${title}:`, e);
        alert('An error occurred while generating the PDF. See console for details.');
    }
}