chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: "OFF",
  });
  chrome.storage.local.set({
    active: false,
    inTime: 0,
    breakTime: 0,
    resumeTime: 0,
    outTime: 0,
    message: null
  });
});

chrome.storage.local.onChanged.addListener(e => {
  if (e.message && e.message.newValue) {
    const newValue =  e.message.newValue;
    changeActive(newValue.active, newValue)
  }
  updateLabel();
})

chrome.alarms.onAlarm.addListener(e => {
  let script = null;
  switch (e.name) {
    case 'inTime':
      initInTime();
      script = "scripts/startWork.js";
      break;
    case 'breakTime':
      initBreakTime();
      script = "scripts/startBreak.js";
      break;
    case 'resumeTime':
      initResumeTime();
      script = "scripts/endBreak.js";
      break;
    case 'outTime':
      initOutTime();
      script = "scripts/endWork.js";
      break;
  }

  if (!script) return;

  chrome.storage.local.get(['tabId'], result => {
    if (!result.tabId) {
      changeActive(false, {id: null});
      return;
    }

    chrome.scripting.executeScript({
      files: [script],
      target: {
        tabId: result.tabId
      },
    });
  });
})

const changeActive = (nextState, tab) => {
  chrome.storage.local.set({
    active: nextState,
    tabId: tab.id
  });

  chrome.action.setBadgeText({
    tabId: tab.id,
    text: nextState ? "ON" : "OFF",
  });
  return nextState ? initAlarm() : clearAlarm();
}
const initAlarm = () => {
  initInTime();
  initBreakTime();
  initResumeTime();
  initOutTime();
}
const initInTime = () => {
  const inTime = getDateInMs(8, -1);
  chrome.storage.local.set({
    inTime
  });
  chrome.alarms.create('inTime', {
    when: inTime
  });
}
const initBreakTime = () => {
  const breakTime = getDateInMs(12, 1);
  chrome.storage.local.set({
    breakTime
  });
  chrome.alarms.create('breakTime', {
    when: breakTime
  });
}
const initResumeTime = () => {
  const resumeTime = getDateInMs(13, -1);

  chrome.storage.local.set({
    resumeTime
  });
  chrome.alarms.create('resumeTime', {
    when: resumeTime
  });
}
const initOutTime = () => {
  const outTime = getDateInMs(17, 1);
  chrome.storage.local.set({
    outTime
  });
  chrome.alarms.create('outTime', {
    when: outTime
  });
}

const clearAlarm = () => chrome.alarms.clearAll();
const randomIn = (start, end) => Math.round(Math.random() * (end - start) + start);
const getDateInMs = (hr, minus) => {
  let rand = randomIn(0, 10);
  if (minus < 0) rand = - rand;
  const diff = rand < 0 ? -1 : 0;
  const targetDate = new Date();
  targetDate.setHours(hr + diff);
  targetDate.setMinutes(rand >= 0 ? rand : (60 + rand));
  targetDate.setSeconds(randomIn(0, 59));
  if (targetDate.getTime() < new Date().getTime()) {
    targetDate.setDate(targetDate.getDate() + 1);
  }
  return targetDate.getTime();
}
const isActiveSite = (tab) => tab.url.startsWith('https://attendance.moneyforward.com/');
const updateLabel = async () => {
  let tab = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });
  if (tab.length == 0 || !tab[0]) return;
  tab = tab[0];
  if (isActiveSite(tab)) {
    chrome.storage.local.get(['active'], result => {
      chrome.action.setBadgeText({
        tabId: tab.id,
        text: result.active ? "ON" : "OFF",
      });
    })
  }
}
chrome.tabs.onUpdated.addListener(updateLabel)