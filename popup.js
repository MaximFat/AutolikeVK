
document.getElementById('start').addEventListener('click', async () => {
  const interval = parseInt(document.getElementById('interval').value) * 1000;
  const limit = parseInt(document.getElementById('limit').value);
  const forceLike = document.getElementById("forceLike").checked;

  chrome.storage.local.set({ running: true, interval, limit, likes: 0, forceLike });
  document.getElementById('status').textContent = "Запущено";
  document.getElementById('likes').textContent = "0";
  document.getElementById('totalLikes').textContent = "0";

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });
});

document.getElementById('stop').addEventListener('click', () => {
  chrome.storage.local.set({ running: false });
  document.getElementById('status').textContent = "Остановлено";
});

document.getElementById("clearLog").addEventListener("click", () => {
  chrome.storage.local.set({ log: [] });
  document.getElementById("log").innerHTML = "";
});

document.getElementById("exportLog").addEventListener("click", () => {
  chrome.storage.local.get("log", (data) => {
    const log = data.log || [];
    const lines = log.map(entry => {
      return typeof entry === "string" ? entry : `${entry.time} — ${entry.post}`;
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vk_likes_log.txt";
    a.click();
    URL.revokeObjectURL(url);
  });
});

function renderLog(log) {
  const list = document.getElementById("log");
  list.innerHTML = "";
  log.slice().reverse().forEach(entry => {
    const li = document.createElement("li");
    if (typeof entry === "string") {
      li.textContent = entry;
    } else {
      li.textContent = `${entry.time} — ${entry.post}`;
    }
    list.appendChild(li);
  });
}

chrome.storage.local.get(["log", "likes", "totalLikes", "running", "forceLike"], (data) => {
  const cleanLog = Array.isArray(data.log) ? data.log.filter(Boolean) : [];
  renderLog(cleanLog);

  document.getElementById('likes').textContent = `${data.likes || 0}`;
  document.getElementById('totalLikes').textContent = `${data.totalLikes || 0}`;
  document.getElementById("forceLike").checked = !!data.forceLike;

  if (data.running) {
    document.getElementById('status').textContent = "Запущено";
  }
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.likes) {
    document.getElementById('likes').textContent = `${changes.likes.newValue}`;
  }
  if (changes.totalLikes) {
    document.getElementById('totalLikes').textContent = `${changes.totalLikes.newValue}`;
  }
  if (changes.running && changes.running.newValue === false) {
    chrome.storage.local.get(["likes", "totalLikes"], (data) => {
      document.getElementById('status').textContent = "Завершено";
      document.getElementById('likes').textContent = `${data.likes || 0}`;
      document.getElementById('totalLikes').textContent = `${data.totalLikes || 0}`;
    });
  }
});

document.getElementById("unlikeAll").addEventListener("click", async () => {
  chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async () => {
        const delay = ms => new Promise(res => setTimeout(res, ms));
        const interval = parseFloat(document.getElementById("unlikeInterval")?.value || 1) * 1000;

        const buttons = document.querySelectorAll('div.PostButtonReactions[role="button"][aria-label*="реакцию"]');
        let removed = 0;

        for (let btn of buttons) {
          const icon = btn.querySelector('.PostButtonReactions__icon');
          if (icon && icon.classList.contains('PostButtonReactions__icon--custom')) {
            btn.click();
            removed++;
            await delay(interval);
          }
        }

        alert(`Удалено реакций: ${removed}`);
      }
    });
  });
});
