const toggleButton = document.querySelector('.dark-light');
const colors = document.querySelectorAll('.color');


var loaded = false
const socket = io();
socket.on('message',(message)=>{
  const lastmessage = document.getElementById(`${message.channel}-lastmessage`)
  const lastmessagetime  = document.getElementById(`${message.channel}-lastmessagetime`)
  lastmessage.innerText = message.message
  let formtime = ms(Date.now()-message.time)
  conversations[message.channel].lastmessage_timestamp = message.time
  if (formtime.includes('ms')){
    formtime = '1s'

  }
  lastmessagetime.innerText = formtime
  if (!selected){return}
  if (selected.dataset.channelid===message.channel){
    renderMessage(message.message,strftime('%a %e %b %I:%M %p',new Date(message.time)),false,message.id)
    conversations[message.channel].messages.push(message)
  }else if (conversations[message.channel].messages){
    conversations[message.channel].messages.push(message)

  }
  else{

  }

})


const conversations = {}
var selected
let typing = false

function createAlert(message,type){
  const wrapper = document.createElement('div')
  wrapper.classList.add('contact-alert')
  wrapper.innerHTML = '<div class="alert alert-' + type + ' alert-dismissible" role="alert" id="conversationAlert">' +'<p id="contactErrorText">'+message+'</p>'+ '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>'
  return wrapper

}

socket.on('conversation',(conversation)=>{
  if (conversation.private){
    renderConversation(conversation.from,'','',conversation.id,conversation.participants,true)

  }
})


async function reload(){
  for (let k in conversations){
    let conversation = conversations[k]
    if (conversation.private){
      let resp = await axios.post('/status',{user:conversation.name,channel:k})
      let info =resp.data
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
      
      if (!selected){return}
      if (selected.dataset.channelid ===k){
        if (info.typing){
          document.getElementById('contact-label').innerText = `${conversation.name} is typing`
        }else{
          document.getElementById('contact-label').innerText = conversation.name
        }



      }
      
    }

  }
}


socket.on('connect', () => {
  socket.emit('whoami', (username) => {
    socket.username = username
    if (!loaded){
      
      axios.post('/conversations', {
      })
      .then(function (response) {
        console.log(response.data)
        for (let i of response.data){
          if (i.private){
            const _name = i.participants.filter(x=>x!==socket.username)
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
          }
        }
      })
      .catch(function (error) {
        console.log(error);
      });
      loaded = true
    }
      
  })
})
// socket.onAny((event, ...args) => {
//     console.log(event, args);
//   });

function openConversation(){
  let AcountEntry = document.getElementById('accountentry')
  if (!AcountEntry.value){
    return
  }
  socket.emit('openconversation',AcountEntry.value,(resp)=>{
    if (resp.success){
      showPopUp()
      renderConversation(AcountEntry.value,'','',resp.id,[AcountEntry.value,socket.username],true)

    }else{
      let previousError = document.getElementById('contactErrorText')
      console.log(previousError)
      if (previousError){
        previousError.innerText = resp.info
      }
      else{
        let error = createAlert(resp.info,'danger')
        let popup = document.getElementById("Popup");
        popup.prepend(error)

      }
    }
  })
  
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
    const chatArea = document.getElementById('chat-area')
    while (chatArea.firstChild) {
      chatArea.removeChild(chatArea.firstChild);
  }
    if (selected){
      selected.classList.remove('active')
    }
    selected = ev.path[0]
    const channelId = selected.dataset.channelid
    ev.path[0].classList.add('active')
    document.getElementById('contact-label').innerText = ev.path[0].innerText
    if (!conversations[channelId].messages){
      let resp = await axios.post('/messages',{channel:channelId})
      conversations[channelId].messages = resp.data
    }
    for (let i of conversations[channelId].messages){
      let owner = false
      if (i.from === socket.username){
        owner = true
      }
      renderMessage(i.message,strftime('%a %e %b %I:%M %p',new Date(i.time)),owner,i._id)
    }


  }
})


function sendMessage(){
  if (!selected){return}
  if (!messageEntry.value){return}
  socket.emit('send_message',{channel:selected.dataset.channelid,message:messageEntry.value},(resp)=>{
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
      renderMessage(messageEntry.value,strftime('%a %e %b %I:%M %p',new Date(resp.message.time)),true,resp.message.id)
      messageEntry.value = ''
      axios.post('/typing',{channel:selected.dataset.channelid,typing:false})
    }
  })
}

const messageEntry = document.getElementById('messsage-input')
messageEntry.addEventListener('keyup',(event)=>{
  if (event.keyCode === 13) {
    return sendMessage()
  }
  if (!selected){return}
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
  conversations[id] = {name,lastmessage,time,participants,messages:undefined,private:private,lastmessage_timestamp}
  

}

function renderMessage(message,time,owner,id){
  let mainDiv = document.createElement('div')
  mainDiv.dataset.id = id
  mainDiv.classList.add('chat-msg')
  if (owner){
    mainDiv.classList.add('owner')
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
    if (!conversation.lastmessage_timestamp){continue}
    let formtime = ms(Date.now()-conversation.lastmessage_timestamp)
    if (formtime.includes('ms')){
      formtime = '1s'
  
    }
    lastmessagetime.innerText = formtime



  }
}
setInterval(refresh_timings,990)
setInterval(reload,400)