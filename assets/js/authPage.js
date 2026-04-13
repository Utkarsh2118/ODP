// Ensure renderNavAuth exists and handles missing elements gracefully
if (typeof renderNavAuth !== 'undefined') {
  try {
    renderNavAuth();
  } catch (err) {
    console.warn("renderNavAuth error:", err);
  }
}

/**
 * Validation Utilities
 */
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validateEmail = (email) => {
  if (!email.trim()) return "Email is required";
  if (!isValidEmail(email)) return "Please enter a valid email address";
  return null;
};

const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  return null;
};

const validateOtp = (otp) => {
  if (!otp || !otp.trim()) return "OTP is required";
  if (!/^\d{6}$/.test(otp.trim())) return "OTP must be 6 digits";
  return null;
};

const validateName = (name) => {
  if (!name.trim()) return "Name is required";
  if (name.trim().length < 2) return "Name must be at least 2 characters";
  return null;
};

/**
 * Error Display & Clear Functions
 */
const showError = (element, message) => {
  if (!element) return;
  element.textContent = message;
  element.classList.add("show");
};

const clearError = (element) => {
  if (!element) return;
  element.textContent = "";
  element.classList.remove("show");
};

const clearAllErrors = (formType) => {
  const errorSelector = formType === "login" ? "[id^='login'][id$='-error']" : "[id^='register'][id$='-error']";
  document.querySelectorAll(errorSelector).forEach((el) => clearError(el));
};

/**
 * Message Display Functions
 */
const showAuthMessage = (messageElement, text, type) => {
  if (!messageElement) return;
  messageElement.textContent = text;
  messageElement.className = `auth-message show ${type}`;
};

const clearAuthMessage = (messageElement) => {
  if (!messageElement) return;
  messageElement.textContent = "";
  messageElement.classList.remove("show", "error", "success");
};

/**
 * Loading State Management
 */
const setLoading = (button, loader, isLoading) => {
  if (!button) return;
  if (isLoading) {
    button.classList.add("loading");
    button.disabled = true;
  } else {
    button.classList.remove("loading");
    button.disabled = false;
  }
};

/**
 * Initialize Auth Page
 */
const initializeAuthPage = () => {
  console.log("Initializing auth page...");

  // ===== TAB SWITCHING =====
  const authTabs = document.querySelectorAll(".auth-tab");
  const authContainers = document.querySelectorAll(".auth-form-container");

  authTabs.forEach((tab) => {
    tab.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const tabName = this.getAttribute("data-tab");
      console.log("Clicked tab:", tabName);

      // Remove active from all tabs
      authTabs.forEach((t) => t.classList.remove("auth-tab-active"));
      // Add active to clicked tab
      this.classList.add("auth-tab-active");

      // Hide all containers
      authContainers.forEach((container) => container.classList.remove("active"));
      
      // Show target container
      const targetContainer = document.getElementById(`${tabName}-container`);
      if (targetContainer) {
        targetContainer.classList.add("active");
        clearAllErrors(tabName);
        const msgEl = document.getElementById(`${tabName}-message`);
        clearAuthMessage(msgEl);
        console.log("Switched to form:", tabName);
      }
    });
  });

  // ===== FORM SWITCH BUTTONS =====
  const switchButtons = document.querySelectorAll(".auth-switch-btn");
  switchButtons.forEach((btn) => {
    btn.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const targetTab = this.getAttribute("data-switch");
      console.log("Form switch to:", targetTab);
      
      const tabButton = document.querySelector(`.auth-tab[data-tab="${targetTab}"]`);
      if (tabButton) {
        tabButton.click();
      }
    });
  });

  // ===== PASSWORD TOGGLE =====
  const loginToggle = document.getElementById("login-toggle-password");
  const registerToggle = document.getElementById("register-toggle-password");
  const forgotToggle = document.getElementById("forgot-toggle-password");

  [loginToggle, registerToggle, forgotToggle].forEach((toggle) => {
    if (!toggle) return;
    
    toggle.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const inputId = this.id.replace("-toggle-password", "-password");
      const input = document.getElementById(inputId);
      
      if (!input) {
        console.warn("Input not found:", inputId);
        return;
      }

      console.log("Toggle password visibility for:", inputId);
      
      if (input.type === "password") {
        input.type = "text";
        this.innerHTML = '<i class="fas fa-eye-slash"></i>';
      } else {
        input.type = "password";
        this.innerHTML = '<i class="fas fa-eye"></i>';
      }
    });
  });

  // ===== LOGIN FORM =====
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    const loginEmail = document.getElementById("login-email");
    const loginPassword = document.getElementById("login-password");
    const loginBtn = loginForm.querySelector("button[type='submit']");
    const loginLoader = document.getElementById("login-loader");
    const loginMsg = document.getElementById("login-message");

    if (loginEmail) {
      loginEmail.addEventListener("input", () => {
        clearError(document.getElementById("login-email-error"));
      });
    }

    if (loginPassword) {
      loginPassword.addEventListener("input", () => {
        clearError(document.getElementById("login-password-error"));
      });
    }

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearAllErrors("login");
      clearAuthMessage(loginMsg);

      if (!loginEmail || !loginPassword) {
        console.error("Login form elements not found");
        return;
      }

      const email = loginEmail.value.trim();
      const password = loginPassword.value;

      const emailErr = validateEmail(email);
      const passErr = validatePassword(password);

      if (emailErr) {
        showError(document.getElementById("login-email-error"), emailErr);
        return;
      }

      if (passErr) {
        showError(document.getElementById("login-password-error"), passErr);
        return;
      }

      try {
        setLoading(loginBtn, loginLoader, true);

        // Use local storage instead of API
        const result = StorageManager.verifyCredentials(email, password);

        if (!result.success) {
          showAuthMessage(loginMsg, result.message || "Login failed", "error");
          setLoading(loginBtn, loginLoader, false);
          return;
        }

        saveAuth("local_token_" + result.user.id, result.user);
        showAuthMessage(loginMsg, "✓ Redirecting to dashboard...", "success");

        setTimeout(() => {
          window.location.href = result.user.role === "admin" ? "admin.html" : "dashboard.html";
        }, 800);
      } catch (error) {
        setLoading(loginBtn, loginLoader, false);
        showAuthMessage(loginMsg, error.message || "Login failed. Please try again.", "error");
      }
    });
  }

  // ===== FORGOT PASSWORD =====
  const forgotLink = document.getElementById("forgot-password-link");
  const forgotPanel = document.getElementById("forgot-password-panel");
  const forgotEmail = document.getElementById("forgot-email");
  const forgotGenerateBtn = document.getElementById("forgot-generate-btn");
  const forgotOtp = document.getElementById("forgot-otp");
  const forgotNewPassword = document.getElementById("forgot-new-password");
  const forgotResetBtn = document.getElementById("forgot-reset-btn");
  const forgotMsg = document.getElementById("forgot-message");

  // Track forgot password flow state
  let forgotPasswordState = {
    step: 1, // 1: email, 2: OTP verification, 3: password reset
    email: "",
    otpVerified: false,
  };

  if (forgotLink && forgotPanel) {
    forgotLink.addEventListener("click", (e) => {
      e.preventDefault();
      forgotPanel.classList.toggle("open");
      if (!forgotPanel.classList.contains("open")) {
        clearAuthMessage(forgotMsg);
        // Reset state when closing panel
        forgotPasswordState = { step: 1, email: "", otpVerified: false };
      }
    });
  }

  if (forgotGenerateBtn && forgotEmail) {
    forgotGenerateBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      clearError(document.getElementById("forgot-email-error"));
      clearAuthMessage(forgotMsg);

      const email = forgotEmail.value.trim();
      const emailErr = validateEmail(email);
      if (emailErr) {
        showError(document.getElementById("forgot-email-error"), emailErr);
        return;
      }

      // Check if user exists in local storage
      const user = StorageManager.getUserByEmail(email);
      if (!user) {
        showAuthMessage(forgotMsg, "Email not found in system", "error");
        return;
      }

      // Store email for next steps
      forgotPasswordState.email = email;
      forgotPasswordState.step = 3; // Skip OTP, go directly to password reset
      
      showAuthMessage(
        forgotMsg,
        "✓ Email verified. Please enter your new password below.",
        "success"
      );

      // Disable email input and show password field
      forgotEmail.disabled = true;
      forgotGenerateBtn.textContent = "Email Verified ✓";
      
      // Hide OTP section
      if (forgotOtp) forgotOtp.parentElement.parentElement.style.display = "none";
      if (document.getElementById("forgot-verify-btn")) document.getElementById("forgot-verify-btn").style.display = "none";

      // Show password field
      if (forgotNewPassword) {
        forgotNewPassword.parentElement.parentElement.style.display = "block";
        forgotNewPassword.disabled = false;
        forgotNewPassword.focus();
      }
      if (forgotResetBtn) forgotResetBtn.style.display = "block";
    });
  }

  // Verify OTP button - skip for local storage
  const forgotVerifyBtn = document.getElementById("forgot-verify-btn");
  if (forgotVerifyBtn && forgotOtp) {
    forgotVerifyBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      // For local storage, OTP is skipped - show password field directly
      forgotPasswordState.otpVerified = true;
      forgotPasswordState.step = 3;

      showAuthMessage(
        forgotMsg,
        "✓ Proceeding to password reset.",
        "success"
      );

      // Disable OTP field and show password field
      forgotOtp.disabled = true;
      forgotVerifyBtn.style.display = "none";
      if (forgotNewPassword) forgotNewPassword.disabled = false;
      if (forgotResetBtn) forgotResetBtn.style.display = "block";
      if (forgotNewPassword) forgotNewPassword.focus();
    });
  }

  if (forgotResetBtn && forgotOtp && forgotNewPassword) {
    forgotResetBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      clearError(document.getElementById("forgot-new-password-error"));
      clearAuthMessage(forgotMsg);

      const newPassword = forgotNewPassword.value;
      const passwordErr = validatePassword(newPassword);

      if (passwordErr) {
        showError(document.getElementById("forgot-new-password-error"), passwordErr);
        return;
      }

      try {
        forgotResetBtn.disabled = true;

        // Use local storage to update password
        const user = StorageManager.getUserByEmail(forgotPasswordState.email);
        if (!user) {
          showAuthMessage(forgotMsg, "User not found", "error");
          return;
        }

        const result = StorageManager.updateUser(user.id, { password: newPassword });

        if (!result.success) {
          showAuthMessage(forgotMsg, result.message || "Could not reset password", "error");
          return;
        }

        showAuthMessage(
          forgotMsg,
          "✓ Password reset successful! Logging in...",
          "success"
        );

        // Reset form and close panel after delay
        setTimeout(() => {
          forgotEmail.value = "";
          forgotOtp.value = "";
          forgotNewPassword.value = "";
          forgotPanel.classList.remove("open");

          // Reset UI state
          forgotEmail.disabled = false;
          forgotGenerateBtn.textContent = "Send OTP";
          forgotOtp.disabled = true;
          forgotNewPassword.disabled = true;
          if (forgotVerifyBtn) forgotVerifyBtn.style.display = "block";
          forgotResetBtn.style.display = "none";

          // Reset state
          forgotPasswordState = { step: 1, email: "", otpVerified: false };

          // Show login message
          const loginMsg = document.getElementById("login-message");
          showAuthMessage(
            loginMsg,
            "Password reset successful! Please log in with your new password.",
            "success"
          );
        }, 1500);
      } catch (error) {
        showAuthMessage(
          forgotMsg,
          error.message || "Could not reset password",
          "error"
        );
      } finally {
        forgotResetBtn.disabled = false;
      }
    });
  }

  // ===== REGISTER FORM =====
  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    const regName = document.getElementById("register-name");
    const regEmail = document.getElementById("register-email");
    const regPassword = document.getElementById("register-password");
    const regTerms = document.getElementById("register-terms");
    const regBtn = registerForm.querySelector("button[type='submit']");
    const regLoader = document.getElementById("register-loader");
    const regMsg = document.getElementById("register-message");

    if (regName) {
      regName.addEventListener("input", () => {
        clearError(document.getElementById("register-name-error"));
      });
    }

    if (regEmail) {
      regEmail.addEventListener("input", () => {
        clearError(document.getElementById("register-email-error"));
      });
    }

    if (regPassword) {
      regPassword.addEventListener("input", () => {
        clearError(document.getElementById("register-password-error"));
      });
    }

    if (regTerms) {
      regTerms.addEventListener("change", () => {
        clearError(document.getElementById("register-terms-error"));
      });
    }

    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearAllErrors("register");
      clearAuthMessage(regMsg);

      if (!regName || !regEmail || !regPassword || !regTerms) {
        console.error("Register form elements not found");
        return;
      }

      const name = regName.value.trim();
      const email = regEmail.value.trim();
      const password = regPassword.value;
      const termsAccepted = regTerms.checked;

      const nameErr = validateName(name);
      const emailErr = validateEmail(email);
      const passErr = validatePassword(password);

      if (nameErr) {
        showError(document.getElementById("register-name-error"), nameErr);
        return;
      }

      if (emailErr) {
        showError(document.getElementById("register-email-error"), emailErr);
        return;
      }

      if (passErr) {
        showError(document.getElementById("register-password-error"), passErr);
        return;
      }

      if (!termsAccepted) {
        showError(
          document.getElementById("register-terms-error"),
          "You must accept the Terms of Service and Privacy Policy"
        );
        return;
      }

      try {
        setLoading(regBtn, regLoader, true);

        // Use local storage instead of API
        const result = StorageManager.addUser({ name, email, password });

        if (!result.success) {
          showAuthMessage(regMsg, result.message || "Registration failed", "error");
          setLoading(regBtn, regLoader, false);
          return;
        }

        saveAuth("local_token_" + result.user.id, result.user);
        showAuthMessage(regMsg, "✓ Account created! Redirecting...", "success");

        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 800);
      } catch (error) {
        setLoading(regBtn, regLoader, false);
        showAuthMessage(regMsg, error.message || "Registration failed. Please try again.", "error");
      }
    });
  }

  console.log("Auth page initialization complete");
};

// Wait for DOM to be ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeAuthPage);
} else {
  // DOM already loaded
  setTimeout(initializeAuthPage, 0);
}
