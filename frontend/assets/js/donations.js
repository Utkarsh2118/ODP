const user = requireAuth("user");
if (!user) {
  window.__donationsInitStopped = true;
}

const tableBody = document.getElementById("donation-history");
const skeleton = document.getElementById("donations-skeleton");
const emptyState = document.getElementById("donations-empty");
const tableWrap = document.getElementById("donations-table-wrap");

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

window.downloadReceipt = async function downloadReceipt(donationId) {
  try {
    const token = localStorage.getItem("odp_token");
    const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/donations/${donationId}/receipt`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Unable to download receipt");
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `receipt-${donationId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    window.alert(error.message);
  }
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

const renderDonationTable = (donations) => {
  tableBody.innerHTML = donations
    .map((donation) => {
      const statusMap = {
        success: { label: "Success", className: "status-success" },
        pending: { label: "Pending Review", className: "status-pending" },
        rejected: { label: "Rejected", className: "status-failed" },
        failed: { label: "Failed", className: "status-failed" },
      };
      const statusInfo = statusMap[donation.status] || statusMap.failed;
      const txDisplay = donation.payerReference || donation.razorpayPaymentId || "-";
      const canDownloadReceipt = donation.status === "success";

      return `
        <tr>
          <td>
            <div class="td-title">${donation.campaign?.title || "-"}</div>
            <div class="td-sub">${donation.campaign?.description || "Donation campaign"}</div>
          </td>
          <td class="amount">${formatAmount(donation.amount)}</td>
          <td>${new Date(donation.donatedAt).toLocaleString()}</td>
          <td><span class="tx-chip">${txDisplay}</span></td>
          <td><span class="status-badge ${statusInfo.className}">${statusInfo.label}</span></td>
          <td>
            ${
              canDownloadReceipt
                ? `<button class="btn btn-outline btn-press" onclick="downloadReceipt('${donation._id}')">Download</button>`
                : `<span class="td-sub">Available after approval</span>`
            }
          </td>
        </tr>
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

async function loadDonationsData() {
  skeleton.classList.remove("is-hidden");
  emptyState.classList.add("is-hidden");
  tableWrap.classList.add("is-hidden");

  try {
    const donationsRes = await apiRequest("/donations/me");
    const donations = donationsRes.donations || [];

    renderKpis(donations);

    if (!donations.length) {
      skeleton.classList.add("is-hidden");
      emptyState.classList.remove("is-hidden");
      return;
    }

    renderDonationTable(donations);
    skeleton.classList.add("is-hidden");
    tableWrap.classList.remove("is-hidden");
  } catch (error) {
    skeleton.classList.add("is-hidden");
    tableWrap.classList.remove("is-hidden");
    tableBody.innerHTML = `<tr><td colspan='6' class='message error'>${error.message}</td></tr>`;
  }
}

applySavedTheme();
if (!window.__donationsInitStopped) {
  bindStaticUi();
  loadDonationsData();
}
