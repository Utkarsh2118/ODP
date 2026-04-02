const user = requireAuth("user");
if (!user) {
  window.__profileInitStopped = true;
}

const topUserName = document.getElementById("top-user-name");
const topUserAvatar = document.getElementById("top-user-avatar");

const sideLogoutBtn = document.getElementById("side-logout-btn");
const topLogoutBtn = document.getElementById("top-logout-btn");
const sidebarToggle = document.getElementById("sidebar-toggle");
const sidebar = document.getElementById("dash-sidebar");
const themeToggle = document.getElementById("theme-toggle");

const profileForm = document.getElementById("profile-form");
const passwordForm = document.getElementById("password-form");
const profileMessage = document.getElementById("profile-message");
const passwordMessage = document.getElementById("password-message");
const editProfileBtn = document.getElementById("edit-profile-btn");
const cancelProfileBtn = document.getElementById("cancel-profile-btn");
const profileActions = document.getElementById("profile-actions");

const profileNameInput = document.getElementById("profile-name");
const profileEmailInput = document.getElementById("profile-email");
const profilePhoneInput = document.getElementById("profile-phone");
const profileAddressInput = document.getElementById("profile-address");
const profileBioInput = document.getElementById("profile-bio");

const profileNameDisplay = document.getElementById("profile-name-display");
const profileEmailDisplay = document.getElementById("profile-email-display");
const profileAvatarImg = document.getElementById("profile-avatar-img");
const profileAvatarFallback = document.getElementById("profile-avatar-fallback");
const profileImageFileInput = document.getElementById("profile-image-file");

let profileImageData = "";
let cachedProfile = null;

const getInitials = (name) => {
  if (!name) return "U";
  return name
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

const setTheme = (theme) => {
  document.body.classList.toggle("theme-dark", theme === "dark");
  localStorage.setItem("odp_dashboard_theme", theme);
  if (themeToggle) {
    themeToggle.innerHTML =
      theme === "dark"
        ? '<i class="fa-solid fa-sun"></i>'
        : '<i class="fa-solid fa-moon"></i>';
  }
};

const applySavedTheme = () => {
  const saved = localStorage.getItem("odp_dashboard_theme") || "light";
  setTheme(saved);
};

const setProfileEditMode = (isEditing) => {
  profileNameInput.disabled = !isEditing;
  profilePhoneInput.disabled = !isEditing;
  profileAddressInput.disabled = !isEditing;
  profileBioInput.disabled = !isEditing;

  if (profileImageFileInput) {
    profileImageFileInput.disabled = !isEditing;
  }

  profileActions.classList.toggle("is-hidden", !isEditing);
  editProfileBtn.classList.toggle("is-hidden", isEditing);
};

const renderAvatar = (name, imageSrc) => {
  const initials = getInitials(name || "User");
  if (imageSrc) {
    profileAvatarImg.src = imageSrc;
    profileAvatarImg.classList.remove("is-hidden");
    profileAvatarFallback.classList.add("is-hidden");
    return;
  }

  profileAvatarImg.classList.add("is-hidden");
  profileAvatarImg.removeAttribute("src");
  profileAvatarFallback.classList.remove("is-hidden");
  profileAvatarFallback.textContent = initials;
};

const populateProfile = (profile) => {
  cachedProfile = profile;
  profileImageData = profile.profileImage || "";

  profileNameInput.value = profile.name || "";
  profileEmailInput.value = profile.email || "";
  profilePhoneInput.value = profile.phone || "";
  profileAddressInput.value = profile.address || "";
  profileBioInput.value = profile.bio || "";

  profileNameDisplay.textContent = profile.name || "User";
  profileEmailDisplay.textContent = profile.email || "-";

  topUserName.textContent = profile.name || "User";
  topUserAvatar.textContent = getInitials(profile.name || "User");
  renderAvatar(profile.name, profileImageData);
};

const loadProfile = async () => {
  try {
    const data = await apiRequest("/user/profile");
    populateProfile(data.user);
    setProfileEditMode(false);
  } catch (error) {
    showMessage(profileMessage, error.message, "error");
  }
};

const bindShellUi = () => {
  sideLogoutBtn.addEventListener("click", logout);
  topLogoutBtn.addEventListener("click", logout);

  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  themeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.contains("theme-dark");
    setTheme(isDark ? "light" : "dark");
  });
};

const bindProfileUi = () => {
  editProfileBtn.addEventListener("click", () => {
    setProfileEditMode(true);
  });

  cancelProfileBtn.addEventListener("click", () => {
    if (cachedProfile) {
      populateProfile(cachedProfile);
    }
    showMessage(profileMessage, "", "success");
    setProfileEditMode(false);
  });

  profileImageFileInput.addEventListener("change", () => {
    const file = profileImageFileInput.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showMessage(profileMessage, "Please select a valid image file", "error");
      return;
    }

    if (file.size > 1024 * 1024 * 2) {
      showMessage(profileMessage, "Image must be smaller than 2MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      profileImageData = String(reader.result || "");
      renderAvatar(profileNameInput.value || cachedProfile?.name || "User", profileImageData);
      showMessage(profileMessage, "Image ready. Click Save Changes to update profile.", "success");
    };
    reader.readAsDataURL(file);
  });

  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
      name: profileNameInput.value.trim(),
      phone: profilePhoneInput.value.trim(),
      address: profileAddressInput.value.trim(),
      bio: profileBioInput.value.trim(),
      profileImage: profileImageData,
    };

    if (!payload.name) {
      showMessage(profileMessage, "Name is required", "error");
      return;
    }

    try {
      const data = await apiRequest("/user/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      populateProfile(data.user);
      showMessage(profileMessage, "Profile updated successfully", "success");
      setProfileEditMode(false);
    } catch (error) {
      showMessage(profileMessage, error.message, "error");
    }
  });

  passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const oldPassword = document.getElementById("old-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (newPassword.length < 6) {
      showMessage(passwordMessage, "New password must be at least 6 characters", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage(passwordMessage, "Confirm password does not match", "error");
      return;
    }

    try {
      await apiRequest("/user/change-password", {
        method: "PUT",
        body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
      });
      passwordForm.reset();
      showMessage(passwordMessage, "Password changed successfully", "success");
    } catch (error) {
      showMessage(passwordMessage, error.message, "error");
    }
  });
};

applySavedTheme();
if (!window.__profileInitStopped) {
  bindShellUi();
  bindProfileUi();
  loadProfile();
}
