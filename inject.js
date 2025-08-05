console.log("Link Guardian inject.js running, requesting whitelist...");

// Force light mode background and text color
document.documentElement.style.backgroundColor = "#fff";
document.body.style.backgroundColor = "#fff";
document.documentElement.style.color = "#000";
document.body.style.color = "#000";

const style = document.createElement("style");
style.textContent = `
  html, body {
    background-color: white !important;
    color: black !important;
  }
`;
document.head.appendChild(style);

// Add floating 'Update Whitelist' button
const updateBtn = document.createElement("button");
updateBtn.textContent = "Update Whitelist";
updateBtn.style.position = "fixed";
updateBtn.style.bottom = "20px";
updateBtn.style.right = "20px";
updateBtn.style.zIndex = "9999";
updateBtn.style.padding = "10px 14px";
updateBtn.style.backgroundColor = "#0078D7";
updateBtn.style.color = "white";
updateBtn.style.border = "none";
updateBtn.style.borderRadius = "5px";
updateBtn.style.cursor = "pointer";
updateBtn.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
updateBtn.title = "Click to manually update the whitelist";
document.body.appendChild(updateBtn);

// === Admin Override Logic ===
let overrideActive = false;

function showOverrideBanner() {
  const banner = document.createElement("div");
  banner.id = "link-guardian-banner";
  banner.textContent = "⚠ Link Guardian: Protection temporarily disabled";
  Object.assign(banner.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    backgroundColor: "#ffcc00",
    color: "#000",
    padding: "8px",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "14px",
    zIndex: "99999",
    boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
  });
  document.body.appendChild(banner);
}

function enableOverrideMode() {
  overrideActive = true;

  // Re-enable all links
  document.querySelectorAll("a[href]").forEach(link => {
    link.style.pointerEvents = "auto";
    link.style.color = "";
    link.style.textDecoration = "";
    link.title = "Admin override: Link re-enabled";
    link.removeEventListener("click", preventClickHandler);
  });

  console.warn("⚠ Admin override enabled — links are active.");
  alert("Admin Override Activated.\nLinks have been re-enabled for this message for 30 seconds.");
  showOverrideBanner();

  // Set timeout to disable override after 30 seconds
  setTimeout(() => {
    overrideActive = false;

    // Restore protection
    browser.runtime.sendMessage({ type: "getWhitelist" }).then(response => {
      const whitelist = response.whitelist || [];

      document.querySelectorAll("a[href]").forEach(link => {
        const href = link.getAttribute("href");
        if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) return;

        try {
          const url = new URL(link.href);
          const domain = url.hostname.replace(/^www\./, '');

          const isWhitelisted = whitelist.some(allowed =>
            domain === allowed || domain.endsWith("." + allowed)
          );

          if (!isWhitelisted) {
            link.style.pointerEvents = "none";
            link.style.color = "red";
            link.style.textDecoration = "line-through";
            link.title = "Blocked unsafe link";
            link.addEventListener("click", preventClickHandler);
          }
        } catch (e) {
          console.warn("Skipping malformed link:", link.href);
        }
      });

      // Remove override banner
      const banner = document.getElementById("link-guardian-banner");
      if (banner) banner.remove();

      alert("Admin Override expired.\nProtection re-enabled.");

    }).catch(err => {
      console.error("Error restoring link protection:", err);
    });

  }, 30000); // 30 seconds in milliseconds
}

function preventClickHandler(e) {
  if (!overrideActive) {
    e.preventDefault();
    alert("Blocked unsafe link:\n" + e.currentTarget.href);
  }
}

// Register key combination: Ctrl + Alt + Shift + S
window.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.altKey && e.shiftKey && e.key.toLowerCase() === "s") {
    enableOverrideMode();
  }
});

// === Whitelist enforcement logic extracted into a function ===
function enforceWhitelist(whitelist) {
  document.querySelectorAll("a[href]").forEach(link => {
    const href = link.getAttribute("href");

    // Skip mailto: and tel: links
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return;
    }

    try {
      const url = new URL(link.href);
      const domain = url.hostname.replace(/^www\./, '');

      const isWhitelisted = whitelist.some(allowed =>
        domain === allowed || domain.endsWith("." + allowed)
      );

      if (!isWhitelisted) {
        link.style.pointerEvents = "none";
        link.style.color = "red";
        link.style.textDecoration = "line-through";
        link.title = "Blocked unsafe link";
        link.addEventListener("click", preventClickHandler);
      } else {
        // Clean up styling if link is now allowed
        link.style.pointerEvents = "";
        link.style.color = "";
        link.style.textDecoration = "";
        link.title = "";
        link.removeEventListener("click", preventClickHandler);
      }
    } catch (e) {
      console.warn("Skipping malformed link:", link.href);
    }
  });
}

// === Initial whitelist fetch ===
browser.runtime.sendMessage({ type: "getWhitelist" }).then(response => {
  const whitelist = response.whitelist || [];
  console.log("Received whitelist:", whitelist);
  enforceWhitelist(whitelist);
}).catch(err => {
  console.error("Failed to get whitelist:", err);
});

// === Update button now refreshes the whitelist and mail content ===
updateBtn.addEventListener("click", () => {
  browser.runtime.sendMessage({ type: "refreshWhitelist" })
    .then(() => {
      alert("Whitelist updated. Refreshing links...");
      return browser.runtime.sendMessage({ type: "getWhitelist" });
    })
    .then(response => {
      const newWhitelist = response.whitelist || [];
      console.log("Re-applying updated whitelist:", newWhitelist);
      enforceWhitelist(newWhitelist);
    })
    .catch(err => {
      alert("Failed to update whitelist.");
      console.error(err);
    });
});