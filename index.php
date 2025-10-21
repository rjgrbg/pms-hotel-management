<?php
// Use secure session settings
session_start([
    'cookie_httponly' => true,
    'cookie_secure' => isset($_SERVER['HTTPS']),
    'use_strict_mode' => true
]);

// This is the new part
if (isset($_SESSION['UserID']) && isset($_SESSION['UserType'])) {
    // User is already logged in. Redirect them to their correct page.
    $user_type = $_SESSION['UserType'];
    
    // Use the same redirect map from your signin.php
    $redirect_map = [
        'admin'           => 'admin.php', // Use .php
        'housekeeping_manager' => 'housekeeping.php', // Use .php
        'housekeeping_staff'   => 'housekeeping_staff.php', // Use .php
        'maintenance_manager'  => 'maintenance.php', // Use .php
        'maintenance_staff'    => 'maintenance_staff.php', // Use .php
        'parking_manager'      => 'parking.php', // Use .php
        'default'              => 'index.php' // Fallback (shouldn't happen)
    ];

    $location = $redirect_map[$user_type] ?? $redirect_map['default'];
    
    // Perform the redirect
    header("Location: $location");
    exit();
}
// If the user is NOT logged in, the script does nothing 
// and the rest of the HTML page is displayed normally.
?>
<!DOCTYPE html>
<html lang="en">
<head></head>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Celestia Hotel - Property Management</title>
  <link rel="stylesheet" href="css/styles.css">
  <style>
    .formErrorMessage {
      color: red; 
      text-align: center; 
      margin-bottom: 10px; 
      font-weight: bold;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <main>
    <div class="frontPage">
      <button class="loginButton" id="loginBtn">LOGIN</button>

      <div class="logocontainer">
        <img src="assets/images/celestia-logo.png" alt="Logo" class="logo" />
        <h2 class="logoName">THE CELESTIA HOTEL</h2>
        <p class="subtitle">
          Housekeeping · Maintenance · Parking · Inventory
        </p>
      </div>
    </div>

    <section class="propertySection">
      <h2>Property Management</h2>
      <hr />
      <p>
        Where management meets sophistication. <br />
        Elevate housekeeping, maintenance, parking, and inventory with ease.
      </p>

      <div class="cardsContainer">
        <div class="card">
          <img src="assets/images/housekeeping.png" width="50" alt="Housekeeping Icon" />
          <h3>Housekeeping</h3>
          <p>Impeccable care, timeless comfort.</p>
        </div>

        <div class="card">
          <img src="assets/images/maintenance.png" width="50" alt="Maintenance Icon" />
          <h3>Maintenance</h3>
          <p>Excellence preserved in every detail.</p>
        </div>

        <div class="card">
          <img src="assets/images/parking.png" width="50" alt="Parking Icon" />
          <h3>Parking</h3>
          <p>Effortless organization, maximum convenience.</p>
        </div>

        <div class="card">
          <img src="assets/images/inventory.png" width="50" alt="Inventory Icon" />
          <h3>Inventory</h3>
          <p>Smart tracking, seamless control.</p>
        </div>
      </div>
    </section>

    <footer class="footer">
      <img src="assets/images/celestia-logo.png" alt="Celestia Hotel Logo" />

      <p><strong>THE CELESTIA HOTEL</strong></p>
      <p>Housekeeping · Maintenance · Parking · Inventory</p>

      <div class="footerLinks">
        <a href="#">Terms of Service</a> | <a href="#">Privacy Policy</a>
      </div>

      <p class="footerInfo">
        thecelestiahotel.com <br />
        100 Grade St. Villa Celestia, Flat Uno Please, Quezon City
      </p>

      <p style="margin-top: 10px; font-size: 12px; color: #a38b6d;">
        ©2025 SBIT-3F ALL RIGHTS RESERVED
      </p>
    </footer>

    <div class="modalBackdrop" id="loginModal" style="display: none;">
    <div class="emailVerificationPanel">
        <button class="closeButton" id="closeLoginBtn">×</button>
        
        <div class="verificationHeader">
            <img src="assets/images/celestia-logo.png" alt="Logo" class="modalLogo" />
            <h2>THE CELESTIA HOTEL</h2>
            <p>Property Management System</p>
        </div>

        <form class="verificationForm" id="loginForm"> 
            
            <div id="loginError" style="color: red; text-align: center; margin-bottom: 10px; display: none; font-weight: bold;"></div>

            <div class="formGroup">
                <label for="username">Username</label>
                <input 
                    type="text" 
                    id="username" 
                    name="username" placeholder="Enter your username"
                    required
                />
            </div>

            <div class="formGroup">
                <label for="password">Password</label>
                <div class="passwordInputWrapper">
                  <input 
                    type="password" 
                    id="password" 
                    name="password" 
                    class="passwordInput" 
                    placeholder="Enter your password"
                    required
                  />
                  <button type="button" class="togglePassword" id="toggleLoginPassword">
  <img src="assets/icons/eye-closed.png" alt="Toggle Password Visibility" class="eyeIconImg">
</button>
                </div>
            </div>
           
           <div style="text-align: right; margin-bottom: 15px;">
                <a href="#" class="forgotPassword" id="forgotPasswordLink" style="color: black;">Forgot Password?</a>
           </div>

            <button type="submit" class="verificationButton" id="submitBtn"> Sign In
            </button>
        </form>

    </div>
</div>

    <div class="modalBackdrop" id="recoveryModal" style="display: none;">
      <div class="recoveryModal">
        <button class="closeButton" id="closeRecoveryBtn">×</button>
        
        <div class="recoveryHeader">
          <h2>Account Recovery Options</h2>
          <p>Please choose which account detail you want to recover or change.</p>
        </div>

        <div class="recoveryOptions">
          <button class="recoveryButton" id="recoverUsernameBtn">
            RECOVER USERNAME
          </button>
          
          <div class="orDivider">or</div>
          
          <button class="recoveryButton" id="recoverPasswordBtn">
            RECOVER PASSWORD
          </button>
        </div>

        <div class="recoveryFooter">
          <button class="backButton" id="backToLoginBtn">
            ← Back to Login
          </button>
        </div>
      </div>
    </div>

    <div class="modalBackdrop" id="recoverUsernameEmailModal" style="display: none;">
      <div class="emailVerificationPanel">
        <button class="closeButton" id="closeRecoverUsernameEmailBtn">×</button>
        
        <div class="verificationHeader">
          <h2>Recover Username</h2>
          <p>Please enter your registered email address. We'll send a 6-digit One-Time Password (OTP) to verify your account.</p>
        </div>

        <div class="verificationForm">
          <div id="recoverUsernameEmailMessage" class="formErrorMessage" style="display: none;"></div>
          
          <div class="formGroup">
            <label for="recoverUsernameEmail">Email Address:</label>
            <input 
              type="email" 
              id="recoverUsernameEmail" 
              placeholder="Enter your email address"
              required
            />
          </div>

          <button type="button" class="verificationButton" id="sendUsernameOtpBtn">
            SEND OTP
          </button>
        </div>

        <div class="verificationFooter">
          <button class="backButton" id="backToRecoveryFromUsernameEmailBtn">
            ← Back to Options
          </button>
        </div>
      </div>
    </div>

    <div class="modalBackdrop" id="usernameOtpVerificationModal" style="display: none;">
      <div class="emailVerificationPanel">
        <button class="closeButton" id="closeUsernameOtpBtn">×</button>
        
        <div class="verificationHeader">
          <h2>Enter Verification Code</h2>
          <p>Please enter the 6-digit OTP sent to your email.</p>
        </div>

        <div class="verificationForm">
          <div id="usernameOtpErrorMessage" class="formErrorMessage" style="display: none;"></div>
          
          <div class="otpInputContainer" id="usernameOtpContainer">
          <input type="text" inputmode="numeric" pattern="[0-9]*" class="otpInput usernameOtpInput" maxlength="1" placeholder="0" required />
            <input type="text" inputmode="numeric" pattern="[0-9]*" class="otpInput usernameOtpInput" maxlength="1" placeholder="0" required />
            <input type="text" inputmode="numeric" pattern="[0-9]*" class="otpInput usernameOtpInput" maxlength="1" placeholder="0" required />
            <input type="text" inputmode="numeric" pattern="[0-9]*" class="otpInput usernameOtpInput" maxlength="1" placeholder="0" required />
            <input type="text" inputmode="numeric" pattern="[0-9]*" class="otpInput usernameOtpInput" maxlength="1" placeholder="0" required />
            <input type="text" inputmode="numeric" pattern="[0-9]*" class="otpInput usernameOtpInput" maxlength="1" placeholder="0" required />
          </div>

          <p class="resendCode">
            Didn't receive the code? <a href="#" id="resendUsernameOtpLink">Resend code</a>
          </p>

          <button type="button" class="verificationButton" id="verifyUsernameOtpBtn">
            VERIFY CODE
          </button>
        </div>

        <div class="verificationFooter">
          <button class="backButton" id="backToUsernameEmailBtn">
            ← Back
          </button>
        </div>
      </div>
    </div>

    <div class="modalBackdrop" id="usernameDisplayModal" style="display: none;">
      <div class="emailVerificationPanel successPanel">
        <button class="closeButton" id="closeUsernameDisplayBtn">×</button>
        
        <div class="verificationHeader">
          <h2>✓ Username Found</h2>
          <p>Your username has been recovered successfully.</p>
        </div>

        <div class="usernameDisplay">
          <div class="usernameBox">
            <p class="usernameLabel">Your Username:</p>
            <h3 id="displayedUsername" style="text-align: center; margin: 10px 0;"></h3>
          </div>
        </div>

        <div class="verificationFooter">
          <button class="backButton" id="backToLoginFromUsernameBtn">
            ← Back to Login
          </button>
        </div>
      </div>
    </div>

    <div class="modalBackdrop" id="resetPasswordEmailModal" style="display: none;">
      <div class="emailVerificationPanel">
        <button class="closeButton" id="closeResetEmailBtn">×</button>
        
        <div class="verificationHeader">
          <h2>Reset Your Password</h2>
          <p>Please enter your registered email address. We'll send a 6-digit One-Time Password (OTP) to verify your account.</p>
        </div>

        <div class="verificationForm">
          <div id="resetPasswordEmailMessage" class="formErrorMessage" style="display: none;"></div>
          
          <div class="formGroup">
            <label for="resetEmail">Email Address:</label>
            <input 
              type="email" 
              id="resetEmail" 
              placeholder="Enter your email address"
              required
            />
          </div>

          <button type="button" class="verificationButton" id="sendOtpBtn">
            SEND OTP
          </button>
        </div>

        <div class="verificationFooter">
          <button class="backButton" id="backToRecoveryFromEmailBtn">
            ← Back to Options
          </button>
        </div>
      </div>
    </div>

    <div class="modalBackdrop" id="otpVerificationModal" style="display: none;">
      <div class="emailVerificationPanel">
        <button class="closeButton" id="closeOtpBtn">×</button>
        
        <div class="verificationHeader">
          <h2>Enter Verification Code</h2>
          <p>Please enter the 6-digit OTP sent to your email.</p>
        </div>

        <div class="verificationForm">
          <div id="passwordOtpErrorMessage" class="formErrorMessage" style="display: none;"></div>
          
          <div class="otpInputContainer">
            <input type="text" inputmode="numeric" pattern="[0-9]*" class="otpInput" maxlength="1" placeholder="0" required/>
            <input type="text" inputmode="numeric" pattern="[0-9]*" class="otpInput" maxlength="1" placeholder="0" required/>
            <input type="text" inputmode="numeric" pattern="[0-9]*" class="otpInput" maxlength="1" placeholder="0" required/>
            <input type="text" inputmode="numeric" pattern="[0-9]*" class="otpInput" maxlength="1" placeholder="0" required/>
            <input type="text" inputmode="numeric" pattern="[0-9]*" class="otpInput" maxlength="1" placeholder="0" required/>
            <input type="text" inputmode="numeric" pattern="[0-9]*" class="otpInput" maxlength="1" placeholder="0" required/>    
          </div>

          <p class="resendCode">
            Didn't receive the code? <a href="#" id="resendOtpLink">Resend code</a>
          </p>

          <button type="button" class="verificationButton" id="verifyOtpBtn">
            VERIFY CODE
          </button>
        </div>

        <div class="verificationFooter">
          <button class="backButton" id="backToEmailBtn">
            ← Back
          </button>
        </div>
      </div>
    </div>

    <div class="modalBackdrop" id="createPasswordModal" style="display: none;">
      <div class="emailVerificationPanel">
        <button class="closeButton" id="closeCreatePasswordBtn">×</button>
        
        <div class="verificationHeader">
          <h2>Create New Password</h2>
        </div>

        <div class="verificationForm">
          <div id="createPasswordErrorMessage" class="formErrorMessage" style="display: none;"></div>
          
          <div class="formGroup">
    <label for="newPassword">New Password:</label>
    <div class="passwordInputWrapper">
        <input 
            type="password" 
            id="newPassword" 
            class="passwordInput"
            placeholder="Enter your new password"
            required
        />
        <button type="button" class="togglePassword" id="togglePassword1">
            <img src="assets/icons/eye-closed.png" alt="Toggle Password Visibility" class="eyeIconImg">
        </button>
    </div>
</div>

          <div class="formGroup">
            <label for="confirmPassword">Confirm New Password:</label>
            <div class="passwordInputWrapper">
              <input 
                type="password" 
                id="confirmPassword"
                class="passwordInput"
                placeholder="Confirm your new password"
                required
              />
              <button type="button" class="togglePassword" id="togglePassword2">
                <img src="assets/icons/eye-closed.png" alt="Toggle Password Visibility" class="eyeIconImg">
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
            CHANGE PASSWORD
          </button>
        </div>

        <div class="verificationFooter">
          <button class="backButton" id="backToOtpBtn">
            ← Back
          </button>
        </div>
      </div>
    </div>

    <div class="modalBackdrop" id="passwordSuccessModal" style="display: none;">
      <div class="emailVerificationPanel successPanel">
        <button class="closeButton" id="closeSuccessBtn">×</button>
        
        <div class="verificationHeader">
          <h2>✓ Password Changed Successfully</h2>
          <p>Your password has been updated. You can now login with your new password.</p>
        </div>

        <div class="verificationFooter">
          <button class="backButton" id="backToLoginFromSuccessBtn">
            ← Back to Login
          </button>
        </div>
      </div>
    </div>

  </main>

  <script src="script/script.js"></script>
</body>
</html>