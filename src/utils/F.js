// 全局方法
import GLO from './GLO';
import eventBus from './eventBus';

/* 全局方法 */
const F = {
    /** 使用source更新target中的数据（Object类型），若键不存在则忽略 */
    updateObject(target, source){
        for (let key in source) {
            if (key in target) {
                if (typeof source[key]==='object' && source[key]!==null && !Array.isArray(source[key]))
                    F.updateObject(target[key], source[key]);
                else
                    target[key] = source[key];
            }
        }
    },
    /** 计算timeA到timeB之间的天数 */
    getDaysBetween(timeA,timeB){
        timeA=Date.parse(new Date(timeA*1000).toDateString())
        timeB=Date.parse(new Date(timeB*1000).toDateString())
        return (timeB-timeA)/(24*60*60*1000)
    },
    /**
     * 进行请求访问
     * @param {string} url - 请求链接
     * 
     * @param {Object} [arg] - 请求参数
     * @param {boolean} [arg.needAuth] - 是否发送Authorization验证请求头，默认为true
     * @param {boolean} [arg.toObj] - 是否将响应结果转换为Object，默认为true
     * @param {function(string,*)} [arg.onError] - 当遇到错误时执行该函数，传递错误文本和err
     * @param {number[]} [arg.expectCodes] - 验证状态码数组，为空时允许任何状态码
     * @param {string} [arg.errorText] - 遇到未知错误时的提示信息
     * 
     * @param {Object} opt - 请求体的具体参数，以及其他传递给fetch的参数
     * @param {string} [opt.method] - 请求方法，为空时自动判断，默认为 `GET`
     * @param {Object} [opt.json] - 使用此参数时，自动将json转换为字符串，并默认使用 `application/json` 的MIME
     * @param {Object} [opt.data] - 使用此参数时，直接将 `data` 作为请求体，并默认使用 `POST` 方法，用于传递二进制文件
     * @param {Object} [opt.headers] - 自定义请求头，覆盖自动添加的请求头
     */
    async myFetch(url,arg={},opt={}){
        //配置参数
        const{
            needAuth = true,
            toObj = true,
            onError = (text,e)=>{
                eventBus.emit("dialog",{text})
                console.error(e)
            },
            expectCodes = undefined,
            errorText = undefined
        } = arg
        
        //配置请求信息
        let option={}
        for(let key in opt){
            if(key==='json' || key==='data') continue
            option[key]=opt[key]
        }
        option.headers = option.headers||{}
        let headers=option.headers
        let defaultMethod='GET'

        if(!option.body){
            if(opt.json){
                option.body=JSON.stringify(opt.json)
                defaultMethod='POST'
                headers["Content-Type"]=headers["Content-Type"]||"application/json"
            }else if(opt.data){
                option.body=opt.data
                defaultMethod='POST'
            }
        }
        option.method=option.method||defaultMethod
        //获取响应
        try{
            let r=await fetch(url,option)
            //是否获取正确的状态码
            if(expectCodes && expectCodes.indexOf(r.status)<0){
                if(toObj){
                    r=await r.json()
                    onError(r.message||r.detail||errorText,r)
                }else{
                    let errText=`请求异常:${r.status}: ${r.statusText}`
                    onError(errorText||errText,r)
                }
                return null
            }
            if(toObj) r=await r.json()
            return r
        }catch(e){
            onError(errorText||("请求异常:"+e.message),e)
            return null
        }
    },
    /**
     * 使用默认 API 地址进行请求访问
     * @param {string} path - 相对于API路径的请求路径
     * 
     * @param {Object} [arg] - 请求参数
     * @param {boolean} [arg.needAuth] - 是否发送Authorization验证请求头，默认为true
     * @param {boolean} [arg.toObj] - 是否将响应结果转换为Object，默认为true
     * @param {function(string,*)} [arg.onError] - 当遇到错误时执行该函数，传递错误文本和err
     * @param {number[]} [arg.expectCodes] - 验证状态码数组，为空时允许任何状态码
     * @param {string} [arg.errorText] - 遇到未知错误时的提示信息
     * 
     * @param {Object} opt - 请求体的具体参数，以及其他传递给fetch的参数
     * @param {string} [opt.method] - 请求方法，为空时自动判断，默认为 `GET`
     * @param {Object} [opt.json] - 使用此参数时，自动将json转换为字符串，并默认使用 `application/json` 的MIME
     * @param {Object} [opt.data] - 使用此参数时，直接将 `data` 作为请求体，并默认使用 `POST` 方法，用于传递二进制文件
     * @param {Object} [opt.headers] - 自定义请求头，覆盖自动添加的请求头 
     */
    async myFetchApi(path,arg={},opt={}){
        return await F.myFetch(GLO.API_SERVER_URL+path,arg,opt)
    }
}

export default F
