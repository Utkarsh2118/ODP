const user = requireAuth();
if (!user) {
  window.__campaignInitStopped = true;
}

const detailContainer = document.getElementById("campaign-detail");
const params = new URLSearchParams(window.location.search);
const campaignId = params.get("id");
const paymentMode = (window.APP_CONFIG.PAYMENT_MODE || "qr").toLowerCase();
const qrImageUrl = window.APP_CONFIG.DONATION_QR_IMAGE_URL || "";
const upiId = window.APP_CONFIG.DONATION_UPI_ID || "";
const upiName = window.APP_CONFIG.DONATION_UPI_NAME || "DonateSphere";

const topUserName = document.getElementById("top-user-name");
const topUserAvatar = document.getElementById("top-user-avatar");
const sideLogoutBtn = document.getElementById("side-logout-btn");
const topLogoutBtn = document.getElementById("top-logout-btn");
const sidebarToggle = document.getElementById("sidebar-toggle");
const sidebar = document.getElementById("dash-sidebar");
const themeToggle = document.getElementById("theme-toggle");

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

const bindShellUi = () => {
  if (topUserName) topUserName.textContent = user.name || "User";
  if (topUserAvatar) topUserAvatar.textContent = getInitials(user.name);

  if (sideLogoutBtn) sideLogoutBtn.addEventListener("click", logout);
  if (topLogoutBtn) topLogoutBtn.addEventListener("click", logout);

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const isDark = document.body.classList.contains("theme-dark");
      setTheme(isDark ? "light" : "dark");
    });
  }
};

if (!campaignId) {
  detailContainer.innerHTML = "<p class='message error'>Invalid campaign link.</p>";
}

async function loadCampaign() {
  if (!campaignId) return;

  try {
    const data = await apiRequest(`/campaigns/${campaignId}`);
    const campaign = data.campaign;
    const progress = Math.min((campaign.fundsRaised / campaign.goalAmount) * 100, 100);
    const remaining = Math.max(campaign.goalAmount - campaign.fundsRaised, 0);
    const donors = Math.max(1, Math.floor(campaign.fundsRaised / 650));

    detailContainer.innerHTML = `
      <section class="campaign-hero">
        <div class="campaign-hero-main">
          <div class="campaign-hero-head">
            <span class="campaign-chip">Urgent Support</span>
            <h2>${campaign.title}</h2>
          </div>
          <p class="campaign-hero-description">${campaign.description}</p>

          <div class="campaign-hero-stats">
            <article>
              <small>Raised</small>
              <strong>INR ${campaign.fundsRaised.toLocaleString()}</strong>
            </article>
            <article>
              <small>Goal</small>
              <strong>INR ${campaign.goalAmount.toLocaleString()}</strong>
            </article>
            <article>
              <small>Remaining</small>
              <strong>INR ${remaining.toLocaleString()}</strong>
            </article>
            <article>
              <small>Supporters</small>
              <strong>${donors}</strong>
            </article>
          </div>

          <div class="progress campaign-progress-large"><span style="width: ${progress}%"></span></div>
          <p class="campaign-progress-text">${progress.toFixed(0)}% of target achieved</p>

          <div class="campaign-trust-row">
            <span>Secure Payment</span>
            <span>Instant Receipt</span>
            <span>Verified Campaign</span>
          </div>
        </div>

        <aside class="campaign-donate-card">
          <h3>Contribute Now</h3>
          <p>Your support creates immediate impact for this cause.</p>

          <form id="donation-form" class="form campaign-donation-form">
            <div>
              <label for="amount">Donation Amount (INR)</label>
              <input id="amount" type="number" min="1" required />
            </div>
            <button class="btn btn-primary campaign-donate-btn" type="submit">${
              paymentMode === "qr" ? "Show QR Code" : "Donate with Razorpay"
            }</button>
            <p id="donation-message" class="message"></p>
          </form>

          <section id="receipt-panel" class="campaign-receipt-panel is-hidden"></section>
        </aside>
      </section>
    `;

    const donationForm = document.getElementById("donation-form");
    const donationMessage = document.getElementById("donation-message");
    const receiptPanel = document.getElementById("receipt-panel");

    donationForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!user) return;

      const amount = Number(document.getElementById("amount").value);
      if (!amount || amount <= 0) {
        showMessage(donationMessage, "Enter a valid amount", "error");
        return;
      }

      if (paymentMode === "qr") {
        const upiLink = upiId
          ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
              upiName
            )}&am=${encodeURIComponent(String(amount))}&cu=INR&tn=${encodeURIComponent(
              `Donation for ${campaign.title}`
            )}`
          : "";

        receiptPanel.classList.remove("is-hidden");
        receiptPanel.classList.add("qr-payment-panel");
        receiptPanel.innerHTML = `
          <h3>Scan & Pay (Temporary)</h3>
          <p>Amount to pay: <strong>INR ${amount.toLocaleString()}</strong></p>
          <p class="qr-note">Please complete payment using this QR code, then submit transaction reference for admin verification.</p>
          <div class="qr-preview-wrap">
            ${
              qrImageUrl
                ? `<img src="${qrImageUrl}" alt="Donation QR Code" class="donation-qr-image" />`
                : `<div class="qr-placeholder">Add your QR image URL in APP_CONFIG.DONATION_QR_IMAGE_URL</div>`
            }
          </div>
          <div class="qr-payment-meta">
            ${upiId ? `<p><strong>UPI ID:</strong> ${upiId}</p>` : ""}
            <p><strong>Campaign:</strong> ${campaign.title}</p>
          </div>
          <form id="manual-payment-form" class="form qr-confirm-form">
            <div>
              <label for="manual-reference">UPI Transaction Reference</label>
              <input id="manual-reference" type="text" minlength="4" maxlength="80" placeholder="e.g. 432198765432" required />
            </div>
            <div>
              <label for="manual-note">Note (optional)</label>
              <textarea id="manual-note" rows="2" maxlength="250" placeholder="Any payment note..."></textarea>
            </div>
            <button type="submit" class="btn btn-primary">I Have Paid - Submit for Verification</button>
            <p id="manual-payment-message" class="message"></p>
          </form>
          <div class="qr-actions">
            ${
              upiLink
                ? `<a class="btn btn-outline" href="${upiLink}">Pay via UPI App</a>`
                : ""
            }
            <a class="btn btn-primary" href="dashboard.html">Go to Dashboard</a>
          </div>
        `;

        showMessage(donationMessage, "QR code displayed. Complete payment manually.", "success");

        const manualForm = document.getElementById("manual-payment-form");
        const manualMessage = document.getElementById("manual-payment-message");

        if (manualForm) {
          manualForm.addEventListener("submit", async (manualEvent) => {
            manualEvent.preventDefault();

            const reference = document.getElementById("manual-reference").value.trim();
            const note = document.getElementById("manual-note").value.trim();

            if (!reference || reference.length < 4) {
              showMessage(manualMessage, "Enter a valid transaction reference", "error");
              return;
            }

            try {
              await apiRequest("/donations/manual-request", {
                method: "POST",
                body: JSON.stringify({
                  campaignId,
                  amount,
                  payerReference: reference,
                  paymentNote: note,
                }),
              });

              showMessage(
                manualMessage,
                "Submitted successfully. Admin will verify and update your dashboard.",
                "success"
              );
              manualForm.reset();
            } catch (manualError) {
              showMessage(manualMessage, manualError.message, "error");
            }
          });
        }

        return;
      }

      try {
        const orderRes = await apiRequest("/donations/create-order", {
          method: "POST",
          body: JSON.stringify({ campaignId, amount }),
        });

        const options = {
          key: orderRes.razorpayKey,
          amount: orderRes.order.amount,
          currency: orderRes.order.currency,
          name: "DonateSphere",
          description: `Donation for ${campaign.title}`,
          order_id: orderRes.order.id,
          handler: async function (response) {
            try {
              const verifyRes = await apiRequest("/donations/verify", {
                method: "POST",
                body: JSON.stringify({
                  campaignId,
                  amount,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              showMessage(donationMessage, "Donation successful", "success");
              const r = verifyRes.receipt;
              receiptPanel.classList.remove("is-hidden");
              receiptPanel.innerHTML = `
                <h3>Digital Receipt</h3>
                <p><strong>Receipt ID:</strong> ${r.receiptId}</p>
                <p><strong>Donor:</strong> ${r.donor}</p>
                <p><strong>Campaign:</strong> ${r.campaign}</p>
                <p><strong>Amount:</strong> ${r.currency} ${r.amount}</p>
                <p><strong>Transaction ID:</strong> ${r.transactionId}</p>
                <p><strong>Date:</strong> ${new Date(r.donatedAt).toLocaleString()}</p>
                <a class="btn btn-outline" href="dashboard.html">View all donations</a>
              `;
            } catch (verifyError) {
              showMessage(donationMessage, verifyError.message, "error");
            }
          },
          prefill: {
            name: user.name,
            email: user.email,
          },
          theme: {
            color: "#0f766e",
          },
        };

        if (typeof Razorpay === "undefined") {
          showMessage(donationMessage, "Razorpay SDK not loaded. Switch PAYMENT_MODE to qr for temporary flow.", "error");
          return;
        }

        const rzp = new Razorpay(options);
        rzp.on("payment.failed", function () {
          showMessage(donationMessage, "Payment failed. Please try again.", "error");
        });

        rzp.open();
      } catch (error) {
        showMessage(donationMessage, error.message, "error");
      }
    });
  } catch (error) {
    detailContainer.innerHTML = `<p class="message error">${error.message}</p>`;
  }
}

applySavedTheme();

if (!window.__campaignInitStopped) {
  bindShellUi();
  loadCampaign();
}
