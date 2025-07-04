const mongoose = require("mongoose");

const cardGroupUserSchema = new mongoose.Schema(
    {
        name:{
            type:String,
            required:true,
        },
        user_id:{
            type: mongoose.Schema.ObjectId,
            required:true,
            ref: 'User',
        },
        group_id:{
            type: mongoose.Schema.ObjectId,
            required:true,
            ref: 'card_group',
        },
        card_list:[
            {
                type: mongoose.Schema.Types.ObjectId,
                ref:'credit_cards'
            }
        ],
        created_at:{
            type:Date, 
            default: Date.now,
            required:true,
            trim:true,
        }
        
    }
)

module.exports = mongoose.model("card_group_user", cardGroupUserSchema);



// const cardGroupUserSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: true,
//     },
//     user_id: {
//         type: mongoose.Schema.ObjectId,
//         required: true,
//         ref: 'User',
//     },
//     group_id: {
//         type: mongoose.Schema.ObjectId,
//         required: true,
//         ref: 'card_group',
//     },
//     card_list: [
//         {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'credit_cards'
//         }
//     ],
//     status: {
//         type: String,
//         enum: ['pending', 'accepted', 'rejected'],
//         default: 'pending'
//     },
//     created_at: {
//         type: Date,
//         default: Date.now,
//         required: true,
//     }
// });