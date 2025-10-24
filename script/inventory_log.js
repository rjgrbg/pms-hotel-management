// Get all modal and button elements
// **REMOVED** loginBtn, loginModal, closeLoginBtn, submitBtn, allCards as they are not on this page.

const recoveryModal = document.getElementById('recoveryModal');
const closeRecoveryBtn = document.getElementById('closeRecoveryBtn');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const backToLoginBtn = document.getElementById('backToLoginBtn');


// --- NEW/UPDATED ELEMENTS FOR LOGIN FORM SUBMISSION ---
const loginForm = document.getElementById('login-form'); // Use correct ID
const loginError = document.getElementById('login-error-message'); // Use correct ID
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
const usernameOtpInputs = document.querySelectorAll('#usernameOtpVerificationModal .usernameOtpInput'); // More specific selector

// Username Display Modal
const usernameDisplayModal = document.getElementById('usernameDisplayModal');
const closeUsernameDisplayBtn = document.getElementById('closeUsernameDisplayBtn');
const backToLoginFromUsernameBtn = document.getElementById('backToLoginFromUsernameBtn');

// Reset Password - Email Modal
const closeResetEmailBtn = document.getElementById('closeResetEmailBtn');
const sendOtpBtn = document.getElementById('sendOtpBtn');
const backToRecoveryFromEmailBtn = document.getElementById('backToRecoveryFromEmailBtn');

// OTP Verification Modal (for password reset)
const closeOtpBtn = document.getElementById('closeOtpBtn');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const resendOtpLink = document.getElementById('resendOtpLink');
const backToEmailBtn = document.getElementById('backToEmailBtn');
const otpInputs = document.querySelectorAll('#otpVerificationModal .otpInput'); // More specific selector

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

document.addEventListener('DOMContentLoaded', () => { // Wrap all code in DOMContentLoaded

    // **REMOVED** LOGIN MODAL section as it's not a modal.

    // --- Toggle Password for Login Modal ---
    const toggleLoginPassword = document.getElementById('toggleLoginPassword');
    const loginPasswordInput = document.getElementById('password');

    if (toggleLoginPassword && loginPasswordInput) {
        toggleLoginPassword.addEventListener('click', () => {
            togglePasswordVisibility(loginPasswordInput);
        });
    }

    // ==================== RECOVERY OPTIONS MODAL ====================
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            // **REMOVED** if (loginModal) loginModal.style.display = 'none';
            if (recoveryModal) recoveryModal.style.display = 'flex';
        });
    }

    if (closeRecoveryBtn) {
        closeRecoveryBtn.addEventListener('click', () => {
            if (recoveryModal) recoveryModal.style.display = 'none';
        });
    }

    if (backToLoginBtn) {
        backToLoginBtn.addEventListener('click', () => {
            if (recoveryModal) recoveryModal.style.display = 'none';
            // **REMOVED** if (loginModal) loginModal.style.display = 'flex';
        });
    }

    if (recoveryModal) {
        recoveryModal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                recoveryModal.style.display = 'none';
            }
        });
    }

    // ==================== RECOVER USERNAME FLOW ====================
    if (recoverUsernameBtn) {
        recoverUsernameBtn.addEventListener('click', () => {
            if (recoveryModal) recoveryModal.style.display = 'none';
            if (recoverUsernameEmailModal) recoverUsernameEmailModal.style.display = 'flex';
        });
    }

    if (closeRecoverUsernameEmailBtn) {
        closeRecoverUsernameEmailBtn.addEventListener('click', () => {
            if (recoverUsernameEmailModal) recoverUsernameEmailModal.style.display = 'none';
        });
    }

    if (backToRecoveryFromUsernameEmailBtn) {
        backToRecoveryFromUsernameEmailBtn.addEventListener('click', () => {
            if (recoverUsernameEmailModal) recoverUsernameEmailModal.style.display = 'none';
            if (recoveryModal) recoveryModal.style.display = 'flex';
        });
    }

    if (recoverUsernameEmailModal) {
        recoverUsernameEmailModal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                recoverUsernameEmailModal.style.display = 'none';
            }
        });
    }


    // ==================== USERNAME OTP VERIFICATION MODAL ====================
    if (closeUsernameOtpBtn) {
        closeUsernameOtpBtn.addEventListener('click', () => {
            if (usernameOtpVerificationModal) usernameOtpVerificationModal.style.display = 'none';
        });
    }

    if (backToUsernameEmailBtn) {
        backToUsernameEmailBtn.addEventListener('click', () => {
            if (usernameOtpVerificationModal) usernameOtpVerificationModal.style.display = 'none';
            if (recoverUsernameEmailModal) recoverUsernameEmailModal.style.display = 'flex';
            clearUsernameOtpInputs();
        });
    }

    if (usernameOtpVerificationModal) {
        usernameOtpVerificationModal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                usernameOtpVerificationModal.style.display = 'none';
            }
        });
    }

    // Username OTP Input Navigation
    usernameOtpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            // Allow only numbers
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            
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


    // Resend Username OTP Link
    if (resendUsernameOtpLink) {
        resendUsernameOtpLink.addEventListener('click', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('recoverUsernameEmail');
            const email = emailInput ? emailInput.value.trim() : '';
            
            const messageDiv = document.getElementById('usernameOtpErrorMessage'); 

            if (!email || !isValidEmail(email)) {
                if (messageDiv) {
                        messageDiv.textContent = 'Email address missing. Go back and enter it again.';
                        messageDiv.style.color = 'red';
                        messageDiv.style.display = 'block';
                } else {
                    alert('Email address missing. Go back and enter it again.');
                }
                return;
            }
            
             if (messageDiv) {
                  messageDiv.textContent = 'Resending OTP...';
                  messageDiv.style.color = 'green';
                  messageDiv.style.display = 'block';
             } else {
                alert('Resending OTP...'); // Fallback
             }


            const formData = new FormData();
            formData.append('email', email);
            formData.append('type', 'username');

            fetch('send_otp.php', { method: 'POST', body: formData })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                         if (messageDiv) {
                              messageDiv.textContent = data.message;
                              messageDiv.style.color = 'green';
                              messageDiv.style.display = 'block';
                              setTimeout(() => { if(messageDiv) messageDiv.style.display = 'none'; }, 2000); // Hide after 2s
                         } else {
                              alert(data.message); // Fallback
                         }
                        clearUsernameOtpInputs();
                        if (usernameOtpInputs.length > 0) usernameOtpInputs[0].focus();
                    } else {
                         if (messageDiv) {
                              messageDiv.textContent = data.message;
                              messageDiv.style.color = 'red';
                              messageDiv.style.display = 'block';
                         } else {
                              alert('Error resending OTP: ' + data.message); // Fallback
                         }
                    }
                })
                .catch(error => {
                    console.error('Resend Username OTP Error:', error);
                    if (messageDiv) {
                         messageDiv.textContent = 'Network error. Please try again.';
                         messageDiv.style.color = 'red';
                         messageDiv.style.display = 'block';
                    } else {
                         alert('A network error occurred while resending. Please try again.'); // Fallback
                    }
                });
        });
    }

    // ==================== USERNAME DISPLAY MODAL ====================
    if (closeUsernameDisplayBtn) {
        closeUsernameDisplayBtn.addEventListener('click', () => {
            if (usernameDisplayModal) usernameDisplayModal.style.display = 'none';
        });
    }

    if (backToLoginFromUsernameBtn) {
        backToLoginFromUsernameBtn.addEventListener('click', () => {
            if (usernameDisplayModal) usernameDisplayModal.style.display = 'none';
            // **REMOVED** if (loginModal) loginModal.style.display = 'flex';
            const emailInput = document.getElementById('recoverUsernameEmail');
             if(emailInput) emailInput.value = '';
        });
    }

    if (usernameDisplayModal) {
        usernameDisplayModal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                usernameDisplayModal.style.display = 'none';
            }
        });
    }

    // ==================== RECOVER PASSWORD FLOW ====================
    if (recoverPasswordBtn) {
        recoverPasswordBtn.addEventListener('click', () => {
            if (recoveryModal) recoveryModal.style.display = 'none';
            if (resetPasswordEmailModal) resetPasswordEmailModal.style.display = 'flex';
        });
    }

    if (closeResetEmailBtn) {
        closeResetEmailBtn.addEventListener('click', () => {
            if (resetPasswordEmailModal) resetPasswordEmailModal.style.display = 'none';
        });
    }

    if (backToRecoveryFromEmailBtn) {
        backToRecoveryFromEmailBtn.addEventListener('click', () => {
            if (resetPasswordEmailModal) resetPasswordEmailModal.style.display = 'none';
            if (recoveryModal) recoveryModal.style.display = 'flex';
        });
    }

    if (resetPasswordEmailModal) {
        resetPasswordEmailModal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                resetPasswordEmailModal.style.display = 'none';
            }
        });
    }


    // ==================== OTP VERIFICATION MODAL (Password Reset) ====================
    if (closeOtpBtn) {
        closeOtpBtn.addEventListener('click', () => {
            if (otpVerificationModal) otpVerificationModal.style.display = 'none';
        });
    }

    if (backToEmailBtn) {
        backToEmailBtn.addEventListener('click', () => {
            if (otpVerificationModal) otpVerificationModal.style.display = 'none';
            if (resetPasswordEmailModal) resetPasswordEmailModal.style.display = 'flex';
            clearOtpInputs();
        });
    }

    if (otpVerificationModal) {
        otpVerificationModal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                otpVerificationModal.style.display = 'none';
            }
        });
    }

    // OTP Input Navigation (Password Reset)
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            // Allow only numbers
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            
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


    // Resend Password Reset OTP Link
     if (resendOtpLink) {
        resendOtpLink.addEventListener('click', (e) => {
            e.preventDefault();
             const emailInput = document.getElementById('resetEmail');
             const email = emailInput ? emailInput.value.trim() : '';
             
             const messageDiv = document.getElementById('passwordOtpErrorMessage'); 

             if (!email || !isValidEmail(email)) {
                 if (messageDiv) {
                       messageDiv.textContent = 'Email address missing. Go back and enter it again.';
                       messageDiv.style.color = 'red';
                       messageDiv.style.display = 'block';
                 } else {
                     alert('Email address missing. Go back and enter it again.');
                 }
                 return;
             }
              
             if (messageDiv) {
                  messageDiv.textContent = 'Resending OTP...';
                  messageDiv.style.color = 'green';
                  messageDiv.style.display = 'block';
             } else {
                 alert('Resending OTP...'); // Fallback
             }


             const formData = new FormData();
             formData.append('email', email);
             formData.append('type', 'password');

             fetch('send_otp.php', { method: 'POST', body: formData })
                 .then(response => response.json())
                 .then(data => {
                     if (data.success) {
                           if (messageDiv) {
                               messageDiv.textContent = data.message;
                               messageDiv.style.color = 'green';
                               messageDiv.style.display = 'block';
                               setTimeout(() => { if(messageDiv) messageDiv.style.display = 'none'; }, 2000);
                           } else {
                               alert(data.message);
                           }
                           clearOtpInputs();
                           if (otpInputs.length > 0) otpInputs[0].focus();
                     } else {
                           if (messageDiv) {
                               messageDiv.textContent = data.message;
                               messageDiv.style.color = 'red';
                               messageDiv.style.display = 'block';
                           } else {
                               alert('Error resending OTP: ' + data.message);
                           }
                     }
                 })
                 .catch(error => {
                     console.error('Resend Password OTP Error:', error);
                     if (messageDiv) {
                           messageDiv.textContent = 'Network error. Please try again.';
                           messageDiv.style.color = 'red';
                           messageDiv.style.display = 'block';
                     } else {
                          alert('A network error occurred while resending. Please try again.'); // Fallback
                     }
                 });
        });
     }

    // ==================== CREATE PASSWORD MODAL ====================
    if (closeCreatePasswordBtn) {
        closeCreatePasswordBtn.addEventListener('click', () => {
            if (createPasswordModal) createPasswordModal.style.display = 'none';
        });
    }

    if (backToOtpBtn) {
        backToOtpBtn.addEventListener('click', () => {
            if (createPasswordModal) createPasswordModal.style.display = 'none';
            if (otpVerificationModal) otpVerificationModal.style.display = 'flex';
        });
    }

    if (createPasswordModal) {
        createPasswordModal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                createPasswordModal.style.display = 'none';
            }
        });
    }

    // Toggle Password Visibility
    if (togglePassword1 && newPasswordInput) {
        togglePassword1.addEventListener('click', () => {
            togglePasswordVisibility(newPasswordInput); // Calls the function for the first input
        });
    }

    if (togglePassword2 && confirmPasswordInput) {
        togglePassword2.addEventListener('click', () => {
            togglePasswordVisibility(confirmPasswordInput); // Calls the function for the second input
        });
    }

    // Password validation listeners
    if (newPasswordInput) newPasswordInput.addEventListener('input', validatePassword);
    if (confirmPasswordInput) confirmPasswordInput.addEventListener('input', validatePassword);


    // ==================== PASSWORD SUCCESS MODAL ====================
    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', () => {
            if (passwordSuccessModal) passwordSuccessModal.style.display = 'none';
        });
    }

    if (backToLoginFromSuccessBtn) {
        backToLoginFromSuccessBtn.addEventListener('click', () => {
            if (passwordSuccessModal) passwordSuccessModal.style.display = 'none';
            // **REMOVED** if (loginModal) loginModal.style.display = 'flex';
            clearAllForms();
        });
    }

    if (passwordSuccessModal) {
        passwordSuccessModal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                passwordSuccessModal.style.display = 'none';
            }
        });
    }

    // ==================== LOGIN FORM SUBMISSION (Correct Version) ====================
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (loginError) {
                loginError.style.display = 'none';
                loginError.textContent = '';
            }
            const formData = new FormData(loginForm);
            
            // Get the submit button from the form
            const submitButton = loginForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'LOGGING IN...';
            }

            // **FIX 1:** Point to login_process.php
            fetch('login_process.php', { method: 'POST', body: formData })
                .then(response => {
                    if (!response.ok) {
                        // Handle server errors (like 500, 404)
                        throw new Error(`Server error: ${response.status} ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        window.location.href = data.redirect; // Redirect on success
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
                    console.error('Network or Fetch Error:', error);
                    if (loginError) {
                        loginError.textContent = 'Network error: Could not connect to the server.';
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
    // =======================================================================


    // **REMOVED** CARDS CLICK section

    // ===== RECOVERY PROCESS EVENT LISTENERS (UPDATED - Using message divs) =====

    // --- Send Username OTP ---
    if (sendUsernameOtpBtn) {
        sendUsernameOtpBtn.addEventListener('click', () => {
            const emailInput = document.getElementById('recoverUsernameEmail');
            const email = emailInput ? emailInput.value.trim() : '';
            
            const messageDiv = document.getElementById('recoverUsernameEmailMessage');
            if(messageDiv) { 
                messageDiv.textContent = '';
                messageDiv.style.display = 'none';
            }

            if (!email || !isValidEmail(email)) {
                if (messageDiv) {
                    messageDiv.textContent = 'Please enter a valid email address.';
                    messageDiv.style.display = 'block';
                }
                return;
            }

            sendUsernameOtpBtn.disabled = true;
            sendUsernameOtpBtn.textContent = 'SENDING...';

            const formData = new FormData();
            formData.append('email', email);
            formData.append('type', 'username');

            fetch('send_otp.php', { method: 'POST', body: formData })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    if(messageDiv) {
                        messageDiv.textContent = data.message;
                        messageDiv.style.color = 'green';
                        messageDiv.style.display = 'block';
                    }
                    setTimeout(() => {
                        if(messageDiv) messageDiv.style.display = 'none';
                        if(recoverUsernameEmailModal) recoverUsernameEmailModal.style.display = 'none';
                        if(usernameOtpVerificationModal) usernameOtpVerificationModal.style.display = 'flex';
                        if (usernameOtpInputs.length > 0) usernameOtpInputs[0].focus();
                    }, 2000);
                } else {
                    if (messageDiv) {
                         messageDiv.textContent = data.message;
                         messageDiv.style.color = 'red';
                         messageDiv.style.display = 'block';
                    }
                }
            })
            .catch(error => {
                console.error('Send Username OTP Error:', error);
                 if (messageDiv) {
                       messageDiv.textContent = 'Network error. Please try again.';
                       messageDiv.style.color = 'red';
                       messageDiv.style.display = 'block';
                 }
            })
            .finally(() => {
                sendUsernameOtpBtn.disabled = false;
                sendUsernameOtpBtn.textContent = 'SEND OTP';
            });
        });
    }

    // --- Verify Username OTP ---
    if (verifyUsernameOtpBtn) {
        verifyUsernameOtpBtn.addEventListener('click', () => {
            const messageDiv = document.getElementById('usernameOtpErrorMessage');
            if (messageDiv) { 
                messageDiv.textContent = '';
                messageDiv.style.display = 'none';
            }
            
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
            .then(response => response.json())
            .then(data => {
                if (data.success && data.username) {
                    const displayedUsername = document.getElementById('displayedUsername');
                    if (displayedUsername) displayedUsername.textContent = data.username;
                    if(usernameOtpVerificationModal) usernameOtpVerificationModal.style.display = 'none';
                    if(usernameDisplayModal) usernameDisplayModal.style.display = 'flex';
                    clearUsernameOtpInputs();
                } else {
                    if (messageDiv) {
                        messageDiv.textContent = data.message;
                        messageDiv.style.display = 'block';
                    }
                    clearUsernameOtpInputs();
                    if (usernameOtpInputs.length > 0) usernameOtpInputs[0].focus();
                }
            })
            .catch(error => {
                console.error('Verify Username OTP Error:', error);
                if (messageDiv) {
                    messageDiv.textContent = 'A network error occurred. Please try again.';
                    messageDiv.style.display = 'block';
                }
            })
            .finally(() => {
                verifyUsernameOtpBtn.disabled = false;
                verifyUsernameOtpBtn.textContent = 'VERIFY CODE';
            });
        });
    }


    // --- Send Password Reset OTP ---
    if (sendOtpBtn) {
        sendOtpBtn.addEventListener('click', () => {
            const emailInput = document.getElementById('resetEmail');
            const email = emailInput ? emailInput.value.trim() : '';

            const messageDiv = document.getElementById('resetPasswordEmailMessage');
            if(messageDiv) { 
                messageDiv.textContent = '';
                messageDiv.style.display = 'none';
            }

            if (!email || !isValidEmail(email)) {
                if (messageDiv) {
                    messageDiv.textContent = 'Please enter a valid email address.';
                    messageDiv.style.display = 'block';
                }
                return;
            }

            sendOtpBtn.disabled = true;
            sendOtpBtn.textContent = 'SENDING...';

            const formData = new FormData();
            formData.append('email', email);
            formData.append('type', 'password');

            fetch('send_otp.php', { method: 'POST', body: formData })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    if(messageDiv) {
                        messageDiv.textContent = data.message;
                        messageDiv.style.color = 'green';
                        messageDiv.style.display = 'block';
                    }
                    setTimeout(() => {
                        if(messageDiv) messageDiv.style.display = 'none';
                        if(resetPasswordEmailModal) resetPasswordEmailModal.style.display = 'none';
                        if(otpVerificationModal) otpVerificationModal.style.display = 'flex';
                        if (otpInputs.length > 0) otpInputs[0].focus();
                    }, 2000);
                } else {
                     if (messageDiv) {
                           messageDiv.textContent = data.message;
                           messageDiv.style.color = 'red';
                           messageDiv.style.display = 'block';
                     }
                }
            })
             .catch(error => {
                 console.error('Send Password OTP Error:', error);
                  if (messageDiv) {
                         messageDiv.textContent = 'Network error. Please try again.';
                         messageDiv.style.color = 'red';
                         messageDiv.style.display = 'block';
                  }
             })
            .finally(() => {
                sendOtpBtn.disabled = false;
                sendOtpBtn.textContent = 'SEND OTP';
            });
        });
    }


    // --- Verify Password Reset OTP ---
    if (verifyOtpBtn) {
        verifyOtpBtn.addEventListener('click', () => {
            const messageDiv = document.getElementById('passwordOtpErrorMessage');
            if (messageDiv) { 
                messageDiv.textContent = '';
                messageDiv.style.display = 'none';
            }
            
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
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    if(otpVerificationModal) otpVerificationModal.style.display = 'none';
                    if(createPasswordModal) createPasswordModal.style.display = 'flex';
                    clearOtpInputs();
                } else {
                    if (messageDiv) {
                        messageDiv.textContent = data.message;
                        messageDiv.style.display = 'block';
                    }
                    clearOtpInputs();
                    if (otpInputs.length > 0) otpInputs[0].focus();
                }
            })
            .catch(error => {
                console.error('Verify Password OTP Error:', error);
                if (messageDiv) {
                    messageDiv.textContent = 'A network error occurred. Please try again.';
                    messageDiv.style.display = 'block';
                }
            })
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
            if (messageDiv) { 
                // Don't clear the message here, in case validatePassword() set it
            }

            const newPassword = newPasswordInput ? newPasswordInput.value : '';
            const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

            // Check strength first
            if (!validatePasswordStrength(newPassword)) {
                 if (messageDiv) {
                     messageDiv.textContent = 'Password does not meet all requirements.';
                     messageDiv.style.display = 'block';
                 }
                return;
            }
            
            // Check match second (this is the final safeguard)
            if (newPassword !== confirmPassword) {
                if (messageDiv) {
                    messageDiv.textContent = 'Passwords do not match.';
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
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    if(createPasswordModal) createPasswordModal.style.display = 'none';
                    if(passwordSuccessModal) passwordSuccessModal.style.display = 'flex';
                     if(newPasswordInput) newPasswordInput.value = '';
                     if(confirmPasswordInput) confirmPasswordInput.value = '';
                     validatePassword();
                } else {
                    if (messageDiv) {
                        messageDiv.textContent = data.message;
                        messageDiv.style.display = 'block';
                    }
                }
            })
            .catch(error => {
                console.error('Change Password Error:', error);
                if (messageDiv) {
                    messageDiv.textContent = 'A network error occurred. Please try again.';
                    messageDiv.style.display = 'block';
                }
            })
            .finally(() => {
                changePasswordBtn.textContent = 'CHANGE PASSWORD';
                 validatePassword();
            });
        });
    }

}); // End DOMContentLoaded


// ==================== HELPER FUNCTIONS ====================

// **MODIFIED** clearLoginForm Function
function clearLoginForm() {
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password'); // Use the correct ID for the login password
  const loginErrorMsg = document.getElementById('login-error-message'); // **FIX 2:** Use correct ID
  
  if (usernameInput) usernameInput.value = '';
  
  if (passwordInput) {
      passwordInput.value = '';
      passwordInput.type = 'password'; // Reset to hidden
      
      // Find and reset the icon image
      const wrapper = passwordInput.parentElement;
      if (wrapper) {
          const iconImg = wrapper.querySelector('.eyeIconImg');
          if (iconImg) iconImg.src = 'assets/icons/eye-closed.png'; // Reset to closed eye
      }
  }
  
  if (loginErrorMsg) {
      loginErrorMsg.style.display = 'none';
      loginErrorMsg.textContent = '';
  }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// **MODIFIED** togglePasswordVisibility Function
function togglePasswordVisibility(input) {
  if (!input) return;

  const wrapper = input.parentElement;
  if (!wrapper) return;
  const iconImg = wrapper.querySelector('.eyeIconImg'); // Find the img tag

  if (!iconImg) return; 

  const isPassword = input.type === 'password';

  input.type = isPassword ? 'text' : 'password';
  
  // Toggle the image source based on the new state
  // If it *was* password (isPassword is true), it's now text, so show 'eye-open.png'
  // If it *was* text (isPassword is false), it's now password, so show 'eye-closed.png'
  iconImg.src = isPassword ? 'assets/icons/eye-open.png' : 'assets/icons/eye-closed.png'; 
}


function validatePasswordStrength(password) {
    if (password === null || password === undefined) return false;
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


// ===== UPDATED FUNCTION =====
function validatePassword() {
    const password = newPasswordInput ? newPasswordInput.value : '';
    const confirmPass = confirmPasswordInput ? confirmPasswordInput.value : '';
    
    // Get the message div
    const messageDiv = document.getElementById('createPasswordErrorMessage');

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
        const checkmark = element ? element.querySelector('.checkmark') : null;
        if (element) {
            if (requirementList[index]) {
                element.classList.add('active');
                 if(checkmark) checkmark.textContent = '✓';
            } else {
                element.classList.remove('active');
                 if(checkmark) checkmark.textContent = '☐';
            }
        }
    });

    const allMet = requirementList.every(req => req);
    const passwordsMatch = password === confirmPass && password.length > 0;

    // --- NEW: Real-time password match error logic ---
    if (messageDiv) {
        // Only show this error if all strength rules are met
        if (allMet) { 
            if (!passwordsMatch && confirmPass.length > 0) {
                // If passwords don't match AND user has started typing in confirm box
                messageDiv.textContent = 'Passwords do not match.';
                messageDiv.style.display = 'block';
            } else {
                // Clear the "Passwords do not match" error if they now match or if confirm box is empty
                if (messageDiv.textContent === 'Passwords do not match.') {
                     messageDiv.textContent = '';
                     messageDiv.style.display = 'none';
                }
            }
        } else {
             // If strength rules are broken, hide the "match" error 
             // to avoid clutter. The strength rules are primary.
             if (messageDiv.textContent === 'Passwords do not match.') {
                 messageDiv.textContent = '';
                 messageDiv.style.display = 'none';
             }
        }
    }
    // --- END NEW LOGIC ---

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
// ===== END OF UPDATED FUNCTION =====


function clearOtpInputs() {
    otpInputs.forEach(input => {
        if (input) input.value = '';
    });
    if (otpInputs.length > 0 && otpInputs[0]) otpInputs[0].focus();
}

function clearUsernameOtpInputs() {
    usernameOtpInputs.forEach(input => {
        if (input) input.value = '';
    });
    if (usernameOtpInputs.length > 0 && usernameOtpInputs[0]) usernameOtpInputs[0].focus();
}

// **MODIFIED** clearAllForms Function
function clearAllForms() {
  clearLoginForm(); // Resets login form fields and icon

  const resetEmailInput = document.getElementById('resetEmail');
  if (resetEmailInput) resetEmailInput.value = '';

  const recoverUsernameEmailInput = document.getElementById('recoverUsernameEmail');
   if(recoverUsernameEmailInput) recoverUsernameEmailInput.value = '';

  // Reset the create-password fields and their icons
  if (newPasswordInput) {
      newPasswordInput.value = '';
      newPasswordInput.type = 'password';
      const wrapper = newPasswordInput.parentElement;
      if(wrapper) {
          const iconImg = wrapper.querySelector('.eyeIconImg');
          if(iconImg) iconImg.src = 'assets/icons/eye-closed.png'; // Reset icon
      }
  }
  if (confirmPasswordInput) {
      confirmPasswordInput.value = '';
      confirmPasswordInput.type = 'password';
      const wrapper = confirmPasswordInput.parentElement;
      if(wrapper) {
          const iconImg = wrapper.querySelector('.eyeIconImg');
          if(iconImg) iconImg.src = 'assets/icons/eye-closed.png'; // Reset icon
      }
  }

  clearOtpInputs();
  clearUsernameOtpInputs();

  // Reset password validation display
  const requirementIds = ['req1', 'req2', 'req3', 'req4', 'req5', 'req6'];
  requirementIds.forEach(id => {
      const element = document.getElementById(id);
       const checkmark = element ? element.querySelector('.checkmark') : null;
      if (element) {
           element.classList.remove('active');
           if (checkmark) checkmark.textContent = '☐';
      }
  });

  // Reset change password button state
  if (changePasswordBtn) {
      changePasswordBtn.disabled = true;
      changePasswordBtn.style.opacity = '0.6';
  }
  
  const errorDivs = document.querySelectorAll('.formErrorMessage');
  errorDivs.forEach(div => {
      if (div) {
          div.textContent = '';
          div.style.display = 'none';
      }
  });
}

// ===== PROFILE BUTTON =====
const profileBtn = document.getElementById('profileBtn');
        const sidebar = document.getElementById('profile-sidebar');
        const closeBtn = document.getElementById('sidebar-close-btn');

        // 2. Add an event listener to the profile icon
        // When clicked, add the 'active' class to the sidebar to show it
        profileBtn.addEventListener('click', () => {
            sidebar.classList.add('active');
        });

        // 3. Add an event listener to the close button
        // When clicked, remove the 'active' class from the sidebar to hide it
        closeBtn.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });


                // ===== LOGOUT FUNCTIONALITY =====
        const logoutBtn = document.getElementById('logoutBtn');
        const logoutModal = document.getElementById('logoutModal');
        const closeLogoutBtn = document.getElementById('closeLogoutBtn');
        const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
        const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

        if (logoutBtn) {
          logoutBtn.addEventListener('click', () => {
            logoutModal.style.display = 'flex';
          });
        }

        if (closeLogoutBtn) {
          closeLogoutBtn.addEventListener('click', () => {
            logoutModal.style.display = 'none';
          });
        }

        if (cancelLogoutBtn) {
          cancelLogoutBtn.addEventListener('click', () => {
            logoutModal.style.display = 'none';
          });
        }

        if (confirmLogoutBtn) {
          confirmLogoutBtn.addEventListener('click', () => {
            console.log('Logout confirmed - redirecting to login page');
            window.location.href = '/logout.php'; // adjusted to logout.php
          });
        }

        if (logoutModal) {
          logoutModal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
              logoutModal.style.display = 'none';
            }
          });
        }