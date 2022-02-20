const mongoose = require('mongoose');

const ChannelSchema = new mongoose.Schema({
    participants:[String],
    name:String,
    private:Boolean
})



module.exports = mongoose.model('Channel',ChannelSchema)