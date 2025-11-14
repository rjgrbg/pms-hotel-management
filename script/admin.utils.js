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