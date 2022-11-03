const getTime = date => date.toString().substr(16, 8);
const setTimeDOM = (selector, value) => {
  const dom = document.querySelector(selector);
  dom.innerText = value ? getTime(new Date(value)) : 'Unset';
  const isTomorrow = new Date().getDate() != new Date(value).getDate();
  dom.classList[isTomorrow ? 'add' : 'remove']('tomorrow');
}
const setActiveState = async state => {
  const tab = await getCurrentTab();
  chrome.storage.local.set({
    activateMessage: {
      active: state,
      id: tab.id,
      url: tab.url,
      t: new Date().getTime()
    }
  });
}
const init = async () => {
  const tab = await getCurrentTab();
  const targetPage = "https://attendance.moneyforward.com/my_page";
  if (!tab.url.startsWith(targetPage)) {
    const message = document.querySelector('.notWorking');
    message.classList.add("show");
    message.onclick = () => {
      chrome.storage.local.get(['tabId'], result => {
        if (!result.tabId) return chrome.tabs.create({url: targetPage });
        chrome.tabs.get(result.tabId, tabRes => {
          return  tabRes ? chrome.tabs.update(result.tabId, {selected: true}) : chrome.tabs.create({url: targetPage });
        })
      })
    }
  }

  setLabel();
}

const getCurrentTab = async () => {
  let tab = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });
  if (tab.length == 0 || !tab[0]) throw 'This is authorized!!!';;
  return tab[0];
}

const setLabel = () => {
  chrome.storage.local.get(['active', 'inTime', 'breakTime', 'resumeTime', 'outTime'], result => {
    chrome.alarms.get('inTime', e => setTimeDOM('.clockIn', (e || {}).scheduledTime))
    chrome.alarms.get('breakTime', e => setTimeDOM('.startBreak', (e || {}).scheduledTime));
    chrome.alarms.get('resumeTime', e => setTimeDOM('.endBreak', (e || {}).scheduledTime));
    chrome.alarms.get('outTime', e => setTimeDOM('.clockOut', (e || {}).scheduledTime));
    document.querySelector('.btnGroup').classList[result.active ? 'remove' : 'add']('stopped');
  });
}

init();
document.querySelector('#startBtn').onclick = () => setActiveState(true);
document.querySelector('#stopBtn').onclick = () => setActiveState(false);
[...document.querySelectorAll('[data-editable]')].forEach(element => element.onclick = async () => {
  const res = prompt("What is new value ?", element.innerHTML);
  if (!res) return;
  let updateValue = undefined;
  try {
    const now = new Date();
    updateValue = new Date(`${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${res}`);
    if (now.getTime() > updateValue.getTime()) updateValue.setDate(updateValue.getDate() + 1);
    updateValue = updateValue.getTime();
  } catch {
    return alert("Invalid time format!!!");
  }

  const tab = await getCurrentTab();
  chrome.storage.local.set({
    updateAlarmMessage: {
      type: element.dataset.editable,
      updateValue,
      id: tab.id,
      url: tab.url,
      t: new Date().getTime()
    }
  });
});
chrome.storage.local.onChanged.addListener(setLabel);