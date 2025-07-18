const Card = require("../../models/card")
const Recommendation = require("../../models/recommendations")
// const User = require("../../models/User")
exports.Cardfetch=async(req,res)=>{
    try{
        const bank_name=req.body.bank_name
        if(!bank_name){
            return res.status(404).json({
                success:false,
                message:"bank name not found"
            })
        }
       
        const card =  await Card.find({bank_name:bank_name})
        if(!card){
            return res.status(400).json({
                success:false,
                message:`No card found`
            })
        };
        return res.status(200).json({
            success:true,
            message:`All card for ${bank_name} `,
            cards:card
        })
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:`error in fetching card details`,
            error:error.message
        })

    }
}

// exports.all_bank=async(req, res)=>{
//     const start = Date.now(); 
//     try{
//         const bankNames = await Card.distinct('bank_name', { bank_name: { $ne: null } });
//         res.status(200).json({ banks: bankNames });

//     }
//     catch(err){
//         // console.error('Error fetching bank names:', err);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
//     const end = Date.now();
//     console.log(`all_bank executed in ${end - start}ms`);
// }
exports.recommended_card = async (req, res) => {
    try {
        // console.log("you are in recommended card");
        // console.log(req.id);
        const userId = req.id.toString();	
        // console.log("userId is", userId);

        if (!userId) {
            return res.status(404).json({
                success: false,
                message: `User ID not found`,
            });
        }
        const recomended_card = await Recommendation.find({ _id:userId });
        // console.log("recomended card is", recomended_card);
        if (!recomended_card) {
            return res.status(400).json({
                success: false,
                message: `No recommended cards found for user ${userId}`,
            });
        }

        res.status(200).json({
            success: true,
            message: `All cards for ${userId}`,
            cards: recomended_card,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: `Error in fetching recommended card details`,
            error: error.message,
        });
    }
};



// Top of your file
let cachedBanks = null;
let cacheTimestamp = null;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

exports.all_bank = async (req, res) => {
  try {
   
      const now = Date.now();
    if (cachedBanks && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION_MS)) {
        const end = Date.now();
        console.log(`all_bank (from cache) executed in ${end - now}ms`);
      return res.status(200).json({ banks: cachedBanks });
    }

    const bankNames = await Card.distinct('bank_name', { bank_name: { $ne: null } });

    cachedBanks = bankNames;
    cacheTimestamp = now;

    const end = Date.now();
    console.log(`all_bank (from DB) executed in ${end - now}ms`);

    return res.status(200).json({ banks: bankNames });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', error:err.message });
  }

};

