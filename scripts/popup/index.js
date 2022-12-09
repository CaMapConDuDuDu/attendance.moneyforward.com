const getTime = date => date.toString().substr(16, 8);
const setTimeDOM = (selector, value) => {
  const dom = document.querySelector(selector);
  if (!value) {
    dom.innerText = 'Unused';
    dom.classList.add('turnoff');
    dom.title = "This not working";
    return;
  }
  dom.innerText = getTime(new Date(value));
  dom.title = new Date(value);
  const isTomorrow = new Date().getDate() != new Date(value).getDate();
  dom.classList[isTomorrow ? 'add' : 'remove']('tomorrow');
  dom.classList.remove('turnoff');
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
  // if (!tab.url.startsWith(targetPage)) {
  //   const message = document.querySelector('.notWorking');
  //   message.classList.add("show");
  //   message.onclick = () => {
  //     chrome.storage.local.get(['tabId'], result => {
  //       if (!result.tabId) return chrome.tabs.create({url: targetPage });
  //       chrome.tabs.get(result.tabId, tabRes => {
  //         return  tabRes ? chrome.tabs.update(result.tabId, {selected: true}) : chrome.tabs.create({url: targetPage });
  //       })
  //     })
  //   }
  // }
  const clock = document.querySelector('.clock');
  clock.innerText = getTime(new Date());
  setInterval(() => {
    clock.innerText = getTime(new Date());
  }, 1000);

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
  chrome.storage.local.get(['active'], result => {
    document.querySelector('.btnGroup').classList[result.active ? 'remove' : 'add']('stopped');
  });
  chrome.alarms.get('inTime', e => setTimeDOM('.clockIn', (e || {}).scheduledTime))
  chrome.alarms.get('breakTime', e => setTimeDOM('.startBreak', (e || {}).scheduledTime));
  chrome.alarms.get('resumeTime', e => setTimeDOM('.endBreak', (e || {}).scheduledTime));
  chrome.alarms.get('outTime', e => setTimeDOM('.clockOut', (e || {}).scheduledTime));
  chrome.storage.sync.get(['syncActive'], result => {
    document.querySelector('.syncIcon').classList[result.syncActive ? 'remove' : 'add']('noSync');
  })
}

init();
document.querySelector('#startBtn').onclick = () => setActiveState(true);
document.querySelector('#stopBtn').onclick = () => setActiveState(false);
document.querySelector('.gearIcon').onclick = (e) => setActiveState(e.target.parentElement.classList.contains('stopped'));

[...document.querySelectorAll('[data-editable]')].forEach(element => element.onclick = async () => {
  let askValue = element.innerHTML;
  if (askValue == 'Unused') askValue = '';
  const res = prompt("What is new value (blank to turn off, 1 to turn on again)?", askValue);
  let updateValue = undefined;
  let turnOffForLong = false;
  let initDate = false;
  if (res != '' && res != '1') {
    try {
      const now = new Date();
      updateValue = new Date(`${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${res}`);
      if (now.getTime() > updateValue.getTime()) updateValue.setDate(updateValue.getDate() + 1);
      updateValue = updateValue.getTime();
    } catch {
      return alert("Invalid time format!!!");
    }
  } else if (res == '1') {
    initDate = element.dataset.editable;
  } else {
    turnOffForLong = confirm("Turn it off until enabled again?");
  }

  const tab = await getCurrentTab();
  chrome.storage.local.set({
    updateAlarmMessage: {
      type: element.dataset.editable,
      updateValue,
      turnOffForLong,
      initDate,
      id: tab.id,
      url: tab.url,
      t: new Date().getTime()
    }
  });
});
chrome.storage.local.onChanged.addListener(setLabel);