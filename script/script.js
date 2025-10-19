// Get all modal and button elements
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const closeLoginBtn = document.getElementById('closeLoginBtn');
const recoveryModal = document.getElementById('recoveryModal');
const closeRecoveryBtn = document.getElementById('closeRecoveryBtn');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const backToLoginBtn = document.getElementById('backToLoginBtn');
const submitBtn = document.getElementById('submitBtn');
const allCards = document.querySelectorAll('.card');

// --- NEW/UPDATED ELEMENTS FOR LOGIN FORM SUBMISSION ---
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
// ------------------------------------------------------

// Password Recovery modals
const resetPasswordEmailModal = document.getElementById('resetPasswordEmailModal');
const otpVerificationModal = document.getElementById('otpVerificationModal');
const createPasswordModal = document.getElementById('createPasswordModal');
const passwordSuccessModal = document.getElementById('passwordSuccessModal');

// Recovery buttons
const recoverUsernameBtn = document.getElementById('recoverUsernameBtn');
const recoverPasswordBtn = document.getElementById('recoverPasswordBtn');

// Recover Username - Email Modal
const recoverUsernameEmailModal = document.getElementById('recoverUsernameEmailModal');
const closeRecoverUsernameEmailBtn = document.getElementById('closeRecoverUsernameEmailBtn');
const sendUsernameOtpBtn = document.getElementById('sendUsernameOtpBtn');
const backToRecoveryFromUsernameEmailBtn = document.getElementById('backToRecoveryFromUsernameEmailBtn');

// Username OTP Verification Modal
const usernameOtpVerificationModal = document.getElementById('usernameOtpVerificationModal');
const closeUsernameOtpBtn = document.getElementById('closeUsernameOtpBtn');
const verifyUsernameOtpBtn = document.getElementById('verifyUsernameOtpBtn');
const resendUsernameOtpLink = document.getElementById('resendUsernameOtpLink');
const backToUsernameEmailBtn = document.getElementById('backToUsernameEmailBtn');
const usernameOtpInputs = document.querySelectorAll('.usernameOtpInput');

// Username Display Modal
const usernameDisplayModal = document.getElementById('usernameDisplayModal');
const closeUsernameDisplayBtn = document.getElementById('closeUsernameDisplayBtn');
const backToLoginFromUsernameBtn = document.getElementById('backToLoginFromUsernameBtn');

// Reset Password - Email Modal
const closeResetEmailBtn = document.getElementById('closeResetEmailBtn');
const sendOtpBtn = document.getElementById('sendOtpBtn');
const backToRecoveryFromEmailBtn = document.getElementById('backToRecoveryFromEmailBtn');

// OTP Verification Modal
const closeOtpBtn = document.getElementById('closeOtpBtn');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const resendOtpLink = document.getElementById('resendOtpLink');
const backToEmailBtn = document.getElementById('backToEmailBtn');
const otpInputs = document.querySelectorAll('.otpInput');

// Create Password Modal
const closeCreatePasswordBtn = document.getElementById('closeCreatePasswordBtn');
const changePasswordBtn = document.getElementById('changePasswordBtn');
const backToOtpBtn = document.getElementById('backToOtpBtn');
const togglePassword1 = document.getElementById('togglePassword1');
const togglePassword2 = document.getElementById('togglePassword2');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');

// Password Success Modal
const closeSuccessBtn = document.getElementById('closeSuccessBtn');
const backToLoginFromSuccessBtn = document.getElementById('backToLoginFromSuccessBtn');

// ==================== LOGIN MODAL ====================
loginBtn.addEventListener('click', () => {
    loginModal.style.display = 'flex';
});

closeLoginBtn.addEventListener('click', () => {
    loginModal.style.display = 'none';
    clearLoginForm(); 
});

loginModal.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        loginModal.style.display = 'none';
        clearLoginForm(); 
    }
});

// ==================== RECOVERY OPTIONS MODAL ====================
forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.style.display = 'none';
    recoveryModal.style.display = 'flex';
});

closeRecoveryBtn.addEventListener('click', () => {
    recoveryModal.style.display = 'none';
});

backToLoginBtn.addEventListener('click', () => {
    recoveryModal.style.display = 'none';
    loginModal.style.display = 'flex';
});

recoveryModal.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        recoveryModal.style.display = 'none';
    }
});

// ==================== RECOVER USERNAME FLOW ====================
recoverUsernameBtn.addEventListener('click', () => {
    recoveryModal.style.display = 'none';
    recoverUsernameEmailModal.style.display = 'flex';
});

closeRecoverUsernameEmailBtn.addEventListener('click', () => {
    recoverUsernameEmailModal.style.display = 'none';
});

backToRecoveryFromUsernameEmailBtn.addEventListener('click', () => {
    recoverUsernameEmailModal.style.display = 'none';
    recoveryModal.style.display = 'flex';
});

recoverUsernameEmailModal.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        recoverUsernameEmailModal.style.display = 'none';
    }
});

// Send Username OTP
sendUsernameOtpBtn.addEventListener('click', () => {
    const email = document.getElementById('recoverUsernameEmail').value;

    if (!email) {
        alert('Please enter your email address');
        return;
    }

    recoverUsernameEmailModal.style.display = 'none';
    usernameOtpVerificationModal.style.display = 'flex';
});

// ==================== USERNAME OTP VERIFICATION MODAL ====================
closeUsernameOtpBtn.addEventListener('click', () => {
    usernameOtpVerificationModal.style.display = 'none';
});

backToUsernameEmailBtn.addEventListener('click', () => {
    usernameOtpVerificationModal.style.display = 'none';
    recoverUsernameEmailModal.style.display = 'flex';
    clearUsernameOtpInputs();
});

usernameOtpVerificationModal.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        usernameOtpVerificationModal.style.display = 'none';
    }
});

// Username OTP Input Navigation
usernameOtpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
        if (e.target.value.length === 1) {
            if (index < usernameOtpInputs.length - 1) {
                usernameOtpInputs[index + 1].focus();
            }
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
            usernameOtpInputs[index - 1].focus();
        }
    });
});

// Verify Username OTP
verifyUsernameOtpBtn.addEventListener('click', () => {
    const otp = Array.from(usernameOtpInputs).map(input => input.value).join('');

    if (otp.length !== 6) {
        alert('Please enter a complete 6-digit code');
        return;
    }

    usernameOtpVerificationModal.style.display = 'none';
    usernameDisplayModal.style.display = 'flex';
});

// Resend Username OTP
resendUsernameOtpLink.addEventListener('click', (e) => {
    e.preventDefault();
    clearUsernameOtpInputs();
    alert('OTP resent to your email');
});

// ==================== USERNAME DISPLAY MODAL ====================
closeUsernameDisplayBtn.addEventListener('click', () => {
    usernameDisplayModal.style.display = 'none';
});

backToLoginFromUsernameBtn.addEventListener('click', () => {
    usernameDisplayModal.style.display = 'none';
    loginModal.style.display = 'flex';
    document.getElementById('recoverUsernameEmail').value = '';
    clearUsernameOtpInputs();
});

usernameDisplayModal.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        usernameDisplayModal.style.display = 'none';
    }
});

// ==================== RECOVER PASSWORD FLOW ====================
recoverPasswordBtn.addEventListener('click', () => {
    recoveryModal.style.display = 'none';
    resetPasswordEmailModal.style.display = 'flex';
});

closeResetEmailBtn.addEventListener('click', () => {
    resetPasswordEmailModal.style.display = 'none';
});

backToRecoveryFromEmailBtn.addEventListener('click', () => {
    resetPasswordEmailModal.style.display = 'none';
    recoveryModal.style.display = 'flex';
});

resetPasswordEmailModal.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        resetPasswordEmailModal.style.display = 'none';
    }
});

// Send OTP
sendOtpBtn.addEventListener('click', () => {
    const email = document.getElementById('resetEmail').value;

    if (!email || !isValidEmail(email)) {
        alert('Please enter a valid email address');
        return;
    }

    console.log('OTP sent to:', email);

    resetPasswordEmailModal.style.display = 'none';
    otpVerificationModal.style.display = 'flex';
});

// ==================== OTP VERIFICATION MODAL ====================
closeOtpBtn.addEventListener('click', () => {
    otpVerificationModal.style.display = 'none';
});

backToEmailBtn.addEventListener('click', () => {
    otpVerificationModal.style.display = 'none';
    resetPasswordEmailModal.style.display = 'flex';
    clearOtpInputs();
});

otpVerificationModal.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        otpVerificationModal.style.display = 'none';
    }
});

// OTP Input Navigation
otpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
        if (e.target.value.length === 1) {
            if (index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
            otpInputs[index - 1].focus();
        }
    });
});

// Verify OTP
verifyOtpBtn.addEventListener('click', () => {
    const otp = Array.from(otpInputs).map(input => input.value).join('');

    if (otp.length !== 6) {
        alert('Please enter a complete 6-digit code');
        return;
    }

    console.log('OTP verified:', otp);

    otpVerificationModal.style.display = 'none';
    createPasswordModal.style.display = 'flex';
});

// Resend OTP
resendOtpLink.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('Resending OTP...');
    clearOtpInputs();
    alert('OTP resent to your email');
});

// ==================== CREATE PASSWORD MODAL ====================
closeCreatePasswordBtn.addEventListener('click', () => {
    createPasswordModal.style.display = 'none';
});

backToOtpBtn.addEventListener('click', () => {
    createPasswordModal.style.display = 'none';
    otpVerificationModal.style.display = 'flex';
});

createPasswordModal.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        createPasswordModal.style.display = 'none';
    }
});

// Toggle Password Visibility
togglePassword1.addEventListener('click', () => {
    togglePasswordVisibility(newPasswordInput);
});

togglePassword2.addEventListener('click', () => {
    togglePasswordVisibility(confirmPasswordInput);
});

// Password validation
newPasswordInput.addEventListener('input', validatePassword);
confirmPasswordInput.addEventListener('input', validatePassword);

// Change Password
changePasswordBtn.addEventListener('click', () => {
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!validatePasswordStrength(newPassword)) {
        alert('Password does not meet requirements');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    console.log('Password changed successfully');

    createPasswordModal.style.display = 'none';
    passwordSuccessModal.style.display = 'flex';
});

// ==================== PASSWORD SUCCESS MODAL ====================
closeSuccessBtn.addEventListener('click', () => {
    passwordSuccessModal.style.display = 'none';
});

backToLoginFromSuccessBtn.addEventListener('click', () => {
    passwordSuccessModal.style.display = 'none';
    loginModal.style.display = 'flex';
    clearAllForms();
});

passwordSuccessModal.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        passwordSuccessModal.style.display = 'none';
    }
});

// ==================== LOGIN FORM SUBMISSION (FIXED) ====================
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        // Reset error message
        loginError.style.display = 'none'; 
        loginError.textContent = '';
        
        // Use FormData to capture all inputs with 'name' attributes from the form
        const formData = new FormData(loginForm);
        
        // Disable the button and show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing In...'; 

        try {
            // Send the request to your PHP backend
            const response = await fetch('signin.php', {
                method: 'POST',
                body: formData,
            });
            
            if (response.redirected) {
                // SUCCESS: PHP sent a Location header, follow it
                window.location.href = response.url;
            } else {
                // FAILURE: Get the error message from PHP
                const errorMessage = await response.text();
                
                // --- START OF LOGIN FAILURE HANDLING ---
                if (errorMessage.trim().length > 0) {
                    loginError.textContent = errorMessage.trim();
                    loginError.style.display = 'block';
                    
                    // Clear ONLY the password field on login error for security
                    const passwordInput = document.getElementById('password');
                    if (passwordInput) {
                        passwordInput.value = '';
                        passwordInput.focus(); // Set focus for quick re-entry
                    }
                } else {
                    loginError.textContent = 'An unexpected error occurred during login.';
                    loginError.style.display = 'block';
                }
                // --- END OF LOGIN FAILURE HANDLING ---
            }
        } catch (error) {
            console.error('Network or Fetch Error:', error);
            loginError.textContent = 'Network error: Could not connect to the server.';
            loginError.style.display = 'block';
        } finally {
            // Re-enable the button regardless of success/failure
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }
    });
}
// =======================================================================


// ==================== CARDS CLICK ====================
allCards.forEach(card => {
    card.addEventListener('click', () => {
        loginModal.style.display = 'flex';
    });
});

// ==================== HELPER FUNCTIONS ====================

// FIX: Moved clearLoginForm out of validatePassword
function clearLoginForm() {
    // Clear username and password fields
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('loginError');

    // Check if elements exist before trying to set their value
    if (usernameInput) usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';
    
    // Hide and clear any previous error message
    if (loginError) {
        loginError.style.display = 'none';
        loginError.textContent = '';
    }
}


function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function togglePasswordVisibility(input) {
    if (input.type === 'password') {
        input.type = 'text';
    } else {
        input.type = 'password';
    }
}

function validatePasswordStrength(password) {
    const requirements = {
        minLength: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
        noSpaces: !/\s/.test(password) && !/(password|123456|qwerty)/i.test(password)
    };

    return Object.values(requirements).every(req => req);
}

function validatePassword() {
    const password = newPasswordInput.value;

    const requirements = {
        minLength: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
        noSpaces: !/\s/.test(password) && !/(password|123456|qwerty)/i.test(password)
    };

    const requirementIds = ['req1', 'req2', 'req3', 'req4', 'req5', 'req6'];
    const requirementList = Object.values(requirements);

    requirementIds.forEach((id, index) => {
        const element = document.getElementById(id);
        if (element) { // Check if element exists before manipulating it
            if (requirementList[index]) {
                element.classList.add('active');
            } else {
                element.classList.remove('active');
            }
        }
    });
    
    // Logic to disable/enable the Change Password button (for user feedback)
    const allMet = requirementList.every(req => req);
    const passwordsMatch = newPasswordInput.value === confirmPasswordInput.value && newPasswordInput.value.length > 0;
    
    if (changePasswordBtn) {
        if (allMet && passwordsMatch) {
            changePasswordBtn.disabled = false;
            changePasswordBtn.style.opacity = '1';
        } else {
            changePasswordBtn.disabled = true;
            changePasswordBtn.style.opacity = '0.6';
        }
    }
}

function clearOtpInputs() {
    otpInputs.forEach(input => {
        input.value = '';
    });
    if (otpInputs.length > 0) otpInputs[0].focus();
}

function clearUsernameOtpInputs() {
    usernameOtpInputs.forEach(input => {
        input.value = '';
    });
    if (usernameOtpInputs.length > 0) usernameOtpInputs[0].focus();
}

// Added a function to clear all forms (used in the success modal)
function clearAllForms() {
    // Clear login form
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    if (usernameInput) usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';
    
    // Clear reset password form
    const resetEmailInput = document.getElementById('resetEmail');
    if (resetEmailInput) {
        resetEmailInput.value = '';
    }
    
    // Clear create password form inputs
    if (newPasswordInput) newPasswordInput.value = '';
    if (confirmPasswordInput) confirmPasswordInput.value = '';
    
    // Clear OTP inputs (if they were the last modal shown)
    clearOtpInputs();
    
    // Reset password validation display
    const requirementIds = ['req1', 'req2', 'req3', 'req4', 'req5', 'req6'];
    requirementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
             element.classList.remove('active');
             // Also reset the checkmark display if applicable (depends on your CSS/HTML)
             const checkmark = element.querySelector('.checkmark');
             if (checkmark) checkmark.innerHTML = '☐';
        }
    });
    
    // Re-enable change password button if it was disabled (and reset opacity)
    if (changePasswordBtn) {
        changePasswordBtn.disabled = true; 
        changePasswordBtn.style.opacity = '0.6';
    }
}