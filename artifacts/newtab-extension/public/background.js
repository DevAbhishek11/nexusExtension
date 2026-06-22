// Service Worker for NexTab Chrome Extension
// Handles background tasks, alarms, and push notifications

const ALARM_PREFIX = "reminder_";

chrome?.runtime?.onInstalled?.addListener((details) => {
  if (details.reason === "install") {
    chrome.storage.local.set({ firstInstall: true, installedAt: Date.now() });
  }
  rescheduleAllReminders();
});

async function rescheduleAllReminders() {
  if (!chrome?.storage || !chrome?.alarms) return;
  try {
    const result = await chrome.storage.local.get(["nt_reminders"]);
    const reminders = result.nt_reminders || [];
    for (const r of reminders) {
      if (!r.enabled) continue;
      const alarmName = `${ALARM_PREFIX}${r.id}`;
      const next = nextOccurrence(r);
      if (next) chrome.alarms.create(alarmName, { when: next });
    }
  } catch { /* storage not available */ }
}

function nextOccurrence(reminder) {
  const now = Date.now();
  if (reminder.repeat === "none") {
    return reminder.datetime > now ? reminder.datetime : null;
  }
  const base = new Date(reminder.datetime);
  if (reminder.repeat === "daily") {
    let next = new Date(base);
    while (next.getTime() <= now) next.setDate(next.getDate() + 1);
    return next.getTime();
  }
  if (reminder.repeat === "weekly") {
    let next = new Date(base);
    while (next.getTime() <= now) next.setDate(next.getDate() + 7);
    return next.getTime();
  }
  return null;
}

// Alarm fires → show notification
chrome?.alarms?.onAlarm?.addListener(async (alarm) => {
  if (!alarm.name.startsWith(ALARM_PREFIX)) return;
  const reminderId = alarm.name.slice(ALARM_PREFIX.length);
  try {
    const result = await chrome.storage.local.get(["nt_reminders"]);
    const reminders = result.nt_reminders || [];
    const reminder = reminders.find((r) => r.id === reminderId);
    if (!reminder || !reminder.enabled) return;

    chrome.notifications.create(`notif_${reminderId}_${Date.now()}`, {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: `🔔 ${reminder.title || "Reminder"}`,
      message: reminder.description || "You have a scheduled reminder!",
      priority: 2,
    });

    // Re-schedule if repeating
    const next = nextOccurrence({ ...reminder, datetime: reminder.repeat !== "none" ? reminder.datetime : -1 });
    if (next && reminder.repeat !== "none") {
      const base = new Date(reminder.datetime);
      if (reminder.repeat === "daily") {
        let n = new Date(base);
        while (n.getTime() <= Date.now()) n.setDate(n.getDate() + 1);
        chrome.alarms.create(alarm.name, { when: n.getTime() });
      } else if (reminder.repeat === "weekly") {
        let n = new Date(base);
        while (n.getTime() <= Date.now()) n.setDate(n.getDate() + 7);
        chrome.alarms.create(alarm.name, { when: n.getTime() });
      }
    }
  } catch { /* storage not available */ }
});

// Message listeners
chrome?.runtime?.onMessage?.addListener((message, _sender, sendResponse) => {
  if (message.type === "SYNC_SETTINGS") {
    chrome.storage.sync.set(message.data, () => sendResponse({ success: true }));
    return true;
  }

  if (message.type === "GET_PREMIUM_STATUS") {
    chrome.storage.local.get(["isPremium"], (result) => {
      sendResponse({ isPremium: result.isPremium || false });
    });
    return true;
  }

  if (message.type === "SCHEDULE_REMINDER") {
    const { reminder } = message;
    const alarmName = `${ALARM_PREFIX}${reminder.id}`;
    chrome.alarms.clear(alarmName, () => {
      chrome.storage.local.get(["nt_reminders"], (result) => {
        const reminders = result.nt_reminders || [];
        const idx = reminders.findIndex((r) => r.id === reminder.id);
        if (idx >= 0) reminders[idx] = reminder;
        else reminders.push(reminder);
        chrome.storage.local.set({ nt_reminders: reminders }, () => {
          if (!reminder.enabled || reminder.datetime <= Date.now()) {
            sendResponse({ success: false, reason: "past or disabled" });
            return;
          }
          chrome.alarms.create(alarmName, { when: reminder.datetime });
          sendResponse({ success: true });
        });
      });
    });
    return true;
  }

  if (message.type === "CANCEL_REMINDER") {
    const alarmName = `${ALARM_PREFIX}${message.reminderId}`;
    chrome.alarms.clear(alarmName, () => {
      chrome.storage.local.get(["nt_reminders"], (result) => {
        const reminders = (result.nt_reminders || []).filter((r) => r.id !== message.reminderId);
        chrome.storage.local.set({ nt_reminders: reminders }, () => sendResponse({ success: true }));
      });
    });
    return true;
  }

  if (message.type === "SYNC_REMINDERS") {
    chrome.storage.local.set({ nt_reminders: message.reminders }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
