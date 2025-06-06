document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("googleLogin");
  const logoutBtn = document.getElementById("logoutButton");
  const welcomeText = document.getElementById("welcomeTxt");

  const CLIENT_ID = '970370380874-kt1825if936escjjjk9ao1b6u4blucgb.apps.googleusercontent.com';
  const REDIRECT_URI = chrome.identity.getRedirectURL();
  const SCOPES = 'profile email';
  const AUTH_URL = `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}&prompt=select_account`;
console.log(REDIRECT_URI);
console.log(SCOPES)


  // Check for existing login
  chrome.storage.local.get("userEmail", (data) => {
    if (data.userEmail) {
      loginBtn.style.display = 'none';
      logoutBtn.style.display = 'block';
      welcomeText.textContent = `Welcome ${data.userEmail}`;
    }
  });

  // Login button
  loginBtn.addEventListener("click", () => {
    chrome.identity.launchWebAuthFlow({ url: AUTH_URL, interactive: true }, (redirectUrl) => {
      if (chrome.runtime.lastError || !redirectUrl) {
        welcomeText.textContent = "Login failed";
        return;
      }

      // Extract access token from redirect URL
      const urlFragment = new URL(redirectUrl).hash.substring(1);
      const params = new URLSearchParams(urlFragment);
      const accessToken = params.get("access_token");

      if (!accessToken) {
        welcomeText.textContent = "Token error";
        return;
      }

      // Fetch user info
      fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
          Authorization: 'Bearer ' + accessToken
        }
      })
        .then(response => response.json())
        .then(userInfo => {
          chrome.storage.local.set({ userEmail: userInfo.name }, () => {
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'block';
            welcomeText.textContent = `Welcome ${userInfo.name}`;
          });
        })
        .catch(() => {
          welcomeText.textContent = "Failed to fetch user info";
        });
    });
  });

  // Logout button
  logoutBtn.addEventListener("click", () => {
    chrome.storage.local.remove("userEmail", () => {
      loginBtn.style.display = 'block';
      logoutBtn.style.display = 'none';
      welcomeText.textContent = '';
    });
  });
});
