function saveAuth(token, user) {
  localStorage.setItem("odp_token", token);
  localStorage.setItem("odp_user", JSON.stringify(user));
}

function getCurrentUser() {
  const raw = localStorage.getItem("odp_user");
  return raw ? JSON.parse(raw) : null;
}

function logout() {
  localStorage.removeItem("odp_token");
  localStorage.removeItem("odp_user");
  window.location.href = "auth.html";
}

function requireAuth(role) {
  const token = localStorage.getItem("odp_token");
  const user = getCurrentUser();

  if (!token || !user) {
    window.location.href = "auth.html";
    return null;
  }

  if (role && user.role !== role) {
    window.location.href = "index.html";
    return null;
  }

  return user;
}

function renderNavAuth() {
  const navSlot = document.getElementById("nav-auth-slot");
  if (!navSlot) return;

  const isHomePage = document.body.classList.contains("campaigns-page");
  const user = getCurrentUser();

  if (isHomePage) {
    if (!user) {
      navSlot.innerHTML = `
        <a href="auth.html" class="nav-btn" id="login-btn">
          <i class="fas fa-right-to-bracket"></i> Login
        </a>
        <a href="auth.html" class="nav-btn" id="signup-btn">
          <i class="fas fa-user-plus"></i> Sign Up
        </a>
      `;
      return;
    }

    const dashboardLink = user.role === "admin" ? "admin.html" : "dashboard.html";
    const roleClass = user.role === "admin" ? "role-admin" : "role-user";
    const roleLabel = user.role === "admin" ? "ADMIN" : "USER";

    navSlot.innerHTML = `
      <span class="role-badge ${roleClass}">${roleLabel}</span>
      <a class="nav-btn" href="${dashboardLink}">
        <i class="fas fa-arrow-left"></i> Back to Dashboard
      </a>
      <button class="nav-btn nav-logout" id="logout-btn" type="button">
        <i class="fas fa-right-from-bracket"></i> Logout
      </button>
    `;

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) logoutBtn.addEventListener("click", logout);
    return;
  }

  const adminLinks = document.querySelectorAll('a[href="admin.html"]');
  const dashboardLinks = document.querySelectorAll('a[href="dashboard.html"]');

  const setAdminLinkState = (isAdminLoggedIn) => {
    adminLinks.forEach((link) => {
      link.style.display = "";

      if (isAdminLoggedIn) {
        link.classList.remove("restricted-admin-link");
        link.textContent = "Admin";
        link.title = "Open admin panel";
        link.onclick = null;
      } else {
        link.classList.add("restricted-admin-link");
        link.textContent = "Admin (Locked)";
        link.title = "Login with admin account to access admin panel";
        link.onclick = (event) => {
          event.preventDefault();
          window.alert("Admin panel access is only for admin users. Please login with an admin account.");
        };
      }
    });
  };

  if (!user) {
    adminLinks.forEach((link) => {
      link.style.display = "none";
      link.classList.remove("restricted-admin-link");
      link.textContent = "Admin";
      link.title = "";
      link.onclick = null;
    });
    dashboardLinks.forEach((link) => {
      link.style.display = "";
    });
    navSlot.innerHTML = '<a class="btn btn-outline" href="auth.html">Login</a>';
    return;
  }

  if (user.role !== "admin") {
    setAdminLinkState(false);
  } else {
    setAdminLinkState(true);
    dashboardLinks.forEach((link) => {
      link.style.display = "none";
    });
  }

  const dashboardLink = user.role === "admin" ? "admin.html" : "dashboard.html";
  const roleClass = user.role === "admin" ? "role-admin" : "role-user";
  const roleLabel = user.role === "admin" ? "ADMIN" : "USER";

  navSlot.innerHTML = `
    <span class="role-badge ${roleClass}">${roleLabel}</span>
    <a class="btn btn-outline" href="${dashboardLink}">${user.name}</a>
    <button class="btn btn-primary" id="logout-btn">Logout</button>
  `;

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);
}
