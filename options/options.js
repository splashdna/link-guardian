const urlInput = document.getElementById('whitelistUrl');
const saveBtn = document.getElementById('saveBtn');
const status = document.getElementById('statusMessage');

// Load saved URL on page load
browser.storage.local.get('whitelistUrl').then(data => {
  if (data.whitelistUrl) {
    urlInput.value = data.whitelistUrl;
    status.textContent = "Current saved URL loaded.";
  } else {
    status.textContent = "No URL saved yet.";
  }
});

// Save new URL on click
saveBtn.addEventListener('click', () => {
  const url = urlInput.value.trim();
  if (url) {
    browser.storage.local.set({ whitelistUrl: url }).then(() => {
      status.textContent = "Whitelist URL saved.";
    });
  } else {
    status.textContent = "Please enter a valid URL.";
  }
});