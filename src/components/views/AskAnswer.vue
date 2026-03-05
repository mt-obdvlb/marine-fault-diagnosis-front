<template>
    <div class="area">
        <div :class="['chatsBar',screen.type,{show:allChats.length>0,'active':chatsBarActive}]">
            <div class="functions">
                <div v-if="screen.type=='hor'" class="toggleBar buttonEffect" @click="chatsBarActive=!chatsBarActive" :title="chatsBarActive?'收回':'展开'">{{chatsBarActive?'<':'>'}}</div>
                <div v-else class="toggleBar buttonEffect" @click="chatsBarActive=false" title="关闭"><img src="/icon/del.svg" alt=" X"></div>
                <div class="addButton buttonEffect" @click="changeChat(cachedNewChat)" title="创建新会话"><img src="/icon/add.svg" alt="add"><div>创建新会话</div></div>
            </div>
            <div class="chats">
                <div v-for="cls in chatClasses">
                    <!-- 分界线 -->
                    <div v-show="allChats.filter(cls.filter).length>0" style="display:flex;align-items:center;padding:10px;">
                        <div v-show="chatsBarActive" style="padding-left:8px;padding-right:18px;color:var(--holder-color);">{{ cls.className }}</div>
                        <div style="flex:1;height:2px;background-color:var(--subBgColor);"></div>
                    </div>
                    <div v-for="chat of allChats.filter(cls.filter)" :key="chat.timestamp" :class="['chatItem',{'buttonEffect':!chat.editing,'active':currentChat==chat}]" :title="chat.title" @click="changeChat(chat)">
                        <img src="/icon/chat.svg" alt="C" class="chatIcon"/>
                        <span v-show="!chat.editing" class="text">{{ chat.title }}</span>
                        <input v-show="chat.editing" type="text" class="input" @click.stop v-model="newname" @blur="renameChat(chat,newname)" @keyup.enter="renameChat(chat,newname)">
                        <img v-show="!chat.editing" src="/icon/more.svg" alt="..." class="menuButton buttonEffect" @click.stop="openChatMenu($event,chat)" title="会话设置"/>
                    </div>
                </div>
                <!-- <div v-for="chat of allChats" :key="chat.timestamp" :class="['chatItem',{'buttonEffect':!chat.editing,'active':currentChat==chat}]" :title="chat.title" @click="changeChat(chat)">
                    <img src="/icon/chat.svg" alt="C" class="chatIcon"/>
                    <span v-show="!chat.editing" class="text">{{ chat.title }}</span>
                    <input v-show="chat.editing" type="text" class="input" @click.stop v-model="newname" @blur="renameChat(chat,newname)" @keyup.enter="renameChat(chat,newname)">
                    <img v-show="!chat.editing" src="/icon/menu.svg" alt="..." class="menuButton buttonEffect" @click.stop="openChatMenu($event,chat)" title="会话设置"/>
                </div> -->
                <!-- 浮动会话菜单 -->
                 <div v-show="chatMenuActive" class="chatMenu" ref="chatMenu">
                    <div class="chatMenuItem buttonEffect" @click.stop="renameChat(chatMenuTarget,undefined)" title="重命名">
                        <img src="/icon/edit.svg" alt="" class="icon"/>
                        <span class="text">重命名</span>
                    </div>
                    <div class="chatMenuItem buttonEffect" @click.stop="delChat(chatMenuTarget,true)" title="删除会话">
                        <img src="/icon/del.svg" alt="" class="icon"/>
                        <span class="text">删除会话</span>
                    </div>
                 </div>
            </div>
        </div>
        <!-- 竖屏会话列表按钮 -->
        <img v-show="screen.type=='ver'&&allChats.length>0" src="/icon/chat.svg" alt="对话" class="floatChat buttonEffect" @click="chatsBarActive=!chatsBarActive"/>
        <div class="mainArea">
            <div :class="['loading',{'show':currentChat.status=='unload'}]">
                <img class="autoInvert" src="/icon/loading.svg" alt="">
                加载中
            </div>
            <div :class="['startArea',{'hasContent':currentChat.messages.length>0||currentChat.status=='unload'}]">
                <div class="title">
                    <img src="/logo.svg" alt="船舶装备故障诊断智能问答系统">
                    <span>船舶装备故障诊断智能问答系统</span>
                </div>
                <div class="subtitle">面向发动机、液压、电气与甲板机械场景的船舶装备故障诊断助手</div>
            </div>
            <div :class="['answersArea',{'hasContent':currentChat.messages.length>0||currentChat.status=='unload'}]">
                <div :class="['toolbar',screen.type]">
                    <div v-if="SupportExport" @click="exportChat(currentChat,'markdown')" class="item buttonEffect"> 
                        <div class="itemContent"><img src="/icon/export.svg" alt="导出" class="icon"/> 导出会话.md</div>
                    </div>
                    <div v-if="SupportExport" @click="exportChat(currentChat,'json')" class="item buttonEffect"> 
                        <div class="itemContent"><img src="/icon/export.svg" alt="导出" class="icon"/> 导出会话.json</div>
                    </div>
                    <div @click="allFold()" class="item buttonEffect">
                        <div class="itemContent"><img src="/icon/fold.svg" alt="折叠" class="icon"/> 全部{{ isAllFold?"展开":"折叠" }}</div>
                    </div>
                </div>
                <div :class="['answers',screen.type]" ref="answers">
                    <div :class="['msg',msg.status]" v-for="(msg,i) in currentChat.messages" >
                        <div class="questionBar">
                            <!-- 折叠按钮 -->
                            <div :class="['foldButton','buttonEffect',{'folded':msg.fold}]" :title="msg.fold?'展开':'折叠'" @click="msg.fold=!msg.fold" >
                                <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" viewBox="0 0 1964 1963" overflow="hidden">
                                    <defs>
                                    <mask :id="'mask'+i">
                                        <rect width="100%" height="100%" fill="white"/>
                                        <path class="turn" stroke="black" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="150" d="m982 926 632 791h-319l-313-391-313 391H350Z"/>
                                    </mask>
                                    </defs>
                                    <g fill="#393C45">
                                    <path d="M287 1174h1390v203H287zM287 786h1390v203H287zM287 398h1390v203H287z" :style="`mask:url(#mask${i})`"/>
                                    <path class="turn" d="m982 982 562 702h-284l-278-347-278 347H420Z"/>
                                    </g>
                                </svg>
                            </div>
                            <!-- <img :class="['foldButton','buttonEffect',{'folded':msg.fold}]" src="/icon/fold.svg" :title="msg.fold?'展开':'折叠'" @click="msg.fold=!msg.fold"> -->
                            <div :class="['question',{'folded':msg.fold,'thinking':msg.fold&&msg.status==='unfinished'}]" :title="msg.question">{{ msg.question }}</div>
                            <img v-if="msg.status==='finished'" class="questionBarButton buttonEffect" src="/icon/copy.svg" title="复制答案为markdown" style="margin-right: 15px;" @click="copy(msg.text)">
                            <img v-if="msg.status!=='unfinished'" class="questionBarButton buttonEffect" src="/icon/del.svg" title="删除" @click="remove(currentChat,msg,true)">
                        </div>
                        <br v-show="!msg.fold">
                        <div v-show="!msg.fold" :class="{'foldable':true,thinking:msg.status==='unfinished'}" style="display: flex;">
                            <Markdown v-if="msg.text.length>0" :md="msg.text" :theme="settings.theme"/>
                            <div v-else> ... </div>
                            <div v-if="i===currentChat.messages.length-1&&msg.status==='stop'" class="continueButton buttonEffect" @click="restream(msg,currentChat)">
                                <img src="/icon/play.svg" alt=">" style="width:30px"> 继续回答</div>
                            <div v-if="msg.ref_files.length>0" class="refFiles">
                                <div class="filesTitle buttonEffect" @click="msg.ref_show=!msg.ref_show">{{ msg.ref_show?'∧':'∨' }}  参考资料  {{ msg.ref_show?'∧':'∨' }}</div>
                                <div :class="['filesItems',{'show':msg.ref_show}]">
                                    <a class="filesItem" v-for="file in msg.ref_files" :title="file.name" :href="file.url" target="_blank">{{ file.name }}</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div :class="['requestArea',{'hasContent':currentChat.messages.length>0||currentChat.status=='unload'}]">
                <div :class="['request',screen.type]">
                    <div class="requestHint">
                        <span>输入故障现象、参数、报警信息</span>
                        <span>支持 Markdown 输出与参考资料回溯</span>
                    </div>
                    <textarea :class="['requestbox',screen.type]" v-model="currentChat.input" placeholder="例如：主推进发动机冷启动困难，排烟发白且燃油压力偏低，可能是什么故障？" @keydown.enter.exact="submit" @input="changeHandler()" ref="inputTextarea"/>
                    <div :class="['submitRow',screen.type]">
                        <img v-show="submitAllow" class="submit buttonEffect" src="/icon/submit.svg" alt="提问" @click="submit"/>
                        <img v-show="stopAllow" class="stop buttonEffect" src="/icon/stop.svg" alt="停止" @click="stop(currentChat)"/>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref,reactive,getCurrentInstance,computed,watch,nextTick } from 'vue';
import eventBus from '@/utils/eventBus';
import { screen, API_SERVER_URL } from '@/utils/GLO';
import { settings } from '@/utils/Settings';
import F from '@/utils/F';
import api from '@/utils/api';
let debug=getCurrentInstance().proxy.debug

const currentChat=ref()
const allChats=reactive([])
let cachedNewChat=null

//时间分类
let _t=(c)=>F.getDaysBetween(c.timestamp, new Date()/1000)
const chatClasses=reactive([
    {
        className:"今天",
        filter:(chat)=>_t(chat)==0
    },
    {
        className:"昨天",
        filter:(chat)=>_t(chat)==1
    },
    {
        className:"三天内",
        filter:(chat)=>_t(chat)>1&&_t(chat)<=3
    },
    {
        className:"更久以前",
        filter:(chat)=>_t(chat)>3
    },
])


// 页面元素
const inputTextarea=ref()
const answers=ref()
const chatMenu=ref()

debug.allChats=allChats
debug.currentChat=currentChat;

const SupportExport=Blob&&URL.createObjectURL&&URL.revokeObjectURL
const isAllFold=computed(()=>currentChat.value.messages.every((msg)=>msg.fold))
const chatsBarActive= ref(false)
watch(allChats,()=>{ chatsBarActive.value=(allChats.length<=0?false:chatsBarActive.value) })
const chatMenuActive= ref(false)
window.addEventListener('mouseup', ()=>chatMenuActive.value=false)
let chatMenuTarget=null
let chatMenuTargetDom=null

const submitAllow=computed(()=>{
    const CC=currentChat.value
    if(CC.status!=='ready') return false
    const msgs=CC.messages
    if(msgs.length>0 && msgs[msgs.length-1].status==='unfinished') return false
    return true
})
const stopAllow=computed(()=>{
    const msgs=currentChat.value.messages
    if(msgs.length>0 && msgs[msgs.length-1].status==='unfinished') return true
    return false
})

function newChat(){
    const AllSessionId=allChats.map((chat)=>chat.session_id)
    function generateUUID() {
        let d = new Date().getTime();
        let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            let r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x3|0x8)).toString(16);
        });
        return uuid;
    };
    let session_id=generateUUID()
    while(AllSessionId.indexOf(session_id)>=0) session_id=generateUUID()
    //define chat
    cachedNewChat=reactive({title:'',messages:[],session_id,input:'',rel_ques:[],status:"ready",editing:false})
    return cachedNewChat
}
eventBus.on("delAllChats",()=>{ delAllChat(true) })
currentChat.value=newChat()

function sortChats(){
    allChats.sort((c1,c2)=>c2.timestamp-c1.timestamp)
}
function toApiUrl(path){
    if(!path) return ''
    if(/^https?:\/\//.test(path)) return path
    const base=settings.debugMode ? settings.api_path : API_SERVER_URL
    return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
function parseStreamJson(buffer){
    const objects=[]
    let start=-1
    let depth=0
    let inString=false
    let escape=false

    for(let i=0;i<buffer.length;i++){
        const ch=buffer[i]
        if(inString){
            if(escape) escape=false
            else if(ch==='\\') escape=true
            else if(ch==='"') inString=false
            continue
        }
        if(ch==='"'){
            inString=true
            continue
        }
        if(ch==='{'){
            if(depth===0) start=i
            depth++
            continue
        }
        if(ch==='}'){
            depth--
            if(depth===0 && start>=0){
                const raw=buffer.slice(start,i+1)
                try{
                    objects.push(JSON.parse(raw))
                    buffer=buffer.slice(i+1)
                    i=-1
                    start=-1
                }catch{
                    depth=0
                    start=-1
                }
            }
        }
    }
    return { objects, rest: buffer }
}
function changeChat(chat,closeBar=true){
    currentChat.value=chat
    if(chat.status=="unload"){
        api.qaList(chat.session_id,{errorText:"会话加载失败"}).then(r=>{
            if(!r) return
            r.data.forEach(msg=>{
                //define message
                const localMsg=reactive({
                    question:msg.question,
                    id:msg.question_id,
                    answer:msg.answer,
                    text:(!msg.num_render?msg.answer:msg.answer.substring(0,msg.num_render)),
                    status:(!msg.num_render||msg.num_render>=msg.answer.length)?"finished":"stop",
                    controller:{abort(){}},
                    fold:false,
                    ref_files:[],
                    ref_show:false,
                    rag_sources:msg.rag_sources||[]
                })
                chat.messages.push(localMsg)
                if(localMsg.status==='finished') loadReferences(localMsg)
            })
            chat.status="ready"
            setTimeout(()=>answers.value.scrollTo(0,Number.MAX_SAFE_INTEGER),300)
        })
    }
    if(screen.type=='ver' && closeBar) chatsBarActive.value=false
    setTimeout(()=>answers.value.scrollTo(0,Number.MAX_SAFE_INTEGER),300)
}
function delChat(chat,confirm=false){
    function _delChat(){
        let index=allChats.indexOf(chat)
        if(allChats[index]==currentChat.value) currentChat.value=cachedNewChat

        //终止chat的所有请求
        chat.messages.forEach((msg)=>{ msg.controller.abort() })
        allChats.splice(index,1)
        api.sessionDelete(chat.session_id,{onError(text,e){console.error(text,e)}})
    }
    if(confirm && settings.comfBefDelSess)
        eventBus.emit('dialog',{text:"确定删除该会话吗？",onYes(checkVal){
            settings.comfBefDelSess=checkVal
            _delChat()
        }, checkText:"每次删除都提示确认", checkVal:true, type:"yes_no"})
    else
        _delChat()
}
function delAllChat(confirm=false){
    function _delAllChat(){
        api.sessionClear({onError(text,e){console.error(text,e)}})
        allChats.length=0;
        currentChat.value=cachedNewChat
    }
    if(confirm)
        eventBus.emit('dialog',{text:"确定清空所有会话吗？",onYes(){ _delAllChat() },type:"yes_no"})
    else
        _delAllChat()
}
async function loadChats(){
    let r=await api.sessionList({errorText:"会话列表加载失败，请刷新重试"})
    if(!r) return
    let chats=r.data||[]
    let changeID=false
    let AllSessionId=[]
    allChats.length=0;
    chats.forEach(chat=>{
        //define chat
        allChats.push({
            title:chat.name,
            session_id:chat.session_id,
            timestamp:chat.timestamp,
            messages:[],rel_ques:[],
            input:'',
            status:"unload",
            editing:false
        })
        AllSessionId.push(chat.session_id)
        if(chat.session_id==cachedNewChat.session_id) changeID=true
    })
    if(changeID){
        function generateUUID() {
            let d = new Date().getTime();
            let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                let r = (d + Math.random()*16)%16 | 0;
                d = Math.floor(d/16);
                return (c=='x' ? r : (r&0x3|0x8)).toString(16);
            });
            return uuid;
        };
        let session_id=generateUUID()
        while(AllSessionId.indexOf(session_id)>=0) session_id=generateUUID()
        cachedNewChat.session_id=session_id
    }
    currentChat.value=cachedNewChat

}
let newname=''
function renameChat(chat, _newname=undefined){
    if(_newname!==undefined){
        chat.editing=false
        if(_newname && chat.title!=_newname){
            chat.title=_newname
            api.sessionRename({session_id:chat.session_id,name:_newname},{onError(text,e){console.error(text,e)}})
        }
    }
    else{
        newname=chat.title
        chat.editing=true
        nextTick(()=>{
            chatMenuTargetDom.getElementsByClassName("input")[0].focus()
        })
        
    }
}
function openChatMenu(event, chat){
    let dom=event.target
    let pos=dom.getClientRects()[0]
    let menu=chatMenu.value

    menu.style.top=""
    menu.style.left=""
    menu.style.bottom=""
    menu.style.right=""
    if(screen.type=='hor'){
        menu.style.top=pos.bottom+"px"
        menu.style.left=pos.left+"px"
    }else{
        menu.style.top=pos.top+"px"
        menu.style.right=`calc(100% - ${pos.right}px)`
    }

    chatMenuTarget=chat
    chatMenuTargetDom=dom.parentElement

    chatMenuActive.value=true
}

function changeHandler(text=undefined, add=false){
    if(text!=undefined){
        if(add){
            currentChat.value.input+=text
            inputTextarea.value.value+=text
        }else{
            currentChat.value.input=text
            inputTextarea.value.value=text
        }
    }
    inputTextarea.value.style.height="auto"
    inputTextarea.value.style.height=inputTextarea.value.scrollHeight+"px"
}
async function submit(event){
    event.preventDefault()
    const CC=currentChat.value
    const msgs=CC.messages
    if(msgs.length>0 && msgs[msgs.length-1].status==='unfinished') return
    if(await genAns(CC.input)){
        changeHandler("")
        CC.rel_ques.length=0
    }
}
function stop(chat){
    const msgs=chat.messages
    if(msgs.length<=0)return
    const msg=msgs[msgs.length-1]
    if(msg.status==='unfinished') msg.status='stop'
}
function restream(msg, chat){
    msg.status='unfinished'
    // TODO如果没接收完刷新怎么办
    rendChat(msg, chat)
}
async function genAns(question, addTo=currentChat.value){
    question=question.trim()
    if(question.length<=0) return false
    
    let body={}
    if(settings.debugMode){
        try{
            body=JSON.parse(settings.api_arg)
        }catch(e){
            eventBus.emit('dialog',{text:"请求体参数解析错误，请检测是否是正确的json"})
            console.error(e)
            return
        }
    }
    // 新添会话
    if(allChats.indexOf(addTo)<0){
        addTo.title=question
        addTo.timestamp=new Date()/1000
        addTo.status='prepost'

        let r=await api.sessionAdd({session_id:addTo.session_id, name:addTo.title},{errorText:"会话创建失败，请刷新重试"})
        addTo.status='ready'
        if(!r) return false
        allChats.push(addTo)
        sortChats()
        newChat()
    }
    //define message
    let msg=reactive({question,id:null,answer:'',text:'',status:"unfinished",receiveAll:false,controller:new AbortController(),fold:false,ref_files:[],ref_show:false,rag_sources:[]})

    let messages=[]
    //DEBUG
    //滤去请求失败的对话
    // chats.value.forEach((ch)=>{
    //     if(ch.status=='error') return;
    //     messages.push({role:'user',content:ch.question})
    //     messages.push({role:'assistant',content:ch.text})
    // })
    messages.push({role:'user',content:question})
    body.messages=body.messages||messages
    body.session_id=body.session_id||addTo.session_id
    body.model=body.model||"qwen2.5-7b-instruct"
    
    function _error(text,e){
        if(e.name==='AbortError'){
            msg.answer=msg.text+'[中止]'
            msg.status="stop"
            return
        }
        eventBus.emit("dialog",{text})
        console.error(e);
        msg.answer+=`[${text}]`
        msg.status='error'
    }
    api.chatCompletions(body,{onError:_error},{signal:msg.controller.signal}).then(r=>{
        if(!r) return
        const reader = r.body.getReader();
        const decoder = new TextDecoder();
        let result=''
        // 循环读取流数据
        function processStream(){
            reader.read().then(({ done, value }) => {
                if (done) {
                    addTo.timestamp=new Date()/1000
                    msg.receiveAll=true
                    sortChats()
                    return;
                }
                result += decoder.decode(value, {stream:true});
                const parsed=parseStreamJson(result)
                result=parsed.rest
                for(const obj of parsed.objects){
                    if(obj['choices']?.[0]?.message?.content){
                        msg.answer += obj['choices'][0]['message']['content'];
                    }
                    if(obj['final']){
                        addTo.timestamp=obj.created || new Date()/1000
                        msg.id=obj['id']
                        msg.rag_sources=obj['rag_sources']||[]
                        msg.receiveAll=true
                        sortChats()
                    }
                }
                // 继续读取
                processStream();
            }).catch(e=>{
                _error("读取异常",e)
            })
        }
        processStream()
    })
    addTo.messages.push(msg)
    rendChat(msg,addTo)
    return true
}
function rendChat(msg, chat){
    //将接收到的答案显示出来
    let i=msg.text.length
    let _scroll=i===0
    let updateInt=null,updateTimer=null
    const FPS=20
    if(settings.printByWord){
        //逐字显示
        let _toAppend='',text=msg.text
        const WordsATick=1/FPS*settings.charPerSecond
        let left=0, endFlag=0
        let textAddInt=null,textAddTimer=null
        //回答停止
        function _end(){
            if(Worker){
                textAddTimer.postMessage(["clearTimer"])
                updateTimer.postMessage(["clearTimer"])
            }else{
                clearInterval(textAddInt);
                clearInterval(updateInt)
            }
            msg.text=text
        }
        //循环往答案中加字
        function _textAdd(){
            if(i>=1 &&_scroll){
                setTimeout(()=>answers.value.scrollTo(0,Number.MAX_SAFE_INTEGER),500)
                _scroll=false
            }
            if(msg.status==='stop'){
                _end()
                api.stopGeneration({session_id:chat.session_id, num_render:msg.text.length},{onError(text,e){console.error(text,e)}})
                return
            }else if(msg.status==='unfinished'){
                if(i<msg.answer.length){
                    _toAppend=msg.answer.substring(i,i+WordsATick+left)
                    text+=_toAppend
                    i=text.length
                    left=(WordsATick+left)%1
                }else if(msg.receiveAll){
                    if(i<msg.answer.length){
                        endFlag=0
                        return;
                    }else if(endFlag<5){
                        endFlag++
                        return
                    }
                    _end()
                    msg.text=text
                    msg.status='finished'
                    loadReferences(msg)
                }
            }
            if(i<msg.answer.length){
                _toAppend=msg.answer.substring(i,i+WordsATick+left)
                text+=_toAppend
                i=text.length
                left=(WordsATick+left)%1
            }else if(msg.status!=='unfinished'){
                if(i<msg.answer.length){
                    endFlag=0
                    return;
                }else if(endFlag<5){
                    endFlag++
                    return
                }
                _end()
                msg.text=text
            }
        }
        //更新渲染对话
        function _update(){
            if(msg.text!=text) msg.text=text
        }
        //保证兼容性
        if(Worker){
            textAddTimer=new Worker('./js/timer.js')
            updateTimer=new Worker("./js/timer.js")
            textAddTimer.onmessage=_textAdd
            updateTimer.onmessage=_update
            textAddTimer.postMessage(['setTimer',1000/FPS])
            updateTimer.postMessage(['setTimer',1000/FPS])
        }else{
            textAddInt=setInterval(_textAdd, 1000/FPS)
            updateInt=setTimeout(_update, 1000/FPS)
        }
    }else{
        function _end(){
            if(Worker) updateTimer.postMessage(["clearTimer"])
            else clearInterval(updateInt)
        }
        function _update(){
            if(msg.receiveAll){
                _end()
                msg.text=msg.answer
                msg.status='finished'
                loadReferences(msg)
                return
            }
            if(msg.status!=='unfinished'){
                _end()
                msg.text=msg.answer
                if(msg.status==='stop') api.stopGeneration({session_id:chat.session_id, num_render:msg.text.length},{onError(text,e){console.error(text,e)}})
                return
            }
            if(msg.text!=msg.answer){
                msg.text=msg.answer
                if(msg.text.length>=1 &&_scroll){
                    setTimeout(()=>answers.value.scrollTo(0,Number.MAX_SAFE_INTEGER),500)
                    _scroll=false
                }
            }
        }
        if(Worker){
            updateTimer=new Worker("./js/timer.js")
            updateTimer.onmessage=_update
            updateTimer.postMessage(['setTimer',1000/FPS])
        }else{
            updateInt=setTimeout(_update, 1000/FPS)
        }
    }
}
function loadReferences(msg){
    if(!msg.id) return
    api.referenceGet(msg.id,{errorText:"参考资料获取失败",onError(text,e){console.error(text,e)}}).then(r=>{
        if(!r || !r.data) return
        const docUrl=toApiUrl(r.data.doc_url || '')
        let files=[]
        if(docUrl){
            files.push({
                name:'参考资料页面',
                url:docUrl
            })
        }
        ;(r.data.knowledge_items||[]).forEach(item=>{
            if(!docUrl) return
            files.push({
                name:`${item.name}${item.category ? `（${item.category}）` : ''}`,
                url:docUrl
            })
        })
        ;(msg.rag_sources||[]).forEach(item=>{
            if(!docUrl) return
            if(files.some(file=>file.name===item.name)) return
            files.push({
                name:`${item.name}${item.type ? ` [${item.type}]` : ''}`,
                url:docUrl
            })
        })
        msg.ref_files=files
    })
}
function remove(chat,msg,confirm=false){
    function _remove(chat,msg){
        //TODO 删除会话需要stop吗？
        msg.controller.abort()
        let index=chat.messages.indexOf(msg)
        if(chat.messages.length==1){
            delChat(chat)
            return
        }
        if(msg.status!='error'){
            api.qaDelete({session_id:chat.session_id,question_id:chat.messages[index].id},{onError(text,e){console.error(text,e)}})
        }
        chat.messages.splice(index,1)
        return index
    }
    if(confirm && settings.comfBefDelQues && msg.status!='error')
        eventBus.emit("dialog",{text:"确认要删除该轮提问？",onYes(checkVal){
            settings.comfBefDelQues=checkVal
            _remove(chat,msg)
        }, checkText:"每次删除都提示确认", checkVal:true, type:"yes_no"})
    else _remove(chat,msg)
}
function allFold(){
    if(isAllFold.value)
        currentChat.value.messages.forEach((msg)=>{msg.fold=false})
    else
        currentChat.value.messages.forEach((msg)=>{msg.fold=true})
}
async function copy(text){
    if(!text) return
    await navigator.clipboard.writeText(text);
    eventBus.emit("dialog",{text:"复制成功"})
}
function exportChat(chat, format){
    if(chat.messages.length<=0) return
    let data=null, ext=''
    if(format==='markdown'){
        ext='.md'
        data=''
        chat.messages.forEach(msg=>{
            if(msg.status!='finished') return
            data+=`**${msg.question}**\n\n`
            data+=msg.text+'\n\n'
            if(msg.ref_files.length>0){
                data+='`参考文档`\n\n'
                msg.ref_files.forEach(file=>{
                    data+=`#### [*${file.name}*](${file.url})\n\n`
                })
            }
            data+='---\n\n'
        })
    }else if(format==='json'){
        ext='.json'
        let msgs=chat.messages.filter(msg=>msg.status=='finished').map(msg=>({
            question:msg.question,
            question_id:msg.id,
            answer:msg.text,
            timestamp:msg.timestamp,
            reference_files:msg.ref_files
        }))
        let session={name:chat.title,session_id:chat.session_id,questions:msgs}
        data=JSON.stringify(session)
    }
    if(data){
        let _a=document.createElement("a")
        data = new Blob([data])
        let url=URL.createObjectURL(data)
        _a.href=url
        _a.download=`${chat.session_id}${ext}`
        _a.click()
        URL.revokeObjectURL(url)
    }
}
loadChats()

</script>

<style scoped>
.area{
    display: flex;
    height: 100%;
}

.chatsBar{
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-right: 0px solid var(--subBgColor);
    transition: width .3s, border .3s;
    width: 0px;
}
.chatsBar.hor.show{
    border-right: 3px solid var(--subBgColor);
    width: 50px;
}
.chatsBar.hor.show.active{
    width: 250px;
}
.chatsBar.ver{
    display: none;
}
.chatsBar.ver.show.active{
    background-color: var(--bgColor);
    border: 2px solid var(--subBgColor);
    border-radius: 20px;
    display: flex;
    position: fixed;
    left: 7%;
    right: 7%;
    top: 15%;
    bottom: 15%;
    width: 86%;
    z-index: 25;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.15);
    animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.functions{
    display: flex;
    flex-direction: column;
}
.toggleBar{
    text-align: center;
    background-color: var(--bgColor);
    padding: 10px;
}
.chatsBar.ver .toggleBar {
    text-align: right;
    padding: 5px 15px;
    border-bottom: 1px solid var(--subBgColor);
    background: rgba(255, 255, 255, 0.05);
}

.chatsBar.ver .toggleBar img {
  height: 30px;
  opacity: 0.7;
  transition: all 0.3s;
}

.chatsBar.ver .toggleBar img:hover {
  opacity: 1;
  transform: scale(1.1);
}

.addButton{
    overflow: hidden;
    display: flex;
    background-color: var(--bgColor);
    height: 40px;
    align-items: center;
}
.addButton img{
    height: 25px;
    width: 50px;
    object-fit: contain;
}
.addButton div{
    flex: 1;
    width: 0;
    white-space: nowrap;
}
.chats{
    flex: 1;
    height: 0;
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    scrollbar-width: none;
}
.chatsBar.ver .chats {
  padding: 0 20px;
  margin-top: 0;
}
.chatItem{
    display: flex;
    align-items: center;
    margin: 3px;
    padding: 5px;
    border: 3px double var(--subBgColor);
    border-radius: 10px;
    overflow: hidden;
    flex-shrink: 0;
    background-color: var(--bgColor);
}
.chatItem.active{
    border: 3px solid var(--header-item-active);
}
.chatItem img.chatIcon{
    object-fit: cover;
    width: 25px;
    height: 25px;
    padding-left: 2px;
    padding-right: 7px;
    flex-shrink: 0;
    transition: all .3s;
    max-width: 50px;
}
.chatsBar.active img.chatIcon{
    max-width: 0px;
    padding-left: 0px;
}
.chatItem span{
    flex: 1;
    width: 0;
    overflow: hidden;
    padding: 5px;
    white-space: nowrap;
    text-overflow: ellipsis;
}
.chatItem.active span{
    color: var(--header-item-active);
    text-decoration: underline;
}
.chatItem .input{
    flex: 1;
    margin-right: 7px;
    padding: 4.7px;
    font-size: 16px;
}
.chatItem .menuButton{
    overflow: hidden;
    height: 25px;
    max-width: 0;
}
.chatsBar.active .chatItem .menuButton{
    max-width: 100%;
}
.chatMenu{
    position: fixed;
    background-color: var(--bgColor);
    border: 2px solid var(--subBgColor);
    border-radius: 14px;
    display: flex;
    flex-direction: column;
    z-index: 25;
    box-shadow: 0px 0px 10px 0px rgba(128, 128, 128, 0.348);
}
.chatMenuItem{
    display: flex;
    align-items: center;
    background: inherit;
    border-radius: 12px;
    padding: 5px;
    margin: 4px 2px;
}
.chatMenuItem:not(:first-child){
    margin-top: 2px;
}
.chatMenuItem .icon{
    width: 30px;
}
.chatMenuItem .text{
    text-align: center;
    width: 120px;
}

.floatChat{
    position: fixed;
    right: 0;
    top: 0;
    padding: 5px;
    width: 40px;
    height: 40px;
}

.mainArea{
    flex:1;
    display: flex;
    overflow: hidden;
    flex-direction: column;
    align-items: center;
    justify-content: center;position: relative;
}
.loading{
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    background-color: rgba(125, 125, 125, 0.451);
    transition: opacity 1s;
    opacity: 0;
    align-items: center;
    justify-content: center;
    display: flex;
    z-index: -1;
}
.loading.show{
    z-index: 20;
    opacity: 1;
}
.loading img{
    width: 50px;
    height: 50px;
    padding: 20px;
}
.startArea{
    overflow: hidden;
    max-height: 100%;
    opacity: 1;
    margin-bottom: 15px;
    display: flex;
    flex-direction: column;
    align-items: center;
}
.startArea.hasContent{
    transition: all .7s ease-in-out;
    max-height: 0%;
    opacity: 0;
    margin-bottom: 0;
}
.title{
    display: flex;
    align-items: center;
}
.title img{
    height: 100px;
    animation: show_in 0.7s ease-out forwards;
}
@keyframes show_in {
    0% {
        padding: 10px 50px;
        filter: drop-shadow(0 0 0 #00d9ff88);
        transform: translateX(-20px);
    }
    100% {
        padding: 10px 10px;
        filter: drop-shadow(0 0 12px #00d9ff88);
        transform: translateX(0px);
    }
}
.title span{
    margin: 30px;
    font-size: 24px;
    height: fit-content;
    padding-bottom: 5px;
    background: linear-gradient(to right,var(--text-color) 0% ,var(--subBgColor) 80%, rgba(0,0,0,0) 100%) no-repeat bottom left;
    animation: show_in2 0.5s ease-in forwards;
}
@keyframes show_in2 {
    0% {
        background-size: 0% 2px;
    }
    100% {
        background-size: 100% 2px;
    }
}
.subtitle{
    color: var(--holder-color);
    font-size: 15px;
    font-style: italic;
}

.answersArea{
    display: flex;
    flex:1;
    height: 0;
    width: 100%;
    max-width: 800px;
    flex-direction: column;
    border-left: 3px dashed var(--subBgColor);
    border-right: 3px dashed var(--subBgColor);
    max-height: 0;
    overflow: hidden;
}
.answersArea.hasContent{
    transition: max-height .8s ease-in-out;
    max-height: 100%;
}
.toolbar{
    width: 100%;
    text-align: center;
    display: flex;
    align-items: flex-end;
    overflow: hidden;
    transition: all .3s;
}
.toolbar.hor{
    height: 10px;
    padding-top: 0;
    border: 2px solid silver;
    border-top: none;
    border-bottom-right-radius: 10px;
    border-bottom-left-radius: 10px;
}
.toolbar.hor:hover{
    height: 50px;
}
.toolbar.ver{
    height: 50px;
    border-bottom: 2px solid silver;
}
.toolbar .item{
    background-color: var(--bgColor);
    border-left: 2px solid silver;
    padding-top: 12px;
    padding-bottom: 12px;
    flex:1;
}
.toolbar .item .itemContent{
    display: flex;
    align-items: center;
    justify-content: center;
}
.toolbar .item .icon{
    width: 20px;
    height: 20px;
    margin-right: 5px;
}
.toolbar .item:first-child{
    border-left: none;
}
.answers{
    height: 100%;
    scrollbar-width: none;
    overflow-y: auto;
}
.msg{
    padding: 15px;
    margin: 10px;
    margin-bottom: 20px;
    background-color: rgba(255, 255, 255, 0.086);
    border-radius: 10px;
    box-shadow: 0px 5px 10px 0px rgba(128, 128, 128, 0.348);
    transition: all .7s, color 0s;
    animation: showMsg .5s ease;
}
@keyframes showMsg {
    from{
        padding: 0;
        overflow: hidden;
        opacity: 0;
        max-height: 0px;
    }
    to{
        max-height: 20000px;
    }
}
/* .chat.unfinished{
} */
.msg .question{
    transition: color .7s;
}
.msg.error .question{
    color: rgb(255, 74, 74);
}
.msg.stop .question{
    color: var(--holder-color);
}
.questionBar{
    display: flex;
    overflow: hidden;
}
.question{
    word-break: break-word;
    flex: 1;
}
.question.folded{
    width: 0px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.foldButton{
    width: 25px;
    height: 25px;
    margin-right: 5px;
}
.foldButton .turn{
    transform-origin: 50% 70%;
    transition: all .3s;
}
.foldButton.folded .turn{
    transform: rotate(180deg);
}

.questionBarButton{
    width: 25px;
    height: 25px;
    cursor: pointer;
    user-select: none;
}
.thinking{
    position: relative;
    padding-left: 2px;
    padding-right: 2px;
}
.thinking::before,.thinking::after{
    content:"";
    position: absolute;
    top: 0; bottom: 0; left: 0; right: 0;
    border: 2px solid var(--text-color);
}
.thinking::before{
    animation: borderline 3s infinite linear;
}
.thinking::after{
    animation: borderline 3s infinite -1.5s linear;
}
@keyframes borderline{
    0%,100%{ clip-path: inset(95% 0 0 0); }
    25%{ clip-path: inset(0 95% 0 0); }
    50%{ clip-path: inset(0 0 95% 0); }
    75%{ clip-path: inset(0 0 0 95%); }
}
.foldable{
    display: flex;
    flex-direction: column;
}
.continueButton{
    display: flex;
    align-items: center;
    align-self: flex-end;
    padding: 5px;
    padding-left: 10px;
    padding-right: 10px;
    border-radius: 10px;
    background-color: var(--subBgColor2);
    box-shadow: 3px 3px 5px 0 gray;
}
.refFiles{
    max-width: 100%;
    border: 1px solid var(--text-color);
    padding: 3px;
    width: fit-content;
    align-self: flex-end;
    font-size: 15px;
}
.filesTitle{
    text-align: center;
    color: var(--holder-color);
    user-select: none;
}
.filesItems{
    height: 0;
    overflow: hidden;
}
.filesItems.show{
    height: auto;
}
.filesItem{
    font-style: italic;
    text-decoration: underline;
    transition: color .3s;
    margin-top: 15px;
    display: block;
    color: var(--text-color);
    padding-right: 5px;
    max-width: 350px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.filesItem:hover{
    color: rgb(0, 162, 255);
}
.relQues{
    margin: 10px;
    border: 2px solid var(--subBgColor);
    border-radius: 5px;
    overflow: hidden;
    width: calc(100% - 20px);
    float: right;
    display: flex;
    flex-direction: column;
    animation: showRelQues 1s linear;
}
@keyframes showRelQues {
    from{opacity: 0;}
    to{opacity: 1;}
}
.quesTitle{
    margin: 5px;
    margin-left: 15px;
    font-size: 15px;
    font-style: italic;
    flex-shrink: 0;
}
.quesItems{
    display: flex;
    flex-direction: column;
}
.quesItem{
    margin: 5px;
    padding: 14px;
    border-radius: 10px;
    background-color: var(--subBgColor2);
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    user-select: unset;
}

.requestArea{
    background-color: var(--bgColor);
    box-shadow: 0 -10px 10px 0 var(--bgColor);
    width: 100%;
    max-width: 800px;
    z-index: 10;
    display: flex;
    justify-content: center;
    margin-bottom: 120px;
}
.requestArea.hasContent{
    margin-bottom: 0;
}
.requestHint{
    width: 100%;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    color: var(--holder-color);
    font-size: 13px;
    margin-bottom: 10px;
}
.requestHint span{
    padding: 6px 10px;
    border-radius: 999px;
    background: var(--subBgColor2);
}
.request{
    position: relative;
    border: 2px solid gray;
    border-radius: 25px;
    margin: 10px;
    margin-top: 0;
    padding: 15px;
    width: calc(100% - 50px);
    max-width: 800px;
    display: flex;
    align-items: center;
}
.request.hor{
    flex-direction: column;
    align-items: stretch;
}
.request.ver{
    padding-left: 12px;
    padding-right: 12px;
}
.requestbox{
    font-size: 17px;
    font-family: auto;
    color: var(--text-color);
    border: none;
    outline: none;
    scrollbar-width: thin;
    resize: none;
    height: 45px;
    padding: 0;
    max-height: 150px;
    width: 100%;
    background-color: inherit;
}
.requestbox::-webkit-input-placeholder{
    color: var(--holder-color);
}
.requestbox.ver{
    scrollbar-width: none;
}
.submitRow.hor{
    width: 100%;
}
.submitRow .submit, .submitRow .stop{
    float: right;
    height: 35px;
    width: 35px;
}

@media (max-width: 720px) {
    .requestHint{
        flex-wrap: wrap;
    }
}
</style>
