/**
 * Admin User Management Page
 */

// Check if user is admin
requireAuth("admin");

let allUsers = [];
let currentEditingUserId = null;
let currentDeletingUserId = null;

/**
 * Show message
 */
function showMessage(text, type = "success") {
  const msgEl = document.getElementById("message");
  msgEl.textContent = text;
  msgEl.className = `message show ${type}`;

  // Auto-hide after 3 seconds
  setTimeout(() => {
    msgEl.classList.remove("show");
  }, 3000);
}

/**
 * Load and display all users
 */
function loadUsers() {
  apiRequest("/user/admin/users")
    .then((data) => {
      allUsers = Array.isArray(data.users) ? data.users : [];
      renderUsers(allUsers);
      updateStats();
    })
    .catch((error) => {
      showMessage(error.message || "Unable to load users", "error");
      renderUsers([]);
      updateStats();
    });
}

/**
 * Update statistics
 */
function updateStats() {
  const adminCount = allUsers.filter((user) => user.role === "admin").length;
  const userCount = allUsers.filter((user) => user.role === "user").length;
  document.getElementById("stat-total").textContent = allUsers.length;
  document.getElementById("stat-admins").textContent = adminCount;
  document.getElementById("stat-regular").textContent = userCount;
}

/**
 * Render users in table
 */
function renderUsers(users) {
  const tbody = document.getElementById("users-tbody");
  const noUsers = document.getElementById("no-users");

  if (users.length === 0) {
    tbody.innerHTML = "";
    noUsers.style.display = "block";
    return;
  }

  noUsers.style.display = "none";
  tbody.innerHTML = users
    .map(
      (user) => `
    <tr>
      <td><strong>${user.name}</strong></td>
      <td>
        <span class="user-email">${user.email}</span>
      </td>
      <td>
        <span class="user-role-badge ${user.role}">
          ${user.role.toUpperCase()}
        </span>
      </td>
      <td>${new Date(user.createdAt).toLocaleDateString()}</td>
      <td>
        <div class="user-actions">
          <button class="action-btn edit" onclick="openEditModal('${user.id}')">
            <i class="fa-solid fa-edit"></i> Edit
          </button>
          <button class="action-btn delete" onclick="openDeleteModal('${user.id}')">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </div>
      </td>
    </tr>
  `
    )
    .join("");
}

/**
 * Search users
 */
function searchUsers() {
  const query = document.getElementById("search-box").value.toLowerCase();

  const filtered = allUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
  );

  renderUsers(filtered);
}

/**
 * Open edit modal
 */
function openEditModal(userId) {
  currentEditingUserId = userId;
  const user = allUsers.find((entry) => String(entry.id) === String(userId));

  if (!user) {
    showMessage("User not found", "error");
    return;
  }

  document.getElementById("edit-name").value = user.name;
  document.getElementById("edit-email").value = user.email;
  document.getElementById("edit-role").value = user.role;
  document.getElementById("edit-password").value = "";

  document.getElementById("edit-modal").classList.add("active");
}

/**
 * Close edit modal
 */
function closeEditModal() {
  document.getElementById("edit-modal").classList.remove("active");
  currentEditingUserId = null;
  document.getElementById("edit-form").reset();
}

/**
 * Save user changes
 */
function saveUserChanges() {
  if (!currentEditingUserId) {
    showMessage("Error: No user selected", "error");
    return;
  }

  const name = document.getElementById("edit-name").value.trim();
  const email = document.getElementById("edit-email").value.trim();
  const role = document.getElementById("edit-role").value;
  const password = document.getElementById("edit-password").value;

  if (!name || !email) {
    showMessage("Name and email are required", "error");
    return;
  }

  const updates = { name, email, role };
  if (password) {
    updates.password = password;
  }

  apiRequest(`/user/admin/users/${currentEditingUserId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  })
    .then((result) => {
      showMessage(result.message || "User updated successfully", "success");
      closeEditModal();
      loadUsers();
    })
    .catch((error) => {
      showMessage(error.message || "Error updating user", "error");
    });
}

/**
 * Open delete modal
 */
function openDeleteModal(userId) {
  currentDeletingUserId = userId;
  document.getElementById("delete-modal").classList.add("active");
}

/**
 * Close delete modal
 */
function closeDeleteModal() {
  document.getElementById("delete-modal").classList.remove("active");
  currentDeletingUserId = null;
}

/**
 * Confirm delete
 */
function confirmDelete() {
  if (!currentDeletingUserId) {
    showMessage("Error: No user selected", "error");
    return;
  }

  // Prevent deleting yourself
  const currentUser = getCurrentUser();
  if (currentUser.id === currentDeletingUserId) {
    showMessage("Cannot delete your own account", "error");
    closeDeleteModal();
    return;
  }

  apiRequest(`/user/admin/users/${currentDeletingUserId}`, {
    method: "DELETE",
  })
    .then((result) => {
      showMessage(result.message || "User deleted successfully", "success");
      closeDeleteModal();
      loadUsers();
    })
    .catch((error) => {
      showMessage(error.message || "Error deleting user", "error");
    });
}

/**
 * Logout
 */
function handleLogout() {
  logout();
}

/**
 * Initialize page
 */
function initializePage() {
  // Verify admin access
  const user = getCurrentUser();
  if (!user || user.role !== "admin") {
    window.location.href = "auth.html";
    return;
  }

  // Set admin name in header
  document.getElementById("admin-name").textContent = user.name;
  document.getElementById("admin-avatar").textContent = user.name.charAt(0).toUpperCase();

  // Load users
  loadUsers();

  // Sidebar toggle
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebar = document.getElementById("admin-sidebar");
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("active");
    });
  }

  // Logout buttons
  const sideLogoutBtn = document.getElementById("side-logout-btn");
  const topLogoutBtn = document.getElementById("top-logout-btn");

  if (sideLogoutBtn) sideLogoutBtn.addEventListener("click", handleLogout);
  if (topLogoutBtn) topLogoutBtn.addEventListener("click", handleLogout);

  // Search
  const searchBox = document.getElementById("search-box");
  if (searchBox) {
    searchBox.addEventListener("input", searchUsers);
  }

  // Edit modal - close buttons
  const modalClose = document.getElementById("modal-close");
  const modalCancel = document.getElementById("modal-cancel");
  if (modalClose) modalClose.addEventListener("click", closeEditModal);
  if (modalCancel) modalCancel.addEventListener("click", closeEditModal);

  // Edit modal - form submit
  const editForm = document.getElementById("edit-form");
  if (editForm) {
    editForm.addEventListener("submit", (e) => {
      e.preventDefault();
      saveUserChanges();
    });
  }

  // Delete modal - close buttons
  const deleteModalClose = document.getElementById("delete-modal-close");
  const cancelDelete = document.getElementById("cancel-delete");
  if (deleteModalClose) deleteModalClose.addEventListener("click", closeDeleteModal);
  if (cancelDelete) cancelDelete.addEventListener("click", closeDeleteModal);

  // Delete modal - confirm button
  const confirmDeleteBtn = document.getElementById("confirm-delete");
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", confirmDelete);
  }

  console.log("Admin user management page initialized");
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializePage);
} else {
  setTimeout(initializePage, 0);
}
