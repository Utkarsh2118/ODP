renderNavAuth();

// DOM Elements
const campaignList = document.getElementById("campaign-list");
const searchInput = document.getElementById("search-input");
const searchClear = document.getElementById("search-clear");
const categoryFilter = document.getElementById("category-filter");
const sortFilter = document.getElementById("sort-filter");
const resetFiltersBtn = document.getElementById("reset-filters");
const resetAllBtn = document.getElementById("reset-all");
const emptyState = document.getElementById("empty-state");
const logoutBtn = document.getElementById("logout-btn");
const backDashboardBtn = document.getElementById("back-dashboard-btn");

const currentUser = getCurrentUser();
if (backDashboardBtn && currentUser) {
  backDashboardBtn.href = currentUser.role === "admin" ? "admin.html" : "dashboard.html";
}

// State
let allCampaigns = [];
let filteredCampaigns = [];

// Utility Functions
const showEmptyState = () => {
  campaignList.innerHTML = "";
  emptyState.style.display = "flex";
};

const hideEmptyState = () => {
  emptyState.style.display = "none";
};

const truncateText = (text, length = 140) => {
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

const getCategoryIcon = (category) => {
  const icons = {
    medical: "fa-heart-pulse",
    education: "fa-book",
    disaster: "fa-triangle-exclamation",
    community: "fa-people-group",
    environment: "fa-leaf",
    other: "fa-star"
  };
  return icons[category] || icons.other;
};

const getCategoryLabel = (category) => {
  const labels = {
    medical: "Medical",
    education: "Education",
    disaster: "Disaster Relief",
    community: "Community",
    environment: "Environment",
    other: "Other"
  };
  return labels[category] || "General";
};

const getProgressColor = (percentage) => {
  if (percentage >= 80) return "#166534"; // green (--ok)
  if (percentage >= 50) return "#0f766e"; // brand
  if (percentage >= 25) return "#ea580c"; // accent (orange)
  return "#b91c1c"; // danger (red)
};

const isUrgent = (campaign) => {
  const progress = (campaign.fundsRaised / campaign.goalAmount) * 100;
  return progress < 30; // Less than 30% funded
};

const getTrendingLabel = (campaign) => {
  const supporters = Math.floor(campaign.fundsRaised / 500);
  if (supporters > 50) return "Trending";
  if (isUrgent(campaign)) return "Urgent";
  return null;
};

const createCampaignCard = (campaign) => {
  const progress = Math.min((campaign.fundsRaised / campaign.goalAmount) * 100, 100);
  const supporters = Math.max(1, Math.floor(campaign.fundsRaised / 500));
  const trendingLabel = getTrendingLabel(campaign);
  const shortDesc = truncateText(campaign.description, 120);
  const daysLeft = Math.max(0, Math.floor(Math.random() * 30) + 1); // Simulated days
  const categoryIcon = getCategoryIcon(campaign.category);
  const categoryLabel = getCategoryLabel(campaign.category);
  const progressColor = getProgressColor(progress);

  return `
    <article class="campaign-card">
      <!-- Image Container -->
      <div class="campaign-card-image">
        <div class="campaign-image-placeholder">
          <i class="fas ${categoryIcon}"></i>
        </div>
        
        <!-- Badges -->
        <div class="campaign-badges">
          <span class="badge badge-verified">
            <i class="fas fa-check-circle"></i> Verified
          </span>
          ${trendingLabel ? `<span class="badge badge-${trendingLabel.toLowerCase()}">
            <i class="fas fa-${trendingLabel === 'Trending' ? 'fire' : 'clock'}"></i> ${trendingLabel}
          </span>` : ''}
        </div>

        <!-- Progress Overlay -->
        <div class="campaign-progress-overlay">
          <span class="progress-text">${progress.toFixed(0)}% Funded</span>
        </div>
      </div>

      <!-- Content -->
      <div class="campaign-card-content">
        <!-- Category Tag -->
        <div class="campaign-category">
          <i class="fas ${categoryIcon}"></i>
          <span>${categoryLabel}</span>
        </div>

        <!-- Title -->
        <h3 class="campaign-title">${campaign.title}</h3>

        <!-- Description -->
        <p class="campaign-description">${shortDesc}</p>

        <!-- Progress Bar -->
        <div class="campaign-progress-bar">
          <div class="progress-fill" style="width: ${progress}%; background: ${progressColor};"></div>
        </div>

        <!-- Stats Grid -->
        <div class="campaign-stats">
          <div class="stat">
            <small class="stat-label">Raised</small>
            <strong class="stat-value">INR ${campaign.fundsRaised.toLocaleString()}</strong>
          </div>
          <div class="stat">
            <small class="stat-label">Goal</small>
            <strong class="stat-value">INR ${campaign.goalAmount.toLocaleString()}</strong>
          </div>
          <div class="stat">
            <small class="stat-label">Donors</small>
            <strong class="stat-value">${supporters}</strong>
          </div>
          <div class="stat">
            <small class="stat-label">Days Left</small>
            <strong class="stat-value">${daysLeft}</strong>
          </div>
        </div>

        <!-- Actions -->
        <div class="campaign-actions">
          <a href="campaign.html?id=${campaign._id}" class="btn btn-primary btn-block">
            <i class="fas fa-heart"></i> Donate Now
          </a>
          <a href="campaign.html?id=${campaign._id}" class="btn btn-outline btn-block">
            <i class="fas fa-arrow-right"></i> View Details
          </a>
        </div>
      </div>
    </article>
  `;
};

// Filtering and Sorting Logic
const filterAndSort = () => {
  const searchTerm = searchInput.value.toLowerCase().trim();
  const selectedCategory = categoryFilter.value;
  const sortBy = sortFilter.value;

  // Filter campaigns
  filteredCampaigns = allCampaigns.filter((campaign) => {
    const matchesSearch = !searchTerm || 
      campaign.title.toLowerCase().includes(searchTerm) ||
      campaign.description.toLowerCase().includes(searchTerm);
    
    const matchesCategory = !selectedCategory || campaign.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Sort campaigns
  if (sortBy === "most-funded") {
    filteredCampaigns.sort((a, b) => b.fundsRaised - a.fundsRaised);
  } else if (sortBy === "most-urgent") {
    filteredCampaigns.sort((a, b) => {
      const progressA = (a.fundsRaised / a.goalAmount) * 100;
      const progressB = (b.fundsRaised / b.goalAmount) * 100;
      return progressA - progressB; // Less funded = more urgent
    });
  } else if (sortBy === "closing-soon") {
    // Simulated by random days left
    filteredCampaigns.sort((a, b) => Math.random() - 0.5);
  } else {
    // Newest first (assuming newer campaigns are later in array)
    filteredCampaigns.reverse();
  }

  renderCampaigns();
};

const renderCampaigns = () => {
  if (filteredCampaigns.length === 0) {
    showEmptyState();
    return;
  }

  hideEmptyState();
  campaignList.innerHTML = filteredCampaigns.map(createCampaignCard).join("");
};

// Event Listeners
searchInput.addEventListener("input", () => {
  searchClear.style.display = searchInput.value ? "flex" : "none";
  filterAndSort();
});

searchClear.addEventListener("click", () => {
  searchInput.value = "";
  searchClear.style.display = "none";
  filterAndSort();
});

categoryFilter.addEventListener("change", filterAndSort);
sortFilter.addEventListener("change", filterAndSort);

resetFiltersBtn.addEventListener("click", () => {
  searchInput.value = "";
  categoryFilter.value = "";
  sortFilter.value = "newest";
  searchClear.style.display = "none";
  filterAndSort();
});

resetAllBtn.addEventListener("click", () => {
  searchInput.value = "";
  categoryFilter.value = "";
  sortFilter.value = "newest";
  searchClear.style.display = "none";
  filterAndSort();
});

// Logout handler
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    if (!confirm("Are you sure you want to logout?")) return;
    if (typeof logout === "function") {
      logout();
      return;
    }
    localStorage.removeItem("odp_token");
    localStorage.removeItem("odp_user");
    window.location.href = "auth.html";
  });
}

// Load Campaigns
async function loadCampaigns() {
  try {
    const data = await apiRequest("/campaigns");

    if (!data.campaigns || data.campaigns.length === 0) {
      showEmptyState();
      return;
    }

    allCampaigns = data.campaigns;
    filterAndSort(); // This will also render campaigns
  } catch (error) {
    campaignList.innerHTML = `
      <article class="panel" style="grid-column: 1 / -1;">
        <div style="text-align: center; padding: 40px 20px;">
          <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--danger); margin-bottom: 20px;"></i>
          <h3>Unable to load campaigns</h3>
          <p style="color: var(--muted); margin-bottom: 20px;">${error.message}</p>
          <div style="text-align: left; background: #f3f4f6; padding: 15px; border-radius: 10px; font-size: 0.9rem;">
            <p><strong>Quick troubleshooting:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Ensure backend is running: <code>npm run dev</code> in backend folder</li>
              <li>Check backend/.env has MONGO_URI and other required variables</li>
              <li>Verify API URL in frontend/assets/js/config.js matches your backend</li>
              <li>Check browser console for detailed error messages</li>
            </ul>
          </div>
          <button class="btn btn-primary" onclick="location.reload();" style="margin-top: 20px;">
            <i class="fas fa-redo"></i> Retry
          </button>
        </div>
      </article>
    `;
    console.error("Failed to load campaigns:", error);
  }
}

// Initialize
loadCampaigns();
