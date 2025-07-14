// const cron = require('node-cron');
// const mongoose = require('mongoose');
// const UserOauth = require('../models/user_oauth_details');
// const axios = require('axios');
// const {fetchGmailMessages} = require("../controller/useroauthcontroller")


// function startCronJob() {
//   cron.schedule('*/2 * * * *', async () => {
//     console.log('🕐 Cron Job Started: 1 AM');

//     try {
//       const users = await UserOauth.find();

//       for (const user of users) {
//         console.log(`🔄 Refreshing token for: ${user.user_email}`);
//         await fetchGmailMessages(user.user_email);
//         console.log(`✅ Processed ${user.user_email}`);
//       }
//       console.log('✅ All users processed');
//     } catch (error) {
//       console.error('❌ Error during cron job:', error.message);
//     }

//     console.log('✅ Cron Job Completed');
//   });
// }

// module.exports = { startCronJob };





const UserOauth = require('../models/user_oauth_details');
const { fetchGmailMessages } = require('./useroauthcontroller');

async function executeCronJob() {
  const results = {
    startTime: new Date().toISOString(),
    processedUsers: 0,
    successes: 0,
    failures: 0,
    details: []
  };

  try {
    console.log('🕐 Cron Job Started');
    const users = await UserOauth.find();

    for (const user of users) {
      try {
        console.log(`🔄 Processing user: ${user.user_email}`);
        await fetchGmailMessages(user.user_email);
        results.details.push({
          email: user.user_email,
          status: 'success',
          processedAt: new Date().toISOString()
        });
        results.successes++;
      } catch (userError) {
        console.error(`❌ Error processing ${user.user_email}:`, userError.message);
        results.details.push({
          email: user.user_email,
          status: 'failed',
          error: userError.message,
          processedAt: new Date().toISOString()
        });
        results.failures++;
      }
      results.processedUsers++;
    }

    console.log('✅ Cron Job Completed');
    return {
      ...results,
      endTime: new Date().toISOString(),
      status: 'completed'
    };
  } catch (error) {
    console.error('❌ Critical Cron Job Error:', error);
    return {
      ...results,
      endTime: new Date().toISOString(),
      status: 'failed',
      error: error.message
    };
  }
}

// For Vercel compatibility - creates an HTTP handler
async function cronHandler() {
  // Add authentication if needed
 
  const result = await executeCronJob();
  
}

module.exports = {
  executeCronJob,
  cronHandler
};