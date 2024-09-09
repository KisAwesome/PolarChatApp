const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    from:String,
    channel:String,
    time:Number,
    message:String,
    sysalert:{type:Boolean,default:false}
})



module.exports = mongoose.model('Message', MessageSchema)