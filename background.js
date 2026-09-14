const TARGET_URL_PREFIX = "https://bendrauk.tamo.lt/Messages/Received";

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url || !tab.url.startsWith(TARGET_URL_PREFIX)) {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => alert("Tamo Inbox Cleaner: open " + "https://bendrauk.tamo.lt/Messages/Received" + " first.")
    });
    return;
  }

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: tamoCleanerMain
  });
});

function tamoCleanerMain() {
  const LOG = (...args) => console.log('[Tamo Cleaner]', ...args);

  if (window.__tamoDeleteRunning) {
    window.__tamoDeleteStopRequested = true;
    LOG('Icon clicked while running -> stop requested. Will halt after current step.');
    return;
  }

  LOG('Starting (select-all + bulk delete mode).');
  window.__tamoDeleteRunning = true;
  window.__tamoDeleteStopRequested = false;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function selectAllRowCheckboxes() {
    const inputs = Array.from(document.querySelectorAll('input[type="checkbox"]')).filter(
      (el) => !el.closest('nav')
    );
    LOG(`Found ${inputs.length} row checkbox(es) to select.`);
    let clicked = 0;
    inputs.forEach((input) => {
      if (!input.checked) {
        input.click();
        clicked++;
      }
    });
    LOG(`Clicked ${clicked} previously-unchecked checkbox(es).`);
    return inputs.length;
  }

  function findBulkDeleteButton() {
    const buttons = Array.from(document.querySelectorAll('button.v-btn'));
    return buttons.find((btn) => {
      const icon = btn.querySelector('i.fa-trash');
      const content = btn.querySelector('.v-btn__content');
      return icon && content && content.textContent.trim() === 'Šalinti';
    }) || null;
  }

  function findShowMoreButton() {
    const spans = Array.from(document.querySelectorAll('.v-btn__content'));
    const span = spans.find((s) => s.textContent.trim() === 'Rodyti daugiau');
    return span ? span.closest('button, a, [role="button"]') : null;
  }

  async function waitForButtonByText(candidates, timeoutMs = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const scope =
        document.querySelector('.v-overlay--active .v-dialog') ||
        document.querySelector('[role="dialog"]') ||
        document.querySelector('.v-overlay--active');
      if (scope) {
        const spans = Array.from(scope.querySelectorAll('.v-btn__content'));
        const span = spans.find((s) => candidates.includes(s.textContent.trim()));
        if (span) {
          const btn = span.closest('button, a, [role="button"]');
          if (btn) return btn;
        }
      }
      await sleep(200);
    }
    return null;
  }

  function getDisplayedCount() {
    const navLink = document.querySelector('a[href*="Messages/Received"]');
    if (navLink) {
      const item = navLink.closest('.v-list-item') || navLink.parentElement;
      if (item) {
        const match = item.textContent.match(/\d+/g);
        if (match) {
          const total = parseInt(match[match.length - 1], 10);
          if (total >= 0) return total;
        }
      }
    }
    return null;
  }

  async function runLoop() {
    const MAX_ROUNDS = 50;
    let round = 0;

    while (round < MAX_ROUNDS) {
      round++;
      LOG(`=== Round ${round} ===`);

      if (window.__tamoDeleteStopRequested) { LOG('Stopped by user.'); break; }
      if (!location.href.startsWith('https://bendrauk.tamo.lt/Messages/Received')) {
        LOG('No longer on the Received page — stopping.');
        break;
      }

      const countBefore = getDisplayedCount();
      if (countBefore === 0) { LOG('Nothing left to delete. Done.'); break; }

      const selectedCount = selectAllRowCheckboxes();
      if (selectedCount === 0) { LOG('No row checkboxes found. Stopping.'); break; }
      await sleep(500);

      const deleteBtn = findBulkDeleteButton();
      if (!deleteBtn) { LOG('Bulk delete button not found. Stopping.'); break; }
      LOG('Clicking bulk delete button...');
      deleteBtn.click();

      const confirmBtn = await waitForButtonByText(['Taip', 'Šalinti', 'Yes']);
      if (!confirmBtn) { LOG('Confirm button never appeared. Stopping.'); break; }
      LOG('Clicking confirm button...');
      confirmBtn.click();

      await sleep(1500);
      const countAfter = getDisplayedCount();
      if (countAfter === null || (countBefore !== null && countAfter >= countBefore)) {
        LOG(`WARNING: count did not decrease (before: ${countBefore}, after: ${countAfter}). Stopping.`);
        break;
      }
      LOG(`Round ${round} done. Count went from ${countBefore} to ${countAfter}.`);

      if (countAfter === 0) { LOG('All messages deleted. Done.'); break; }

      const showMoreBtn = findShowMoreButton();
      if (showMoreBtn) {
        LOG('Clicking "Rodyti daugiau" to load more messages...');
        showMoreBtn.click();
        await sleep(1500);
      } else {
        LOG('No "Rodyti daugiau" button found — continuing with whatever is already loaded.');
      }

      await sleep(500);
    }

    window.__tamoDeleteRunning = false;
    window.__tamoDeleteStopRequested = false;
    LOG('Loop finished.');
  }

  runLoop();
}