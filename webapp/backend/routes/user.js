const express= require("express")
const router= express.Router()

const {signup, login}=  require("../controller/Auth")
const {verifyToken} = require("../middlewares/verifyToken")
const {getUserData}= require("../controller/Auth")
const {addcards} = require("../controller/Auth")
const {getUserCards} =require("../controller/Auth")
const {removeCardFromCart, updateAdditionalDetails,getFullUserDetails}=require("../controller/Auth")
const{findIdByContact}=require("../controller/Auth")



router.post("/login",login)
router.post("/signup",signup)
router.get("/userdata",verifyToken, getUserData)
router.post("/addcard",verifyToken,addcards)
router.get("/addedcards",verifyToken,getUserCards)
router.post("/removeCardFromCart",verifyToken,removeCardFromCart)
router.post("/additionalDetails",verifyToken,updateAdditionalDetails)
router.get("/userdetail",verifyToken,getFullUserDetails)
router.post("/findbycontact",verifyToken,findIdByContact)

// router.post("/your_recomendation",Cardfetch)

module.exports= router

