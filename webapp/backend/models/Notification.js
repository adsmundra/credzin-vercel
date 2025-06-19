const mongoose = require("mongoose");

const Notification= new mongoose.Schema({
    User_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    Activity:{
        type:String,
        require:true,
    },
    Status:{
        type:String
    },
    createdAt: {
    type: Date,
    default: Date.now,
  },
  LastUpdatedAt: {
    type: Date,
    default: Date.now,
  },

})

module.exports = mongoose.model("Notifications", userSchema);