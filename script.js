document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("googleLogin");
  const logoutBtn = document.getElementById("logoutButton");
  const welcomeText = document.getElementById("welcomeTxt");
  const historyList = document.getElementById("historyList");
   const clearBtn = document.getElementById("clearHistoryButton");

  const CLIENT_ID = '970370380874-kt1825if936escjjjk9ao1b6u4blucgb.apps.googleusercontent.com';
  const REDIRECT_URI = chrome.identity.getRedirectURL();
  const SCOPES = 'profile email';
  const AUTH_URL = `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}&prompt=select_account`;

 function displayHistory() {
  chrome.storage.local.get("history", (data) => {
    const history = data.history || [];

    // Curitics on top + sort 
    const sorted = [...history].sort((a, b) => {
      const aC = a.url.toLowerCase().includes("curitics");
      const bC = b.url.toLowerCase().includes("curitics");

      if (aC && !bC) return -1; 
      if (!aC && bC) return 1;  
      return new Date(b.timestamp) - new Date(a.timestamp); // newest first
    });

    historyList.innerHTML = '';
    sorted.forEach(item => {
      const li = document.createElement("li");
      li.textContent = `${item.url} - ${new Date(item.timestamp).toLocaleString()}`;

      if (item.url.toLowerCase().includes("curitics")) {
        li.style.fontWeight = "bold";
        li.style.color = "green"; 
      }

      historyList.appendChild(li);
    });
  });
}


  chrome.storage.local.get("userEmail", (data) => {
    if (data.userEmail) {
      loginBtn.style.display = 'none';
      logoutBtn.style.display = 'block';
      welcomeText.textContent = `Welcome ${data.userEmail}`;
      displayHistory();
    }
  });

  loginBtn.addEventListener("click", () => {
    chrome.identity.launchWebAuthFlow({ url: AUTH_URL, interactive: true }, (redirectUrl) => {
      if (chrome.runtime.lastError || !redirectUrl) {
        welcomeText.textContent = "Login failed";
        return;
      }

      const urlFragment = new URL(redirectUrl).hash.substring(1);
      const params = new URLSearchParams(urlFragment);
      const accessToken = params.get("access_token");

      if (!accessToken) {
        welcomeText.textContent = "Token error";
        return;
      }

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
            clearBtn.style.display = 'block';
            welcomeText.textContent = `Welcome ${userInfo.name}`;
            displayHistory();
          });
        })
        .catch(() => {
          welcomeText.textContent = "Failed to fetch user info";
        });
    });
  });

  logoutBtn.addEventListener("click", () => {
    chrome.storage.local.remove(["userEmail"], () => {
      loginBtn.style.display = 'block';
      logoutBtn.style.display = 'none';
      welcomeText.textContent = '';
      clearBtn.style.display = 'none';
      historyList.innerHTML = '';
    });
  });

 

clearBtn.addEventListener("click", () => {
  chrome.storage.local.remove("history", () => {
    historyList.innerHTML = '';
    alert("Browsing history cleared!");
  });
});

});
