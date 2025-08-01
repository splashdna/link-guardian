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

updateBtn.addEventListener("click", () => {
  browser.runtime.sendMessage({ type: "refreshWhitelist" })
    .then(() => {
      alert("Whitelist updated.");
    })
    .catch(err => {
      alert("Failed to update whitelist.");
      console.error(err);
    });
});

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
  document.querySelectorAll("a[href]").forEach(link => {
    link.style.pointerEvents = "auto";
    link.style.color = "";
    link.style.textDecoration = "";
    link.title = "Admin override: Link re-enabled";
    link.removeEventListener("click", preventClickHandler);
  });

  console.warn("⚠ Admin override enabled — links are active.");
  alert("Admin Override Activated.\nLinks have been re-enabled for this message.");
  showOverrideBanner();
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

// Whitelist logic
browser.runtime.sendMessage({ type: "getWhitelist" }).then(response => {
  const whitelist = response.whitelist || [];
  console.log("Received whitelist:", whitelist);

  document.querySelectorAll("a[href]").forEach(link => {
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
}).catch(err => {
  console.error("Failed to get whitelist:", err);
});