
chrome.storage.local.get(["interval", "limit", "likes", "forceLike"], (config) => {
  let liked = config.likes || 0;
  let total = config.totalLikes || 0;
  const force = config.forceLike;
  const limit = config.limit || 999;
  const interval = config.interval || 1000;

  const delay = ms => new Promise(res => setTimeout(res, ms));

  async function likeSequentially() {
    const buttons = [...document.querySelectorAll('div.PostButtonReactions[role="button"][aria-label*="реакцию"]')];

    for (const btn of buttons) {
      if (liked >= limit) {
        chrome.storage.local.set({ running: false });
        return;
      }

      const icon = btn.querySelector('.PostButtonReactions__icon');
      const alreadyReacted = icon?.classList.contains('PostButtonReactions__icon--custom');
      const reactionSet = btn.closest('[data-reaction-target-object]')?.dataset?.reactionTargetObject;

      if (!force && alreadyReacted) {
        // Пропустить и скроллить вниз
        window.scrollBy({ top: 600, behavior: 'smooth' });
        await delay(interval);
        continue;
      }

      btn.click();
      liked++;
      total++;
      chrome.storage.local.set({ likes: liked, totalLikes: total });

      const now = new Date().toLocaleTimeString();
      const logItem = { time: now, post: reactionSet || 'неизвестно' };

      chrome.storage.local.get("log", (data) => {
        const log = data.log || [];
        log.push(logItem);
        chrome.storage.local.set({ log });
      });

      window.scrollBy({ top: 600, behavior: 'smooth' });
      await delay(interval);
    }

    await delay(1000);
    likeSequentially(); // Повторить цикл после паузы
  }

  likeSequentially();
});
