const { google } = require('googleapis');
const userOauthDetails = require("../models/user_oauth_details");

const client_secret = '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';
const client_id = '877634687727-5vce2nfr61eeopaikbhgk100670vplkg.apps.googleusercontent.com';
const redirect_uris = ['http://localhost:5000/api/v1/auth/oauth2callback'];

const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

const refreshTokenMiddleware = async (req, res, next) => {
  try {
    const userEmail = req.user.email;
    const oauthDetails = await userOauthDetails.findOne({ user_email: userEmail });

    if (!oauthDetails) {
      return res.status(401).json({
        success: false,
        message: 'No OAuth details found for user'
      });
    }

    let access_token = oauthDetails.access_token;
    let expiry_date = oauthDetails.expiry_date;
    let refresh_token = oauthDetails.refresh_token;

    const currentTime = Date.now();
    const expiryTime = new Date(expiry_date).getTime();
    const fiveMinutes = 5 * 60 * 1000;

    if (currentTime + fiveMinutes >= expiryTime) {
      const tokens = await oAuth2Client.refreshToken(refresh_token);

      access_token = tokens.credentials.access_token;
      expiry_date = tokens.credentials.expiry_date;
      refresh_token = tokens.credentials.refresh_token || refresh_token;

      await userOauthDetails.findOneAndUpdate(
        { user_email: userEmail },
        {
          access_token,
          expiry_date,
          refresh_token
        }
      );
    }

    req.oauthTokens = {
      access_token,
      expiry_date,
      refresh_token
    };

    next();
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error refreshing token',
      error: error.message
    });
  }
};

module.exports = refreshTokenMiddleware;

