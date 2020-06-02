var port = chrome.runtime.connect({
    name: "Pinbox"
})
port.postMessage({
    type: "fresh"
})
port.postMessage({
    type: "getLinkSearch"
})

var div = document.createElement('div')
div.setAttribute('id', 'pinbox-extension-installed')
document.body.appendChild(div)

var shortcut = null
var iframeDom = document.querySelector('#pinbox-iframe')
var imageHoverBtn = false
// 修改搜索引擎结果页面
var baiduBtn = document.querySelector('#su')
var soBtn = document.querySelector('#su')
var href = window.location.href

window.addEventListener('mousedown', function() {
    iframeDom = document.querySelector('#pinbox-iframe')
    if (iframeDom) {
        document.body.removeChild(iframeDom)
    }
})

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === 'getShortcut') {
        shortcut = request.data
    } else if (request.type === 'iframeHeight') {
        // 动态改变iframe尺寸
        iframeDom = document.querySelector('#pinbox-iframe')
        iframeDom.style.height = (request.iframeHeight + 40) + 'px'
        if (request.iframeWidth) {
            iframeDom.style.width = (request.iframeWidth) + 'px'
        }
    } else if (request.type === 'unloadIframe') {
        iframeDom = document.querySelector('#pinbox-iframe')
        if (iframeDom) {
            document.body.removeChild(iframeDom)
        }
    } else if (request.type === 'checkIframe') {
        iframeDom = document.querySelector('#pinbox-iframe')
        if (iframeDom) {
            sendResponse(true)
        } else {
            sendResponse(false)
        }
    }
})
port.onMessage.addListener(function(msg) {
    if (msg.type === 'getShortcut') {
        shortcut = msg.data
    } else if (msg.type === 'search') {
        insertSearchContent(msg)
    } else if (msg.type === 'getLinkSearchRes') {
        imageHoverBtn = msg.imageHoverBtn
        if (imageHoverBtn) {
            if (!document.querySelector('#pinbox_image_hover_btn')) {
                insertimageHoverBtn()
            }
        } else {
            let imageHoverBtnDom = document.querySelector('#pinbox_image_hover_btn')
            if (imageHoverBtnDom) {
                document.body.removeChild(imageHoverBtnDom)
            }
        }
    }
})
// 快捷键
var activeItem = 0
var openUrl

window.addEventListener("message", function(event) {
    if (event.source != window) {
        return
    }
    if (event.data.type === 'pinbox') {
        if (event.data.action === 'login') {
            port.postMessage({
                type: "pinboxLogin"
            })
        } else if (event.data.action === 'logout') {
            port.postMessage({
                type: "pinboxLogout"
            })
        } else if (event.data.action === 'updateShortcutKey') {
            port.postMessage({
                type: "updateShortcutKey"
            })
        } else if (event.data.action === 'collectOrderChanged') {
            port.postMessage({
                type: "collectOrderChanged"
            })
        } else if (event.data.action === 'itemOrderChanged') {
            port.postMessage({
                type: "itemOrderChanged"
            })
        }
            
    }
}, false)

document.addEventListener('keyup', function(e) {
    let keyCode = e.keyCode || e.which
    if (keyCode == 18) {
        var shortcutBoxDom = document.getElementById('Pinbox_shortcutBox')
        if (shortcutBoxDom) {
            document.body.removeChild(shortcutBoxDom)
            setTimeout(() => {
                activeItem = 0
                port.postMessage({
                    type: "creatTab",
                    item: openUrl
                })
            }, 100)
        }
    }
})

document.addEventListener('keydown', function(e) {
    let keyCode = e.keyCode || e.which
    if (e.altKey) {
        if (shortcut == null && keyCode != 18) {
            if (!shortcut) {
                // port.postMessage({
                //     type: "creatTab",
                //     item: {
                //         url: 'https://withpinbox.com/login'
                //     }
                // })
                return
            }
        }
        if (shortcut && shortcut[keyCodeMap[keyCode]] && shortcut[keyCodeMap[keyCode]].length > 1) {
            var shortcutBox = document.createElement('div')
            shortcutBox.setAttribute('id', 'Pinbox_shortcutBox')
            shortcutBox.setAttribute('class', 'pinbox-shortcut-box')
            shortcutBox.onclick = () => {
                document.body.removeChild(shortcutBox)
            }

            var shortcutContent = document.createElement('div')
            shortcutContent.setAttribute('id', 'Pinbox_shortcutContent')
            shortcutContent.setAttribute('class', 'pinbox-shortcut-content')
            shortcutContent.onclick = (e) => {
                e.stopPropagation()
            }
            shortcut[keyCodeMap[keyCode]].forEach(item => {
                var itemDom = document.createElement('div')
                itemDom.setAttribute('class', 'pinbox-shortcut-item')
                itemDom.onclick = function() {
                    document.body.removeChild(shortcutBox)
                    activeItem = 0
                    setTimeout(() => {
                        port.postMessage({
                            type: "creatTab",
                            item: item
                        })
                    }, 100)

                }
                var itemDomTitle = document.createElement('div')
                var itemDomDes = document.createElement('div')

                itemDomTitle.setAttribute('class', 'pinbox-shortcut-item-title')
                itemDomTitle.innerHTML = item.brief || item.title
                
                if (item.thumbnail || item.cover) {
                    itemDomDes.setAttribute('class', 'pinbox-shortcut-item-des')
                    itemDomDes.style.backgroundImage = `url(${item.cover || item.thumbnail})`
                } else {
                    var title = item.brief || item.title
                    itemDomDes.setAttribute('class', 'pinbox-shortcut-item-des-default')
                    itemDomDes.innerHTML = title.trim().substring(0, 1)
                }

                var des = item.note || item.description
                if (des) {
                    var itemDomNote = document.createElement('div')
                    itemDomNote.setAttribute('class', 'pinbox-shortcut-item-note')
                    itemDomNote.innerHTML = des
                    itemDomDes.appendChild(itemDomNote)
                }

                var itemDomBottom = document.createElement('div')
                var itemDomIcon = document.createElement('div')
                var itemDomUrl = document.createElement('div')
                itemDomBottom.setAttribute('class', 'pinbox-shortcut-item-bottom')
                itemDomIcon.setAttribute('class', 'pinbox-shortcut-item-icon')
                var url = item.link || item.url
                if (url && url.match(/.+:\/\/([^\/^\?^#]+)/)) {
                    item.favicon = url.match(/.+:\/\/([^\/^\?^#]+)/)[0] + '/favicon.ico'
                }
                if (item.favicon) {
                    itemDomIcon.style.backgroundImage = `url(${item.favicon})`
                }
                itemDomUrl.setAttribute('class', 'pinbox-shortcut-item-url')
                if (url.match(/.+:\/\/([^\/^\?^#]+)/)) {
                    url = url.match(/.+:\/\/([^\/^\?^#]+)/)[1]
                }
                itemDomUrl.innerHTML = url
                itemDomBottom.appendChild(itemDomIcon)
                itemDomBottom.appendChild(itemDomUrl)

                itemDom.appendChild(itemDomTitle)
                itemDom.appendChild(itemDomDes)
                itemDom.appendChild(itemDomBottom)
                shortcutContent.appendChild(itemDom)
            })

            var shortcutBoxDom = document.getElementById('Pinbox_shortcutBox')
            if (!shortcutBoxDom) {
                shortcutBox.appendChild(shortcutContent)
                document.body.appendChild(shortcutBox)
                var itemList = document.getElementById('Pinbox_shortcutContent')
                itemList.firstChild.classList.add('pinbox-shortcut-item-active')
                openUrl = shortcut[keyCodeMap[keyCode]][0]

            } else {
                if (activeItem < shortcut[keyCodeMap[keyCode]].length - 1) {
                    activeItem++
                } else {
                    activeItem = 0
                }
                openUrl = shortcut[keyCodeMap[keyCode]][activeItem]
            }
            var pinbox_shortcutContent = document.getElementById('Pinbox_shortcutContent')
            var itemList = Array.from(pinbox_shortcutContent.children)
            itemList.forEach((item, index) => {
                if (index == activeItem) {
                    item.classList.add('pinbox-shortcut-item-active')
                    // 卡片处在视野中
                    if (item.offsetTop + item.offsetHeight- pinbox_shortcutContent.clientHeight > 0) {
                        pinbox_shortcutContent.scrollTop = item.offsetTop + item.offsetHeight - pinbox_shortcutContent.clientHeight
                    } else {
                        pinbox_shortcutContent.scrollTop = 0
                    }
                } else {
                    item.classList.remove('pinbox-shortcut-item-active')
                }
            })

        } else if (shortcut && shortcut[keyCodeMap[keyCode]] && shortcut[keyCodeMap[keyCode]].length == 1) {
            port.postMessage({
                type: "creatTab",
                item: shortcut[keyCodeMap[keyCode]][0]
            })
        }
    }
})

window.addEventListener('load', function() {
    baiduBtn = document.querySelector('#su')
    soBtn = document.querySelector('#su')
    searchForPinbox()
})

function searchForPinbox () {
    if (href.match(/google\.com(\.\w*)?\/search\?/)) {
        let params = new URLSearchParams(window.location.search)
        let value = params.get('q')
        port.postMessage({
            type: "search",
            key: 'google',
            value: value
        })
    } else if (href.match(/\.baidu\.com/)) {
        let params = new URLSearchParams(window.location.search)
        let value = params.get('wd')
        port.postMessage({
            type: "search",
            key: 'baidu',
            value: value
        })
        var titleEl = document.getElementsByTagName("title")[0]
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver
        var MutationObserverConfig={
            childList: true,
            subtree: true,
            characterData: true
        }
        var observer = new MutationObserver(function(mutations){
            let params = new URLSearchParams(window.location.search)
            let value = params.get('wd')
            port.postMessage({
                type: "search",
                key: 'baidu',
                value: value
            })
            
        })
        observer.observe(titleEl,MutationObserverConfig)
    } else if (href.match(/\.so\.com\/s\?/)) {
        let params = new URLSearchParams(window.location.search)
        let value = params.get('q')
        port.postMessage({
            type: "search",
            key: '360',
            value: value
        })
        if (soBtn) {
            soBtn.addEventListener('click', () => {
                setTimeout(() => {
                    let params = new URLSearchParams(window.location.search)
                    let value = params.get('q')
                    port.postMessage({
                        type: "search",
                        key: '360',
                        value: value
                    })
                }, 1000)
            })
        }
    } else if (href.match(/\.sogou\.com\/web\?/)) {
        let params = new URLSearchParams(window.location.search)
        let value = params.get('query')
        port.postMessage({
            type: "search",
            key: 'sogou',
            value: value
        })
    } else if (href.match(/\.dogedoge\.com\/results\?/)) {
        let params = new URLSearchParams(window.location.search)
        let value = params.get('q')
        port.postMessage({
            type: "search",
            key: 'dogedoge',
            value: value
        })
    } else if (href.match(/cn\.bing\.com\/search\?/)) {
        let params = new URLSearchParams(window.location.search)
        let value = params.get('q')
        
        port.postMessage({
            type: "search",
            key: 'bing_cn',
            value: value
        })
    }
}

function insertSearchContent (msg) {
    var rhs = document.querySelector('#rhs')
    var pinboxRecommend = document.createElement('div')
    var hasItem = false
    if (msg.key === 'google') {
        pinboxRecommend.setAttribute('class', 'pinbox-recommend pinbox-recommend-google')
    } else if (msg.key === 'baidu') {
        rhs = document.querySelector('#content_right')
        pinboxRecommend.setAttribute('class', 'pinbox-recommend-baidu')
    } else if (msg.key === '360') {
        rhs = document.querySelector('#side')
        pinboxRecommend.setAttribute('class', 'pinbox-recommend')
    } else if (msg.key === 'sogou') {
        rhs = document.querySelector('#right')
        pinboxRecommend.setAttribute('class', 'pinbox-recommend-sogou')
    } else if (msg.key === 'dogedoge') {
        rhs = document.querySelector('#links_wrapper')
        pinboxRecommend.setAttribute('class', 'pinbox-recommend-dogedoge')
    } else if (msg.key === 'bing_cn') {
        rhs = document.querySelector('#b_context')
        pinboxRecommend.setAttribute('class', 'pinbox-recommend')
    }
    
    var pinboxClose = document.createElement('div')
    pinboxClose.setAttribute('class', 'pinbox-recommend-close')
    pinboxClose.onclick = (e) => {
        e.stopPropagation()
        port.postMessage({
            type: "setLinkSeach",
            linkSeach: false
        })
        rhs.removeChild(pinboxRecommend)
    }
    var pinboxLogo = document.createElement('div')
    pinboxLogo.setAttribute('class', 'pinbox-logo')
    pinboxLogo.onclick = () => {
        port.postMessage({
            type: "creatTab",
            item: {type: 'toItems', path: '/items'}
        })
    }
    pinboxRecommend.appendChild(pinboxLogo)
    pinboxRecommend.appendChild(pinboxClose)
    for (var i = 0; i < msg.data.items.length; i++) {
        let item = msg.data.items[i]
        if (item.item_type == 'website') {
            hasItem = true
            let pinboxRecommendItem = document.createElement('a')
            let pinboxRecommendItemTitle = document.createElement('div')
            let pinboxRecommendItemTagBox = document.createElement('div')
            let pinboxRecommendItemUrl = document.createElement('div')
            pinboxRecommendItem.setAttribute('class', 'pinbox-recommend-item')
            pinboxRecommendItemTitle.setAttribute('class', 'pinbox-recommend-item-title')
            pinboxRecommendItemTagBox.setAttribute('class', 'pinbox-recommend-item-tagbox')
            pinboxRecommendItemUrl.setAttribute('class', 'pinbox-recommend-item-url')
            pinboxRecommendItemTitle.innerHTML = item.title
            pinboxRecommendItem.href = item.link || item.url
            pinboxRecommendItem.target = '_blank'
            
            var url = item.link || item.url
            if (url.match(/.+:\/\/([^\/^\?^#]+)/)) {
                url = url.match(/.+:\/\/([^\/^\?^#]+)/)[1]
            }
            for (let j = 0; j < item.tags.length; j++) {
                let pinboxRecommendItemTagItem = document.createElement('div')
                pinboxRecommendItemTagItem.setAttribute('class', 'pinbox-recommend-item-tag-item')
                pinboxRecommendItemTagItem.innerHTML = '# ' + item.tags[j]
                pinboxRecommendItemTagItem.onclick = (e) => {
                    e.preventDefault()
                    port.postMessage({
                        type: "creatTab",
                        item: {type: 'toItems', path: '/tag/' + item.tags[j] + '?category=all'}
                    })
                }
                pinboxRecommendItemTagBox.appendChild(pinboxRecommendItemTagItem)
            }
            pinboxRecommendItemUrl.innerHTML = url
            pinboxRecommendItem.appendChild(pinboxRecommendItemTitle)
            pinboxRecommendItem.appendChild(pinboxRecommendItemTagBox)
            pinboxRecommendItem.appendChild(pinboxRecommendItemUrl)
            pinboxRecommend.appendChild(pinboxRecommendItem)
        }else if (item.item_type == 'text') {
            hasItem = true
            let pinboxRecommendItem = document.createElement('div')
            let pinboxRecommendItemText = document.createElement('div')
            let pinboxRecommendItemTagBox = document.createElement('div')
            let pinboxRecommendItemUrl = document.createElement('div')
            pinboxRecommendItem.setAttribute('class', 'pinbox-recommend-item')
            pinboxRecommendItemText.setAttribute('class', 'pinbox-recommend-item-text')
            pinboxRecommendItemTagBox.setAttribute('class', 'pinbox-recommend-item-tagbox')
            pinboxRecommendItemUrl.setAttribute('class', 'pinbox-recommend-item-url')
            pinboxRecommendItemText.innerHTML = `<div class="pinbox-recommend-item-text-content">${item.content}</div>`
            pinboxRecommendItemText.onclick = () => {
                viewText(item)
            }
            pinboxRecommendItemUrl.onclick = () => {
                openlink(item.link || item.url)
            }
            var url = item.link || item.url
            if (url.match(/.+:\/\/([^\/^\?^#]+)/)) {
                url = url.match(/.+:\/\/([^\/^\?^#]+)/)[1]
            }
            for (let j = 0; j < item.tags.length; j++) {
                let pinboxRecommendItemTagItem = document.createElement('div')
                pinboxRecommendItemTagItem.setAttribute('class', 'pinbox-recommend-item-tag-item')
                pinboxRecommendItemTagItem.innerHTML = '# ' + item.tags[j]
                pinboxRecommendItemTagItem.onclick = () => {
                    port.postMessage({
                        type: "creatTab",
                        item: {type: 'toItems', path: '/tag/' + item.tags[j] + '?category=all'}
                    })
                }
                pinboxRecommendItemTagBox.appendChild(pinboxRecommendItemTagItem)
            }
            pinboxRecommendItemUrl.innerHTML = url || '无来源'
            if (!url) {
                pinboxRecommendItemUrl.style.cursor = 'default'
            }
            pinboxRecommendItem.appendChild(pinboxRecommendItemText)
            pinboxRecommendItem.appendChild(pinboxRecommendItemTagBox)
            pinboxRecommendItem.appendChild(pinboxRecommendItemUrl)
            pinboxRecommend.appendChild(pinboxRecommendItem)
        } else if (item.item_type == 'image') {
            hasItem = true
            let pinboxRecommendItem = document.createElement('div')
            let pinboxRecommendItemImage = document.createElement('div')
            let pinboxRecommendItemTagBox = document.createElement('div')
            let pinboxRecommendItemUrl = document.createElement('div')
            pinboxRecommendItem.setAttribute('class', 'pinbox-recommend-item')
            pinboxRecommendItemImage.setAttribute('class', 'pinbox-recommend-item-text')
            pinboxRecommendItemTagBox.setAttribute('class', 'pinbox-recommend-item-tagbox')
            pinboxRecommendItemUrl.setAttribute('class', 'pinbox-recommend-item-url')
            pinboxRecommendItemImage.innerHTML = `<img class="pinbox-recommend-item-img-content" src="${item.image_url}" />`
            pinboxRecommendItemImage.onclick = () => {
                viewImage(item)
            }
            pinboxRecommendItemUrl.onclick = () => {
                openlink(item.link || item.url)
            }
            var url = item.link || item.url
            if (url.match(/.+:\/\/([^\/^\?^#]+)/)) {
                url = url.match(/.+:\/\/([^\/^\?^#]+)/)[1]
            }
            for (let j = 0; j < item.tags.length; j++) {
                let pinboxRecommendItemTagItem = document.createElement('div')
                pinboxRecommendItemTagItem.setAttribute('class', 'pinbox-recommend-item-tag-item')
                pinboxRecommendItemTagItem.innerHTML = '# ' + item.tags[j]
                pinboxRecommendItemTagItem.onclick = () => {
                    port.postMessage({
                        type: "creatTab",
                        item: {type: 'toItems', path: '/tag/' + item.tags[j] + '?category=all'}
                    })
                }
                pinboxRecommendItemTagBox.appendChild(pinboxRecommendItemTagItem)
            }
            pinboxRecommendItemUrl.innerHTML = url || '无来源'
            if (!url) {
                pinboxRecommendItemUrl.style.cursor = 'default'
            }
            pinboxRecommendItem.appendChild(pinboxRecommendItemImage)
            pinboxRecommendItem.appendChild(pinboxRecommendItemTagBox)
            pinboxRecommendItem.appendChild(pinboxRecommendItemUrl)
            pinboxRecommend.appendChild(pinboxRecommendItem)
        }
        
    }
    if (msg.data.items_count > 6) {
        let more = document.createElement('div')
        more.setAttribute('class', 'pinbox-recommend-more')
        more.innerText = "查看更多"
        more.onclick = () => {
            port.postMessage({
                type: "creatTab",
                item: {type: 'toSearch', path: '/search?q=' + msg.value}
            })
        }
        pinboxRecommend.appendChild(more)
    }
    if (!document.querySelector('.pinbox-recommend-baidu')) {
        if (hasItem) {
            rhs.insertBefore(pinboxRecommend, rhs.firstChild)
        }
    } else {
        rhs.removeChild(document.querySelector('.pinbox-recommend-baidu'))
        if (hasItem) {
            rhs.insertBefore(pinboxRecommend, rhs.firstChild)
        }
    }
}

function openlink (url) {
    if (url) {
        window.open(url)
    }
}

function viewText (item) {
    let textViewBox = document.createElement('div')
    let textViewContent = document.createElement('div')
    textViewBox.setAttribute('class', 'pinbox-text-view-box')
    textViewContent.setAttribute('class', 'pinbox-text-view-content')
    textViewContent.innerHTML = item.content
    textViewBox.onclick = () => {
        document.body.removeChild(textViewBox)
    }
    textViewContent.onclick = (e) => {
        e.stopPropagation()
    }
    textViewBox.appendChild(textViewContent)
    document.body.appendChild(textViewBox)
}

function viewImage(item) {
    let textViewBox = document.createElement('div')
    let imageViewContent = document.createElement('img')
    textViewBox.setAttribute('class', 'pinbox-text-view-box')
    imageViewContent.setAttribute('class', 'pinbox-image-view-content')
    imageViewContent.src = item.image_url
    textViewBox.onclick = () => {
        document.body.removeChild(textViewBox)
    }
    imageViewContent.onclick = (e) => {
        e.stopPropagation()
    }
    textViewBox.appendChild(imageViewContent)
    document.body.appendChild(textViewBox)
}

function insertimageHoverBtn () {
    let btn = document.createElement('div')
    btn.setAttribute('class', 'image-hover-btn')
    btn.setAttribute('id', 'pinbox_image_hover_btn')
    btn.innerText = '收藏'
    document.body.appendChild(btn)
    document.addEventListener('mouseover', (e) => {
        if (e.target.nodeName.toLocaleLowerCase() === 'img') {
            let image = e.target
            if (image.clientWidth > 199 || image.clientHeight > 199) {
                btn.style.top = e.pageY - e.offsetY + 8 + 'px'
                btn.style.left = e.pageX - e.offsetX + 8 + 'px'
                btn.style.display = 'block'
                btn.onclick = () => {
                    port.postMessage({
                        type: "addImage",
                        src: image.getAttribute('src')
                    })
                }
            }
        } else {
            let dom = e.target
            let currentStyle = function(element){return element.currentStyle || document.defaultView.getComputedStyle(element, null)}
            let bgUrl = currentStyle(dom).backgroundImage
            if (bgUrl) {
                bgUrl = bgUrl.match(/"(.+)"/) && bgUrl.match(/"(.+)"/)[1]
            }
            
            if (bgUrl) {
                if (dom.clientWidth > 199 && dom.clientHeight > 199) {
                    btn.style.top = e.pageY - e.offsetY + 4 + 'px'
                    btn.style.left = e.pageX - e.offsetX + 4 + 'px'
                    btn.style.display = 'block'
                    btn.onclick = () => {
                        port.postMessage({
                            type: "addImage",
                            src: bgUrl
                        })
                    }
                }
            }
            else if (e.target.id !== 'pinbox_image_hover_btn') {
                btn.style.display = 'none'
            }
        }
    })
}
