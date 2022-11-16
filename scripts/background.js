const targetPage = "https://attendance.moneyforward.com/my_page";
let retryCount = 1;
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    active: false,
    inTime: 0,
    breakTime: 0,
    resumeTime: 0,
    outTime: 0,
    activateMessage: null,
    updateAlarmMessage: null
  });
});

chrome.storage.local.onChanged.addListener(e => {
  if (e.activateMessage && e.activateMessage.newValue) {
    const newValue = e.activateMessage.newValue;
    changeActive(newValue.active, newValue);
    updateLabel();
  }

  if (e.updateAlarmMessage && e.updateAlarmMessage.newValue) {
    const newValue = e.updateAlarmMessage.newValue;
    chrome.alarms.clear(newValue.type, () => {
      const storageData = {t: new Date()};
      storageData[newValue.type] = newValue.updateValue;
      setTimeout(() => chrome.storage.local.set(storageData), 1000);

      if (!newValue.updateValue) return;
      chrome.alarms.create(newValue.type, {
        when: newValue.updateValue
      });
    })
  }
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
  
  const executeScript = () => chrome.storage.local.get(['tabId'], result => {
    if (!result.tabId) {
      changeActive(false, {
        id: null
      });
      return;
    }
    chrome.scripting.executeScript({
      files: [script],
      target: {
        tabId: result.tabId
      },
    });
  });

  chrome.storage.sync.get(['syncActive'], function(result) {
    if (!result.syncActive) return;
    executeScript();
  });
})

const changeActive = (nextState, tab) => {
  chrome.storage.local.set({
    active: nextState,
    tabId: tab.id
  });
  chrome.storage.sync.set({
    syncActive: nextState,
  });

  chrome.action.setIcon({
    path: getPaths(nextState)
  });
  return nextState ? initAlarm() : clearAlarm();
}
const initAlarm = () => {
  initInTime();
  initBreakTime();
  initResumeTime();
  initOutTime();
  retryCount = 1;
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

const clearAlarm = () => {
  chrome.alarms.clearAll();
}
const randomIn = (start, end) => Math.round(Math.random() * (end - start) + start);
const getDateInMs = (hr, minus) => {
  let rand = randomIn(0, 10);
  if (minus < 0) rand = -rand;
  const diff = rand < 0 ? -1 : 0;
  const targetDate = new Date();
  targetDate.setHours(hr + diff);
  targetDate.setMinutes(rand >= 0 ? rand : (60 + rand));
  targetDate.setSeconds(randomIn(0, 59));
  if (targetDate.getTime() < new Date().getTime()) {
    targetDate.setDate(targetDate.getDate() + 1);
  }
  if (targetDate.getDay() == 6) { // Off on saturday
    targetDate.setDate(targetDate.getDate() + 2);
  }
  if (targetDate.getDay() == 0) { // Off on sunday
    targetDate.setDate(targetDate.getDate() + 1);
  }
  return targetDate.getTime();
}
const isActiveSite = (tab) => tab.url == targetPage;
const updateLabel = async () => {
  let tab = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });
  if (tab.length == 0 || !tab[0]) return;
  tab = tab[0];

  chrome.storage.local.get(['active', 'tabId'], result => {
    chrome.action.setIcon({
      path: getPaths(result.active)
    });
    if (result.active && !isActiveSite(tab) && retryCount > 0) {
      chrome.tabs.get(result.tabId, tabRes => {
        if (!tabRes || tabRes.url != targetPage) {
          chrome.tabs.create({
            url: targetPage
          }, tab => {
            chrome.storage.local.set({
              tabId: tab.id
            });
          });
          retryCount--;
        }
      })
    }
  })

}
const getPath = (state) => state ? '/images/icons/started-*.png' : '/images/icons/stopped-*.png';
const getPaths = (state) => {
  return [16, 32, 64, 128].reduce((acc, r) => (acc[r] = getPath(state).replace('*', r), acc), {});
}
chrome.tabs.onUpdated.addListener(updateLabel)
chrome.tabs.onReplaced.addListener(updateLabel)
chrome.tabs.onRemoved.addListener(updateLabel)