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
