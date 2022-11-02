const setActiveState = async state => {
  const tab = await getCurrentTab();
  chrome.storage.local.set({
    message: {
      active: state,
      id: tab.id,
      url: tab.url,
      t: new Date().getTime()
    }
  });
}

const init = async () => {
  const tab = await getCurrentTab();
  if (!tab.url.startsWith("https://attendance.moneyforward.com/my_page")) {
    document.querySelector('.notWorking').classList.add("show");
    throw 'This is not target page';
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
    const wrInMs = (result.breakTime - result.inTime + result.outTime - result.resumeTime);
    const outputWkTime = document.querySelector('.message-2 span');
    outputWkTime.innerHTML = msToDate(wrInMs)
  });
}

init();
document.querySelector('#startBtn').onclick = () => setActiveState(true)
document.querySelector('#stopBtn').onclick = () => setActiveState(false)
const getTime = date => date.toString().substr(16, 8);
const msToDate = ms => {
  ms /= 1000;
  const date = new Date();
  date.setHours(Math.floor(ms / 3600));
  ms = ms % 3600;
  date.setMinutes(Math.floor(ms / 60));
  ms = ms % 60;
  date.setSeconds(ms)
  return getTime(date);
}
const setTimeDOM = (selector, value) => document.querySelector(selector).innerText = value ? getTime(new Date(value)) : 'Unset';
chrome.storage.local.onChanged.addListener(setLabel)