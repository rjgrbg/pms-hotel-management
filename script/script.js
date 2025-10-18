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
});

loginModal.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    loginModal.style.display = 'none';
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

// ==================== LOGIN FORM SUBMISSION ====================
submitBtn.addEventListener('click', (e) => {
  e.preventDefault();
  console.log('Login submitted');
});

// ==================== CARDS CLICK ====================
allCards.forEach(card => {
  card.addEventListener('click', () => {
    loginModal.style.display = 'flex';
  });
});

// ==================== HELPER FUNCTIONS ====================
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
    if (requirementList[index]) {
      element.classList.add('active');
    } else {
      element.classList.remove('active');
    }
  });
}

function clearOtpInputs() {
  otpInputs.forEach(input => {
    input.value = '';
  });
  otpInputs[0].focus();
}

function clearUsernameOtpInputs() {
  usernameOtpInputs.forEach(input => {
    input.value = '';
  });
  usernameOtpInputs[0].focus();
}