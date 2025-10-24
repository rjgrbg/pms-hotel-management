// =================================================================================
// ===== LOGIN / RECOVERY VARIABLES
// =================================================================================
// Get all modal and button elements
const recoveryModal = document.getElementById('recoveryModal');
const closeRecoveryBtn = document.getElementById('closeRecoveryBtn');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const backToLoginBtn = document.getElementById('backToLoginBtn');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error-message');

// Password Recovery modals
const resetPasswordEmailModal = document.getElementById('resetPasswordEmailModal');
const otpVerificationModal = document.getElementById('otpVerificationModal');
const createPasswordModal = document.getElementById('createPasswordModal');
const passwordSuccessModal = document.getElementById('passwordSuccessModal');

// Recovery buttons
const recoverUsernameBtn = document.getElementById('recoverUsernameBtn');
const recoverPasswordBtn = document.getElementById('recoverPasswordBtn');

// Recover Username Modals & Buttons
const recoverUsernameEmailModal = document.getElementById('recoverUsernameEmailModal');
const closeRecoverUsernameEmailBtn = document.getElementById('closeRecoverUsernameEmailBtn');
const sendUsernameOtpBtn = document.getElementById('sendUsernameOtpBtn');
const backToRecoveryFromUsernameEmailBtn = document.getElementById('backToRecoveryFromUsernameEmailBtn');
const usernameOtpVerificationModal = document.getElementById('usernameOtpVerificationModal');
const closeUsernameOtpBtn = document.getElementById('closeUsernameOtpBtn');
const verifyUsernameOtpBtn = document.getElementById('verifyUsernameOtpBtn');
const resendUsernameOtpLink = document.getElementById('resendUsernameOtpLink');
const backToUsernameEmailBtn = document.getElementById('backToUsernameEmailBtn');
const usernameOtpInputs = document.querySelectorAll('#usernameOtpVerificationModal .usernameOtpInput');
const usernameDisplayModal = document.getElementById('usernameDisplayModal');
const closeUsernameDisplayBtn = document.getElementById('closeUsernameDisplayBtn');
const backToLoginFromUsernameBtn = document.getElementById('backToLoginFromUsernameBtn');

// Reset Password Modals & Buttons
const closeResetEmailBtn = document.getElementById('closeResetEmailBtn');
const sendOtpBtn = document.getElementById('sendOtpBtn');
const backToRecoveryFromEmailBtn = document.getElementById('backToRecoveryFromEmailBtn');
const closeOtpBtn = document.getElementById('closeOtpBtn');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const resendOtpLink = document.getElementById('resendOtpLink');
const backToEmailBtn = document.getElementById('backToEmailBtn');
const otpInputs = document.querySelectorAll('#otpVerificationModal .otpInput');
const closeCreatePasswordBtn = document.getElementById('closeCreatePasswordBtn');
const changePasswordBtn = document.getElementById('changePasswordBtn');
const backToOtpBtn = document.getElementById('backToOtpBtn');
const togglePassword1 = document.getElementById('togglePassword1');
const togglePassword2 = document.getElementById('togglePassword2');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const closeSuccessBtn = document.getElementById('closeSuccessBtn');
const backToLoginFromSuccessBtn = document.getElementById('backToLoginFromSuccessBtn');


// =================================================================================
// ===== SCRIPT EXECUTION AFTER DOM CONTENT IS LOADED
// =================================================================================
document.addEventListener('DOMContentLoaded', () => {

    // ============================================
    // ===== LOGIN / RECOVERY EVENT LISTENERS =====
    // ============================================

    // --- Toggle Password Visibility ---
    const toggleLoginPassword = document.getElementById('toggleLoginPassword');
    const loginPasswordInput = document.getElementById('password');
    if (toggleLoginPassword && loginPasswordInput) {
        toggleLoginPassword.addEventListener('click', () => togglePasswordVisibility(loginPasswordInput));
    }

    // --- Recovery Options Modal ---
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (recoveryModal) recoveryModal.style.display = 'flex';
        });
    }
    if (closeRecoveryBtn) closeRecoveryBtn.addEventListener('click', () => recoveryModal.style.display = 'none');
    if (backToLoginBtn) backToLoginBtn.addEventListener('click', () => recoveryModal.style.display = 'none');
    if (recoveryModal) {
        recoveryModal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) recoveryModal.style.display = 'none';
        });
    }

    // --- Recover Username Flow ---
    if (recoverUsernameBtn) {
        recoverUsernameBtn.addEventListener('click', () => {
            if (recoveryModal) recoveryModal.style.display = 'none';
            if (recoverUsernameEmailModal) recoverUsernameEmailModal.style.display = 'flex';
        });
    }
    if (closeRecoverUsernameEmailBtn) closeRecoverUsernameEmailBtn.addEventListener('click', () => recoverUsernameEmailModal.style.display = 'none');
    if (backToRecoveryFromUsernameEmailBtn) {
        backToRecoveryFromUsernameEmailBtn.addEventListener('click', () => {
            if (recoverUsernameEmailModal) recoverUsernameEmailModal.style.display = 'none';
            if (recoveryModal) recoveryModal.style.display = 'flex';
        });
    }
    if (recoverUsernameEmailModal) {
        recoverUsernameEmailModal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) recoverUsernameEmailModal.style.display = 'none';
        });
    }

    // --- Username OTP Verification Modal ---
    if (closeUsernameOtpBtn) closeUsernameOtpBtn.addEventListener('click', () => usernameOtpVerificationModal.style.display = 'none');
    if (backToUsernameEmailBtn) {
        backToUsernameEmailBtn.addEventListener('click', () => {
            if (usernameOtpVerificationModal) usernameOtpVerificationModal.style.display = 'none';
            if (recoverUsernameEmailModal) recoverUsernameEmailModal.style.display = 'flex';
            clearUsernameOtpInputs();
        });
    }
    if (usernameOtpVerificationModal) {
        usernameOtpVerificationModal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) usernameOtpVerificationModal.style.display = 'none';
        });
    }

    // --- Username Display Modal ---
    if (closeUsernameDisplayBtn) closeUsernameDisplayBtn.addEventListener('click', () => usernameDisplayModal.style.display = 'none');
    if (backToLoginFromUsernameBtn) {
        backToLoginFromUsernameBtn.addEventListener('click', () => {
            if (usernameDisplayModal) usernameDisplayModal.style.display = 'none';
            const emailInput = document.getElementById('recoverUsernameEmail');
            if (emailInput) emailInput.value = '';
        });
    }
    if (usernameDisplayModal) {
        usernameDisplayModal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) usernameDisplayModal.style.display = 'none';
        });
    }

    // --- Recover Password Flow ---
    if (recoverPasswordBtn) {
        recoverPasswordBtn.addEventListener('click', () => {
            if (recoveryModal) recoveryModal.style.display = 'none';
            if (resetPasswordEmailModal) resetPasswordEmailModal.style.display = 'flex';
        });
    }
    if (closeResetEmailBtn) closeResetEmailBtn.addEventListener('click', () => resetPasswordEmailModal.style.display = 'none');
    if (backToRecoveryFromEmailBtn) {
        backToRecoveryFromEmailBtn.addEventListener('click', () => {
            if (resetPasswordEmailModal) resetPasswordEmailModal.style.display = 'none';
            if (recoveryModal) recoveryModal.style.display = 'flex';
        });
    }
    if (resetPasswordEmailModal) {
        resetPasswordEmailModal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) resetPasswordEmailModal.style.display = 'none';
        });
    }


    // --- OTP Verification Modal (Password Reset) ---
    if (closeOtpBtn) closeOtpBtn.addEventListener('click', () => otpVerificationModal.style.display = 'none');
    if (backToEmailBtn) {
        backToEmailBtn.addEventListener('click', () => {
            if (otpVerificationModal) otpVerificationModal.style.display = 'none';
            if (resetPasswordEmailModal) resetPasswordEmailModal.style.display = 'flex';
            clearOtpInputs();
        });
    }
    if (otpVerificationModal) {
        otpVerificationModal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) otpVerificationModal.style.display = 'none';
        });
    }

    // --- Create Password Modal ---
    if (closeCreatePasswordBtn) closeCreatePasswordBtn.addEventListener('click', () => createPasswordModal.style.display = 'none');
    if (backToOtpBtn) {
        backToOtpBtn.addEventListener('click', () => {
            if (createPasswordModal) createPasswordModal.style.display = 'none';
            if (otpVerificationModal) otpVerificationModal.style.display = 'flex';
        });
    }
    if (createPasswordModal) {
        createPasswordModal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) createPasswordModal.style.display = 'none';
        });
    }

    // --- Toggle Password Visibility (Create Password Modal) ---
    if (togglePassword1 && newPasswordInput) togglePassword1.addEventListener('click', () => togglePasswordVisibility(newPasswordInput));
    if (togglePassword2 && confirmPasswordInput) togglePassword2.addEventListener('click', () => togglePasswordVisibility(confirmPasswordInput));

    // --- Password Validation Listeners ---
    if (newPasswordInput) newPasswordInput.addEventListener('input', validatePassword);
    if (confirmPasswordInput) confirmPasswordInput.addEventListener('input', validatePassword);

    // --- Password Success Modal ---
    if (closeSuccessBtn) closeSuccessBtn.addEventListener('click', () => passwordSuccessModal.style.display = 'none');
    if (backToLoginFromSuccessBtn) {
        backToLoginFromSuccessBtn.addEventListener('click', () => {
            if (passwordSuccessModal) passwordSuccessModal.style.display = 'none';
            clearAllForms();
        });
    }
    if (passwordSuccessModal) {
        passwordSuccessModal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) passwordSuccessModal.style.display = 'none';
        });
    }

    // --- OTP Input Navigation ---
    usernameOtpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            if (e.target.value.length === 1 && index < usernameOtpInputs.length - 1) {
                usernameOtpInputs[index + 1].focus();
            }
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                usernameOtpInputs[index - 1].focus();
            }
        });
    });
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            if (e.target.value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });

    // ============================================
    // ===== FORM SUBMISSION & ASYNC LOGIC =====
    // ============================================

    // --- Login Form Submission ---
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (loginError) {
                loginError.style.display = 'none';
                loginError.textContent = '';
            }
            const formData = new FormData(loginForm);
            const submitButton = loginForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'LOGGING IN...';
            }
            fetch('login_process.php', {
                    method: 'POST',
                    body: formData
                })
                .then(response => {
                    if (!response.ok) throw new Error(`Server error: ${response.status}`);
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        window.location.href = data.redirect;
                    } else {
                        if (loginError) {
                            loginError.textContent = data.message;
                            loginError.style.display = 'block';
                        }
                        const passwordInput = document.getElementById('password');
                        if (passwordInput) {
                            passwordInput.value = '';
                            passwordInput.focus();
                        }
                    }
                })
                .catch(error => {
                    console.error('Login Fetch Error:', error);
                    if (loginError) {
                        loginError.textContent = 'Network error. Could not connect to the server.';
                        loginError.style.display = 'block';
                    }
                })
                .finally(() => {
                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.textContent = 'LOG IN';
                    }
                });
        });
    }

    // --- Send/Resend OTP (Username & Password) ---
    const setupOtpSender = (button, emailInputId, messageDivId, type) => {
        if (!button) return;
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById(emailInputId);
            const email = emailInput ? emailInput.value.trim() : '';
            const messageDiv = document.getElementById(messageDivId);
            const showMessage = (msg, isError = false) => {
                if (messageDiv) {
                    messageDiv.textContent = msg;
                    messageDiv.style.color = isError ? 'red' : 'green';
                    messageDiv.style.display = 'block';
                }
            };
            if (!email || !isValidEmail(email)) {
                showMessage('Please enter a valid email address.', true);
                return;
            }
            showMessage('Sending OTP...');
            const formData = new FormData();
            formData.append('email', email);
            formData.append('type', type);
            fetch('send_otp.php', { method: 'POST', body: formData })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        showMessage(data.message);
                        if (type === 'username') {
                            setTimeout(() => {
                                if (recoverUsernameEmailModal) recoverUsernameEmailModal.style.display = 'none';
                                if (usernameOtpVerificationModal) usernameOtpVerificationModal.style.display = 'flex';
                                if (usernameOtpInputs.length > 0) usernameOtpInputs[0].focus();
                            }, 1500);
                        } else {
                            setTimeout(() => {
                                if (resetPasswordEmailModal) resetPasswordEmailModal.style.display = 'none';
                                if (otpVerificationModal) otpVerificationModal.style.display = 'flex';
                                if (otpInputs.length > 0) otpInputs[0].focus();
                            }, 1500);
                        }
                    } else {
                        showMessage(data.message, true);
                    }
                }).catch(err => showMessage('Network error. Please try again.', true));
        });
    };
    setupOtpSender(sendUsernameOtpBtn, 'recoverUsernameEmail', 'recoverUsernameEmailMessage', 'username');
    setupOtpSender(resendUsernameOtpLink, 'recoverUsernameEmail', 'usernameOtpErrorMessage', 'username');
    setupOtpSender(sendOtpBtn, 'resetEmail', 'resetPasswordEmailMessage', 'password');
    setupOtpSender(resendOtpLink, 'resetEmail', 'passwordOtpErrorMessage', 'password');

    // --- Verify OTP (Username & Password) ---
    if (verifyUsernameOtpBtn) {
        verifyUsernameOtpBtn.addEventListener('click', () => {
            const messageDiv = document.getElementById('usernameOtpErrorMessage');
            const otp = Array.from(usernameOtpInputs).map(input => input.value).join('');
            if (otp.length !== 6) {
                if (messageDiv) {
                    messageDiv.textContent = 'Please enter the complete 6-digit OTP.';
                    messageDiv.style.display = 'block';
                }
                return;
            }
            verifyUsernameOtpBtn.disabled = true;
            verifyUsernameOtpBtn.textContent = 'VERIFYING...';
            const formData = new FormData();
            formData.append('otp', otp);
            fetch('verify_otp.php', { method: 'POST', body: formData })
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.username) {
                        const displayedUsername = document.getElementById('displayedUsername');
                        if (displayedUsername) displayedUsername.textContent = data.username;
                        if (usernameOtpVerificationModal) usernameOtpVerificationModal.style.display = 'none';
                        if (usernameDisplayModal) usernameDisplayModal.style.display = 'flex';
                        clearUsernameOtpInputs();
                    } else {
                        if (messageDiv) {
                            messageDiv.textContent = data.message;
                            messageDiv.style.display = 'block';
                        }
                        clearUsernameOtpInputs();
                    }
                })
                .catch(err => console.error('Verify Username OTP Error:', err))
                .finally(() => {
                    verifyUsernameOtpBtn.disabled = false;
                    verifyUsernameOtpBtn.textContent = 'VERIFY CODE';
                });
        });
    }
    if (verifyOtpBtn) {
        verifyOtpBtn.addEventListener('click', () => {
            const messageDiv = document.getElementById('passwordOtpErrorMessage');
            const otp = Array.from(otpInputs).map(input => input.value).join('');
            if (otp.length !== 6) {
                if (messageDiv) {
                    messageDiv.textContent = 'Please enter the complete 6-digit OTP.';
                    messageDiv.style.display = 'block';
                }
                return;
            }
            verifyOtpBtn.disabled = true;
            verifyOtpBtn.textContent = 'VERIFYING...';
            const formData = new FormData();
            formData.append('otp', otp);
            fetch('verify_otp.php', { method: 'POST', body: formData })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        if (otpVerificationModal) otpVerificationModal.style.display = 'none';
                        if (createPasswordModal) createPasswordModal.style.display = 'flex';
                        clearOtpInputs();
                    } else {
                        if (messageDiv) {
                            messageDiv.textContent = data.message;
                            messageDiv.style.display = 'block';
                        }
                        clearOtpInputs();
                    }
                })
                .catch(err => console.error('Verify Password OTP Error:', err))
                .finally(() => {
                    verifyOtpBtn.disabled = false;
                    verifyOtpBtn.textContent = 'VERIFY CODE';
                });
        });
    }

    // --- Change Password ---
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            const messageDiv = document.getElementById('createPasswordErrorMessage');
            const newPassword = newPasswordInput ? newPasswordInput.value : '';
            const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';
            if (!validatePasswordStrength(newPassword) || newPassword !== confirmPassword) {
                if (messageDiv) {
                    messageDiv.textContent = 'Password does not meet all requirements or does not match.';
                    messageDiv.style.display = 'block';
                }
                return;
            }
            changePasswordBtn.disabled = true;
            changePasswordBtn.textContent = 'CHANGING...';
            const formData = new FormData();
            formData.append('newPassword', newPassword);
            formData.append('confirmPassword', confirmPassword);
            fetch('reset_password.php', { method: 'POST', body: formData })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        if (createPasswordModal) createPasswordModal.style.display = 'none';
                        if (passwordSuccessModal) passwordSuccessModal.style.display = 'flex';
                        if (newPasswordInput) newPasswordInput.value = '';
                        if (confirmPasswordInput) confirmPasswordInput.value = '';
                        validatePassword();
                    } else {
                        if (messageDiv) {
                            messageDiv.textContent = data.message;
                            messageDiv.style.display = 'block';
                        }
                    }
                })
                .catch(err => console.error('Change Password Error:', err))
                .finally(() => {
                    changePasswordBtn.textContent = 'CHANGE PASSWORD';
                    validatePassword();
                });
        });
    }
});


// =================================================================================
// ===== HELPER FUNCTIONS (LOGIN/RECOVERY)
// =================================================================================

function clearLoginForm() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginErrorMsg = document.getElementById('login-error-message');
    if (usernameInput) usernameInput.value = '';
    if (passwordInput) {
        passwordInput.value = '';
        passwordInput.type = 'password';
        const iconImg = passwordInput.parentElement?.querySelector('.eyeIconImg');
        if (iconImg) iconImg.src = 'assets/icons/eye-closed.png';
    }
    if (loginErrorMsg) {
        loginErrorMsg.style.display = 'none';
        loginErrorMsg.textContent = '';
    }
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function togglePasswordVisibility(input) {
    if (!input) return;
    const iconImg = input.parentElement?.querySelector('.eyeIconImg');
    if (!iconImg) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    iconImg.src = isPassword ? 'assets/icons/eye-open.png' : 'assets/icons/eye-closed.png';
}

function validatePasswordStrength(password) {
    if (!password) return false;
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
    const password = newPasswordInput ? newPasswordInput.value : '';
    const confirmPass = confirmPasswordInput ? confirmPasswordInput.value : '';
    const messageDiv = document.getElementById('createPasswordErrorMessage');
    const requirements = {
        minLength: password.length >= 8, uppercase: /[A-Z]/.test(password), lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password), special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
        noSpaces: !/\s/.test(password) && !/(password|123456|qwerty)/i.test(password)
    };
    ['req1', 'req2', 'req3', 'req4', 'req5', 'req6'].forEach((id, index) => {
        const element = document.getElementById(id);
        const checkmark = element?.querySelector('.checkmark');
        if (element) {
            const passed = Object.values(requirements)[index];
            element.classList.toggle('active', passed);
            if (checkmark) checkmark.textContent = passed ? '✓' : '☐';
        }
    });
    const allMet = Object.values(requirements).every(req => req);
    const passwordsMatch = password === confirmPass && password.length > 0;
    if (messageDiv) {
        if (allMet && !passwordsMatch && confirmPass.length > 0) {
            messageDiv.textContent = 'Passwords do not match.';
            messageDiv.style.display = 'block';
        } else {
            messageDiv.textContent = '';
            messageDiv.style.display = 'none';
        }
    }
    if (changePasswordBtn) {
        changePasswordBtn.disabled = !(allMet && passwordsMatch);
        changePasswordBtn.style.opacity = (allMet && passwordsMatch) ? '1' : '0.6';
    }
}

function clearOtpInputs() {
    otpInputs.forEach(input => { if (input) input.value = ''; });
    if (otpInputs.length > 0 && otpInputs[0]) otpInputs[0].focus();
}

function clearUsernameOtpInputs() {
    usernameOtpInputs.forEach(input => { if (input) input.value = ''; });
    if (usernameOtpInputs.length > 0 && usernameOtpInputs[0]) usernameOtpInputs[0].focus();
}

function clearAllForms() {
    clearLoginForm();
    ['resetEmail', 'recoverUsernameEmail', 'newPassword', 'confirmPassword'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    clearOtpInputs();
    clearUsernameOtpInputs();
    validatePassword(); // Resets validation UI
    document.querySelectorAll('.formErrorMessage').forEach(div => {
        if (div) {
            div.textContent = '';
            div.style.display = 'none';
        }
    });
}