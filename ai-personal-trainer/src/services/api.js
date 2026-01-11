const API_BASE = import.meta.env.VITE_API_BASE || "";

// Token storage (in memory for security)
let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export const api = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;

    const headers = {
      "Content-Type": "application/json",
      ...options.headers
    };

    // Add auth header if we have a token
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include" // Include cookies for refresh token
    });

    // Handle 401/403 - token might be expired
    if (response.status === 401 || response.status === 403) {
      // Try to refresh
      try {
        const refreshResponse = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include"
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          if (data.accessToken) {
            accessToken = data.accessToken;
            // Retry original request
            headers["Authorization"] = `Bearer ${accessToken}`;
            const retryResponse = await fetch(url, {
              ...options,
              headers,
              credentials: "include"
            });
            return retryResponse.json();
          }
        }
      } catch (e) {
        // Refresh failed, clear token
        accessToken = null;
      }
    }

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.error || "Request failed");
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  },

  get(endpoint) {
    return this.request(endpoint, { method: "GET" });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(body)
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body)
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  }
};

// Helper to update token from AuthContext
export function initializeAuth(token) {
  accessToken = token;
}
