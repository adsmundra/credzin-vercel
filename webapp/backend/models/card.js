const mongoose = require("mongoose");

const cardSchema= new mongoose.Schema(
    {
        bank_name:{
            type:String,
            required:true,
        },
        features:{
            type:String,
            required:true,
        },
        joining_fee:{
            type:String,
            required:true,
            trim:true,
        },
        annual_fee:{
            type:String,
            required:true,
            trim:true,
        },
        know_more_link:{
            type:String,
            required:true,
            trim:true,
        },
        apply_now_link:{
            type:String,
            required:true,
            trim:true,
        },
        image_url:{
            type:String,
            required:true,
            trim:true,
        },
        rewards:{
            type:String,
            required:true,
            trim:true,
        },
        card_name:{
            type:String,
            required:true,
        }
        
        
    }
)

module.exports = mongoose.model("credit_cards", cardSchema);