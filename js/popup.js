var bg = chrome.extension.getBackgroundPage();
const $ = document.querySelector.bind(document);
let {baseUrl, delay, switchOpen, evtType} = bg

const init = () => {
  const showDelay = (delay / 1000)
  $('#service').value = baseUrl
  $('#showLoc').innerText = baseUrl
  $('#delay').value = showDelay
  $('#showDelay').innerText = showDelay
  $('#switchState').innerText = switchOpen ? '已开启' : '已关闭'
  $('#switchFunc').innerText = switchOpen ? '功能关闭' : '功能开启'
}
const sendUrl = ()=>{
  chrome.runtime.sendMessage({type:evtType.dataChange, baseUrl, delay})
}
const sendSwitchChange = ()=>{
  chrome.runtime.sendMessage({type:evtType.switchChange, status: switchOpen})
}
init()
$('#save').onclick = () =>{
  baseUrl = $('#service').value;
  delay = $('#delay').value * 1000;
  sendUrl()
  init()
}

$('#switchFunc').onclick = () =>{
  switchOpen = !switchOpen
  sendSwitchChange()
  init()
}