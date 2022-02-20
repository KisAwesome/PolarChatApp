const path = require('path');
const ejsMate = require('ejs-mate')
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const User = require('./models/user');
const express = require('express');
const localpassport = require('passport-local-mongoose')
const WebError = require('./utils/Error')
const middleware = require('./utils/middleware')
const userModel = require('./models/user')
const channelModel = require('./models/channel')
const MongoStore = require('connect-mongodb-session')(session)
const utilFuncs = require('./utils/utils')
const messageModel = require('./models/message');
const ObjectId = mongoose.Types.ObjectId;
const logger = require('morgan')
const helmet = require('helmet')
const hpp = require('hpp')
const mongoSanitize = require('express-mongo-sanitize');
const bodyParser = require('body-parser')
const rateLimiter = require('express-rate-limit')
const MongoRateLimitStore = require('rate-limit-mongo')
// const sharedsession = require("express-socket.io-session");




const server = express()
const http_server = require("http").createServer(server)
const io = require('socket.io')(http_server)


const dbUrl = 'mongodb+srv://main:ur8ZpkjmTGm3MdAn@cluster0.5g5bk.mongodb.net/WebChatApp?retryWrites=true&w=majority';
mongoose.connect(dbUrl, {});


function sendToAllSockets(socket,sockets,path,event){
    for (let i of sockets){
        socket.to(i).emit(path,event)
    }
}


const registerLimiter = rateLimiter.rateLimit({
    windowMs:24*60*1000,
    max:1,
    standardHeaders: true, 

})


function isValidObjectId(id){
    if(ObjectId.isValid(id)){
        if((String)(new ObjectId(id)) === id)
            return true;        
        return false;
    }
    return false;
}
  
async function getSessionUser(user){
    res = await MongoSessionStore.db.collection('sessions').findOne({'session.passport.user':user})
    return res
}

async function getUser(username){
    return userModel.findOne({username})
}

// change
const secret = 'fdsfs'
const MongoSessionStore = new MongoStore({
    uri: dbUrl,
    collection: 'sessions'
  });
const sessionConfig = {
    store:MongoSessionStore,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}



const session_instance = session(sessionConfig)
// server.use(logger('dev'))
server.use(session_instance);
server.use(flash());
server.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );
server.use(mongoSanitize( {replaceWith: '_'}))
server.engine('ejs', ejsMate)
server.set('view engine', 'ejs');
server.set('views', path.join(__dirname, 'views'))
server.disable('x-powered-by')
server.use(express.urlencoded({ extended: true }));
server.use(bodyParser.json())
server.use(express.static(path.join(__dirname, 'public')))
server.use(hpp())
server.use(passport.initialize());
server.use(passport.session());
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

io.use(wrap(session_instance));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));
io.use(wrap(mongoSanitize({replaceWith:'_'})))

io.use((socket, next) => {
    if (socket.request.isAuthenticated()) {
      next();
    } else {
      next(new Error('You must be logged in to init a socket.io connection'))
    }
  });


  
io.on('connect', (socket) => {
    socket.on('whoami', (cb) => {
        cb(socket.request.user ? socket.request.user.username : '');
    });

    socket.on('send_message', async (message_info,cb)=>{
        try{

            const {channel,message} = message_info
            if (!(channel && message)){
                return cb({success:false,info:"Incomplete form"})
            }
            if (!isValidObjectId(channel)){
                return cb({success:false,info:'Invalid object id'})
            }

            
            const channelInfo = await channelModel.findById(channel)
            if (!channelInfo.participants.includes(socket.request.user.username)){
                return cb({success:false,info:'You cannot send a message here'})
            }
            if (!channelInfo){
                return cb({success:false,info:'Conversation does not exist'})
                
            }
            const messageInfo = {channel,from:socket.request.user.username,message,time:Date.now()}
            const messageDocument = new messageModel(messageInfo)
            await messageDocument.save()
            messageInfo.id = messageDocument._id
            cb({success:true,message:messageInfo})
            for (let i of channelInfo.participants){
                if (i===socket.request.user.username){
                    continue
                }
                let session = await getSessionUser(i)
                if (session){
                    socket.to(session.socketId).emit('message',messageInfo)
                }
                
            }
            }catch (e){
                console.log(e)
            }
            

    })
 
    socket.on('openconversation',async (user,cb)=>{
        try{

            if (user === socket.request.user.username){
                return cb({success:false,info:"Can't start a conversation with self"})
            }
            const conv = await channelModel.findOne({
                private:true,
                participants:{'$all':[user,socket.request.user.username]}
                
            })
            
            if (!await getUser(user)){
                return cb({success:false,info:'Account does not exist'})
            }
            
            if (conv){
                return cb({success:false,info:"Conversation already exists"})
            }
            const channelInfo = {participants:[user,socket.request.user.username],private:true,name:''}
            const channel = new channelModel(channelInfo)
            await channel.save()
            cb({success:true,info:'Created successfully',id:channel.id})
            channelInfo.id = channel.id
            channelInfo.from = socket.request.user.username
            // await sendSessionEvent(user,'conversation',channelInfo,socket)
            let session = await getSessionUser(user)
            if (session){
                socket.to(session.socketId).emit('conversation',channelInfo)
            }
        }
    catch (e){
        console.log(e)
    }


    })

    const session = socket.request.session;
    // if (!session.sockets){
        // session.sockets = []
    // }
    socket.join()
    session.socketId = socket.id
    session.save();
});

server.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

server.get('/',(req,res)=>{
    if (req.isAuthenticated()){
        return res.redirect('/app')
    }
    res.render('register')
})

server.get('/login',(req,res)=>{
    res.render('login')
})

server.post('/login',passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }),(req,res)=>{
    const redirectUrl = req.session.returnTo || '/app';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
})

server.get('/register',(req,res)=>{
    res.render('register')
})

server.get('/userstatus',async (req,res)=>{
 
})

server.get('/app',middleware.isLoggedIn,(req,res)=>{
    res.render('index')
})

server.post('/register',(req,res,next)=>{
    try {
        const {username, password } = req.body
        const user = new User({ username })
        const registeredUser = User.register(user, password).then((d)=>{
            req.flash('success','Account made successfully now login')
            res.redirect('/login')
        }).catch((err)=>{
            if (err instanceof localpassport.errors.UserExistsError){
                req.flash('error','A user with the given username is already registered')
                res.redirect('/register')

            }

        })
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/register');
    }
})

server.post('/conversations',middleware.isLoggedIn,utilFuncs.catchAsync(async (req,res)=>{
    const conversations = await channelModel.find({participants:{$all:[req.user.username]}})
    const ClientConversations = []
    for (let conv of conversations){
        const conversation = JSON.parse(JSON.stringify(conv))
        let lastmessage = (await messageModel.find({channel:conv._id})).pop()
        if (lastmessage){
            conversation.message = lastmessage
        }else{
            conversation.message = null
        }
        ClientConversations.push(conversation)
    }
    res.send(ClientConversations)

}))

server.post('/typing',middleware.isLoggedIn,utilFuncs.catchAsync(async (req,res)=>{
    if (!isValidObjectId(req.body.channel)){
        return res.send({success:false,info:'Unvalid channel id'})
    }

    let channel = await channelModel.findById(req.body.channel)
    if (!channel){
        return res.send({success:false,info:'Conversation does not exist'})
    }
    if (!channel.participants.includes(req.user.username)){
        return res.status(401).send({success:false,info:'You do not have access to this conversation'})
    }
    if (req.body.typing){
        req.session.typing = req.body.channel
        
    }else{
        req.session.typing = false
    }
    req.session.save()
    res.send({success:true})
}))


server.post('/status',middleware.isLoggedIn,utilFuncs.catchAsync(async (req,res)=>{
    const session = await getSessionUser(req.body.user)
    if (!isValidObjectId(req.body.channel)){
        return res.send({success:false,info:'Unvalid channel id'})
    }

    let channel = await channelModel.findById(req.body.channel)
    if (!channel){
        return res.send({success:false,info:'Conversation does not exist'})
    }
    if (!channel.participants.includes(req.user.username)){
        return res.status(401).send({success:false,info:'You do not have access to this conversation'})
    }

    if (!session){
        return res.send({online:false,typing:false})
    }

    const sockets = (await io.fetchSockets()).map(socket => socket.id);
    if (session.typing && !sockets.includes(session.session.socketId)){
        session.typing = false
        MongoSessionStore.set(session._id,session,err=>{})
        return res.send({online:false,typing:false})
    }

    const typing = session.session.typing === req.body.channel
    res.send({typing,online:sockets.includes(session.session.socketId)})

}))

server.post('/messages',middleware.isLoggedIn,utilFuncs.catchAsync(async (req,res) =>{
    if (!isValidObjectId(req.body.channel)){
        return res.send({success:false,info:'Unvalid channel id'})
    }

    let channel = await channelModel.findById(req.body.channel)
    if (!channel){
        return res.send({success:false,info:'Conversation does not exist'})
    }
    if (!channel.participants.includes(req.user.username)){
        return res.status(401).send({success:false,info:'You do not have access to this conversation'})
    }

    res.send((await messageModel.find({channel:req.body.channel})) || [])

}))


server.all('*', (req, res, next) => {
    next(new WebError('Page Not Found', 404))
})

server.use((err, req, res, next) => {
    console.log(err)
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
})




http_server.listen(process.env.PORT)
// server.listen(3030,'localhost',()=>{console.log('Server is on')})


