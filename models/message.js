const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    from:String,
    channel:String,
    time:Number,
    message:String
})



module.exports = mongoose.model('Message',MessageSchema)