/**
 * HomeoVault - Frontend Authentication Handler
 */

document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggles();
  initLoginForm();
  initRegisterForm();
  initForgotPasswordForm();
  initResetPasswordForm();
  initProfilePage();
});

/**
 * 1. Toggle Password Field Visibility
 */
function initPasswordToggles() {
  const toggles = document.querySelectorAll('.password-toggle');
  toggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const input = toggle.parentNode.querySelector('input');
      if (input) {
        if (input.type === 'password') {
          input.type = 'text';
          toggle.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
        } else {
          input.type = 'password';
          toggle.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
        }
      }
    });
  });
}

/**
 * 2. Login Flow
 */
function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  const emailInput = document.getElementById('email');
  const rememberCheckbox = document.getElementById('remember-me');

  // Autofill email if "Remember Me" was previously activated
  const rememberedEmail = localStorage.getItem('remembered_email');
  if (rememberedEmail && emailInput) {
    emailInput.value = rememberedEmail;
    if (rememberCheckbox) rememberCheckbox.checked = true;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = document.getElementById('password').value;
    const alertBox = document.getElementById('auth-alert');
    
    if (alertBox) alertBox.style.display = 'none';

    window.spinner.show();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const resData = await response.json();
      window.spinner.hide();

      if (resData.success) {
        // Manage Remember Me preference
        if (rememberCheckbox && rememberCheckbox.checked) {
          localStorage.setItem('remembered_email', email);
        } else {
          localStorage.removeItem('remembered_email');
        }

        window.toast.show('Login Successful', 'Welcome to HomeoVault.', 'success');
        
        // Redirect to dashboard page
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        showFormAlert(alertBox, resData.message || 'Login failed.');
      }
    } catch (err) {
      window.spinner.hide();
      showFormAlert(alertBox, 'Server communication error. Please try again.');
    }
  });
}

/**
 * 3. User Registration Flow
 */
function initRegisterForm() {
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const first_name = document.getElementById('first_name').value;
    const last_name = document.getElementById('last_name').value;
    const email = document.getElementById('email').value;
    const mobile = document.getElementById('mobile').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    const alertBox = document.getElementById('auth-alert');

    if (alertBox) alertBox.style.display = 'none';

    // Simple confirm check
    if (password !== confirmPassword) {
      showFormAlert(alertBox, 'Passwords do not match.');
      return;
    }

    window.spinner.show();

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, first_name, last_name, mobile })
      });

      const resData = await response.json();
      window.spinner.hide();

      if (resData.success) {
        window.toast.show('Account Registered', 'Please log in with your credentials.', 'success');
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 1500);
      } else {
        // Format validation array errors if available
        let errMsg = resData.message;
        if (resData.errors && Array.isArray(resData.errors)) {
          errMsg = resData.errors.map(err => err.message).join('<br>');
        }
        showFormAlert(alertBox, errMsg || 'Registration failed.');
      }
    } catch (err) {
      window.spinner.hide();
      showFormAlert(alertBox, 'Server communication error.');
    }
  });
}

/**
 * 4. Forgot Password request
 */
function initForgotPasswordForm() {
  const form = document.getElementById('forgot-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const alertBox = document.getElementById('auth-alert');

    if (alertBox) alertBox.style.display = 'none';

    window.spinner.show();

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const resData = await response.json();
      window.spinner.hide();

      if (resData.success) {
        // Highlight success
        alertBox.className = 'alert alert-success';
        alertBox.style.display = 'flex';
        alertBox.innerHTML = `<span>A password reset link has been dispatched to your email (Logged to server console for testing).</span>`;
        window.toast.show('Request Dispatched', 'Check application logs.', 'success');
      } else {
        showFormAlert(alertBox, resData.message || 'Forgot password request failed.');
      }
    } catch (err) {
      window.spinner.hide();
      showFormAlert(alertBox, 'Server communication error.');
    }
  });
}

/**
 * 5. Reset Password Form
 */
function initResetPasswordForm() {
  const form = document.getElementById('reset-form');
  if (!form) return;

  // Extract token from query params
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (!token) {
    const alertBox = document.getElementById('auth-alert');
    showFormAlert(alertBox, 'No valid password reset token found in URL parameters.');
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    const alertBox = document.getElementById('auth-alert');

    if (alertBox) alertBox.style.display = 'none';

    if (password !== confirmPassword) {
      showFormAlert(alertBox, 'Passwords do not match.');
      return;
    }

    window.spinner.show();

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const resData = await response.json();
      window.spinner.hide();

      if (resData.success) {
        window.toast.show('Password Reset', 'You can now log in with your new password.', 'success');
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 1500);
      } else {
        showFormAlert(alertBox, resData.message || 'Failed to reset password.');
      }
    } catch (err) {
      window.spinner.hide();
      showFormAlert(alertBox, 'Server communication error.');
    }
  });
}

/**
 * 6. User Profile Dashboard Page
 */
async function initProfilePage() {
  const profileForm = document.getElementById('profile-form');
  const passwordForm = document.getElementById('profile-password-form');
  const logoutBtn = document.getElementById('btn-profile-logout');

  if (!profileForm && !passwordForm && !logoutBtn) return;

  // Fetch current user details on load
  window.spinner.show();
  try {
    const response = await fetch('/api/users/profile');
    const resData = await response.json();
    window.spinner.hide();

    if (resData.success) {
      const user = resData.data;
      
      // Populate fields on profile page
      if (document.getElementById('profile_email')) {
        document.getElementById('profile_email').value = user.email || '';
      }
      if (document.getElementById('first_name')) {
        document.getElementById('first_name').value = user.first_name || '';
        document.getElementById('first_name').parentNode.querySelector('input').dispatchEvent(new Event('input'));
      }
      if (document.getElementById('last_name')) {
        document.getElementById('last_name').value = user.last_name || '';
        document.getElementById('last_name').parentNode.querySelector('input').dispatchEvent(new Event('input'));
      }
      if (document.getElementById('mobile')) {
        document.getElementById('mobile').value = user.mobile || '';
        document.getElementById('mobile').parentNode.querySelector('input').dispatchEvent(new Event('input'));
      }
      if (document.getElementById('profile_image')) {
        document.getElementById('profile_image').value = user.profile_image || '';
        document.getElementById('profile_image').parentNode.querySelector('input').dispatchEvent(new Event('input'));
      }

      // Fill in user initials in header avatar
      const avatarIcon = document.getElementById('avatar-initials');
      if (avatarIcon && user.first_name) {
        avatarIcon.textContent = `${user.first_name[0]}${user.last_name ? user.last_name[0] : ''}`.toUpperCase();
      }
    } else {
      // If unauthorized, push to login
      window.toast.show('Session Expired', 'Redirecting to login...', 'danger');
      setTimeout(() => { window.location.href = '/login.html'; }, 1000);
    }
  } catch (err) {
    window.spinner.hide();
    window.toast.show('Error', 'Failed to retrieve profile details.', 'danger');
  }

  // Handle Profile Update submissions
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const first_name = document.getElementById('first_name').value;
      const last_name = document.getElementById('last_name').value;
      const mobile = document.getElementById('mobile').value;
      const profile_image = document.getElementById('profile_image').value;

      window.spinner.show();
      try {
        const response = await fetch('/api/users/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ first_name, last_name, mobile, profile_image })
        });
        const resData = await response.json();
        window.spinner.hide();

        if (resData.success) {
          window.toast.show('Profile Updated', 'Your profile details have been saved.', 'success');
        } else {
          window.toast.show('Update Failed', resData.message || 'Failed to save changes.', 'danger');
        }
      } catch (err) {
        window.spinner.hide();
        window.toast.show('Error', 'Network error encountered.', 'danger');
      }
    });
  }

  // Handle Password Update submissions
  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById('current_password').value;
      const newPassword = document.getElementById('new_password').value;
      const confirmNew = document.getElementById('confirm_new_password').value;

      if (newPassword !== confirmNew) {
        window.toast.show('Validation Error', 'New passwords do not match.', 'warning');
        return;
      }

      window.spinner.show();
      try {
        const response = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword, newPassword })
        });
        const resData = await response.json();
        window.spinner.hide();

        if (resData.success) {
          window.toast.show('Password Changed', 'Credentials updated. Please log in again.', 'success');
          setTimeout(() => { window.location.href = '/login.html'; }, 1500);
        } else {
          window.toast.show('Failed', resData.message || 'Incorrect current credentials.', 'danger');
        }
      } catch (err) {
        window.spinner.hide();
        window.toast.show('Error', 'Network communication error.', 'danger');
      }
    });
  }

  // Handle Logout button click
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      window.spinner.show();
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.spinner.hide();
        window.toast.show('Logged Out', 'Successfully terminated session.', 'success');
        setTimeout(() => { window.location.href = '/login.html'; }, 1000);
      } catch (err) {
        window.spinner.hide();
        window.location.href = '/login.html';
      }
    });
  }
}

/**
 * Helper to display custom red alert banners inside cards.
 */
function showFormAlert(alertElement, message) {
  if (alertElement) {
    alertElement.className = 'alert alert-danger';
    alertElement.style.display = 'flex';
    alertElement.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      <span>${message}</span>
    `;
  }
}
