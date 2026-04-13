const apiBaseUrl = window.APP_CONFIG.API_BASE_URL;

const getToken = () => localStorage.getItem("odp_token");

async function apiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutMs = 10000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`API request timed out after ${timeoutMs / 1000}s`);
    }

    throw new Error(
      `Cannot reach backend API at ${apiBaseUrl}. Start the backend server and verify backend/.env values.`
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const validationError = Array.isArray(data?.errors) ? data.errors[0]?.msg : "";
    const message = validationError || data?.message || "Request failed";
    throw new Error(message);
  }

  return data;
}

function showMessage(el, msg, type = "error") {
  if (!el) return;
  el.textContent = msg;
  el.className = `message ${type}`;
}
