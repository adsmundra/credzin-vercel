const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middlewares/verifyToken');
const {
  createCardGroup,
  addUserToGroup,
  getAllCard,
  getDistinctGroupsForUser,
  getGroupWithMembersAndCards,
  deleteMember,
  leaveGroup,
  deleteGroup,
  acceptGroupInvitation,
  rejectGroupInvitation,
  cardDetails,
  getCardDetails,
  getCardFeatures,
} = require('../controller/cardpool');

const { Cardfetch, recommended_card } = require('../controller/Card/cardfetch');
const { all_bank } = require('../controller/Card/cardfetch');
// const { verify } = require("jsonwebtoken")
router.post('/your_recomendation', Cardfetch);

router.get('/all_bank', all_bank);
router.get('/recommendedcard', verifyToken, recommended_card);
router.post('/createPool', verifyToken, createCardGroup);
router.post('/addUserToPool', verifyToken, addUserToGroup);
router.get('/getAllUserCard', verifyToken, getAllCard);
router.get('/getDistinctGroupsForUser', verifyToken, getDistinctGroupsForUser);
router.get(
  '/getGroupWithMembersAndCards/:groupId',
  verifyToken,
  getGroupWithMembersAndCards
);
router.post('/removeUserFromPool', verifyToken, deleteMember);
router.post('/leaveGroup', verifyToken, leaveGroup);
router.delete('/deletePool/:groupId', verifyToken, deleteGroup);
router.post('/cardDetails', verifyToken, cardDetails);
router.get('/getcardDetails/:user_card_id', verifyToken, getCardDetails);
router.get('/cardfeatures/:id', verifyToken, getCardFeatures);

router.post(
  '/invitation/accept/:invitationId',
  verifyToken,
  acceptGroupInvitation
);
router.post(
  '/invitation/reject/:invitationId',
  verifyToken,
  rejectGroupInvitation
);
// router.post("/",Cardfetch)

module.exports = router;
