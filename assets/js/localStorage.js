/**
 * Local Storage Management System
 * Handles all user data storage and management in browser localStorage
 */

const StorageManager = (() => {
  const STORAGE_KEYS = {
    USERS: "odp_users",
    ADMIN_USER: "odp_admin",
    ROLES: "odp_roles",
  };

  /**
   * Initialize storage with default admin user if not exists
   */
  const initialize = () => {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
    }

    // Check if admin exists
    const users = getAllUsers();
    const adminExists = users.some((user) => user.role === "admin");

    if (!adminExists) {
      // Create default admin
      const defaultAdmin = {
        id: generateId(),
        name: "Admin",
        email: "Admin2102@1808.com",
        password: hashPassword("@Ramji2118"), // Simple hash
        role: "admin",
        createdAt: new Date().toISOString(),
      };
      addUser(defaultAdmin);
    }
  };

  /**
   * Generate unique ID
   */
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  /**
   * Simple password hashing (for demo purposes - not cryptographically secure)
   */
  const hashPassword = (password) => {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  };

  /**
   * Get all users
   */
  const getAllUsers = () => {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  };

  /**
   * Get user by email
   */
  const getUserByEmail = (email) => {
    const users = getAllUsers();
    return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  };

  /**
   * Get user by ID
   */
  const getUserById = (id) => {
    const users = getAllUsers();
    return users.find((user) => user.id === id);
  };

  /**
   * Add new user (register)
   */
  const addUser = (userData) => {
    // Check if user already exists
    if (getUserByEmail(userData.email)) {
      return {
        success: false,
        message: "User already exists with this email",
      };
    }

    const newUser = {
      id: generateId(),
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: hashPassword(userData.password),
      role: userData.role || "user",
      phone: userData.phone || "",
      address: userData.address || "",
      profileImage: userData.profileImage || "",
      bio: userData.bio || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const users = getAllUsers();
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    return {
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    };
  };

  /**
   * Update user
   */
  const updateUser = (userId, updates) => {
    const users = getAllUsers();
    const userIndex = users.findIndex((user) => user.id === userId);

    if (userIndex === -1) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Don't allow email change to an existing email
    if (updates.email && updates.email !== users[userIndex].email) {
      if (getUserByEmail(updates.email)) {
        return {
          success: false,
          message: "Email already in use",
        };
      }
    }

    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      id: userId, // Prevent ID changes
      email: updates.email ? updates.email.toLowerCase() : users[userIndex].email,
      password: updates.password ? hashPassword(updates.password) : users[userIndex].password,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    return {
      success: true,
      message: "User updated successfully",
      user: {
        id: users[userIndex].id,
        name: users[userIndex].name,
        email: users[userIndex].email,
        role: users[userIndex].role,
      },
    };
  };

  /**
   * Delete user
   */
  const deleteUser = (userId) => {
    const users = getAllUsers();
    const filteredUsers = users.filter((user) => user.id !== userId);

    if (filteredUsers.length === users.length) {
      return {
        success: false,
        message: "User not found",
      };
    }

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filteredUsers));

    return {
      success: true,
      message: "User deleted successfully",
    };
  };

  /**
   * Verify user credentials (for login)
   */
  const verifyCredentials = (email, password) => {
    const user = getUserByEmail(email);

    if (!user) {
      return {
        success: false,
        message: "Invalid credentials",
        user: null,
      };
    }

    // Compare hashed passwords
    if (hashPassword(password) !== user.password) {
      return {
        success: false,
        message: "Invalid credentials",
        user: null,
      };
    }

    return {
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        profileImage: user.profileImage,
        bio: user.bio,
      },
    };
  };

  /**
   * Change password
   */
  const changePassword = (userId, oldPassword, newPassword) => {
    const user = getUserById(userId);

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    if (hashPassword(oldPassword) !== user.password) {
      return {
        success: false,
        message: "Current password is incorrect",
      };
    }

    return updateUser(userId, { password: newPassword });
  };

  /**
   * Get user statistics
   */
  const getStats = () => {
    const users = getAllUsers();
    const adminCount = users.filter((u) => u.role === "admin").length;
    const userCount = users.filter((u) => u.role === "user").length;

    return {
      totalUsers: users.length,
      adminCount,
      userCount,
      users,
    };
  };

  /**
   * Clear all data (for reset)
   */
  const clearAll = () => {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    initialize();
    return { success: true, message: "All data cleared" };
  };

  // Initialize on load
  initialize();

  // Return public API
  return {
    initialize,
    getAllUsers,
    getUserByEmail,
    getUserById,
    addUser,
    updateUser,
    deleteUser,
    verifyCredentials,
    changePassword,
    getStats,
    clearAll,
  };
})();
