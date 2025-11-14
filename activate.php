<?php
// activate.php
include('db_connection.php');

$token = $_GET['token'] ?? null;
$error_message = null;
$user_email = null;
$is_valid_token = false;

if ($token) {
    // Check if the token exists and has not expired
    $sql = "SELECT EmailAddress FROM pms_users WHERE ActivationToken = ? AND TokenExpiry > NOW()";
    if ($stmt = $conn->prepare($sql)) {
        $stmt->bind_param("s", $token);
        if ($stmt->execute()) {
            $result = $stmt->get_result();
            if ($user = $result->fetch_assoc()) {
                $is_valid_token = true;
                $user_email = $user['EmailAddress'];
            } else {
                $error_message = "This activation link is invalid or has expired. Please contact your administrator.";
            }
        } else {
            $error_message = "Database error. Please try again later.";
        }
        $stmt->close();
    } else {
        $error_message = "Database error. Please try again later.";
    }
} else {
    $error_message = "No activation token provided.";
}
$conn->close();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Activate Your Account - Celestia Hotel</title>
  <link rel="stylesheet" href="css/styles.css">
  <style>
    /* Add some specific styles for this page */
    body {
      background-image: linear-gradient(rgba(72, 12, 27, 0.8), rgba(72, 12, 27, 0.8)), url('assets/images/bg-landing-page.jpg');
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    /* We'll borrow the 'emailVerificationPanel' style from styles.css */
    .activationPanel {
      background: linear-gradient(135deg, #f5e6d3 0%, #e8d4b8 100%);
      border: 3px solid #5c3d2e;
      border-radius: 20px;
      padding: 40px;
      width: 90%;
      max-width: 450px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
      position: relative;
    }
    .activationPanel .formErrorMessage {
      display: none;
      background: #ffdddd;
      color: #d8000c;
      border: 1px solid #d8000c;
      padding: 10px 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 13px;
      font-weight: 500;
      text-align: center;
    }
     .activationPanel .formSuccessMessage {
      display: none;
      background: #ddffdd;
      color: #006400;
      border: 1px solid #006400;
      padding: 10px 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 13px;
      font-weight: 500;
      text-align: center;
    }
  </style>
</head>
<body>

  <div class="activationPanel">
    <div class="verificationHeader">
        <img src="assets/images/celestia-logo.png" alt="Logo" class="modalLogo" style="width: 80px; height: 80px;" />
        <h2>Set Your Password</h2>
    </div>

    <?php if ($is_valid_token): ?>
        <p style="color: #5c3d2e; text-align: center; font-size: 14px; margin-bottom: 25px;">
            Welcome! You are activating the account for:<br><strong><?php echo htmlspecialchars($user_email); ?></strong>
        </p>

        <div class="verificationForm">
          <input type="hidden" id="activation_token" value="<?php echo htmlspecialchars($token); ?>">
          
          <div id="createPasswordErrorMessage" class="formErrorMessage"></div>
          
          <div class="formGroup">
            <label for="newPassword" style="color: #5c3d2e;">New Password:</label>
            <div class="passwordInputWrapper">
                <input 
                    type="password" 
                    id="newPassword" 
                    class="passwordInput"
                    placeholder="Enter your new password"
                    required
                />
                <button type="button" class="togglePassword" id="togglePassword1">
                    <img src="assets/icons/eye-closed.png" alt="Toggle" class="eyeIconImg">
                </button>
            </div>
          </div>

          <div class="formGroup">
            <label for="confirmPassword" style="color: #5c3d2e;">Confirm New Password:</label>
            <div class="passwordInputWrapper">
              <input 
                type="password" 
                id="confirmPassword"
                class="passwordInput"
                placeholder="Confirm your new password"
                required
              />
              <button type="button" class="togglePassword" id="togglePassword2">
                <img src="assets/icons/eye-closed.png" alt="Toggle" class="eyeIconImg">
              </button>
            </div>
          </div>

          <div class="passwordRequirements">
            <p class="requirementTitle">Password must contain:</p>
            <ul class="requirementList">
              <li id="req1"><span class="checkmark">☐</span> At least 8 characters</li>
              <li id="req2"><span class="checkmark">☐</span> At least one uppercase letter</li>
              <li id="req3"><span class="checkmark">☐</span> At least one lowercase letter</li>
              <li id="req4"><span class="checkmark">☐</span> At least one number</li>
              <li id="req5"><span class="checkmark">☐</span> At least one special character</li>
              <li id="req6"><span class="checkmark">☐</span> No spaces or common words</li>
            </ul>
          </div>

          <button type="button" class="verificationButton" id="changePasswordBtn">
            ACTIVATE ACCOUNT
          </button>
        </div>

    <?php else: ?>
        <div class="formErrorMessage" style="display: block; text-align: center;">
            <?php echo htmlspecialchars($error_message); ?>
        </div>
        <div class="verificationFooter" style="border-top: none; padding-top: 10px;">
           <a href="index.php" class="backButton" style="color: #5c3d2e;">← Back to Login</a>
        </div>
    <?php endif; ?>
  </div>

  <script>
    // Get elements
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const messageDiv = document.getElementById('createPasswordErrorMessage');
    const tokenInput = document.getElementById('activation_token');

    // Add listeners if the form exists
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', validatePassword);
        confirmPasswordInput.addEventListener('input', validatePassword);
        changePasswordBtn.addEventListener('click', submitNewPassword);
        
        // Toggle Password Visibility
        document.getElementById('togglePassword1').addEventListener('click', () => {
            togglePasswordVisibility(newPasswordInput);
        });
        document.getElementById('togglePassword2').addEventListener('click', () => {
            togglePasswordVisibility(confirmPasswordInput);
        });

        // Initialize button state
        validatePassword();
    }

    // Function to handle the password submission
    function submitNewPassword() {
        if (changePasswordBtn.disabled) return;

        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const token = tokenInput.value;

        // Final check
        if (!validatePasswordStrength(newPassword) || newPassword !== confirmPassword) {
            showMessage('Password does not meet all requirements or passwords do not match.', 'error');
            return;
        }
        
        changePasswordBtn.disabled = true;
        changePasswordBtn.textContent = 'ACTIVATING...';

        const formData = new FormData();
        formData.append('newPassword', newPassword);
        formData.append('confirmPassword', confirmPassword);
        formData.append('token', token);

        fetch('set_password.php', { method: 'POST', body: formData })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Show success message and redirect
                    document.querySelector('.activationPanel').innerHTML = `
                        <div class="verificationHeader">
                           <img src="assets/icons/successful-icon.png" alt="Success" class="modalLogo" style="width: 80px; height: 80px;" />
                           <h2 style="color: #2d5431;">Account Activated!</h2>
                           <p style="color: #4a7c4e;">Your password has been set. You can now log in with your new credentials.</p>
                        </div>
                        <div class="verificationFooter" style="border-top: 2px solid rgba(92, 61, 46, 0.2);">
                           <a href="index.php" class="backButton" style="color: #5c3d2e; font-weight: bold; font-size: 16px;">Click here to Login</a>
                        </div>`;
                } else {
                    showMessage(data.message, 'error');
                    changePasswordBtn.disabled = false;
                    changePasswordBtn.textContent = 'ACTIVATE ACCOUNT';
                }
            })
            .catch(error => {
                console.error('Fetch Error:', error);
                showMessage('A network error occurred. Please try again.', 'error');
                changePasswordBtn.disabled = false;
                changePasswordBtn.textContent = 'ACTIVATE ACCOUNT';
            });
    }

    function showMessage(msg, type = 'error') {
        if (messageDiv) {
            messageDiv.textContent = msg;
            messageDiv.className = `formErrorMessage ${type}`;
            if(type === 'success') {
                 messageDiv.className = `formSuccessMessage`;
            }
            messageDiv.style.display = 'block';
        }
    }

    // --- All Helper Functions from script.js ---

    function togglePasswordVisibility(input) {
      if (!input) return;
      const wrapper = input.parentElement;
      if (!wrapper) return;
      const iconImg = wrapper.querySelector('.eyeIconImg');
      if (!iconImg) return; 
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
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
    
    function validatePassword() {
        const password = newPasswordInput ? newPasswordInput.value : '';
        const confirmPass = confirmPasswordInput ? confirmPasswordInput.value : '';
        
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

        let allMet = true;
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
                  allMet = false;
              }
          }
        });

        const passwordsMatch = password === confirmPass && password.length > 0;

        if (messageDiv) {
            if (allMet) { 
                if (!passwordsMatch && confirmPass.length > 0) {
                    showMessage('Passwords do not match.', 'error');
                } else {
                    if (messageDiv.textContent === 'Passwords do not match.') {
                         messageDiv.style.display = 'none';
                    }
                }
            } else {
                if (messageDiv.textContent === 'Passwords do not match.') {
                     messageDiv.style.display = 'none';
                }
            }
        }

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
  </script>

</body>
</html>