// const API = 'http://198.13.54.92/api/'
const API = 'https://withpinbox.com/api/'

// const homeUrl = 'http://198.13.54.92'
const homeUrl = 'https://withpinbox.com'

var activeTabId
var port
var alpha_info
var websiteInfo
var tabObj = {}
var tipMsg
var shortcut = null
var newtabState = false
var linkSeach = true
var contextMenusState = true
var websiteCheckedOption = {state: false}
var imageHoverBtn = false
var collectObj = null
var itemObj = {}
var tagList = null
var tagObj = {}
var hasChecked = {}
var searchBoxAutoFocus = 'address'
var updatedTabId = null
var optionConfig = {
    newtabState: false,
    linkSeach: true,
    contextMenusState: true,
    imageHoverBtn: false,
    searchBoxAutoFocus: 'address'
}

chrome.storage.sync.get('optionConfig', (result) => {
    if (result.optionConfig) {
        let mOptionConfig = JSON.parse(result.optionConfig)
        newtabState = mOptionConfig.newtabState
        linkSeach = mOptionConfig.linkSeach
        contextMenusState = mOptionConfig.contextMenusState
        imageHoverBtn = mOptionConfig.imageHoverBtn
        searchBoxAutoFocus = mOptionConfig.searchBoxAutoFocus
        optionConfig = mOptionConfig
        
    }
})

var objectPage = {
    type: 'normal',
    title: "收藏该网页到 Pinbox",
    checked: false,
    contexts: ["page"],
    onclick: (data, tab) => {
        addUrl(tab, tab.url, 'website')
    }
}

var objectLink = {
    type: 'normal',
    title: "收藏该链接到 Pinbox",
    checked: false,
    contexts: ["link"],
    onclick: (data, tab) => {
        addUrl(tab, data.linkUrl, 'link')
    }
}

var objectImage = {
    type: 'normal',
    title: "收藏该图片到 Pinbox",
    checked: false,
    contexts: ["image"],
    onclick: (data, tab) => {
        addUrl(tab, data.srcUrl, 'img')
    }
}

var objectSelect = {
    type: 'normal',
    title: "收藏选中文字到 Pinbox",
    checked: false,
    contexts: ["selection"],
    onclick: (data, tab) => {
        addUrl(tab, data, 'text')
    }
}

var updateShortcut = {
    type: 'normal',
    title: "同步快捷键",
    checked: false,
    contexts: ["browser_action"],
    onclick: () => {
        getShortcut(true)
    }
}

var explore = {
    type: 'normal',
    title: "发现",
    checked: false,
    contexts: ["browser_action"],
    onclick: () => {
        chrome.tabs.create({
            url: homeUrl + '/explore'
        })
    }
}

var pinboxItem = {
    type: 'normal',
    title: "我的收藏",
    checked: false,
    contexts: ["browser_action"],
    onclick: () => {
        chrome.tabs.create({
            url: homeUrl + '/items'
        })
    }
}

var callback = () => {
    console.log('success')
}
var page = chrome.contextMenus.create(objectPage, callback)
var link = chrome.contextMenus.create(objectLink, callback)
var image = chrome.contextMenus.create(objectImage, callback)
var select = chrome.contextMenus.create(objectSelect, callback)

chrome.contextMenus.create(pinboxItem, callback)
chrome.contextMenus.create(explore, callback)
chrome.contextMenus.create(updateShortcut, callback)

var tool = {
    type: 'normal',
    title: "工具",
    checked: false,
    contexts: ["browser_action"],
}

var toolId = chrome.contextMenus.create(tool, callback)

var qr = {
    type: 'normal',
    title: "二维码生成",
    checked: false,
    contexts: ["browser_action"],
    parentId: toolId,
    onclick: () => {
        chrome.tabs.sendMessage(activeTabId, {type: "checkIframe"}, (res) => {
            if (!res) {
                chrome.tabs.executeScript(activeTabId, {file: "js/iframe.js"}, () => {
                    setTimeout(() => {
                        chrome.tabs.get(activeTabId, (tab) => {
                            port.postMessage({
                                type: 'qrcode',
                                data: tab.url
                            })
                        })
                    }, 100)
                })
            } else {
                chrome.tabs.get(activeTabId, (tab) => {
                    port.postMessage({
                        type: 'qrcode',
                        data: tab.url
                    })
                })
            }
        })
    }
}

var toolId = chrome.contextMenus.create(qr, callback)

var details = {
    url: homeUrl,
    name: 'alpha_info'
}

// 获取整个书签树
// chrome.bookmarks.getTree((results) => {
//     console.log(JSON.stringify(results));
// })

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'

chrome.runtime.onMessage.addListener((request, sender,sendResponse) => {
    chrome.tabs.sendMessage(activeTabId, request)
})

// 安装时获取快捷键
getShortcut()
// 安装时获取收藏集列表
getcollect().then(res => {
    collectObj = res.data
})
.catch(err => {
    if (err === 'not login') {
        // 此处 port 不存在 使用单次消息通信

    }
})


chrome.browserAction.onClicked.addListener((tab) => {
    addUrl(tab, tab.url, 'website')
})

chrome.tabs.onCreated.addListener((tab) => {
    let url = tab.url || tab.pendingUrl || ''
    if (url && url.match(/withpinbox.com/)) {
        chrome.tabs.move(tab.id, {
            index: 1000
        }, (t) => {
            console.log(t)
        })
    }
    if (newtabState) {
        if (url.match(/^chrome:\/\/newtab|^edge:\/\/newtab|^about:blank$/)) {
            if (searchBoxAutoFocus === 'address') {
                    chrome.tabs.update(tab.id, {
                    url: 'newtab/index.html'
                })
            } else {
                chrome.tabs.remove(tab.id, () =>{})
                chrome.tabs.create({ url: 'newtab/index.html', active: !0})
            }
        }
    }
})


chrome.runtime.onConnect.addListener(function(port) {
    port = port
    window.port = port
    port.onDisconnect.addListener(function() {
        port = null
        window.port = null
    })
    port.onMessage.addListener(function(msg) {
        if (msg.type === 'getcollect') {
            getcollect().then(res => {
                if (port) {
                    collectObj = res.data
                    chrome.storage.sync.get('recentList', (result) => {
                        if (tagList) {
                            port.postMessage({
                                type: 'collect',
                                data: res.data,
                                recentList: result.recentList,
                                tagList: tagList.tags
                            })
                        } else {
                            getTagList().then(r => {
                                tagList = r.data
                                port.postMessage({
                                    type: 'collect',
                                    data: res.data,
                                    recentList: result.recentList,
                                    tagList: tagList.tags
                                })
                            })
                            .catch(err => {
                                port.postMessage({
                                    type: 'collect',
                                    data: res.data,
                                    recentList: result.recentList,
                                    tagList: null
                                })
                            })
                        }
                    })
                }
            })
        } else if (msg.type === 'movecollect') {
            axios.put(API + 'user/' + alpha_info.uid + '/store/' + websiteInfo.id, {collectionId: msg.id}, {headers: {'Authorization': 'Bearer ' + alpha_info.token}})
            .then(res => {
                port.postMessage({
                    type: 'showMsg',
                    name: msg.name,
                    id: msg.id,
                })
            })
        } else if (msg.type == 'addcollect') {
            axios.post(API + 'user/' + alpha_info.uid + '/collection', {name: msg.name}, {headers: {'Authorization': 'Bearer ' + alpha_info.token}})
            .then(res => {
                axios.put(API + 'user/' + alpha_info.uid + '/store/' + websiteInfo.id, {collectionId: res.data.id}, {headers: {'Authorization': 'Bearer ' + alpha_info.token}})
                .then(data => {
                    port.postMessage({
                        type: 'showMsg',
                        name: res.data.name,
                        id: res.data.id,
                    })
                })
            })
            .catch(err => {
                if (err.response.status == 403 && err.response.data.error == 'Subscription required.') {
                    if (err.response.data.feature == 'Number of collections.') {
                        port.postMessage({
                            type: 'vipLimit',
                            data: '您的收藏集个数已达上限，创建更多需要升级成为专业版'
                        })
                    }
                } 
            })
        } else if (msg.type === 'delcollect') {
            let query = '?storeIds[]=' + [websiteInfo.id]
            axios.delete(API + `user/${alpha_info.uid}/store${query}`, {headers: {'Authorization': 'Bearer ' + alpha_info.token}})
            .then(res => {
                port.postMessage({
                    type: 'tips',
                    data: '已删除'
                })
            })

        } else if (msg.type === 'editTitle') {
            axios.put(API + `user/${alpha_info.uid}/store/${websiteInfo.id}`, {brief: msg.title}, {headers: {'Authorization': 'Bearer ' + alpha_info.token}})
            .then(res => {

            })
        } else if (msg.type === 'editDes') {
            axios.put(API + `user/${alpha_info.uid}/store/${websiteInfo.id}`, {note: msg.des}, {headers: {'Authorization': 'Bearer ' + alpha_info.token}})
            .then(res => {

            })
        } else if (msg.type === 'editTag') {
            axios.put(API + `user/${alpha_info.uid}/store/${websiteInfo.id}`, {tags: msg.tags}, {headers: {'Authorization': 'Bearer ' + alpha_info.token}})
            .then(res => {

            })
            .catch(err => {
                if (err.response.status == 403 && err.response.data.error == 'Subscription required.') {
                    if (err.response.data.feature == 'Number of tags.') {
                        port.postMessage({
                            type: 'vipLimit',
                            data: '您的标签个数已达上限，创建更多需要升级成为专业版'
                        })
                    }
                }
            })
        } else if (msg.type === 'fresh') {
            port.postMessage({
                type: 'getShortcut',
                data: shortcut
            })
        } else if (msg.type === 'getTabObj') {
            port.postMessage({
                type: 'tabObj',
                data: tabObj
            })
        } else if (msg.type === 'getTipMsg') {
            port.postMessage({
                type: 'tipMsg',
                data: tipMsg
            })
        } else if (msg.type === 'collect') {
            chrome.tabs.query({
                active: true
            }, (tab) => {
                addUrl(tab[0], tab[0].url, 'website')
            })
        } else if (msg.type === 'getShortcut') {
            port.postMessage({
                type: 'getShortcut',
                data: shortcut
            })
        } else if (msg.type === 'updateShortcutKey') {
            getShortcut()
        } else if (msg.type === 'pinboxLogin') {
            getShortcut()
            getcollect().then(res => {
                collectObj = res.data
                itemObj = {}
                tagList = null
                tagObj = {}
            })
            chrome.runtime.sendMessage({type: 'pinboxLoginChange'}, (response) => {})
        } else if (msg.type === 'pinboxLogout') {
            window.shortcut = null
            collectObj = null
            itemObj = {}
            tagList = null
            tagObj = {}
            chrome.runtime.sendMessage({type: 'pinboxLoginChange'}, (response) => {})
        } else if (msg.type === 'collectOrderChanged') {
            collectObj = null
            chrome.runtime.sendMessage({type: 'pinboxLoginChange'}, (response) => {})
        } else if (msg.type === 'itemOrderChanged') {
            itemObj = {}
            chrome.runtime.sendMessage({type: 'pinboxLoginChange'}, (response) => {})
        } else if (msg.type === 'creatTab') {
            if (msg.item && msg.item.type == 'toPricing') {
                chrome.tabs.create({
                    url: homeUrl + '/pricing'
                })
            } else if (msg.item && msg.item.type == 'toItems') {
                if (msg.item.target === 'self') {
                    chrome.tabs.update({
                        url: homeUrl + msg.item.path
                    })
                } else {
                    chrome.tabs.create({
                        url: homeUrl + msg.item.path
                    })
                }
            } else if (msg.item && msg.item.type == 'toSearch') {
                chrome.tabs.create({
                    url: homeUrl + msg.item.path
                })
            } else {
                chrome.tabs.create({
                    url: msg.item.link || msg.item.url
                })
                if (msg.item.id != undefined) {
                    addView(msg.item.id)
                }
            }
        } else if (msg.type === 'setNewtab') {
            newtabState = msg.newtabState
            optionConfig.newtabState = newtabState
            chrome.storage.sync.set({'optionConfig': JSON.stringify(optionConfig)})
        } else if (msg.type === 'setSearchBoxAutoFocus') {
            searchBoxAutoFocus = msg.searchBoxAutoFocus
            optionConfig.searchBoxAutoFocus = searchBoxAutoFocus
            chrome.storage.sync.set({'optionConfig': JSON.stringify(optionConfig)})
        } else if (msg.type === 'setContextMenus') {
            contextMenusState = msg.contextMenusState
            optionConfig.contextMenusState = contextMenusState
            chrome.storage.sync.set({'optionConfig': JSON.stringify(optionConfig)})
            if (msg.contextMenusState) {
                page = chrome.contextMenus.create(objectPage, callback)
                image = chrome.contextMenus.create(objectImage, callback)
                select = chrome.contextMenus.create(objectSelect, callback)
            } else {
                chrome.contextMenus.remove(page)
                chrome.contextMenus.remove(image)
                chrome.contextMenus.remove(select)
            }
        } else if (msg.type === 'setLinkSeach') {
            linkSeach = msg.linkSeach
            optionConfig.linkSeach = linkSeach
            chrome.storage.sync.set({'optionConfig': JSON.stringify(optionConfig)})
            port.postMessage({
                type: 'linkSeachChanged',
                data: linkSeach
            })
        } else if (msg.type === 'setImageHoverBtn') {
            imageHoverBtn = msg.imageHoverBtn
            optionConfig.imageHoverBtn = imageHoverBtn
            chrome.storage.sync.set({'optionConfig': JSON.stringify(optionConfig)})
        } else if (msg.type === 'getLinkSearch') {
            port.postMessage({
                type: 'getLinkSearchRes',
                data: linkSeach,
                contextMenusState: contextMenusState,
                imageHoverBtn: imageHoverBtn,
                newtabState: newtabState,
                searchBoxAutoFocus: searchBoxAutoFocus
            })
        } else if (msg.type == 'setRecent') {
            chrome.storage.sync.set({'recentList': msg.value})
        } else if (msg.type == 'search') {
            search(msg)
        } else if (msg.type === 'addImage') {
            chrome.tabs.query({active: true}, (tab) => {
                addUrl(tab[0], msg.src, 'img')
            })
        } else if (msg.type === 'getCollectObj') {
            if (collectObj) {
                port.postMessage({
                    type: 'collectObj',
                    data: collectObj,
                })
            } else {
                getcollect().then(res => {
                    collectObj = res.data
                    port.postMessage({
                        type: 'collectObj',
                        data: collectObj,
                    })
                })
                .catch(err => {
                    collectObj = null
                    if (err === 'not login') {
                        port.postMessage({
                            type: 'collectObj',
                            data: 'not login',
                        })
                    }
                })
            }
            
        } else if (msg.type === 'getItem') {
            if (itemObj[msg.id]) {
                port.postMessage({
                    type: 'item',
                    data: itemObj[msg.id],
                    id: msg.id
                })
            } else {
                getItem(msg.id, 0).then(res => {
                    itemObj[msg.id] = res.data
                    port.postMessage({
                        type: 'item',
                        data: res.data,
                        id: msg.id
                    })
                })
            }
            
        } else if (msg.type === 'getMoreItem') {
            if (msg.id === 'tag') {
                getTaggedItem(msg.id, msg.offset).then(res => {
                    tagObj[msg.id].items.push(...res.data.items)
                    port.postMessage({
                        type: 'item',
                        data: tagObj[msg.id],
                        id: msg.id
                    })
                })
            } else if (msg.id === 'untagged') {
                getUntaggedItem(msg.id, msg.offset).then(res => {
                    tagObj[msg.id].items.push(...res.data.items)
                    port.postMessage({
                        type: 'item',
                        data: tagObj[msg.id],
                        id: msg.id
                    })
                })
            } else {
                getItem(msg.id, msg.offset).then(res => {
                    itemObj[msg.id].items.push(...res.data.items)
                    port.postMessage({
                        type: 'item',
                        data: itemObj[msg.id],
                        id: msg.id
                    })
                })
            }
        } else if (msg.type === 'getTagList') {
            if (tagList) {
                port.postMessage({
                    type: 'tagList',
                    data: tagList,
                })
            } else {
                getTagList().then(res => {
                    tagList = res.data
                    port.postMessage({
                        type: 'tagList',
                        data: res.data,
                    })
                })
                .catch(err => {
                    port.postMessage({
                        type: 'tagList',
                        data: null,
                    })
                })
            }
        } else if (msg.type === 'getUntaggedItem') {
            if (tagObj[msg.id]) {
                port.postMessage({
                    type: 'item',
                    data: tagObj[msg.id],
                    id: msg.id
                })
            } else {
                getUntaggedItem(msg.id, 0).then(res => {
                    tagObj[msg.id] = res.data
                    port.postMessage({
                        type: 'item',
                        data: res.data,
                        id: msg.id
                    })
                })
            }
        } else if (msg.type === 'getTaggedItem') {
            if (tagObj[msg.id]) {
                port.postMessage({
                    type: 'item',
                    data: tagObj[msg.id],
                    id: msg.id
                })
            } else {
                getTaggedItem(msg.id, 0).then(res => {
                    tagObj[msg.id] = res.data
                    port.postMessage({
                        type: 'item',
                        data: res.data,
                        id: msg.id
                    })
                })
            }
        } else if (msg.type === 'login') {
            if (msg.target === 'self') {
                chrome.tabs.update({
                    url: homeUrl + '/login'
                })
            } else {
                chrome.tabs.create({ url: homeUrl + '/login'})
            }
            
        } else if (msg.type === 'shortcutAreaList') {
            chrome.cookies.get(details, (cookies) => {
                if (cookies) {
                    alpha_info = JSON.parse(cookies.value)
                    if (checkToken()) {
                        axios.get(API + 'user/' + alpha_info.uid + '/setting?fields[]=newtab&token=' + alpha_info.token)
                        .then(res => {
                            port.postMessage({
                                type: 'shortcutAreaListRes',
                                data: res.data
                            })
                        })
                    }
                }
            })
            
        } else if (msg.type === 'setShortcutAreaList') {
            let data = {
                field: "newtab",
                data: JSON.stringify(msg.data)
            }
            chrome.cookies.get(details, (cookies) => {
                if (cookies) {
                    alpha_info = JSON.parse(cookies.value)
                    if (checkToken()) {
                        axios.put(API + 'user/' + alpha_info.uid + '/setting', data, {headers: {'Authorization': 'Bearer ' + alpha_info.token}})
                        .then(res => {
                            
                        })
                    }
                }
            })
            
        } else if (msg.type === 'searchSuggest') {
            let list = []
            axios.get(`http://suggestion.baidu.com/su?p=3&wd=${msg.data}&ie=UTF-8&cb=`)
            .then(res => {
                let obj = res.data.match(/\[.+\]/)
                if (obj) {
                    obj = obj[0]
                    let json = `{"s": ${obj}}`
                    json = JSON.parse(json)
                    list = json.s
                } 
                port.postMessage({
                    type: 'searchSuggestRes',
                    data: list
                })
            })
        } else if (msg.type === 'getResourceData') {
            axios.get(API + `resource?type=${msg.resourceType}`)
            .then(res => {
                port.postMessage({
                    type: 'getResourceDataRes',
                    data: res.data,
                    resourceType: msg.resourceType
                })
            })
        }
    })
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // 监测页面url改变
    if (changeInfo.url && updatedTabId == tabId) {
        let url = changeInfo.url
        if (url && !url.match(/^(chrome:|chrome-extension:)\/\/.+/) && !url.match(/\.(png|jpe?g|gif|svg)(\?[^\s,，]*)?$/)) {
            if (hasChecked[url]) {
                websiteCheckedOption = hasChecked[url]
                if (websiteCheckedOption.id !== undefined) {
                    chrome.browserAction.setIcon({
                        path: './img/logoed.png'
                    })
                } else {
                    chrome.browserAction.setIcon({
                        path: './img/logo.png'
                    })
                }
            } else {
                chrome.browserAction.setIcon({
                    path: './img/logo.png'
                })
                chrome.cookies.get(details, (cookies) => {
                    if (cookies) {
                        alpha_info = JSON.parse(cookies.value)
                        if (checkToken()) {
                            axios.put(API + 'user/' + alpha_info.uid + '/store/check', {url: url}, {headers: {'Authorization': 'Bearer ' + alpha_info.token}})
                            .then(res => {
                                chrome.browserAction.setIcon({
                                    path: './img/logoed.png'
                                })
                                websiteCheckedOption = res.data
                                websiteCheckedOption.state = true
                                hasChecked[url] = websiteCheckedOption
                            })
                            .catch(err => {
                                websiteCheckedOption = {state: true}
                                hasChecked[url] = websiteCheckedOption
                            })
                        }
                    }
                })
                
            } 
        }
    }
    updatedTabId = tabId
})

//当窗口选中的标签改变时，此事件触发
chrome.tabs.onActivated.addListener(function(activeInfo) {
    chrome.tabs.sendMessage(activeInfo.tabId, {
        type: "getShortcut",
        data: window.shortcut
    })
    
    if (port && port.postMessage) {
        port.postMessage({
            type: 'getLinkSearchRes',
            data: linkSeach,
            contextMenusState: contextMenusState,
            imageHoverBtn: imageHoverBtn,
            newtabState: newtabState
        })
    }

    if (activeTabId != undefined) {
        chrome.tabs.sendMessage(activeTabId, {
            type: "unloadIframe",
        })
        
    }
    chrome.tabs.query({active: true}, function(tabs) {
        let tab = tabs[0]
        if (tab) {
            let url = tab.url || tab.pendingUrl || ''
            chrome.cookies.get(details, (cookies) => {
                if (cookies) {
                    alpha_info = JSON.parse(cookies.value)
                    if (checkToken()) {
                        if (url && !url.match(/^(chrome:|chrome-extension:)\/\/.+/) && !url.match(/\.(png|jpe?g|gif|svg)(\?[^\s,，]*)?$/)) {
                            if (hasChecked[url]) {
                                websiteCheckedOption = hasChecked[url]
                                if (websiteCheckedOption.id !== undefined) {
                                    chrome.browserAction.setIcon({
                                        path: './img/logoed.png'
                                    })
                                } else {
                                    chrome.browserAction.setIcon({
                                        path: './img/logo.png'
                                    })
                                }
                            } else {
                                chrome.browserAction.setIcon({
                                    path: './img/logo.png'
                                })
                                axios.put(API + 'user/' + alpha_info.uid + '/store/check', {url: url}, {headers: {'Authorization': 'Bearer ' + alpha_info.token}})
                                .then(res => {
                                    chrome.browserAction.setIcon({
                                        path: './img/logoed.png'
                                    })
                                    websiteCheckedOption = res.data
                                    websiteCheckedOption.state = true
                                    hasChecked[url] = websiteCheckedOption
                                })
                                .catch(err => {
                                    websiteCheckedOption = {state: true}
                                    hasChecked[url] = websiteCheckedOption
                                })
                            }  
                        } else {
                            chrome.browserAction.setIcon({
                                path: './img/logo.png'
                            })
                        }
                    } else {
                        chrome.browserAction.setIcon({
                            path: './img/logo.png'
                        })
                    }
                } else {
                    chrome.browserAction.setIcon({
                        path: './img/logo.png'
                    })
                }
            })
        } else {
            chrome.browserAction.setIcon({
                path: './img/logo.png'
            })
        }
    })
    activeTabId = activeInfo.tabId
    if (!updatedTabId) updatedTabId = activeInfo.tabId
})

function getUntaggedItem (id, offset) {
    return new Promise((resolve, reject) => {
        chrome.cookies.get(details, (cookies) => {
            if (cookies) {
                alpha_info = JSON.parse(cookies.value)
                if (checkToken()) {
                    axios.get(API + 'user/' + alpha_info.uid + '/untagged/item?count=50&category=all&order=create&sort=desc&token=' + alpha_info.token + '&offset=' + offset)
                    .then(res => {
                        resolve(res)
                    })
                    .catch(err => {
                        reject(err)
                    })
                }
            } else {
                reject(err)
            }
        })
    })
}

function getTaggedItem (name, offset) {
    return new Promise((resolve, reject) => {
        chrome.cookies.get(details, (cookies) => {
            if (cookies) {
                alpha_info = JSON.parse(cookies.value)
                if (checkToken()) {
                    axios.get(API + 'user/' + alpha_info.uid + '/tag/' + name + '/item?count=50&category=all&order=create&sort=desc&token=' + alpha_info.token + '&offset=' + offset)
                    .then(res => {
                        resolve(res)
                    })
                    .catch(err => {
                        reject(err)
                    })
                }
            } else {
                reject(err)
            }
        })
    })
}

function getTagList () {
    return new Promise((resolve, reject) => {
        chrome.cookies.get(details, (cookies) => {
            if (cookies) {
                alpha_info = JSON.parse(cookies.value)
                if (checkToken()) {
                    axios.get(API + 'user/' + alpha_info.uid + '/tag?token=' + alpha_info.token)
                    .then(res => {
                        resolve(res)
                    })
                    .catch(err => {
                        reject(err)
                    })
                }
            } else {
                reject(err)
            }
        })
    })
}

function getcollect () {
    return new Promise((resolve, reject) => {
        let order = 'default'
        let sort = 'desc'
        chrome.cookies.get({url: homeUrl, name: 'alpha_collect_order'}, (cookies) => {
            if (cookies) {
                let alpha_collect_order = JSON.parse(cookies.value)
                order = alpha_collect_order.name
                sort = alpha_collect_order.direction
            }
            chrome.cookies.get(details, (cookies) => {
                if (cookies) {
                    alpha_info = JSON.parse(cookies.value)
                    if (checkToken()) {
                        axios.get(API + 'user/' + alpha_info.uid + '/collection?token=' + alpha_info.token + '&order=' + order + '&sort=' + sort)
                        .then(res => {
                            resolve(res)
                        })
                        .catch(err => {
                            if (err.response.state === 401) {
                                reject('not login')
                            } else {
                                reject(err)
                            }
                        })
                    } else {
                        reject('not login')
                    }
                } else {
                    reject('not login')
                }
            })
        })
    })
    
}

function getItem (id, offset) {
    return new Promise((resolve, reject) => {
        let order = 'create'
        let sort = 'desc'
        chrome.cookies.get({url: homeUrl, name: 'alpha_item_order'}, (cookies) => {
            if (cookies) {
                let alpha_item_order = JSON.parse(cookies.value)
                order = alpha_item_order.name
                sort = alpha_item_order.direction
            }
            if (order === 'default') {
                order = 'create'
            }
            chrome.cookies.get(details, (cookies) => {
                if (cookies) {
                    alpha_info = JSON.parse(cookies.value)
                    if (checkToken()) {
                        axios.get(API + 'user/' + alpha_info.uid + '/collection/' + id + '/item?token=' + alpha_info.token + '&offset=' + offset + '&count=50&category=all&order=' + order + '&sort=' + sort)
                        .then(res => {
                            resolve(res)
                        })
                        .catch(err => {
                            reject(err)
                        })
                    }
                } else {
                    reject(err)
                }
            })
        })
    })
}
 
function search (msg) {
    chrome.cookies.get(details, (cookies) => {
        if (cookies) {
            alpha_info = JSON.parse(cookies.value)
            if (checkToken() && msg.value && linkSeach) {
                axios.get(API + 'user/' + alpha_info.uid + '/search/store?count=6&keyword=' + msg.value, {headers: {'Authorization': 'Bearer ' + alpha_info.token}})
                .then(res => {
                    port.postMessage({
                        type: 'search',
                        data: res.data,
                        key: msg.key,
                        value: msg.value
                    })
                })
            }
        }
    })
}

function checkToken () {
    let token = alpha_info.token
    if (token) {
        let exp = JSON.parse(window.atob(token.split('.')[1])).exp
        let timestamp=new Date().getTime()
        if (exp * 1000 < timestamp) {
            return false
        } else {
            return true
        }
    } else {
        return false
    }
}

// 获取快捷键
function getShortcut(sync) {
    chrome.cookies.get(details, (cookies) => {
        if (cookies) {
            alpha_info = JSON.parse(cookies.value)
            if (sync) {
                chrome.tabs.sendMessage(activeTabId, {type: "checkIframe"}, (res) => {
                    if (!res) {
                        chrome.tabs.executeScript(activeTabId, {file: "js/iframe.js"}, () => {
                            setTimeout(() => {
                                port.postMessage({
                                    type: 'tips',
                                    data: '正在同步中...'
                                })
                            }, 100)
                        })
                    } else {
                        port.postMessage({
                            type: 'tips',
                            data: '正在同步中...'
                        })
                    }
                })
            }
            axios.get(API + 'user/' + alpha_info.uid + '/shortcut', {headers: {'Authorization': 'Bearer ' + alpha_info.token}})
            .then(res => {
                shortcut = {}
                res.data.data.forEach(item => {
                    if (shortcut[item.shortcut_key]) {
                        shortcut[item.shortcut_key].push(item)
                    } else {
                        shortcut[item.shortcut_key] = [item]
                    }
                })
                window.shortcut = shortcut
                chrome.storage.sync.set({'shortcut': JSON.stringify(shortcut)})
                if (activeTabId != undefined) {
                    chrome.tabs.sendMessage(activeTabId, {
                        type: "getShortcut",
                        data: shortcut
                    })
                }
                if (sync) {
                    setTimeout(() => {
                        port.postMessage({
                            type: 'tips',
                            data: '同步已完成'
                        })
                    }, 600)
                    
                }
            })
            .catch(err => {
                if (sync) {
                    setTimeout(() => {
                        port.postMessage({
                            type: 'tips',
                            data: '同步已完成'
                        })
                    }, 600)
                }
                window.shortcut = null
                chrome.storage.sync.get('shortcut', (result) => {
                    if (result.shortcut) {
                        window.shortcut = JSON.parse(result.shortcut)
                    }
                    if (activeTabId != undefined) {
                        chrome.tabs.sendMessage(activeTabId, {
                            type: "getShortcut",
                            data: null
                        })
                    }
                })
            })
        } else {
            if (sync) {
                setTimeout(() => {
                    port.postMessage({
                        type: 'saveFail',
                        data: '同步快捷键失败，账号未登录'
                    })
                }, 600)
            }
            window.shortcut = null
            if (activeTabId != undefined) {
                chrome.tabs.sendMessage(activeTabId, {
                    type: "getShortcut",
                    data: null
                })
            }
        }
    })
}

// 增加浏览量
function addView(id) {
    chrome.cookies.get(details, (cookies) => {
        if (cookies) {
            alpha_info = JSON.parse(cookies.value)
            axios.post(API + 'user/' + alpha_info.uid + '/store/' + id + '/view', {}, {headers: {'Authorization': 'Bearer ' + alpha_info.token}})
            .then(res => {})
            .catch(err => {})
        }
    })
}

function addWebsite(tab, url, type) {
    var data = {url}
    if (type === 'website') {
        tabObj = {title: '网站标题', content: tab.title}
        if (tab.title) {
            data.title = tab.title
        }
        // 如果已收藏需传递所在收藏集 id
        if (websiteCheckedOption && websiteCheckedOption.collection_id) {
            data.collectionId = websiteCheckedOption.collection_id
        }
    } else if (type === 'link') {
        tabObj = {title: '网站标题', content: url}
    }
    
    axios.post(API + 'user/' + alpha_info.uid + '/website', data, {headers: {'Authorization': 'Bearer ' + alpha_info.token}})
    .then(res => {
        websiteInfo = res.data
        tabObj['des'] = res.data.note || res.data.description
        tabObj['tags'] = res.data.tags
        tabObj['content'] = res.data.brief || res.data.title
        websiteCheckedOption = res.data
        websiteCheckedOption.state = true
        hasChecked[url] = websiteCheckedOption
        chrome.browserAction.setIcon({
            path: './img/logoed.png'
        })
        port.postMessage({
            type: 'saved',
            data: websiteCheckedOption
        })
    })
    .catch(err => {
        if (err.response.status == 401) {
            port.postMessage({
                type: 'saveFail',
                data: '登录过期，请重新登录'
            })
            chrome.tabs.create({
                url: homeUrl + '/login'
            })
        } else if (err.response.status == 422) {
            let data = err.response.data
            if (data && data.errors) {
                if (data.errors.url && data.errors.url[0].match(/greater than/)) {
                    port.postMessage({
                        type: 'saveFail',
                        data: '收藏失败，网站地址过长'
                    })
                }
            }
        } else if (err.response.status == 403 && err.response.data.error == 'Subscription required.') {
            if (err.response.data.feature == 'Number of items.') {
                port.postMessage({
                    type: 'vipLimit',
                    data: '您的收藏个数已达上限，需要升级成为专业版'
                })
            }
        } else {
            port.postMessage({
                type: 'saveFail',
                data: '收藏失败，请重试, 错误码: ' + err.response.status
            })
        }
    })
}

function addText(tab, url, type) {
    tabObj = {
        title: '文字内容',
        content: url.selectionText
    }
    axios.post(API + 'user/' + alpha_info.uid + '/text', {content: url.selectionText, url: tab.url}, {headers: {'Authorization': 'Bearer ' + alpha_info.token}})
    .then(res => {
        websiteInfo = res.data
        tabObj['des'] = res.data.note || res.data.description
        tabObj['tags'] = res.data.tags
        port.postMessage({
            type: 'saved'
        })
    })
    .catch(err => {
        if (err.response.status == 401) {
            port.postMessage({
                type: 'saveFail',
                data: '登录过期，请重新登录'
            })
            chrome.tabs.create({
                url: homeUrl + '/login'
            })
        } else if (err.response.status == 422) {
            let data = err.response.data
            if (data && data.errors) {
                if (data.errors.url && data.errors.url[0].match(/greater than/)) {
                    port.postMessage({
                        type: 'saveFail',
                        data: '收藏失败，文本来源网站地址过长'
                    })
                } else if (data.errors.content && data.errors.content[0].match(/greater than/)) {
                    port.postMessage({
                        type: 'saveFail',
                        data: '收藏失败，文本内容过长，建议收藏网站'
                    })
                } else {
                    port.postMessage({
                        type: 'saveFail',
                        data: '收藏失败，请重试, 错误码: ' + err.response.status
                    })
                }
            }
        } else if (err.response.status == 403 && err.response.data.error == 'Subscription required.') {
            if (err.response.data.feature == 'Number of items.') {
                port.postMessage({
                    type: 'vipLimit',
                    data: '您的收藏个数已达上限，需要升级成为专业版'
                })
            }
        } else {
            port.postMessage({
                type: 'saveFail',
                data: '收藏失败，请重试, 错误码: ' + err.response.status
            })
        }
    })
}

function addIamge(tab, url, type) {
    tabObj = {
        title: '图片',
        content: url
    }
    axios.post(API + 'user/' + alpha_info.uid + '/image', {imageUrl: url, url: tab.url}, {headers: {'Authorization': 'Bearer ' + alpha_info.token}})
    .then(res => {
        websiteInfo = res.data
        tabObj['des'] = res.data.note || res.data.description
        tabObj['tags'] = res.data.tags
        port.postMessage({
            type: 'saved'
        })
    })
    .catch(err => {
        if (err.response.status == 401) {
            port.postMessage({
                type: 'saveFail',
                data: '登录过期，请重新登录'
            })
            chrome.tabs.create({
                url: homeUrl + '/login'
            })
        } else if (err.response.status == 422) {
            let data = err.response.data
            if (data && data.errors) {
                if (data.errors.url && data.errors.url[0].match(/greater than/)) {
                    port.postMessage({
                        type: 'saveFail',
                        data: '收藏失败，图片来源网站地址过长'
                    })
                } else if (data.errors.imageUrl && data.errors.imageUrl[0].match(/greater than/)) {
                    port.postMessage({
                        type: 'saveFail',
                        data: '收藏失败，图片地址过长，建议收藏网站'
                    })
                } else if (data.errors.imageUrl && data.errors.imageUrl[0] === 'The image url format is invalid.') {
                    port.postMessage({
                        type: 'saveFail',
                        data: '收藏失败，图片地址不合法'
                    })
                } else {
                    port.postMessage({
                        type: 'saveFail',
                        data: '收藏失败，请重试, 错误码: ' + err.response.status
                    })
                }
            }
        } else if (err.response.status == 403 && err.response.data.error == 'Subscription required.') {
            if (err.response.data.feature == 'Number of items.') {
                port.postMessage({
                    type: 'vipLimit',
                    data: '您的收藏个数已达上限，需要升级成为专业版'
                })
            }
        } else {
            port.postMessage({
                type: 'saveFail',
                data: '收藏失败，请重试, 错误码: ' + err.response.status
            })
        }
    })
}

function addUrl(tab, url, type) {
    chrome.cookies.get(details, (cookies) => {
        if (!cookies) {
            // 未登录状态跳转到注册页面
            chrome.tabs.create({
                url: homeUrl + '/signup'
            })
        } else {
            alpha_info = JSON.parse(cookies.value)
            // 检测是否解析出 alpha_info
            if (alpha_info) {
                // 判断是否存在 uid
                if (alpha_info.uid) {
                    var token = alpha_info.token
                    // 判断是否存在 token
                    if (token) {
                        var exp = JSON.parse(window.atob(token.split('.')[1])).exp
                        var timestamp = new Date().getTime()
                        // 判断 token 是否过期
                        if (exp * 1000 < timestamp) {
                            chrome.tabs.create({
                                url: homeUrl + '/login'
                            })
                            return
                        }
                    } else {
                        chrome.tabs.create({
                            url: homeUrl + '/login'
                        })
                        return
                    }
                } else {
                    chrome.tabs.create({
                        url: homeUrl + '/login'
                    })
                    return
                }
            } else {
                chrome.tabs.create({
                    url: homeUrl + '/login'
                })
                return
            }
            chrome.tabs.sendMessage(activeTabId, {type: "checkIframe"}, (res) => {
                if (!res) {
                    chrome.tabs.executeScript(activeTabId, {file: "js/iframe.js"}, () => {
                        let portTimer = setInterval(() => {
                            if (port) {
                                clearInterval(portTimer)
                                port.postMessage({
                                    type: 'saving'
                                })
                                if (type === 'website') {
                                    if (websiteCheckedOption && websiteCheckedOption.state === true) {
                                        addWebsite(tab, url, type)
                                    } else {
                                        let checkTimer = setInterval(() => {
                                            if (websiteCheckedOption && websiteCheckedOption.state === true) {
                                                addWebsite(tab, url, type)
                                                clearInterval(checkTimer)
                                            }
                                        }, 100)
                                    }
                                    
                                } else if (type === 'link') {
                                    addWebsite(tab, url, type)
                                } else if (type === 'text') {
                                    addText(tab, url, type)
                                } else if (type === 'img') {
                                    addIamge(tab, url, type)
                                }
                            }
                            
                        }, 100)
                    })
                } else {
                    port.postMessage({
                        type: 'saving'
                    })
                    if (type === 'website') {
                        if (websiteCheckedOption && websiteCheckedOption.state === true) {
                            addWebsite(tab, url, type)
                        } else {
                            let checkTimer = setInterval(() => {
                                if (websiteCheckedOption && websiteCheckedOption.state === true) {
                                    addWebsite(tab, url, type)
                                    clearInterval(checkTimer)
                                }
                            }, 100)
                        }
                    } else if (type === 'link') {
                        addWebsite(tab, url, type)
                    } else if (type === 'text') {
                        addText(tab, url, type)
                    } else if (type === 'img') {
                        addIamge(tab, url, type)
                    }
                }
            })
        }
    })
}
