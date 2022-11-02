const setActiveState = async state => {
  const tab = await getCurrentTab();
  chrome.storage.local.set({
    message: {
      active: state,
      id: tab.id,
      url: tab.url
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
  console.log("setLabel")
  chrome.storage.local.get(['inTime', 'breakTime', 'resumeTime', 'outTime', 'active'], result => {
    setTimeDOM('.clockIn', result.inTime);
    setTimeDOM('.startBreak', result.breakTime);
    setTimeDOM('.endBreak', result.resumeTime);
    setTimeDOM('.clockOut', result.outTime);
    document.querySelector('.btnGroup').classList[!result.active ? 'remove' : 'add']('stopped');
  });
}

init();
document.querySelector('#startBtn').onclick = () => setActiveState(true)
document.querySelector('#stopBtn').onclick = () => setActiveState(false)
const getTime = date => date.toString().substr(16, 8);
const setTimeDOM = (selector, value) => document.querySelector(selector).innerText = value ? getTime(new Date(value)) : 'Unset';
chrome.storage.local.onChanged.addListener(setLabel)