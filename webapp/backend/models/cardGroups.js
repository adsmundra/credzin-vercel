const mongoose = require("mongoose");

const cardGroupSchema= new mongoose.Schema(
    {
        name:{   //group name
            type:String,
            required:true,
        },
        admin:{
            type: mongoose.Schema.ObjectId,
            required:true,
            ref: 'User',
        },
        created_at:{
            type:Date,
            required:true,
            trim:true,
        }
        
    }
)

module.exports = mongoose.model("card_group", cardGroupSchema);