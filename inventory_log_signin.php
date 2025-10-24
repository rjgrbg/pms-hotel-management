<?php
// Use secure session settings
session_start([
    'cookie_httponly' => true,
    'cookie_secure' => isset($_SERVER['HTTPS']),
    'use_strict_mode' => true
]);

// **MODIFIED:** Check if user is logged in
if (isset($_SESSION['UserID']) && isset($_SESSION['UserType'])) {
    // User is already logged in. Redirect them to the single inventory page.
    header("Location: inventory_log.php");
    exit();
}
// If the user is NOT logged in, the script does nothing 
// and the rest of the HTML page is displayed normally.
?>
    
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Celestia Hotel - Login</title>
    <!-- Linking to the correct CSS file -->
    <link rel="stylesheet" href="css/inventory_log.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <!-- Added back the 'Forum' font link -->
    <link href="https://fonts.googleapis.com/css2?family=Forum&display=swap" rel="stylesheet">
</head>

<body>

    <div class="main-container">

        <!-- Left Side: Login Form -->
        <div class="login-section">
            <h1 class="welcome-title">Welcome Back!</h1>
            <div class="divider"></div>

            <div class="form-box">
                <h2>Access Your Account</h2>
                
                <!-- 
                  !! CRITICAL FIX !! 
                  Added id="login-form" so the JavaScript can find it.
                  Added autocomplete="off" to help with testing.
                -->
                <form id="login-form" autocomplete="off">
                    <div class="input-group">
                        <label for="username">Username:</label>
                        <input type="text" id="username" name="username" placeholder="Enter your username" required>
                    </div>

                    <div class="input-group">
                        <label for="password">Password:</label>
                        <div class="password-wrapper">
                            <input type="password" id="password" name="password" placeholder="Enter your password" required>
                            <button type="button" class="togglePassword" id="toggleLoginPassword">
                                <img src="assets/icons/eye-closed.png" alt="Toggle Password Visibility" class="eyeIconImg">
                            </button>
                        </div>
                    </div>

                    <!-- Added a div for error messages -->
                    <div id="login-error-message" class="error-message"></div>

                    <a href="#" class="forgot-link" id="forgotPasswordLink">Forgot Account?</a>
                    <button type="submit" class="login-button">LOG IN</button>
                </form>
            </div>
        </div>

        <!-- Right Side: Branding -->
        <div class="branding-section">
            <img src="assets/images/celestia-logo.png" alt="The Celestia Hotel Logo" class="logo">
            <div class="hotel-title">THE CELESTIA</div>
            <div class="hotel-title-sub">HOTEL</div>
            <p class="hotel-subtitle">Housekeeping • Maintenance</p>
        </div>

    </div>
    
    <!-- =================================== -->
    <!-- === ACCOUNT RECOVERY MODALS START === -->
    <!-- =================================== -->

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

    <!-- ================================= -->
    <!-- === ACCOUNT RECOVERY MODALS END === -->
    <!-- ================================= -->


    <!-- Linking to the correct JavaScript file -->
    <script src="script/inventory_log_signin.js"></script>

</body>
</html>

