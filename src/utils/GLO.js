// 全局属性
import { reactive,computed,watch } from 'vue';
import Settings from './Settings';
import F from './F';

const settings = Settings.settings
/** 记录登录信息,供所有部件引用 */
const loginStatus = reactive({
    /** 是否登录 */
    isLogged:false,
    /** 用户信息 */
    userinfo:{
        /** 用户id */
        id:-1,
        /** 用户名 */
        username:'',
        /** 用户token */
        access_token:'',
        /** 用户更新用token */
        refresh_token:'',
        /** 用户昵称 */
        name:'',
        /** 用户头像文件路径 */
        photo:'',
        /** 用户权限
         * `0` - 普通用户
         * `1` - 管理员
         */
        is_admin:0,
        /** 用户帖子 */
        posts:[{
            id: -1,
            title: "",
            content: "",
            like_count: 0,
            comment_count: 0,
            create_time: "",
            update_time: "",
        }]
    }
})

/** 屏幕尺寸信息 */
const screen=reactive({
    width:window.innerWidth,
    height:window.innerHeight,
    /** `hor` 为横屏，`ver` 为竖屏 */
    type:computed(()=>{
        if(screen.height/screen.width>1.20||screen.width<800)return 'ver'
        else return 'hor'
    })
})
window.addEventListener('resize',()=>{
    screen.width=window.innerWidth
    screen.height=window.innerHeight
})

/** 配置版本*/
const VERSION=3
/** 后端API地址常量 */
const API_SERVER_URL="http://127.0.0.1:8000"

//在localStorage中保存和读取配置
const localStorageKey="ship_fault_qa_localdata"
const toSave=reactive({
    settings,
    loginStatus,
    VERSION
})
function clearConfig(){
    localStorage.removeItem(localStorageKey)
}
function saveConfig(){
    localStorage.setItem(localStorageKey, JSON.stringify(toSave))
}
function loadConfig(){
    try{
        let cfg_obj=JSON.parse(localStorage.getItem(localStorageKey))
        if(cfg_obj.VERSION===undefined || cfg_obj.VERSION<VERSION){
            //清除无效旧配置信息
            clearConfig()
            return
        }
        F.updateObject(settings,cfg_obj.settings)
        F.updateObject(loginStatus,cfg_obj.loginStatus)
    }catch(e){
        console.log(e)
    }
}
loadConfig()

//自动保存更新的配置
watch(toSave,()=>{
  saveConfig()
  document.documentElement.setAttribute('theme',settings.theme)
})
document.documentElement.setAttribute('theme',settings.theme)
window.clearConfig=clearConfig

/** 全局属性 */
const GLO={
    /** 记录登录信息,供所有部件引用 */
    loginStatus,
    /** 屏幕尺寸信息 */
    screen,
    /** 后端API地址常量 */
    API_SERVER_URL,
    /** 整体配置版本 */
    VERSION
}

window.GLO = GLO

export default GLO
export { loginStatus,screen,API_SERVER_URL,VERSION };
