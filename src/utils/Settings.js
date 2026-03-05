// 全局设置以及信息
import { reactive } from 'vue';

/** 具体设置 */
const settings =reactive({
    // 普通设置
    /** 确认删除问题 */
    comfBefDelQues:true,
    /** 确认删除会话 */
    comfBefDelSess:true,
    /** 确认删除知识条目 */
    comfBefDelKnow:true,
    /** 是否逐字渲染 */
    printByWord:true,
    /** 每秒输出字符数量 */
    charPerSecond:40,
    /** 界面主题，取值为 `light` 或 `dark` */
    theme:'light',
    //DEBUG
    /** 调试模式开关 */
    debugMode:false,
    /** 调试模式下使用的api路径 */
    api_path: 'http://localhost:8000',
    /** 调试模式下发送问题的其他参数, */
    api_arg: '{\n  "model": "qwen2.5-7b-instruct",\n  "max_tokens": 1024,\n  "temperature": 0.5\n}',
})

/** 设置的文字描述 */
const description=[
    {
        name:"其他",
        items:[
            {
                text:"删除问题时需确认",
                dscr:"打开后，点击询问块的删除按钮时，会弹出删除提示",
                key:"comfBefDelQues",
                type:"bool",
            },
            {
                text:"删除会话时需确认",
                dscr:"打开后，删除会话前，会弹出删除提示",
                key:"comfBefDelSess",
                type:"bool",
            },
            {
                text:"删除知识条目时需确认",
                dscr:"打开后，删除知识条目前，会弹出删除提示",
                key:"comfBefDelKnow",
                type:"bool",
            },
            {
                text:"逐字渲染",
                dscr:"打开后，模型回答时显示打字效果，关闭则瞬间显示",
                key:"printByWord",
                type:"bool",
            },
            {
                textF:(num)=>`吐字速度(${num}/字/秒)`,
                show:()=>settings.printByWord,
                key:"charPerSecond",
                type:"range",
                max:150,
                min:20
            }
        ]
    },
    {
        name:"调试",
        items:[
            {
                text:"调试模式",
                dscr:"打开后，使用调试设置进行操作",
                key:"debugMode",
                type:"bool",
            },
            {
                text:"API接口",
                dscr:"所有请求接口的服务地址\n例如填入 http://localhost:8000 后，问答接口将请求 http://localhost:8000/v1/chat/completions",
                show:()=>settings.debugMode,
                key:"api_path",
                type:"text",
            },
            {
                text:"请求体其他参数内容",
                dscr:"大模型提问的其他自定义参数JSON\n(若不指明则使用默认参数)",
                show:()=>settings.debugMode,
                key:"api_arg",
                type:"text",
                multiline:true,
                reset:'{\n  "model": "qwen2.5-7b-instruct",\n  "max_tokens": 1024,\n  "temperature": 0.5\n}',
            }
        ]
    }
]

/** 全局设置以及信息 */
const Settings = {
/** 具体设置 */
    settings,
/** 设置的文字描述 */
    description
}

export default Settings
export { settings,description };
