const LOCAL_API_BASE_URL = "http://127.0.0.1:5000/api";
// const PROD_API_BASE_URL = "https://odp-wtf2.onrender.com/api";
const PROD_API_BASE_URL = "https://odp-api.onrender.com/api";
const host = window.location.hostname;
const isLocalHost = host === "localhost" || host === "127.0.0.1";
const isGithubPages = host.endsWith("github.io");
const apiOverride = localStorage.getItem("odp_api_base_url");

const resolvedApiBaseUrl = apiOverride
  ? apiOverride
  : isLocalHost
  ? LOCAL_API_BASE_URL
  : isGithubPages
  ? PROD_API_BASE_URL
  : LOCAL_API_BASE_URL;

window.APP_CONFIG = {
  API_BASE_URL: resolvedApiBaseUrl,
  PAYMENT_MODE: "qr",
  DONATION_QR_IMAGE_URL: "",
  DONATION_UPI_ID: "",
  DONATION_UPI_NAME: "DonateSphere",
};
