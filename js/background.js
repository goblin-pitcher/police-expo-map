// ===================公共参数，不能用块级作用域的命令声明变量======================
var baseUrl = 'http://10.122.100.146/'
var delay = 0
var switchOpen = true
var evtType = {
  dataChange: 'data-change',
  switchChange: 'switch-change'
}
// ===================通用方法=======================
function debounce(func, time=0) {
  let timer = null
  const cancel = ()=>{
    clearTimeout(timer)
    timer = null
  }
  const rtnFunc = function(...args){
    if(timer) {
      cancel()
    }
    timer = setTimeout(()=>{
      func.apply(this, args)
      timer = null;
    }, time)
  }
  rtnFunc.cancel = cancel
  return rtnFunc
}
// ===================业务相关方法====================
function getTabByWid(wid) {
  return new Promise(res=>{
    chrome.tabs.query({
      active: true,
      windowId: wid
    }, ([curTab]) => {
      res(curTab)
    })
  })
}

async function getUrlByWid(wid){
  const tab = await getTabByWid(wid);
  return tab.url
}

function isPanoMap(url) {
  if(!url) return false;
  return  /^https?:\/\/map\..+?\.com\/.+pano/.test(url); // 匹配规则根据腾讯、百度地图来的
}
function dataWatcher(watch){
  let oldData = null
  return function(data) {
    try{
      if(data && data === oldData) return;
      watch(data, oldData)
    } catch(err) {
      console.log(err)
    } finally {
      oldData = data
    }
  }
}
// =====================业务代码============================
let delayFetcherSet = new Set();
let hasDelayChange = false;
const debounceTime = 250;
const switchUrl = '/api/expo/v1/switcher'
const typeEnum = {
  open: 'open',
  close: 'close'
}
const valueMap = {
  [typeEnum.open]: 1,
  [typeEnum.close]: 0
}

const sendSwitcher = async (status)=>{
  const body = JSON.stringify({status});
  try{
    await fetch(`${baseUrl}${switchUrl}`, {method: 'POST', body, headers: {'Content-Type':'application/json;charset=UTF-8'}})
    .then(response => {
      if(response.status >= 400) {
        console.log('请求失败, status::', response.status)
        return {code: 10086, msg: ''};
      }
      return response.json()
    }).then(res => {
      if(res.code){
        console.log('请求失败，后端接口问题。', res.msg)
      }
    });
  } catch(err) {
    console.log(err);
  }
  return true // 代表请求流程的结束
}

const fetcherReset = ()=>{
  delayFetcherSet.forEach(timer=>{
    clearTimeout(timer)
  })
  delayFetcherSet = new Set()
  hasDelayChange = false
}

const debounceSwitch = debounce((state)=>{
  const status = valueMap[state]
  if(!Object.values(valueMap).includes(status)) {
    console.log('请求状态错误')
    return
  }
  // console.log(`${baseUrl}/api/expo/v1/switch`, body)
  if (hasDelayChange) {
    fetcherReset()
  }
  let delayFetcher = setTimeout(()=>{
    sendSwitcher(status).then(()=>{
      delayFetcherSet.delete(delayFetcher)      
    })
  }, delay)
  delayFetcherSet.add(delayFetcher)
}, debounceTime)

const urlWatch = (url, oldUrl) => {
  if(!switchOpen) return;
  const [checkUrlPano, checkOldUrlPano] = [url, oldUrl].map(isPanoMap);
  // tab从
  if(!checkOldUrlPano && checkUrlPano) {
    // 打开检测
    debounceSwitch(typeEnum.open)
  }
  if(checkOldUrlPano && !checkUrlPano) {
    // 关闭检测
    debounceSwitch(typeEnum.close)
  }
}
const urlChange = dataWatcher(urlWatch);

const delayWatch = (delayTime) => {
  delay = delayTime
  hasDelayChange = true
}
const delayChange = dataWatcher(delayWatch)

const switchOpenWatch = (isOpen) => {
  switchOpen = isOpen
  debounceSwitch.cancel()
  fetcherReset()
  sendSwitcher(valueMap[typeEnum.open])
}
const switchOpenChange = dataWatcher(switchOpenWatch)
// 接收事件
chrome.runtime.onMessage.addListener((req, sender, sendResponse)=>{
  if (req.type === evtType.dataChange) {
    baseUrl = req.baseUrl;
    const delayTime = Number.isNaN(+req.delay) ? 0 : +req.delay;
    delayChange(delayTime);
  }
  if (req.type === evtType.switchChange) {
    switchOpenWatch(req.status)
  }
  sendResponse('receive success');
})
// 检测事件：：
chrome.windows.onFocusChanged.addListener( async (wid)=>{
  // console.log('on focused', wid)
  if(wid===-1){
    urlChange('')
    return
  }
  const url = await getUrlByWid(wid);
  urlChange(url)
})

chrome.tabs.onActivated.addListener(async ({windowId: wid})=>{
  // console.log('on actived', wid)
  const url = await getUrlByWid(wid);
  urlChange(url)
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tabInfo)=>{
  const {status} = changeInfo;
  if (status !== 'complete') return;
  // console.log('on updated', tabInfo)
  const {url} = tabInfo;
  urlChange(url)
})