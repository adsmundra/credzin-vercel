const cron = require('node-cron');
const mongoose = require('mongoose');
const UserOauth = require('../models/user_oauth_details');
const axios = require('axios');
const {fetchGmailMessages} = require("../controller/useroauthcontroller")


function startCronJob() {
  cron.schedule('0 1 * * *', async () => {
    console.log('🕐 Cron Job Started: 1 AM');

    try {
      const users = await UserOauth.find();

      for (const user of users) {
        console.log(`🔄 Refreshing token for: ${user.user_email}`);
        await fetchGmailMessages(user.user_email);
        console.log(`✅ Processed ${user.user_email}`);
      }
      console.log('✅ All users processed');
    } catch (error) {
      console.error('❌ Error during cron job:', error.message);
    }

    console.log('✅ Cron Job Completed');
  });
}

module.exports = { startCronJob };