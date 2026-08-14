// Load saved settings
document.addEventListener("DOMContentLoaded", async () => {
  const settings = await chrome.storage.local.get(["apiKey", "aiModel"]);
  
  if (settings.apiKey) {
    document.getElementById("apiKeyInput").value = settings.apiKey;
  } else {
    document.getElementById("apiKeyInput").value = "";
  }
  if (settings.aiModel) {
    document.getElementById("modelSelect").value = settings.aiModel;
  } else {
    document.getElementById("modelSelect").value = "gemini-3.6-flash";
  }
});

// Save settings
document.getElementById("saveBtn").onclick = async () => {
  const apiKey = document.getElementById("apiKeyInput").value.trim();
  const aiModel = document.getElementById("modelSelect").value;

  await chrome.storage.local.set({ apiKey, aiModel });

  // Show status
  const status = document.getElementById("statusMessage");
  status.style.display = "block";
  status.className = "status-message success";
  status.textContent = "Settings saved successfully!";

  setTimeout(() => {
    status.style.display = "none";
    window.close(); // Close the extension popup window
  }, 1500);
};
