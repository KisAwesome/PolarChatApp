const toggleButton = document.querySelector('.dark-light');
const colors = document.querySelectorAll('.color');

const CurrentUser = document.getElementById('user-store').dataset.username


loadConversations()

let refreshInterval
let reloadInterval 

var loaded = false
const socket = io();




socket.on('new_member',(member)=>{
  const message = member.alert

  if (selected && selected.dataset.channelid===message.channel){
    renderSystemAlert(message.message,strftime('%a %e %b %I:%M %p',message.time))
    renderParticipant(member.user)
    conversations[message.channel].messages.push(message)
  }else if (conversations[message.channel].messages){
    conversations[message.channel].messages.push(message)

  }
  else{

  }
  conversations[message.channel].participants.push(member.user)


})

socket.on('message',(message)=>{
  if (conversations[message.channel].messageIds.includes(message.id)) return
  const lastmessage = document.getElementById(`${message.channel}-lastmessage`)
  const lastmessagetime  = document.getElementById(`${message.channel}-lastmessagetime`)
  lastmessage.innerText = message.message
  let formtime = ms(Date.now()-message.time)
  conversations[message.channel].lastmessage_timestamp = message.time
  if (formtime.includes('ms')){
    formtime = '1s'

  }
  lastmessagetime.innerText = formtime
  if (!selected) return
  if (selected.dataset.channelid===message.channel){
    let sender = null
    const messageIds = conversations[message.channel].messages
    if (!conversations[message.channel].private) sender = message.from
    renderMessage(message.message,strftime('%a %e %b %I:%M %p',message.time),false,message.id,sender)
    conversations[message.channel].messages.push(message)
    conversations[message.channel].messageIds.push(message.id)
  }else if (conversations[message.channel].messages){
    conversations[message.channel].messages.push(message)
    conversations[message.channel].messageIds.push(message.id)

  }
  else{

  }

})


const conversations = {}
var selected
let typing = false

function createAlert(message,type,id='contactErrorText'){
  const wrapper = document.createElement('div')
  wrapper.classList.add('contact-alert')
  wrapper.innerHTML = '<div class="alert alert-' + type + ' alert-dismissible" role="alert" id="conversationAlert">' +`<p id="${id}">${message}</p>` + '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>'
  return wrapper

}


function test(member){
  const message = member.alert
  if (selected.dataset.channelid===message.channel){
    renderSystemAlert(message.message,strftime('%a %e %b %I:%M %p',message.time))
    renderParticipant(member.user)
    conversations[message.channel].messages.push(message)
  }else if (conversations[message.channel].messages){
    conversations[message.channel].messages.push(message)

  }
  else{

  }
  conversations[message.channel].participants.push(member.user)

  
  
}

function createNonDismissableAlert(message,type){
  const wrapper = document.createElement('div')
  wrapper.classList.add('system-alert')
  wrapper.innerHTML = `<div class="alert alert-${type} conv-alert-inner" role="alert"><div class="system-alert-text">${message}</div></div>`
  return wrapper

}

socket.on('conversation',(conversation)=>{
  if (conversation.private){
    renderConversation(conversation.from,'','',conversation.id,conversation.participants,true)

  }else{
    let message,time
    if (conversation.lastmessage){
      message = conversation.lastmessage
      time = ms(Date.now()-conversation.lastmessage.time)

    }
    else{
      message = ''
      time = ''
    }
    if (conversation.lastmessage){
      renderConversation(conversation.name,message,time,conversation.id,conversation.participants,false,conversation.lastmessage.time)
    }else{
      renderConversation(conversation.name,message,time,conversation.id,conversation.participants,false)
    }
  }
})


async function reload(){
  const convos_ = []
  for (let k in conversations){
    const conversation = conversations[k]
    if (conversation.private){
      convos_.push({user:conversation.name,channel:k})
    }

  }
  shown = !document.getElementById('detail-area').classList.contains('hidden')
  if (selected &&shown){
    const par = []
    for (let i of conversations[selected.dataset.channelid].participants){
      par.push({user:i,channel:selected.dataset.channelid})
    }
    convos_.push(...par)
  }

  const resp = await axios.post('/status',{users:convos_})
  const data = resp.data
  if (selected &&shown){
    for (let i of conversations[selected.dataset.channelid].participants){
      const el = document.getElementById(`${i}-pardiv`)
      if (!el) continue
      const info = data[i]
      if (!info) continue
      const parel = document.getElementById(`${i}-parmdiv`)
      if (info.online){
        parel.classList.add('online-par')
      }else{
        parel.classList.remove('online-par')
      }
      
      if (info.typing){
        el.innerText = `${i} is typing`
      }else{
        if (el.innerText !== i){
          el.innerText = i 
        }
      }
    }

  }

  for (let k in conversations){
    let conversation = conversations[k]
    if (conversation.private){
      let info = data[conversation.name]
      if (!info) return
      let conversationElement = document.getElementById(k)


      if (info.online){
        conversationElement.classList.add('online')
        
      }else{
        conversationElement.classList.remove('online')
        
      }

      let userDiv = document.getElementById(`${k}-userdiv`)
      if (info.typing){
        userDiv.innerText = `${conversation.name} is typing`

      }else{

        userDiv.innerText = conversation.name
      }
      
      if (!selected) return
      if (selected.dataset.channelid ===k){
        if (info.typing){
          document.getElementById('contact-label').innerText = `${conversation.name} is typing`
        }else{
          if ( document.getElementById('contact-label').innerText !== conversation.name) document.getElementById('contact-label').innerText = conversation.name
        }



      }
      
    }

  }
}



function openConversation(){
  let AcountEntry = document.getElementById('accountentry')
  if (!AcountEntry.value){
    return
  }
  socket.emit('openconversation',AcountEntry.value,(resp)=>{
    if (resp.success){
      showPopUp()
      renderConversation(AcountEntry.value,'','',resp.id,[AcountEntry.value,CurrentUser],true)

    }else{
      let previousError = document.getElementById('contactErrorText')
      if (previousError){
        previousError.innerText = resp.info
      }
      else{
        let error = createAlert(resp.info,'danger')
        let popup = document.getElementById("dm");
        popup.prepend(error)

      }
    }
  })
  
}

document.getElementById('info-toggle').addEventListener('click',(e) =>{
  document.getElementById('detail-area').classList.toggle('hidden')
}
)
function selectAddMode(evt, evtype) {
  var i, tabcontent, tablinks;

  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  document.getElementById(evtype).style.display = "block";
  evt.currentTarget.className += " active";
}
function showPopUp() {
  let popup = document.getElementById("Popup");
  popup.classList.toggle("show");
}
document.getElementById('Popup').addEventListener('click',(ev)=>{
    ev.stopPropagation()
})

document.getElementById('conversations').addEventListener('click', async (ev)=>{
  if (ev.path[0].classList.contains('msg')){
    document.getElementById('contact-label').innerText = ev.path[0].innerText
    const chatArea = document.getElementById('chat-area')
    while (chatArea.firstChild) {
      chatArea.removeChild(chatArea.firstChild);
  }
    if (selected){
      selected.classList.remove('active')
    }
    selected = ev.path[0]
    const channelId = selected.dataset.channelid
    document.getElementById('contact-label').innerText = conversations[channelId].name
    while (document.getElementById('participant-area').firstChild){
      document.getElementById('participant-area').removeChild(document.getElementById('participant-area').firstChild)
    }
    for (let i of conversations[channelId].participants){
      renderParticipant(i)
    }
    if (conversations[channelId].private){ 
      document.getElementById('add-member').classList.add('hidden')
      messageEntry.placeholder = `Message @${conversations[channelId].name}`
    }else{
      document.getElementById('add-member').classList.remove('hidden')
      messageEntry.placeholder = `Message ${conversations[channelId].name}`
    }
    ev.path[0].classList.add('active')
    if (!conversations[channelId].messages){
      let resp = await axios.post('/messages',{channel:channelId})
      conversations[channelId].messages = resp.data
    }
    conversations[channelId].messageIds = []
    for (let i of conversations[channelId].messages){
      conversations[channelId].messageIds.push(i._id)
      let owner = false
      if (i.from === CurrentUser){
        owner = true
      }
      let sender
      if (conversations[channelId].private) sender = null 
      else sender = i.from
      if (i.sysalert){
        renderSystemAlert(i.message,strftime('%a %e %b %I:%M %p',new Date(i.time)))
      }else{
        renderMessage(i.message,strftime('%a %e %b %I:%M %p',new Date(i.time)),owner,i._id,sender)
      }
    }


  }
})


function sendMessage(){
  const msgValue = messageEntry.value
  messageEntry.value = ''
  if (!selected) return
  if (!msgValue) return
  if(messageEntry.value.length>2048) return
  socket.emit('send_message',{channel:selected.dataset.channelid,message:msgValue},(resp)=>{
    if (resp.success){
      const message = resp.message
      const lastmessage = document.getElementById(`${message.channel}-lastmessage`)
      const lastmessagetime  = document.getElementById(`${message.channel}-lastmessagetime`)
      lastmessage.innerText = message.message
      let formtime = ms(Date.now()-message.time)
      conversations[message.channel].lastmessage_timestamp = message.time
      if (formtime.includes('ms')){
        formtime = '1s'
    
      }
      lastmessagetime.innerText = formtime
      renderMessage(message.message,strftime('%a %e %b %I:%M %p',new Date(resp.message.time)),true,resp.message.id)
      axios.post('/typing',{channel:selected.dataset.channelid,typing:false})
    }
  })
}

const messageEntry = document.getElementById('messsage-input')
messageEntry.addEventListener('keyup',(event)=>{
  if (event.keyCode === 13) {
    return sendMessage()
  }
  if (!selected) return
  let val = messageEntry.value.trim()
  let state
  if (val){
    state = true

  }else{
    state = false
  }

  if (state !== typing){
    typing = state
  }
  axios.post('/typing',{channel:selected.dataset.channelid,typing:state})

})


// Dark mode 
colors.forEach(color => {
  color.addEventListener('click', e => {
    colors.forEach(c => c.classList.remove('selected'));
    const theme = color.getAttribute('data-color');
    document.body.setAttribute('data-theme', theme);
    color.classList.add('selected');
  });
});

toggleButton.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});



// message+conversation rendering
function renderConversation(name,lastmessage,time,id,participants,private,lastmessage_timestamp){
  if (!id) return
  if (id in conversations) return
  let maindiv = document.createElement('div')
  maindiv.dataset.channelid = id
  maindiv.dataset.private = private
  maindiv.classList.add('msg')
  let detailDiv = document.createElement('div')
  maindiv.appendChild(detailDiv)
  detailDiv.classList.add('msg-detail')
  let namediv = document.createElement('div')
  namediv.id = `${id}-userdiv`
  namediv.classList.add('msg-username')
  namediv.innerText = name
  detailDiv.appendChild(namediv)
  let messageContent = document.createElement('div')
  detailDiv.appendChild(messageContent)
  messageContent.classList.add('msg-content')
  let msgspan = document.createElement('span')
  msgspan.id = `${id}-lastmessage`
  msgspan.classList.add('msg-message')
  msgspan.innerText = lastmessage
  messageContent.appendChild(msgspan)
  let timespan = document.createElement('span')
  timespan.classList.add('msg-date')
  timespan.id = `${id}-lastmessagetime`
  timespan.innerText = time
  messageContent.appendChild(timespan)
  document.getElementById('conversations').appendChild(maindiv)
  maindiv.id = id
  conversations[id] = {name,lastmessage,time,participants,messages:undefined,private:private,lastmessage_timestamp,messageIds:[]}
  

}


function renderParticipant(name){
  let maindiv = document.createElement('div')
  maindiv.classList.add('msg')
  let detailDiv = document.createElement('div')
  maindiv.appendChild(detailDiv)
  detailDiv.classList.add('msg-detail')
  let namediv = document.createElement('div')
  namediv.id = `${name}-pardiv`
  maindiv.id = `${name}-parmdiv`
  namediv.classList.add('msg-username')
  namediv.innerText = name
  detailDiv.appendChild(namediv)
  document.getElementById('participant-area').appendChild(maindiv)


}

function renderSystemAlert(message,time){
  const alert = createNonDismissableAlert(message,'primary')
  alert.classList.add('system-alert')
  const chatArea = document.getElementById('chat-area')
  chatArea.appendChild(alert)
  chatArea.scroll({ top: chatArea.scrollHeight, behavior: 'smooth' });

}

function renderMessage(message,time,owner,id,sender=null){
  let mainDiv = document.createElement('div')
  mainDiv.dataset.id = id
  mainDiv.classList.add('chat-msg')
  if (owner){
    mainDiv.classList.add('owner')
  }
  if (sender && !owner){
    const senderDiv = document.createElement('div')
    senderDiv.classList.add('chat-msg-profile')
    senderDiv.innerText = sender
    mainDiv.appendChild(senderDiv)
  }
  let profileDiv = document.createElement('div')
  profileDiv.classList.add('chat-msg-profile')
  let timeMain = document.createElement('div')
  timeMain.classList.add('chat-msg-date')
  timeMain.innerText = time
  profileDiv.appendChild(timeMain)
  let messageContent = document.createElement('div')
  mainDiv.appendChild(profileDiv)
  messageContent.classList.add('chat-msg-content')
  mainDiv.appendChild(messageContent)
  let messageText = document.createElement('div')
  messageText.classList.add('chat-msg-text')
  messageContent.appendChild(messageText)
  messageText.innerText = message
  const chatArea = document.getElementById('chat-area')
  chatArea.appendChild(mainDiv)
  chatArea.scroll({ top: chatArea.scrollHeight, behavior: 'smooth' });

}

function refresh_timings(){
  for (let id in conversations){
    let conversation = conversations[id]
    const lastmessagetime  = document.getElementById(`${id}-lastmessagetime`)
    if (!conversation.lastmessage_timestamp) continue
    let formtime = ms(Date.now()-conversation.lastmessage_timestamp)
    if (formtime.includes('ms')){
      formtime = '1s'
  
    }
    lastmessagetime.innerText = formtime
  }

}

async function createGroupChat(){
  const gcentry = document.getElementById('gcentry')
  if (!gcentry.value) return
  const resp = await axios.post('/creategroupchat',{name:gcentry.value})
  const channel = resp.data.channel
  renderConversation(channel.name,'','',channel.id,channel.participants,false)

}

async function addMember(){
  const memberEntry = document.getElementById('GroupMemberEntry')
  if (!memberEntry.value) return
  socket.emit('add_member',{channel:selected.dataset.channelid,member:memberEntry.value},(resp)=>{
    if (resp.success){
      renderParticipant(messageEntry.value)
      conversations[selected.dataset.channelid].participants.push(memberEntry.value)

    }
    else{
      const previousAlert = document.getElementById('AddMemberError')
      if (previousAlert){
        previousAlert.innerText = resp.info
      }else{

        const alert = createAlert(resp.info,'danger','AddMemberError')
        document.getElementById('add-member').prepend(alert)
      }
    }
    
  })
}

async function loadConversations(){
  if (loaded) return 
  const response = await axios.post('/conversations', {
  })
  for (let i of response.data){
    if (i.private){
      const _name = i.participants.filter(x=>x!==CurrentUser)
      const name = _name[0]
      let message,time
      if (i.message){
        message = i.message.message
        time = ms(Date.now()-i.message.time)

      }
      else{
        message = ''
        time = ''
      }
      if (i.message){
        renderConversation(name,message,time,i._id,i.participants,true,i.message.time)
      }else{
        renderConversation(name,message,time,i._id,i.participants,true)

  

      }
    }else{
      let message,time
      if (i.message){
        message = i.message.message
        time = ms(Date.now()-i.message.time)
        
      }
      else{
        message = ''
        time = ''
      }
      if (i.message){
        renderConversation(i.name,message,time,i._id,i.participants,false,i.message.time)
      }
      else{
        renderConversation(i.name,message,time,i._id,i.participants,false)

      }
    }
  }
  loaded = true
}

reloadInterval = setInterval(reload,400)
refreshInterval = setInterval(refresh_timings,1000*60)