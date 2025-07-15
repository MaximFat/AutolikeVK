
chrome.storage.local.get(["interval", "limit", "likes", "forceLike"], (config) => {
  const force = config.forceLike;
  const limit = config.limit || 999;
  const interval = config.interval || 1000;

  let liked = 0;

  const delay = ms => new Promise(res => setTimeout(res, ms));

  function isVisible(elem) {
    const rect = elem.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  }

  async function processPosts() {
    let attemptsWithoutLike = 0;

    while (liked < limit && attemptsWithoutLike < 15) {
      const buttons = [...document.querySelectorAll('div.PostButtonReactions[role="button"][aria-label*="реакцию"]')];
      let likedThisRound = false;

      for (const btn of buttons) {
        if (liked >= limit) break;

        const icon = btn.querySelector('.PostButtonReactions__icon');
        const alreadyReacted = icon?.classList.contains('PostButtonReactions__icon--custom');
        const reactionSet = btn.closest('[data-reaction-target-object]')?.dataset?.reactionTargetObject;

        if (!force && alreadyReacted) continue;

        if (!isVisible(btn)) {
          btn.scrollIntoView({ behavior: "smooth", block: "center" });
          await delay(500);
        }

        btn.click();
        liked++;
        likedThisRound = true;

        const now = new Date().toLocaleTimeString();
        const logItem = { time: now, post: reactionSet || 'неизвестно' };

        chrome.storage.local.get("log", (data) => {
          const log = data.log || [];
          log.push(logItem);
          chrome.storage.local.set({ log });
        });

        chrome.storage.local.set({ likes: liked, totalLikes: liked });
        await delay(interval);
      }

      if (!likedThisRound) {
        attemptsWithoutLike++;
        window.scrollBy({ top: 1000, behavior: "smooth" });
        await delay(1000);
      } else {
        attemptsWithoutLike = 0;
      }
    }

    chrome.storage.local.set({ running: false });
  }

  processPosts();
});
