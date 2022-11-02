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
  });
}

init();
document.querySelector('#startBtn').onclick = () => setActiveState(true)
document.querySelector('#stopBtn').onclick = () => setActiveState(false)
const getTime = date => date.toString().substr(16, 8);
const setTimeDOM = (selector, value) => {
  const dom = document.querySelector(selector);
  dom.innerText = value ? getTime(new Date(value)) : 'Unset';
  const isTomorrow = new Date().getDate() != new Date(value).getDate();
  dom.classList[isTomorrow ? 'add' : 'remove']('tomorrow');
}
chrome.storage.local.onChanged.addListener(setLabel)