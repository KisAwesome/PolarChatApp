const mongoose = require('mongoose');

const ChannelSchema = new mongoose.Schema({
    participants:[String],
    name:String,
    private:Boolean,
    time:Number,
    opener:String
})



module.exports = mongoose.model('Channel',ChannelSchema)