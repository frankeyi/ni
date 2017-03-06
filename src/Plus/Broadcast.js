//跨webView广播通知
//不再失去Ta的消息

const _webviews = new WeakMap()
const _indexID = new WeakMap()
const _names = new WeakMap()
const _events = new WeakMap()

class BroadCast{
    constructor(){
        //构建时 认为是新增了webview
        this.newState = true
        _events.set(this, {})
    }

    //发送事件 带参数 默认跳过自己 通知全部 不特定
    send(name, data = {}, { self = false, ids = [] } = {}){
        if(!window.plus){return}
        let views = this._getViews()
        if(ids.length > 0){
            views = []
            for(let id of ids){
                let view = plus.webview.getWebviewById(id)
                view && views.push(view)
            }
        }
        for(let v of views){
            //是否跳过自己
            if(v.id == this._getIndexID() && !self){
                continue
            }
            v.evalJS(`document.dispatchEvent(new CustomEvent('${name}', {
                detail:JSON.parse('${JSON.stringify(data)}'),
                bubbles: true,
                cancelable: true
            }));`)
        }
    }

    //删除监听事件，全部
    remove(name){
        let nameEvents = _events.get(this)[name]
        if(!nameEvents || !nameEvents.length){
            return false
        }
        for(let en of nameEvents){
            document.removeEventListener(name, en)
        }
        return true
    }

    //定义监听事件
    listen(name, fun){
        let events = _events.get(this),
            tfun = function(e){
                return fun && fun.call(fun, e.detail)
            }
        if(!events[name]){
            events[name] = []
        }
        events[name].push(tfun)
        document.addEventListener(name, tfun)
        return this
    }

    _getViews(){
        //如果webviews为空 或者 新增过了 webview 则重新获取
        if(!_webviews.get(this) || this.newState){
            _webviews.set(this, plus.webview.all())
        }
        return _webviews.get(this)
    }
    _getIndexID(){
        if(!_indexID.get(this)){
            _indexID.set(this, plus.webview.currentWebview().id)
        }   
        return _indexID.get(this)
    }


    get newState(){
        return !!+window.localStorage.getItem('_newsning_broadcast_hasnew_')
    }

    set newState(has = true){
        return window.localStorage.getItem('_newsning_broadcast_hasnew_', +has)
    }

}

export default BroadCast