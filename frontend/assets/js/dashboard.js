const user = requireAuth("user");
if (!user) {
  window.__dashboardInitStopped = true;
}

const progressList = document.getElementById("campaign-progress-list");
const recentList = document.getElementById("recent-activity-list");

const totalDonatedEl = document.getElementById("kpi-total-donated");
const campaignsSupportedEl = document.getElementById("kpi-campaigns-supported");
const transactionsEl = document.getElementById("kpi-transactions");

const topUserName = document.getElementById("top-user-name");
const topUserAvatar = document.getElementById("top-user-avatar");

const sideLogoutBtn = document.getElementById("side-logout-btn");
const topLogoutBtn = document.getElementById("top-logout-btn");
const sidebarToggle = document.getElementById("sidebar-toggle");
const sidebar = document.getElementById("dash-sidebar");
const themeToggle = document.getElementById("theme-toggle");

const formatAmount = (amount) => `INR ${Number(amount || 0).toLocaleString()}`;

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

const relativeTime = (date) => {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const renderKpis = (donations) => {
  const successful = donations.filter((donation) => donation.status === "success");
  const totalDonated = successful.reduce((sum, donation) => sum + Number(donation.amount || 0), 0);
  const uniqueCampaigns = new Set(
    successful.map((donation) => donation.campaign?._id || donation.campaign).filter(Boolean)
  );

  totalDonatedEl.textContent = formatAmount(totalDonated);
  campaignsSupportedEl.textContent = String(uniqueCampaigns.size);
  transactionsEl.textContent = String(successful.length);
};

const renderRecentActivity = (donations) => {
  const items = donations.filter((donation) => donation.status === "success").slice(0, 6);
  if (!items.length) {
    recentList.innerHTML = `
      <li class="activity-item muted">
        <i class="fa-regular fa-clock"></i>
        <div>
          <p>No activity yet</p>
          <span>Your latest donations will appear here.</span>
        </div>
      </li>
    `;
    return;
  }

  recentList.innerHTML = items
    .map(
      (donation) => `
        <li class="activity-item">
          <i class="fa-solid fa-circle-check"></i>
          <div>
            <p>Donated ${formatAmount(donation.amount)} to ${donation.campaign?.title || "a campaign"}</p>
            <span>${relativeTime(donation.donatedAt)}</span>
          </div>
        </li>
      `
    )
    .join("");
};

const renderCampaignProgress = (donations, campaigns) => {
  const campaignTotals = donations
    .filter((donation) => donation.status === "success")
    .reduce((acc, donation) => {
      const campaignId = donation.campaign?._id || donation.campaign;
      if (!campaignId) return acc;
      acc[campaignId] = (acc[campaignId] || 0) + Number(donation.amount || 0);
      return acc;
    }, {});

  const supportedIds = Object.keys(campaignTotals);
  if (!supportedIds.length) {
    progressList.innerHTML = `
      <div class="progress-empty">
        <i class="fa-solid fa-seedling"></i>
        <p>Support a campaign to see your progress here.</p>
      </div>
    `;
    return;
  }

  const campaignsById = campaigns.reduce((acc, campaign) => {
    acc[campaign._id] = campaign;
    return acc;
  }, {});

  progressList.innerHTML = supportedIds
    .map((campaignId) => {
      const contributed = campaignTotals[campaignId];
      const campaign = campaignsById[campaignId] || {};
      const goal = Number(campaign.goalAmount || contributed || 1);
      const percent = Math.min((contributed / goal) * 100, 100);
      const title = campaign.title || "Campaign";

      return `
        <div class="progress-item">
          <div class="progress-meta">
            <p>${title}</p>
            <span>${formatAmount(contributed)} / ${formatAmount(goal)}</span>
          </div>
          <div class="progress-bar"><span style="width: ${percent.toFixed(1)}%"></span></div>
        </div>
      `;
    })
    .join("");
};

const bindStaticUi = () => {
  topUserName.textContent = user.name || "User";
  topUserAvatar.textContent = getInitials(user.name);

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

async function loadDashboardData() {
  try {
    const [donationsRes, campaignsRes] = await Promise.all([
      apiRequest("/donations/me"),
      apiRequest("/campaigns"),
    ]);

    const donations = donationsRes.donations || [];
    const campaigns = campaignsRes.campaigns || [];

    renderKpis(donations);
    renderRecentActivity(donations);
    renderCampaignProgress(donations, campaigns);
  } catch (error) {
    progressList.innerHTML = `<p class='message error'>${error.message}</p>`;
    recentList.innerHTML = `<li class='activity-item muted'>Could not load recent activity</li>`;
  }
}

applySavedTheme();
if (!window.__dashboardInitStopped) {
  bindStaticUi();
  loadDashboardData();
}
