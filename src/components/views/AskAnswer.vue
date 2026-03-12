<template>
  <div class='area'>
    <div
      :class="['chatsBar',screen.type,{show:allChats.length>0,'active':chatsBarActive}]">
      <div class='functions'>
        <div v-if="screen.type=='hor'"
             :title="chatsBarActive?'收回':'展开'"
             class='toggleBar buttonEffect'
             @click='chatsBarActive=!chatsBarActive'>
          {{ chatsBarActive ? '<' : '>' }}
        </div>
        <div v-else class='toggleBar buttonEffect'
             title='关闭' @click='chatsBarActive=false'><img
          alt=' X' src='/icon/del.svg'></div>
        <div class='addButton buttonEffect'
             title='创建新会话'
             @click='changeChat(cachedNewChat)'><img
          alt='add'
          src='/icon/add.svg'>
          <div>创建新会话</div>
        </div>
      </div>
      <div class='chats'>
        <div v-for='cls in chatClasses'>
          <!-- 分界线 -->
          <div v-show='allChats.filter(cls.filter).length>0'
               style='display:flex;align-items:center;padding:10px;height: 42px;white-space: nowrap;'>
            <div v-show='chatsBarActive'
                 style='padding-left:8px;padding-right:18px;color:var(--holder-color);'>
              {{ cls.className }}
            </div>
            <div
              style='flex:1;height:2px;background-color:var(--subBgColor);'></div>
          </div>
          <div v-for='chat of allChats.filter(cls.filter)'
               :key='chat.timestamp'
               :class="['chatItem',{'buttonEffect':!chat.editing,'active':currentChat==chat}]"
               :title='chat.title'
               @click='changeChat(chat)'
               @contextmenu.prevent='openChatMenu($event,chat,"cursor")'>
            <img alt='C' class='chatIcon'
                 src='/icon/chat.svg'/>
            <span v-show='!chat.editing'
                  class='text'>{{ chat.title }}</span>
            <input v-show='chat.editing' v-model='newname'
                   class='input' type='text'
                   @blur='renameChat(chat,newname)'
                   @click.stop
                   @keyup.enter='renameChat(chat,newname)'>
            <img v-show='!chat.editing' alt='...'
                 class='menuButton buttonEffect'
                 src='/icon/more.svg'
                 title='会话设置'
                 @click.stop='openChatMenu($event,chat)'/>
          </div>
        </div>
        <!-- <div v-for="chat of allChats" :key="chat.timestamp" :class="['chatItem',{'buttonEffect':!chat.editing,'active':currentChat==chat}]" :title="chat.title" @click="changeChat(chat)">
            <img src="/icon/chat.svg" alt="C" class="chatIcon"/>
            <span v-show="!chat.editing" class="text">{{ chat.title }}</span>
            <input v-show="chat.editing" type="text" class="input" @click.stop v-model="newname" @blur="renameChat(chat,newname)" @keyup.enter="renameChat(chat,newname)">
            <img v-show="!chat.editing" src="/icon/menu.svg" alt="..." class="menuButton buttonEffect" @click.stop="openChatMenu($event,chat)" title="会话设置"/>
        </div> -->
        <!-- 浮动会话菜单 -->
        <div v-show='chatMenuActive' ref='chatMenu'
             class='chatMenu'>
          <div class='chatMenuItem buttonEffect'
               title='重命名'
               @click.stop='renameChat(chatMenuTarget,undefined)'>
            <img alt='' class='icon' src='/icon/edit.svg'/>
            <span class='text'>重命名</span>
          </div>
          <div class='chatMenuItem buttonEffect'
               title='删除会话'
               @click.stop='delChat(chatMenuTarget,true)'>
            <img alt='' class='icon' src='/icon/del.svg'/>
            <span class='text'>删除会话</span>
          </div>
        </div>
      </div>
    </div>
    <!-- 竖屏会话列表按钮 -->
    <img v-show="screen.type=='ver'&&allChats.length>0"
         alt='对话' class='floatChat buttonEffect'
         src='/icon/chat.svg'
         @click='chatsBarActive=!chatsBarActive'/>
    <div class='mainArea'>
      <div
        :class="['loading',{'show':currentChat.status=='unload'}]">
        <img alt='' class='autoInvert'
             src='/icon/loading.svg'>
        加载中
      </div>
      <div
        :class="['startArea',{'hasContent':currentChat.messages.length>0||currentChat.status=='unload'}]">
        <div class='title'>
          <img alt='船舶装备故障诊断智能问答系统'
               src='/logo.svg'>
          <span>船舶装备故障诊断智能问答系统</span>
        </div>
        <div class='subtitle'>
          面向发动机、液压、电气与甲板机械场景的船舶装备故障诊断助手
        </div>
      </div>
      <div
        :class="['answersArea',{'hasContent':currentChat.messages.length>0||currentChat.status=='unload'}]">
        <div :class="['toolbar',screen.type]">
          <div v-if='SupportExport'
               class='item buttonEffect'
               @click="exportChat(currentChat,'markdown')">
            <div class='itemContent'><img
              alt='导出' class='icon'
              src='/icon/export.svg'/> 导出会话.md
            </div>
          </div>
          <div v-if='SupportExport'
               class='item buttonEffect'
               @click="exportChat(currentChat,'json')">
            <div class='itemContent'><img
              alt='导出' class='icon'
              src='/icon/export.svg'/> 导出会话.json
            </div>
          </div>
          <div class='item buttonEffect' @click='allFold()'>
            <div class='itemContent'><img
              alt='折叠' class='icon' src='/icon/fold.svg'/>
              全部{{ isAllFold ? '展开' : '折叠' }}
            </div>
          </div>
        </div>
        <div ref='answers' :class="['answers',screen.type]">
          <div v-for='(msg,i) in currentChat.messages'
               :key='msg.local_key'
               :class="['msg',msg.status]">
            <div class='questionBar'>
              <!-- 折叠按钮 -->
              <div
                :class="['foldButton','buttonEffect',{'folded':msg.fold}]"
                :title="msg.fold?'展开':'折叠'"
                @click='msg.fold=!msg.fold'>
                <svg overflow='hidden'
                     viewBox='0 0 1964 1963'
                     xml:space='preserve'
                     xmlns='http://www.w3.org/2000/svg'>
                                    <defs>
                                    <mask :id="'mask'+i">
                                        <rect fill='white'
                                              height='100%'
                                              width='100%'/>
                                      <path class='turn'
                                            d='m982 926 632 791h-319l-313-391-313 391H350Z'
                                            stroke='black'
                                            stroke-linejoin='round'
                                            stroke-miterlimit='10'
                                            stroke-width='150'/>
                                    </mask>
                                    </defs>
                  <g fill='#393C45'>
                                    <path
                                      :style='`mask:url(#mask${i})`'
                                      d='M287 1174h1390v203H287zM287 786h1390v203H287zM287 398h1390v203H287z'/>
                    <path class='turn'
                          d='m982 982 562 702h-284l-278-347-278 347H420Z'/>
                                    </g>
                                </svg>
              </div>
              <!-- <img :class="['foldButton','buttonEffect',{'folded':msg.fold}]" src="/icon/fold.svg" :title="msg.fold?'展开':'折叠'" @click="msg.fold=!msg.fold"> -->
              <div
                :class="['question',{'folded':msg.fold,'thinking':msg.fold&&msg.status==='unfinished'}]"
                :title='msg.question'>{{ msg.question }}
              </div>
              <img v-if="msg.status==='finished'"
                   class='questionBarButton buttonEffect'
                   src='/icon/copy.svg'
                   style='margin-right: 15px;'
                   title='复制答案为markdown'
                   @click='copy(msg.text)'>
              <span v-if="msg.status!=='unfinished'&&msg.id"
                    class='questionTextButton buttonEffect'
                    title='查看该条问答参考文献'
                    @click='viewSingleQaReferences(msg)'>查看参考</span>
              <img v-if="msg.status!=='unfinished'"
                   class='questionBarButton buttonEffect'
                   src='/icon/del.svg' title='删除'
                   @click='remove(currentChat,msg,true)'>
            </div>
            <div
              :class="['answerBody', {'collapsed': msg.fold}]">
              <div class='answerBodyInner'>
                <div
                  :class="{'foldable':true,thinking:msg.status==='unfinished'}">
                  <template v-if='msg.text.length>0'>
                    <div v-if="msg.status==='unfinished'"
                         class='streamText'>{{ msg.text }}
                    </div>
                    <Markdown v-else
                              :md='msg.text'
                              :theme='settings.theme'/>
                  </template>
                  <div v-else> ...</div>
                  <div
                    v-if="i===currentChat.messages.length-1&&msg.status==='stop'"
                    class='continueButton buttonEffect'
                    @click='restream(msg,currentChat)'>
                    <img alt='>' src='/icon/play.svg'
                         style='width:30px'> 继续回答
                  </div>
                  <div v-if='msg.ref_files.length>0'
                       class='refFiles'>
                    <div class='filesTitle buttonEffect'
                         @click='msg.ref_show=!msg.ref_show'>
                      {{ msg.ref_show ? '∧' : '∨' }} 参考资料
                      {{ msg.ref_show ? '∧' : '∨' }}
                    </div>
                    <div
                      :class="['filesItems',{'show':msg.ref_show}]">
                      <a v-for='file in msg.ref_files'
                         :href='file.url'
                         :title='file.name'
                         class='filesItem'
                         target='_blank'>{{ file.name }}</a>
                      <div
                        v-if='msg.ref_files.length>0||msg.ref_html_url'
                        class='filesItem filesItemButton buttonEffect'
                        @click='viewSingleQaReferences(msg)'>
                        在应用内查看参考文献
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-show='referencePreview.visible'
           :style='referencePaneStyle'
           class='referencePane'>
        <div class='referenceToolbar'>
          <div :title='referencePreview.title'
               class='referenceTitle'>
            {{ referencePreview.title || '参考文献' }}
          </div>
          <div class='referenceActions'>
            <a v-if='referencePreview.url'
               :href='referencePreview.url'
               class='buttonEffect'
               target='_blank'>新窗口打开</a>
            <span class='buttonEffect'
                  @click='referencePreview.visible=false'>关闭</span>
          </div>
        </div>
        <div v-if='referencePreview.loading'
             class='referenceEmpty'>参考文献加载中...
        </div>
        <div v-else-if='referencePreview.error'
             class='referenceEmpty'>
          {{ referencePreview.error }}
        </div>
        <iframe v-if='referencePreview.url'
                :src='referencePreview.url'
                class='referenceFrame'></iframe>
        <div v-else class='referenceEmpty'>暂无可展示内容
        </div>
        <div class='referenceResizeHandle'
             title='拖拽调整参考面板高度'
             @mousedown='startResizeReferencePane'></div>
      </div>
      <div
        :class="['requestArea',{'hasContent':currentChat.messages.length>0||currentChat.status=='unload'}]">
        <div :class="['request',screen.type]">
          <div class='requestHint'>
            <span>输入故障现象、参数、报警信息</span>
            <span>支持 Markdown 输出与参考资料回溯</span>
          </div>
          <textarea ref='inputTextarea'
                    v-model='currentChat.input'
                    :class="['requestbox',screen.type]"
                    placeholder='例如：主推进发动机冷启动困难，排烟发白且燃油压力偏低，可能是什么故障？'
                    @input='changeHandler()'
                    @keydown.enter.exact='submit'/>
          <div :class="['submitRow',screen.type]">
            <img v-show='submitAllow'
                 alt='提问'
                 class='submit buttonEffect'
                 src='/icon/submit.svg'
                 @click='submit'/>
            <img v-show='stopAllow'
                 alt='停止'
                 class='stop buttonEffect'
                 src='/icon/stop.svg'
                 @click='stop(currentChat)'/>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  reactive,
  computed,
  watch,
  nextTick,
  onBeforeUnmount
} from 'vue';
import eventBus from '@/utils/eventBus';
import {screen, API_SERVER_URL} from '@/utils/GLO';
import {settings} from '@/utils/Settings';
import F from '@/utils/F';
import api from '@/utils/api';

const currentChat = ref()
const allChats = reactive([])
let cachedNewChat = null

//时间分类
let _t = (c) => F.getDaysBetween(c.timestamp, new Date() / 1000)
const chatClasses = reactive([
  {
    className: '今天',
    filter: (chat) => _t(chat) == 0
  },
  {
    className: '昨天',
    filter: (chat) => _t(chat) == 1
  },
  {
    className: '三天内',
    filter: (chat) => _t(chat) > 1 && _t(chat) <= 3
  },
  {
    className: '更久以前',
    filter: (chat) => _t(chat) > 3
  },
])

// 页面元素
const inputTextarea = ref()
const answers = ref()
const chatMenu = ref()

const SupportExport = typeof Blob !== 'undefined' &&
  typeof URL !== 'undefined' &&
  typeof URL.createObjectURL === 'function' &&
  typeof URL.revokeObjectURL === 'function'
const referencePreview = reactive({
  visible: false,
  title: '',
  url: '',
  loading: false,
  error: ''
})
const referencePaneHeight = ref(320)
const referencePaneStyle = computed(() => ({height: `${referencePaneHeight.value}px`}))
let referencePaneResizeCleanup = null
const isAllFold = computed(() => currentChat.value.messages.every((msg) => msg.fold))
const chatsBarActive = ref(false)
watch(allChats, () => {
  chatsBarActive.value = (allChats.length <= 0 ? false : chatsBarActive.value)
})
const chatMenuActive = ref(false)
window.addEventListener('mouseup', () => chatMenuActive.value = false)
let chatMenuTarget = null
let chatMenuTargetDom = null

const submitAllow = computed(() => {
  const CC = currentChat.value
  if (CC.status !== 'ready') return false
  const msgs = CC.messages
  if (msgs.length > 0 && msgs[msgs.length - 1].status === 'unfinished') return false
  return true
})
const stopAllow = computed(() => {
  const msgs = currentChat.value.messages
  if (msgs.length > 0 && msgs[msgs.length - 1].status === 'unfinished') return true
  return false
})

function newChat() {
  const AllSessionId = allChats.map((chat) => chat.session_id)
  
  function generateUUID() {
    let d = new Date().getTime();
    let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      let r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
  };
  let session_id = generateUUID()
  while (AllSessionId.indexOf(session_id) >= 0) session_id = generateUUID()
  //define chat
  cachedNewChat = reactive({
    title: '',
    messages: [],
    session_id,
    input: '',
    rel_ques: [],
    status: 'ready',
    editing: false
  })
  return cachedNewChat
}

eventBus.on('delAllChats', () => {
  delAllChat(true)
})
currentChat.value = newChat()

function sortChats() {
  allChats.sort((c1, c2) => c2.timestamp - c1.timestamp)
}

function toApiUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return `${API_SERVER_URL}${path.startsWith('/') ? path : `/${path}`}`
}

function normalizeSelectedPath(path) {
  if (!path) return ''
  let normalized = String(path)
  if (normalized.startsWith('file://')) {
    normalized = decodeURIComponent(normalized.replace(/^file:\/\//, ''))
    if (/^\/[A-Za-z]:\//.test(normalized)) normalized = normalized.slice(1)
  }
  return normalized
}

function startResizeReferencePane(event) {
  event.preventDefault()
  const startY = event.clientY
  const startHeight = referencePaneHeight.value
  const minHeight = 220
  const maxHeight = Math.max(minHeight, Math.floor(window.innerHeight * 0.68))
  const onMouseMove = (e) => {
    const delta = e.clientY - startY
    const height = Math.max(minHeight, Math.min(maxHeight, startHeight + delta))
    referencePaneHeight.value = height
  }
  const onMouseUp = () => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    referencePaneResizeCleanup = null
  }
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  referencePaneResizeCleanup = onMouseUp
}

function parseStreamJson(buffer) {
  const objects = []
  let start = -1
  let depth = 0
  let inString = false
  let escape = false
  
  for (let i = 0; i < buffer.length; i++) {
    const ch = buffer[i]
    if (inString) {
      if (escape) escape = false
      else if (ch === '\\') escape = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') {
      inString = true
      continue
    }
    if (ch === '{') {
      if (depth === 0) start = i
      depth++
      continue
    }
    if (ch === '}') {
      depth--
      if (depth === 0 && start >= 0) {
        const raw = buffer.slice(start, i + 1)
        try {
          objects.push(JSON.parse(raw))
          buffer = buffer.slice(i + 1)
          i = -1
          start = -1
        } catch {
          depth = 0
          start = -1
        }
      }
    }
  }
  return {objects, rest: buffer}
}

function mergeStreamContent(msg, content, {isFinal = false} = {}) {
  if (!msg || !content) return
  const current = msg.answer || ''

  if (isFinal) {
    // Some providers send a full final answer on the last packet.
    // When it clearly looks like the whole answer, replace instead of append.
    const looksFullFinal = current.length > 0 &&
      content.length >= current.length &&
      content.startsWith(current.slice(0, Math.min(24, current.length)))
    if (looksFullFinal) {
      msg.answer = content
      return
    }
  }

  msg.answer = current + content
}

function syncFinalAnswerFromServer(chat, msg, retry = 0) {
  if (!chat?.session_id || !msg || msg.final_synced) return
  if (!msg.id) {
    if (retry < 6) {
      setTimeout(() => syncFinalAnswerFromServer(chat, msg, retry + 1), 250 * (retry + 1))
    }
    return
  }
  return api.qaList(chat.session_id, {
    onError(text, e) {
      console.error(text, e)
    }
  }).then((r) => {
    const rows = Array.isArray(r?.data) ? r.data : []
    const remote = rows.find(item => item?.question_id === msg.id)
    const remoteAnswer = remote?.answer || ''
    if (!remoteAnswer) {
      if (retry < 6) {
        setTimeout(() => syncFinalAnswerFromServer(chat, msg, retry + 1), 250 * (retry + 1))
      }
      return
    }
    msg.answer = remoteAnswer
    msg.force_answer_sync = remoteAnswer
    msg.id = msg.id || remote?.question_id || null
    msg.final_synced = true
  }).catch((e) => {
    console.error('syncFinalAnswerFromServer failed', e)
    if (retry < 6) {
      setTimeout(() => syncFinalAnswerFromServer(chat, msg, retry + 1), 250 * (retry + 1))
    }
  })
}

function changeChat(chat, closeBar = true) {
  currentChat.value = chat
  referencePreview.visible = false
  if (chat.status == 'unload') {
    api.qaList(chat.session_id, {errorText: '会话加载失败'}).then(r => {
      if (!r) return
      r.data.forEach(msg => {
        //define message
        const localMsg = reactive({
          local_key: `qa-${msg.question_id || `${chat.session_id}-${chat.messages.length}`}`,
          question: msg.question,
          id: msg.question_id,
          answer: msg.answer,
          text: (!msg.num_render ? msg.answer : msg.answer.substring(0, msg.num_render)),
          status: (!msg.num_render || msg.num_render >= msg.answer.length) ? 'finished' : 'stop',
          controller: {
            abort() {
            }
          },
          fold: false,
          ref_files: [],
          ref_show: false,
          ref_html_url: '',
          rag_sources: msg.rag_sources || [],
          final_synced: true,
          force_answer_sync: ''
        })
        chat.messages.push(localMsg)
        if (localMsg.status === 'finished') loadReferences(localMsg)
      })
      chat.status = 'ready'
      setTimeout(() => answers.value.scrollTo(0, Number.MAX_SAFE_INTEGER), 300)
    })
  }
  if (screen.type == 'ver' && closeBar) chatsBarActive.value = false
  setTimeout(() => answers.value.scrollTo(0, Number.MAX_SAFE_INTEGER), 300)
}

function delChat(chat, confirm = false) {
  function _delChat() {
    let index = allChats.indexOf(chat)
    if (allChats[index] == currentChat.value) currentChat.value = cachedNewChat
    
    //终止chat的所有请求
    chat.messages.forEach((msg) => {
      msg.controller.abort()
    })
    allChats.splice(index, 1)
    api.sessionDelete(chat.session_id, {
      onError(text, e) {
        console.error(text, e)
      }
    })
  }
  
  if (confirm && settings.comfBefDelSess)
    eventBus.emit('dialog', {
      text: '确定删除该会话吗？',
      onYes(checkVal) {
        settings.comfBefDelSess = checkVal
        _delChat()
      },
      checkText: '每次删除都提示确认',
      checkVal: true,
      type: 'yes_no'
    })
  else
    _delChat()
}

function delAllChat(confirm = false) {
  function _delAllChat() {
    api.sessionClear({
      onError(text, e) {
        console.error(text, e)
      }
    })
    allChats.length = 0;
    currentChat.value = cachedNewChat
  }
  
  if (confirm)
    eventBus.emit('dialog', {
      text: '确定清空所有会话吗？',
      onYes() {
        _delAllChat()
      },
      type: 'yes_no'
    })
  else
    _delAllChat()
}

async function loadChats() {
  let r = await api.sessionList({errorText: '会话列表加载失败，请刷新重试'})
  if (!r) return
  let chats = r.data || []
  let changeID = false
  let AllSessionId = []
  allChats.length = 0;
  chats.forEach(chat => {
    //define chat
    allChats.push({
      title: chat.name,
      session_id: chat.session_id,
      timestamp: chat.timestamp,
      messages: [], rel_ques: [],
      input: '',
      status: 'unload',
      editing: false
    })
    AllSessionId.push(chat.session_id)
    if (chat.session_id == cachedNewChat.session_id) changeID = true
  })
  if (changeID) {
    function generateUUID() {
      let d = new Date().getTime();
      let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
      return uuid;
    };
    let session_id = generateUUID()
    while (AllSessionId.indexOf(session_id) >= 0) session_id = generateUUID()
    cachedNewChat.session_id = session_id
  }
  currentChat.value = cachedNewChat
  
}

let newname = ''

function renameChat(chat, _newname = undefined) {
  if (_newname !== undefined) {
    chat.editing = false
    if (_newname && chat.title != _newname) {
      chat.title = _newname
      api.sessionRename({
        session_id: chat.session_id,
        name: _newname
      }, {
        onError(text, e) {
          console.error(text, e)
        }
      })
    }
  } else {
    newname = chat.title
    chat.editing = true
    nextTick(() => {
      const input = chatMenuTargetDom?.getElementsByClassName('input')?.[0]
      if (input) input.focus()
    })
    
  }
}

function openChatMenu(event, chat, mode = 'button') {
  const menu = chatMenu.value
  const dom = event.currentTarget || event.target
  const parentItem = dom?.closest?.('.chatItem') || dom?.parentElement
  
  chatMenuTarget = chat
  chatMenuTargetDom = parentItem
  chatMenuActive.value = true
  
  nextTick(() => {
    const menuRect = menu.getBoundingClientRect()
    let top = 8
    let left = 8
    
    if (mode === 'cursor') {
      top = event.clientY
      left = event.clientX
    } else {
      const pos = dom.getBoundingClientRect()
      if (screen.type == 'hor') {
        top = pos.bottom
        left = pos.left
      } else {
        top = pos.top
        left = pos.right - menuRect.width
      }
    }
    
    const maxTop = Math.max(8, window.innerHeight - menuRect.height - 8)
    const maxLeft = Math.max(8, window.innerWidth - menuRect.width - 8)
    top = Math.min(Math.max(8, top), maxTop)
    left = Math.min(Math.max(8, left), maxLeft)
    
    menu.style.top = `${top}px`
    menu.style.left = `${left}px`
    menu.style.right = ''
    menu.style.bottom = ''
  })
}

function changeHandler(text = undefined, add = false) {
  if (text != undefined) {
    if (add) {
      currentChat.value.input += text
      inputTextarea.value.value += text
    } else {
      currentChat.value.input = text
      inputTextarea.value.value = text
    }
  }
  inputTextarea.value.style.height = 'auto'
  inputTextarea.value.style.height = inputTextarea.value.scrollHeight + 'px'
}

async function submit(event) {
  event.preventDefault()
  const CC = currentChat.value
  const msgs = CC.messages
  if (msgs.length > 0 && msgs[msgs.length - 1].status === 'unfinished') return
  if (await genAns(CC.input)) {
    changeHandler('')
    CC.rel_ques.length = 0
  }
}

function stop(chat) {
  const msgs = chat.messages
  if (msgs.length <= 0) return
  const msg = msgs[msgs.length - 1]
  if (msg.status === 'unfinished') {
    msg.status = 'stop'
    syncQaRenderProgress(chat, msg, msg.text.length)
  }
}

function restream(msg, chat) {
  msg.status = 'unfinished'
  // TODO如果没接收完刷新怎么办
  rendChat(msg, chat)
}

async function genAns(question, addTo = currentChat.value) {
  question = question.trim()
  if (question.length <= 0) return false
  
  let body = {}
  // 新添会话
  if (allChats.indexOf(addTo) < 0) {
    addTo.title = question
    addTo.timestamp = new Date() / 1000
    addTo.status = 'prepost'
    
    let r = await api.sessionAdd({
      session_id: addTo.session_id,
      name: addTo.title
    }, {errorText: '会话创建失败，请刷新重试'})
    addTo.status = 'ready'
    if (!r) return false
    allChats.push(addTo)
    sortChats()
    newChat()
  }
  //define message
  let msg = reactive({
    local_key: `local-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    question,
    id: null,
    answer: '',
    text: '',
    status: 'unfinished',
    receiveAll: false,
    rendering: false,
    controller: new AbortController(),
    fold: false,
    ref_files: [],
    ref_show: false,
    ref_html_url: '',
    rag_sources: [],
    final_synced: false,
    force_answer_sync: ''
  })
  
  let messages = []
  messages.push({role: 'user', content: question})
  body.messages = body.messages || messages
  body.session_id = body.session_id || addTo.session_id
  body.model = body.model || 'qwen2.5-7b-instruct'
  
  function _error(text, e) {
    if (e.name === 'AbortError') {
      msg.answer = msg.text + '[中止]'
      msg.status = 'stop'
      return
    }
    eventBus.emit('dialog', {text})
    console.error(e);
    msg.answer += `[${text}]`
    msg.status = 'error'
  }
  
  api.chatCompletions(body, {onError: _error}, {signal: msg.controller.signal}).then(r => {
    if (!r) return
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let result = ''
    
    // 循环读取流数据
    function processStream() {
      reader.read().then(({done, value}) => {
        if (done) {
          addTo.timestamp = new Date() / 1000
          msg.receiveAll = true
          syncFinalAnswerFromServer(addTo, msg)
          sortChats()
          return;
        }
        const chunkText = decoder.decode(value, {stream: true})
        result += chunkText
        const parsed = parseStreamJson(result)
        result = parsed.rest
        for (const obj of parsed.objects) {
          const content = obj['choices']?.[0]?.message?.content
          if (content) {
            mergeStreamContent(msg, content, {isFinal: Boolean(obj['final'])})
          }
          if (obj['final']) {
            addTo.timestamp = obj.created || new Date() / 1000
            msg.id = obj['id']
            msg.rag_sources = obj['rag_sources'] || []
            msg.receiveAll = true
            syncFinalAnswerFromServer(addTo, msg)
            sortChats()
          }
        }
        // 继续读取
        processStream();
      }).catch(e => {
        _error('读取异常', e)
      })
    }
    
    processStream()
  })
  addTo.messages.push(msg)
  rendChat(msg, addTo)
  return true
}

function rendChat(msg, chat) {
  if (msg.rendering) return
  msg.rendering = true
  
  //将接收到的答案显示出来
  let i = msg.text.length
  let _scroll = i === 0
  let renderInt = null
  const FPS = 20
  if (settings.printByWord) {
    //逐字显示
    let text = msg.text
    const WordsATick = 1 / FPS * settings.charPerSecond
    let left = 0, endFlag = 0
    
    function appendPendingText() {
      if (i >= msg.answer.length) return false
      const nextIndex = i + WordsATick + left
      text += msg.answer.substring(i, nextIndex)
      i = text.length
      left = nextIndex % 1
      return true
    }
    
    //回答停止
    function _end() {
      clearInterval(renderInt)
      msg.text = text
      msg.rendering = false
    }
    
    function commitText() {
      if (msg.text != text) {
        msg.text = text
      }
    }
    
    //循环往答案中加字
    function _textAdd() {
      if (msg.force_answer_sync) {
        msg.answer = msg.force_answer_sync
        msg.force_answer_sync = ''
        msg.receiveAll = true
        // keep typing animation: continue rendering toward the synced final answer
        if (text.length > msg.answer.length) {
          text = msg.answer
          i = text.length
          commitText()
        }
      }
      if (i >= 1 && _scroll) {
        setTimeout(() => answers.value.scrollTo(0, Number.MAX_SAFE_INTEGER), 500)
        _scroll = false
      }
      if (msg.status === 'stop') {
        _end()
        api.stopGeneration({
          session_id: chat.session_id,
          num_render: msg.text.length
        }, {
          onError(text, e) {
            console.error(text, e)
          }
        })
        syncQaRenderProgress(chat, msg, msg.text.length)
        return
      }
      
      if (appendPendingText()) {
        commitText()
        return
      }
      
      if (msg.status === 'unfinished') {
        if (msg.receiveAll) {
          if (i < msg.answer.length) {
            endFlag = 0
            return;
          } else if (endFlag < 5) {
            endFlag++
            return
          }
          _end()
          commitText()
          msg.status = 'finished'
          syncQaRenderProgress(chat, msg, msg.text.length)
          loadReferences(msg)
        }
      } else if (msg.status !== 'unfinished') {
        if (i < msg.answer.length) {
          endFlag = 0
          return;
        } else if (endFlag < 5) {
          endFlag++
          return
        }
        _end()
        commitText()
      }
    }
    
    renderInt = setInterval(_textAdd, 1000 / FPS)
  } else {
    function _end() {
      clearInterval(renderInt)
      msg.rendering = false
    }
    
    function _update() {
      if (msg.force_answer_sync) {
        msg.answer = msg.force_answer_sync
        msg.text = msg.force_answer_sync
        msg.force_answer_sync = ''
        msg.receiveAll = true
        msg.status = 'finished'
        _end()
        syncQaRenderProgress(chat, msg, msg.text.length)
        loadReferences(msg)
        return
      }
      if (msg.receiveAll) {
        _end()
        msg.text = msg.answer
        msg.status = 'finished'
        syncQaRenderProgress(chat, msg, msg.text.length)
        loadReferences(msg)
        return
      }
      if (msg.status !== 'unfinished') {
        _end()
        msg.text = msg.answer
        if (msg.status === 'stop') api.stopGeneration({
          session_id: chat.session_id,
          num_render: msg.text.length
        }, {
          onError(text, e) {
            console.error(text, e)
          }
        })
        syncQaRenderProgress(chat, msg, msg.text.length)
        return
      }
      if (msg.text != msg.answer) {
        msg.text = msg.answer
        if (msg.text.length >= 1 && _scroll) {
          setTimeout(() => answers.value.scrollTo(0, Number.MAX_SAFE_INTEGER), 500)
          _scroll = false
        }
      }
    }
    
    renderInt = setInterval(_update, 1000 / FPS)
  }
}

function loadReferences(msg) {
  if (!msg.id) return
  return api.referenceGet(msg.id, {
    errorText: '参考资料获取失败',
    onError(text, e) {
      console.error(text, e)
    }
  }).then(r => {
    if (!r || !r.data) return
    const docUrl = toApiUrl(r.data.html_url || '')
    msg.ref_html_url = docUrl
    let files = []
    ;(r.data.reference_files || []).forEach((file, index) => {
      const url = toApiUrl(file?.url || docUrl)
      if (!url) return
      files.push({
        name: file?.name || `参考资料${index + 1}`,
        url
      })
    })
    if (files.length <= 0 && docUrl) {
      files.push({
        name: '参考资料页面',
        url: docUrl
      })
    }
    ;(r.data.knowledge_items || []).forEach(item => {
      if (!docUrl) return
      files.push({
        name: `${item.name}${item.category ? `（${item.category}）` : ''}`,
        url: docUrl
      })
    })
    ;(msg.rag_sources || []).forEach(item => {
      if (!docUrl) return
      if (files.some(file => file.name === item.name)) return
      files.push({
        name: `${item.name}${item.type ? ` [${item.type}]` : ''}`,
        url: docUrl
      })
    })
    msg.ref_files = files
    return {
      url: msg.ref_html_url,
      files: msg.ref_files
    }
  })
}

function syncQaRenderProgress(chat, msg, numRender = msg?.text?.length || 0) {
  if (!chat?.session_id || !msg?.id) return
  return api.qaUpdate({
    session_id: chat.session_id,
    question_id: msg.id,
    num_render: String(numRender)
  }, {
    onError(text, e) {
      console.error(text, e)
    }
  })
}

function viewSingleQaReferences(msg) {
  referencePreview.title = msg?.question || '参考文献'
  referencePreview.visible = true
  referencePreview.loading = true
  referencePreview.error = ''
  referencePreview.url = ''
  loadReferences(msg)?.then((data) => {
    referencePreview.loading = false
    referencePreview.url = data?.url || msg.ref_html_url || msg.ref_files?.[0]?.url || ''
    if (!referencePreview.url) {
      referencePreview.error = '该条问答暂无参考文献'
      return
    }
  }).catch(() => {
    referencePreview.loading = false
    referencePreview.error = '参考文献加载失败'
  })
}

function remove(chat, msg, confirm = false) {
  function _remove(chat, msg) {
    //TODO 删除会话需要stop吗？
    msg.controller.abort()
    let index = chat.messages.indexOf(msg)
    if (chat.messages.length == 1) {
      delChat(chat)
      return
    }
    if (msg.status != 'error') {
      api.qaDelete({
        session_id: chat.session_id,
        question_id: chat.messages[index].id
      }, {
        onError(text, e) {
          console.error(text, e)
        }
      })
    }
    chat.messages.splice(index, 1)
    if (referencePreview.title === msg.question && chat.messages.length <= 0) {
      referencePreview.visible = false
    }
    return index
  }
  
  if (confirm && settings.comfBefDelQues && msg.status != 'error')
    eventBus.emit('dialog', {
      text: '确认要删除该轮提问？',
      onYes(checkVal) {
        settings.comfBefDelQues = checkVal
        _remove(chat, msg)
      },
      checkText: '每次删除都提示确认',
      checkVal: true,
      type: 'yes_no'
    })
  else _remove(chat, msg)
}

function allFold() {
  if (isAllFold.value)
    currentChat.value.messages.forEach((msg) => {
      msg.fold = false
    })
  else
    currentChat.value.messages.forEach((msg) => {
      msg.fold = true
    })
}

async function copy(text) {
  if (!text) return
  await navigator.clipboard.writeText(text);
  eventBus.emit('dialog', {text: '复制成功'})
}

async function exportChat(chat, format) {
  if (chat.messages.length <= 0) return
  let data = null, ext = ''
  let mime = 'text/plain;charset=utf-8'
  if (format === 'markdown') {
    ext = '.md'
    mime = 'text/markdown;charset=utf-8'
    data = ''
    chat.messages.forEach(msg => {
      if (msg.status === 'unfinished' || !msg.text) return
      data += `**${msg.question}**\n\n`
      data += msg.text + '\n\n'
      if (msg.ref_files.length > 0) {
        data += '`参考文档`\n\n'
        msg.ref_files.forEach(file => {
          data += `#### [*${file.name}*](${file.url})\n\n`
        })
      }
      data += '---\n\n'
    })
  } else if (format === 'json') {
    ext = '.json'
    mime = 'application/json;charset=utf-8'
    let msgs = chat.messages.filter(msg => msg.status !== 'unfinished' && msg.text).map(msg => ({
      question: msg.question,
      question_id: msg.id,
      answer: msg.text,
      timestamp: msg.timestamp,
      reference_files: msg.ref_files
    }))
    let session = {
      name: chat.title,
      session_id: chat.session_id,
      questions: msgs
    }
    data = JSON.stringify(session)
  }
  if (data) {
    const defaultFileName = `${chat.session_id}${ext}`
    let exported = false
    try {
      const [{save}, {invoke}] = await Promise.all([
        import('@tauri-apps/plugin-dialog'),
        import('@tauri-apps/api/core')
      ])
      const filePath = await save({
        defaultPath: defaultFileName,
        filters: [{
          name: format === 'json' ? 'JSON 文件' : 'Markdown 文件',
          extensions: [ext.replace('.', '')]
        }]
      })
      if (filePath) {
        await invoke('save_text_file', {
          path: normalizeSelectedPath(filePath),
          content: data
        })
        exported = true
      }
    } catch (e) {
      console.warn('tauri save failed, fallback to browser download', e)
    }
    if (!exported) {
      let _a = document.createElement('a')
      _a.style.display = 'none'
      document.body.appendChild(_a)
      const blob = new Blob([data], {type: mime})
      let url = URL.createObjectURL(blob)
      _a.href = url
      _a.download = defaultFileName
      _a.click()
      document.body.removeChild(_a)
      URL.revokeObjectURL(url)
      exported = true
    }
    if (exported) eventBus.emit('dialog', {text: '导出成功'})
  } else {
    eventBus.emit('dialog', {text: '没有可导出的问答内容'})
  }
}

loadChats()
onBeforeUnmount(() => {
  if (referencePaneResizeCleanup) referencePaneResizeCleanup()
})

</script>

<style scoped>
.area {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.chatsBar {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 0px solid var(--subBgColor);
  transition: width .3s, border .3s;
  width: 0px;
}

.chatsBar.hor.show {
  border-right: 3px solid var(--subBgColor);
  width: 50px;
}

.chatsBar.hor.show.active {
  width: 250px;
}

.chatsBar.ver {
  display: none;
}

.chatsBar.ver.show.active {
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

.functions {
  display: flex;
  flex-direction: column;
}

.toggleBar {
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

.addButton {
  overflow: hidden;
  display: flex;
  background-color: var(--bgColor);
  height: 40px;
  align-items: center;
}

.addButton img {
  height: 25px;
  width: 50px;
  object-fit: contain;
}

.addButton div {
  flex: 1;
  width: 0;
  white-space: nowrap;
}

.chats {
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

.chatItem {
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

.chatItem.active {
  border: 3px solid var(--header-item-active);
}

.chatItem img.chatIcon {
  object-fit: cover;
  width: 25px;
  height: 25px;
  padding-left: 2px;
  padding-right: 7px;
  flex-shrink: 0;
  transition: all .3s;
  max-width: 50px;
}

.chatsBar.active img.chatIcon {
  max-width: 0px;
  padding-left: 0px;
}

.chatItem span {
  flex: 1;
  width: 0;
  overflow: hidden;
  padding: 5px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.chatItem.active span {
  color: var(--header-item-active);
  text-decoration: underline;
}

.chatItem .input {
  flex: 1;
  margin-right: 7px;
  padding: 4.7px;
  font-size: 16px;
}

.chatItem .menuButton {
  overflow: hidden;
  height: 25px;
  max-width: 0;
}

.chatsBar.active .chatItem .menuButton {
  max-width: 100%;
}

.chatMenu {
  position: fixed;
  background-color: var(--bgColor);
  border: 2px solid var(--subBgColor);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  z-index: 25;
  box-shadow: 0px 0px 10px 0px rgba(128, 128, 128, 0.348);
}

.chatMenuItem {
  display: flex;
  align-items: center;
  background: inherit;
  border-radius: 12px;
  padding: 5px;
  margin: 4px 2px;
}

.chatMenuItem:not(:first-child) {
  margin-top: 2px;
}

.chatMenuItem .icon {
  width: 30px;
}

.chatMenuItem .text {
  text-align: center;
  width: 120px;
}

.floatChat {
  position: fixed;
  right: 0;
  top: var(--app-header-height);
  padding: 5px;
  width: 40px;
  height: 40px;
}

.mainArea {
  flex: 1;
  display: flex;
  overflow: hidden;
  flex-direction: column;
  min-height: 0;
  align-items: center;
  justify-content: center;
  position: relative;
}

.loading {
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

.loading.show {
  z-index: 20;
  opacity: 1;
}

.loading img {
  width: 50px;
  height: 50px;
  padding: 20px;
}

.startArea {
  overflow: hidden;
  max-height: 100%;
  opacity: 1;
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.startArea.hasContent {
  transition: all .7s ease-in-out;
  max-height: 0%;
  opacity: 0;
  margin-bottom: 0;
}

.title {
  display: flex;
  align-items: center;
}

.title img {
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

.title span {
  margin: 30px;
  font-size: 24px;
  height: fit-content;
  padding-bottom: 5px;
  background: linear-gradient(to right, var(--text-color) 0%, var(--subBgColor) 80%, rgba(0, 0, 0, 0) 100%) no-repeat bottom left;
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

.subtitle {
  color: var(--holder-color);
  font-size: 15px;
  font-style: italic;
}

.answersArea {
  display: flex;
  flex: 1;
  height: 0;
  min-height: 0;
  width: 100%;
  max-width: 800px;
  flex-direction: column;
  border-left: 3px dashed var(--subBgColor);
  border-right: 3px dashed var(--subBgColor);
  max-height: 0;
  overflow: hidden;
}

.answersArea.hasContent {
  transition: max-height .8s ease-in-out;
  max-height: 100%;
}

.referencePane {
  width: 100%;
  max-width: 800px;
  margin: 10px 0 0 0;
  min-height: 220px;
  border: 2px solid var(--subBgColor);
  border-radius: 12px;
  background: linear-gradient(180deg, var(--subBgColor2), var(--bgColor) 120px);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  position: relative;
}

.referenceToolbar {
  border-bottom: 1px solid var(--subBgColor);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.referenceTitle {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.referenceActions {
  display: flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
}

.referenceActions span, .referenceActions a {
  color: var(--header-item);
  text-decoration: none;
  cursor: pointer;
  border: 1px solid var(--subBgColor);
  border-radius: 999px;
  padding: 4px 10px;
  background: var(--bgColor);
  font-size: 12px;
}

.referenceFrame {
  width: 100%;
  height: 100%;
  border: none;
  min-height: 0;
  flex: 1;
}

.referenceEmpty {
  color: var(--holder-color);
  padding: 24px;
  text-align: center;
  font-size: 13px;
}

.referenceResizeHandle {
  height: 12px;
  cursor: ns-resize;
  border-top: 1px dashed var(--subBgColor);
  background: linear-gradient(180deg, transparent, var(--subBgColor2));
  flex-shrink: 0;
}

.toolbar {
  width: 100%;
  text-align: center;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  transition: all .3s;
}

.toolbar.hor {
  height: 30px;
  padding-top: 0;
  border: 2px solid silver;
  border-top: none;
  border-bottom-right-radius: 10px;
  border-bottom-left-radius: 10px;
}

.toolbar.hor:hover {
  height: 50px;
}

.toolbar.ver {
  height: 50px;
  border-bottom: 2px solid silver;
}

.toolbar .item {
  background-color: var(--bgColor);
  border-left: 2px solid silver;
  padding-top: 12px;
  padding-bottom: 12px;
  flex: 1;
}

.toolbar .item .itemContent {
  display: flex;
  align-items: center;
  justify-content: center;
}

.toolbar .item .icon {
  width: 20px;
  height: 20px;
  margin-right: 5px;
}

.toolbar .item:first-child {
  border-left: none;
}

.answers {
  height: 100%;
  scrollbar-width: none;
  overflow-y: auto;
}

.msg {
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
  from {
    padding: 0;
    overflow: hidden;
    opacity: 0;
    max-height: 0px;
  }
  to {
    max-height: 20000px;
  }
}

/* .chat.unfinished{
} */
.msg .question {
  transition: color .7s;
}

.msg.error .question {
  color: rgb(255, 74, 74);
}

.msg.stop .question {
  color: var(--holder-color);
}

.questionBar {
  display: flex;
  overflow: hidden;
  align-items: center;
  gap: 6px;
}

.question {
  word-break: break-word;
  flex: 1;
}

.question.folded {
  width: 0px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.foldButton {
  width: 25px;
  height: 25px;
  margin-right: 5px;
}

.foldButton .turn {
  transform-origin: 50% 70%;
  transition: all .3s;
}

.foldButton.folded .turn {
  transform: rotate(180deg);
}

.questionBarButton {
  width: 25px;
  height: 25px;
  cursor: pointer;
  user-select: none;
}

.questionTextButton {
  margin-right: 6px;
  font-size: 12px;
  color: var(--bgColor);
  background: linear-gradient(90deg, var(--header-item), var(--header-item-active));
  border-radius: 999px;
  padding: 3px 9px;
  cursor: pointer;
  white-space: nowrap;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  text-decoration: none;
}

.thinking {
  position: relative;
  padding-left: 2px;
  padding-right: 2px;
}

.thinking::before, .thinking::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  border: 2px solid var(--text-color);
}

.thinking::before {
  animation: borderline 3s infinite linear;
}

.thinking::after {
  animation: borderline 3s infinite -1.5s linear;
}

@keyframes borderline {
  0%, 100% {
    clip-path: inset(95% 0 0 0);
  }
  25% {
    clip-path: inset(0 95% 0 0);
  }
  50% {
    clip-path: inset(0 0 95% 0);
  }
  75% {
    clip-path: inset(0 0 0 95%);
  }
}

.foldable {
  display: flex;
  flex-direction: column;
}

.streamText {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.75;
}

.answerBody {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows .25s ease, opacity .2s ease, margin-top .25s ease;
  margin-top: 8px;
}

.answerBody.collapsed {
  grid-template-rows: 0fr;
  opacity: 0;
  margin-top: 0;
}

.answerBodyInner {
  overflow: hidden;
  min-height: 0;
}

.continueButton {
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

.refFiles {
  max-width: 100%;
  border: 1px solid var(--text-color);
  padding: 3px;
  width: fit-content;
  align-self: flex-end;
  font-size: 15px;
}

.filesTitle {
  text-align: center;
  color: var(--holder-color);
  user-select: none;
}

.filesItems {
  height: 0;
  overflow: hidden;
}

.filesItems.show {
  height: auto;
}

.filesItem {
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

.filesItem:hover {
  color: rgb(0, 162, 255);
}

.filesItemButton {
  cursor: pointer;
}

.relQues {
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
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.quesTitle {
  margin: 5px;
  margin-left: 15px;
  font-size: 15px;
  font-style: italic;
  flex-shrink: 0;
}

.quesItems {
  display: flex;
  flex-direction: column;
}

.quesItem {
  margin: 5px;
  padding: 14px;
  border-radius: 10px;
  background-color: var(--subBgColor2);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  user-select: unset;
}

.requestArea {
  background-color: var(--bgColor);
  box-shadow: 0 -10px 10px 0 var(--bgColor);
  width: 100%;
  max-width: 800px;
  z-index: 10;
  display: flex;
  justify-content: center;
  margin-bottom: 120px;
}

.requestArea.hasContent {
  margin-bottom: 0;
}

.requestHint {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--holder-color);
  font-size: 13px;
  margin-bottom: 10px;
}

.requestHint span {
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--subBgColor2);
}

.request {
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

.request.hor {
  flex-direction: column;
  align-items: stretch;
}

.request.ver {
  padding-left: 12px;
  padding-right: 12px;
}

.requestbox {
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

.requestbox::-webkit-input-placeholder {
  color: var(--holder-color);
}

.requestbox.ver {
  scrollbar-width: none;
}

.submitRow.hor {
  width: 100%;
}

.submitRow .submit, .submitRow .stop {
  float: right;
  height: 35px;
  width: 35px;
}

@media (max-width: 720px) {
  .referencePane {
    width: calc(100% - 16px);
    min-height: 180px;
  }
  
  .requestHint {
    flex-wrap: wrap;
  }
}
</style>
