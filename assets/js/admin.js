renderNavAuth();
const adminUser = requireAuth("admin");

if (!adminUser) {
  window.__adminInitStopped = true;
}

const campaignForm = document.getElementById("campaign-form");
const campaignMessage = document.getElementById("campaign-message");
const campaignsTable = document.getElementById("admin-campaigns");
const donationsTable = document.getElementById("admin-donations");
const campaignSearch = document.getElementById("campaign-search");
const campaignPrevBtn = document.getElementById("campaign-prev");
const campaignNextBtn = document.getElementById("campaign-next");
const campaignPageInfo = document.getElementById("campaign-page-info");
const analyticsBars = document.getElementById("campaign-analytics-bars");
const adminToast = document.getElementById("admin-toast");

const imageInput = document.getElementById("image");
const imagePreview = document.getElementById("image-preview");
const imagePreviewEmpty = document.getElementById("image-preview-empty");

const kpiTotalFunds = document.getElementById("kpi-total-funds");
const kpiTotalCampaigns = document.getElementById("kpi-total-campaigns");
const kpiTotalUsers = document.getElementById("kpi-total-users");
const kpiTotalDonations = document.getElementById("kpi-total-donations");

const adminName = document.getElementById("admin-name");
const adminAvatar = document.getElementById("admin-avatar");
const topLogoutBtn = document.getElementById("top-logout-btn");
const sideLogoutBtn = document.getElementById("side-logout-btn");
const sidebarToggle = document.getElementById("sidebar-toggle");
const adminSidebar = document.getElementById("admin-sidebar");
const adminNav = document.getElementById("admin-nav");

const createBtn = document.getElementById("create-campaign-btn");
const createSpinner = document.getElementById("create-spinner");
const createBtnText = document.getElementById("create-btn-text");

let allCampaigns = [];
let filteredCampaigns = [];
let allDonations = [];
let campaignPage = 1;
const campaignsPerPage = 6;
const LOCAL_KEYS = {
  CAMPAIGNS: "odp_campaigns",
  DONATIONS: "odp_donations",
};

let adminDataMode = "api";
let localModeToastShown = false;

const formatAmount = (amount) => `INR ${Number(amount || 0).toLocaleString()}`;

const isConnectivityError = (error) => {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("cannot reach backend api") || message.includes("timed out");
};

const generateLocalId = (prefix = "id") =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const getLocalCampaigns = () => {
  const raw = localStorage.getItem(LOCAL_KEYS.CAMPAIGNS);
  const campaigns = raw ? JSON.parse(raw) : [];
  return campaigns.map((campaign) => ({
    _id: campaign._id || campaign.id || generateLocalId("cmp"),
    title: campaign.title || "Untitled Campaign",
    description: campaign.description || "",
    goalAmount: Number(campaign.goalAmount || 0),
    fundsRaised: Number(campaign.fundsRaised || 0),
    imageUrl: campaign.imageUrl || "",
    isActive: campaign.isActive !== false,
    createdAt: campaign.createdAt || new Date().toISOString(),
  }));
};

const saveLocalCampaigns = (campaigns) => {
  localStorage.setItem(LOCAL_KEYS.CAMPAIGNS, JSON.stringify(campaigns));
};

const getLocalDonations = () => {
  const raw = localStorage.getItem(LOCAL_KEYS.DONATIONS);
  return raw ? JSON.parse(raw) : [];
};

const saveLocalDonations = (donations) => {
  localStorage.setItem(LOCAL_KEYS.DONATIONS, JSON.stringify(donations));
};

const switchToLocalMode = () => {
  adminDataMode = "local";
  if (!localModeToastShown) {
    localModeToastShown = true;
    showToast("Backend offline. Using local data mode.", "error");
  }
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getInitials = (name) => {
  if (!name) return "A";
  return name
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

const showToast = (message, type = "success") => {
  if (!adminToast) return;
  adminToast.textContent = message;
  adminToast.className = `admin-toast show ${type}`;
  window.setTimeout(() => {
    adminToast.className = "admin-toast";
  }, 2200);
};

const setCreateLoading = (isLoading) => {
  if (!createBtn || !createSpinner || !createBtnText) return;
  createBtn.disabled = isLoading;
  createSpinner.classList.toggle("is-hidden", !isLoading);
  createBtnText.textContent = isLoading ? "Creating..." : "Create Campaign";
};

const getCampaignStatus = (campaign) => {
  if (!campaign.isActive) return { label: "Inactive", className: "status-inactive" };
  if (Number(campaign.fundsRaised || 0) >= Number(campaign.goalAmount || 0)) {
    return { label: "Completed", className: "status-completed" };
  }
  return { label: "Active", className: "status-active" };
};

const renderAnalyticsBars = () => {
  if (!analyticsBars) return;
  if (!allCampaigns.length) {
    analyticsBars.innerHTML = '<p class="muted">No campaigns available for analytics.</p>';
    return;
  }

  const top = [...allCampaigns]
    .sort((a, b) => Number(b.fundsRaised || 0) - Number(a.fundsRaised || 0))
    .slice(0, 5);
  const maxRaised = Math.max(...top.map((campaign) => Number(campaign.fundsRaised || 0)), 1);

  analyticsBars.innerHTML = top
    .map((campaign) => {
      const width = Math.max(8, Math.round((Number(campaign.fundsRaised || 0) / maxRaised) * 100));
      return `
        <div class="analytics-row">
          <div class="analytics-meta">
            <strong>${escapeHtml(campaign.title)}</strong>
            <span>${formatAmount(campaign.fundsRaised)}</span>
          </div>
          <div class="analytics-track">
            <span style="width:${width}%"></span>
          </div>
        </div>
      `;
    })
    .join("");
};

const updateOverview = () => {
  const totalFunds = allCampaigns.reduce((sum, campaign) => sum + Number(campaign.fundsRaised || 0), 0);
  const userIds = new Set(
    allDonations
      .map((donation) => donation.user?._id || donation.user?.id || donation.user?.email)
      .filter(Boolean)
  );

  kpiTotalFunds.textContent = formatAmount(totalFunds);
  kpiTotalCampaigns.textContent = String(allCampaigns.length);
  kpiTotalUsers.textContent = String(userIds.size);
  kpiTotalDonations.textContent = String(allDonations.length);
};

const renderCampaignRows = () => {
  if (!filteredCampaigns.length) {
    campaignsTable.innerHTML =
      "<tr><td colspan='5' class='muted text-center'>No campaigns found for your search.</td></tr>";
    campaignPageInfo.textContent = "Page 1 of 1";
    campaignPrevBtn.disabled = true;
    campaignNextBtn.disabled = true;
    return;
  }

  const totalPages = Math.max(1, Math.ceil(filteredCampaigns.length / campaignsPerPage));
  if (campaignPage > totalPages) campaignPage = totalPages;

  const start = (campaignPage - 1) * campaignsPerPage;
  const pagedCampaigns = filteredCampaigns.slice(start, start + campaignsPerPage);

  campaignsTable.innerHTML = pagedCampaigns
    .map((campaign, index) => {
      const status = getCampaignStatus(campaign);
      const safeTitle = escapeHtml(campaign.title);
      const safeDescription = escapeHtml(campaign.description);
      const jsTitle = encodeURIComponent(campaign.title || "");
      const jsDescription = encodeURIComponent(campaign.description || "");
      const jsImage = encodeURIComponent(campaign.imageUrl || "");
      const displayIndex = start + index + 1;

      return `
        <tr>
          <td>
            <div class="table-title">${displayIndex}. ${safeTitle}</div>
            <div class="table-sub">${safeDescription.slice(0, 90)}${safeDescription.length > 90 ? "..." : ""}</div>
          </td>
          <td>${formatAmount(campaign.goalAmount)}</td>
          <td>${formatAmount(campaign.fundsRaised)}</td>
          <td><span class="status-pill ${status.className}">${status.label}</span></td>
          <td class="action-col">
            <button class="icon-action edit" onclick="editCampaign('${campaign._id}', '${jsTitle}', ${Number(
        campaign.goalAmount
      )}, '${jsDescription}', '${jsImage}')" title="Edit campaign" aria-label="Edit campaign">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="icon-action delete" onclick="deleteCampaign('${campaign._id}')" title="Delete campaign" aria-label="Delete campaign">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  campaignPageInfo.textContent = `Page ${campaignPage} of ${totalPages}`;
  campaignPrevBtn.disabled = campaignPage <= 1;
  campaignNextBtn.disabled = campaignPage >= totalPages;
};

const applyCampaignFilters = () => {
  const term = (campaignSearch?.value || "").toLowerCase().trim();
  filteredCampaigns = allCampaigns.filter((campaign) => {
    if (!term) return true;
    return (
      String(campaign.title || "").toLowerCase().includes(term) ||
      String(campaign.description || "").toLowerCase().includes(term)
    );
  });
  campaignPage = 1;
  renderCampaignRows();
};

async function loadCampaigns() {
  try {
    if (adminDataMode === "local") {
      allCampaigns = getLocalCampaigns();
    } else {
      const data = await apiRequest("/campaigns");
      allCampaigns = data.campaigns || [];
    }
    filteredCampaigns = [...allCampaigns];
    renderCampaignRows();
    renderAnalyticsBars();
    updateOverview();
  } catch (error) {
    if (isConnectivityError(error)) {
      switchToLocalMode();
      allCampaigns = getLocalCampaigns();
      filteredCampaigns = [...allCampaigns];
      renderCampaignRows();
      renderAnalyticsBars();
      updateOverview();
      return;
    }
    campaignsTable.innerHTML = `<tr><td colspan='5' class='message error'>${escapeHtml(error.message)}</td></tr>`;
  }
}

async function loadDonations() {
  try {
    if (adminDataMode === "local") {
      allDonations = getLocalDonations();
    } else {
      const data = await apiRequest("/donations/admin/all");
      allDonations = data.donations || [];
    }

    const statusBadge = (status) => {
      if (status === "success") return '<span class="status-pill status-active">Success</span>';
      if (status === "pending") return '<span class="status-pill status-pending">Pending</span>';
      if (status === "rejected") return '<span class="status-pill status-inactive">Rejected</span>';
      return '<span class="status-pill status-inactive">Failed</span>';
    };

    donationsTable.innerHTML = allDonations
      .map(
        (donation) => `
      <tr>
        <td>${escapeHtml(donation.user?.name || "-")}</td>
        <td>${escapeHtml(donation.campaign?.title || "-")}</td>
        <td>${formatAmount(donation.amount)}</td>
        <td>${new Date(donation.donatedAt).toLocaleString()}</td>
        <td>
          ${donation.paymentMode === "manual_qr" ? "Manual QR" : "Razorpay"}<br />
          <small>${escapeHtml(donation.payerReference || donation.razorpayPaymentId || "-")}</small>
        </td>
        <td>${statusBadge(donation.status)}</td>
        <td>
          ${
            donation.paymentMode === "manual_qr" && donation.status === "pending"
              ? `
                <button class="btn btn-primary btn-sm" onclick="reviewDonation('${donation._id}', 'approve')">Approve</button>
                <button class="btn btn-danger-soft btn-sm" onclick="reviewDonation('${donation._id}', 'reject')">Reject</button>
              `
              : `<span class="muted">Reviewed</span>`
          }
        </td>
      </tr>
    `
      )
      .join("");

    updateOverview();
  } catch (error) {
    if (isConnectivityError(error)) {
      switchToLocalMode();
      allDonations = getLocalDonations();
      donationsTable.innerHTML =
        allDonations
          .map(
            (donation) => `
      <tr>
        <td>${escapeHtml(donation.user?.name || "-")}</td>
        <td>${escapeHtml(donation.campaign?.title || "-")}</td>
        <td>${formatAmount(donation.amount)}</td>
        <td>${new Date(donation.donatedAt || donation.createdAt || Date.now()).toLocaleString()}</td>
        <td>
          ${(donation.paymentMode || "manual_qr") === "manual_qr" ? "Manual QR" : "Razorpay"}<br />
          <small>${escapeHtml(donation.payerReference || donation.razorpayPaymentId || "-")}</small>
        </td>
        <td><span class="status-pill ${donation.status === "success" ? "status-active" : donation.status === "pending" ? "status-pending" : "status-inactive"}">${escapeHtml((donation.status || "pending").toUpperCase())}</span></td>
        <td><span class="muted">Local mode</span></td>
      </tr>
    `
          )
          .join("") || "<tr><td colspan='7' class='muted text-center'>No donations yet.</td></tr>";
      updateOverview();
      return;
    }
    donationsTable.innerHTML = `<tr><td colspan='7' class='message error'>${escapeHtml(error.message)}</td></tr>`;
  }
}

window.reviewDonation = async function reviewDonation(donationId, action) {
  const confirmMsg = action === "approve" ? "Approve this payment request?" : "Reject this payment request?";
  if (!window.confirm(confirmMsg)) return;

  try {
    if (adminDataMode === "local") {
      const donations = getLocalDonations();
      const donationIndex = donations.findIndex((donation) => donation._id === donationId || donation.id === donationId);
      if (donationIndex === -1) throw new Error("Donation not found");

      const donation = donations[donationIndex];
      donation.status = action === "approve" ? "success" : "rejected";
      donations[donationIndex] = donation;
      saveLocalDonations(donations);

      if (action === "approve") {
        const campaigns = getLocalCampaigns();
        const campaignId = donation.campaign?._id || donation.campaign?.id || donation.campaignId;
        const campaignIndex = campaigns.findIndex((campaign) => campaign._id === campaignId || campaign.id === campaignId);
        if (campaignIndex >= 0) {
          campaigns[campaignIndex].fundsRaised =
            Number(campaigns[campaignIndex].fundsRaised || 0) + Number(donation.amount || 0);
          saveLocalCampaigns(campaigns);
        }
      }
    } else {
      await apiRequest(`/donations/admin/${donationId}/review`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
    }
    showToast(action === "approve" ? "Donation approved" : "Donation rejected");
    await loadDonations();
    await loadCampaigns();
  } catch (error) {
    if (isConnectivityError(error)) {
      switchToLocalMode();
      await window.reviewDonation(donationId, action);
      return;
    }
    window.alert(error.message);
  }
};

window.deleteCampaign = async function deleteCampaign(campaignId) {
  const confirmDelete = window.confirm("Delete this campaign?");
  if (!confirmDelete) return;

  try {
    if (adminDataMode === "local") {
      const campaigns = getLocalCampaigns().filter(
        (campaign) => campaign._id !== campaignId && campaign.id !== campaignId
      );
      saveLocalCampaigns(campaigns);
    } else {
      await apiRequest(`/campaigns/${campaignId}`, {
        method: "DELETE",
      });
    }
    showToast("Campaign deleted");
    await loadCampaigns();
  } catch (error) {
    if (isConnectivityError(error)) {
      switchToLocalMode();
      await window.deleteCampaign(campaignId);
      return;
    }
    window.alert(error.message);
  }
};

window.editCampaign = async function editCampaign(
  campaignId,
  titleEncoded,
  goalAmount,
  descriptionEncoded,
  imageUrlEncoded
) {
  const title = decodeURIComponent(titleEncoded || "");
  const description = decodeURIComponent(descriptionEncoded || "");
  const imageUrl = decodeURIComponent(imageUrlEncoded || "");

  const newTitle = window.prompt("Campaign title", title);
  if (!newTitle) return;

  const newDescription = window.prompt("Campaign description", description);
  if (!newDescription) return;

  const goalInput = window.prompt("Goal amount", String(goalAmount));
  const newGoal = Number(goalInput);

  if (!newGoal || newGoal <= 0) {
    window.alert("Invalid goal amount");
    return;
  }

  const newImage = window.prompt("Image URL (optional)", imageUrl || "") || "";

  try {
    if (adminDataMode === "local") {
      const campaigns = getLocalCampaigns();
      const campaignIndex = campaigns.findIndex(
        (campaign) => campaign._id === campaignId || campaign.id === campaignId
      );

      if (campaignIndex === -1) {
        throw new Error("Campaign not found");
      }

      campaigns[campaignIndex] = {
        ...campaigns[campaignIndex],
        title: newTitle,
        description: newDescription,
        goalAmount: newGoal,
        imageUrl: newImage,
      };
      saveLocalCampaigns(campaigns);
    } else {
      await apiRequest(`/campaigns/${campaignId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          goalAmount: newGoal,
          imageUrl: newImage,
        }),
      });
    }
    showToast("Campaign updated");
    await loadCampaigns();
  } catch (error) {
    if (isConnectivityError(error)) {
      switchToLocalMode();
      await window.editCampaign(campaignId, titleEncoded, goalAmount, descriptionEncoded, imageUrlEncoded);
      return;
    }
    window.alert(error.message);
  }
};

const bindSidebarNav = () => {
  if (!adminNav) return;
  const navItems = Array.from(adminNav.querySelectorAll(".admin-nav-item"));
  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      navItems.forEach((navItem) => navItem.classList.remove("active"));
      item.classList.add("active");
      adminSidebar.classList.remove("open");
    });
  });
};

const bindImagePreview = () => {
  if (!imageInput || !imagePreview || !imagePreviewEmpty) return;
  imageInput.addEventListener("input", () => {
    const src = imageInput.value.trim();
    if (!src) {
      imagePreview.removeAttribute("src");
      imagePreview.classList.remove("show");
      imagePreviewEmpty.classList.remove("is-hidden");
      return;
    }

    imagePreview.src = src;
    imagePreview.onload = () => {
      imagePreview.classList.add("show");
      imagePreviewEmpty.classList.add("is-hidden");
    };
    imagePreview.onerror = () => {
      imagePreview.classList.remove("show");
      imagePreviewEmpty.textContent = "Could not load image preview";
      imagePreviewEmpty.classList.remove("is-hidden");
    };
  });
};

const bindTopbarUser = () => {
  if (adminName) adminName.textContent = adminUser?.name || "Admin";
  if (adminAvatar) adminAvatar.textContent = getInitials(adminUser?.name || "Admin");
};

const bindLogout = () => {
  const handleLogout = () => {
    if (!window.confirm("Logout from admin panel?")) return;
    if (typeof logout === "function") {
      logout();
      return;
    }
    localStorage.removeItem("odp_token");
    localStorage.removeItem("odp_user");
    window.location.href = "auth.html";
  };

  if (topLogoutBtn) topLogoutBtn.addEventListener("click", handleLogout);
  if (sideLogoutBtn) sideLogoutBtn.addEventListener("click", handleLogout);
};

if (campaignSearch) {
  campaignSearch.addEventListener("input", applyCampaignFilters);
}

if (campaignPrevBtn) {
  campaignPrevBtn.addEventListener("click", () => {
    campaignPage = Math.max(1, campaignPage - 1);
    renderCampaignRows();
  });
}

if (campaignNextBtn) {
  campaignNextBtn.addEventListener("click", () => {
    const totalPages = Math.max(1, Math.ceil(filteredCampaigns.length / campaignsPerPage));
    campaignPage = Math.min(totalPages, campaignPage + 1);
    renderCampaignRows();
  });
}

if (sidebarToggle) {
  sidebarToggle.addEventListener("click", () => {
    adminSidebar.classList.toggle("open");
  });
}

if (campaignForm) {
  campaignForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();
    const goalAmount = Number(document.getElementById("goal").value);
    const imageUrl = document.getElementById("image").value.trim();

    if (!title || !description || goalAmount <= 0) {
      showMessage(campaignMessage, "Please fill all required campaign fields", "error");
      return;
    }

    try {
      setCreateLoading(true);
      if (adminDataMode === "local") {
        const campaigns = getLocalCampaigns();
        campaigns.unshift({
          _id: generateLocalId("cmp"),
          title,
          description,
          goalAmount,
          fundsRaised: 0,
          imageUrl,
          isActive: true,
          createdAt: new Date().toISOString(),
        });
        saveLocalCampaigns(campaigns);
      } else {
        await apiRequest("/campaigns", {
          method: "POST",
          body: JSON.stringify({ title, description, goalAmount, imageUrl }),
        });
      }

      campaignForm.reset();
      imagePreview.removeAttribute("src");
      imagePreview.classList.remove("show");
      imagePreviewEmpty.textContent = "Image preview will appear here";
      imagePreviewEmpty.classList.remove("is-hidden");
      showMessage(campaignMessage, "Campaign created successfully", "success");
      showToast("Campaign Created", "success");
      await loadCampaigns();
    } catch (error) {
      if (isConnectivityError(error)) {
        switchToLocalMode();
        setCreateLoading(false);
        campaignForm.dispatchEvent(new Event("submit", { cancelable: true }));
        return;
      }
      showMessage(campaignMessage, error.message, "error");
      showToast(error.message, "error");
    } finally {
      setCreateLoading(false);
    }
  });
}

if (!window.__adminInitStopped) {
  bindTopbarUser();
  bindSidebarNav();
  bindLogout();
  bindImagePreview();
  loadCampaigns();
  loadDonations();
}
