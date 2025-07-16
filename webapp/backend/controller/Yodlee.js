const axios = require('axios');
const qs = require('qs');

const YODLEE_CLIENT_ID = 'U8j3S66G0Zv0gacuWFZsPiPJmW8vzr4w8Q0gu935PLqnijfA';
const YODLEE_SECRET = 'IETzb5jUisLslQSm3N0RFzNzztd02ALe4AreT41gxv1TmxUZUBed5PA99PWOCgQZ';
const YODLEE_ADMIN_LOGIN = 'aa5e2570-dc9e-44a0-b3b2-cda7f7c6688f_ADMIN';
let Access_token=null;

exports.getYodleeAccessToken=async(req, res) => {
    console.log('Generating Yodlee access token...');
  const url = 'https://sandbox.api.yodlee.com/ysl/auth/token';

  const data = qs.stringify({
    clientId: 'U8j3S66G0Zv0gacuWFZsPiPJmW8vzr4w8Q0gu935PLqnijfA',
    secret: 'IETzb5jUisLslQSm3N0RFzNzztd02ALe4AreT41gxv1TmxUZUBed5PA99PWOCgQZ'
  });

  const headers = {
    'Api-Version': '1.1',
    'loginName': 'aa5e2570-dc9e-44a0-b3b2-cda7f7c6688f_ADMIN',
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  try {
    const response = await axios.post(url, data, { headers });
    const accessToken = response.data.token.accessToken;
    console.log('Token generated successfully:', accessToken);
    Access_token=accessToken
    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error('Error generating token:', error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to generate Yodlee token', error: error.message });
  }
}

// Example usage
// getYodleeAccessToken().then(token => console.log('Access token:', token));
exports.registerYodleeUser = async (req, res) => {
  const { password, email } = req.body;
  const userId = req.id;
  console.log('Registering Yodlee user with ID:', userId, 'and email:', email);
  if (!userId || !email) {
    return res.status(400).json({ message: 'User ID and email are required' });
  }

  try {
    const accessToken = 'TIYr2Lm7VbTyZSMfX92dS50iK7vB'; // You already generated this

    const yodleeUser = {
      user: {
        loginName: `${userId}`, // must be unique
        password: `${password}`,  // store securely if needed later
        email,
      },
    };

    const registerResponse = await axios.post(
      'https://sandbox.api.yodlee.com/ysl/user/register',
      yodleeUser,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Api-Version': '1.1',
          'Content-Type': 'application/json',
        },
      }
    );

    return res.status(200).json({
      message: '✅ Yodlee user registered successfully',
      userId,
      yodleeLoginName: `user_${userId}`,
      yodleeResponse: registerResponse.data,
    });
  } catch (error) {
    console.error('❌ Error registering Yodlee user:', error.response?.data || error.message);
    return res.status(500).json({
      message: '❌ Failed to register Yodlee user',
      error: error.response?.data || error.message,
    });
  }
};



exports.loginYodleeSandboxUser = async (req, res) => {
  const { loginName, password } = req.body;

  if (!loginName || !password) {
    return res.status(400).json({ message: 'loginName and password are required' });
  }

  try {
    // 1️⃣ Step 1: Get Admin Access Token
    
    const adminAccessToken = 'Lk6FmmxKGwVvuiOrRjc4AkoUvpuG'; 
    console.log("This is adminAccess token",adminAccessToken)// Use the token you generated earlier

    // 2️⃣ Step 2: Log in the Sandbox User
    const loginResponse = await axios.post(
      'https://sandbox.api.yodlee.com/ysl/user/login',
      {
        user: {
          loginName,
          password
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${adminAccessToken}`,
          'Api-Version': '1.1',
          'Content-Type': 'application/json'
        }
      }
    );

    const userSession = loginResponse.data.user.session.userSession;

    return res.status(200).json({
      message: '✅ Yodlee sandbox user logged in successfully',
      loginName,
      userSession
    });
  } catch (error) {
    console.error('❌ Sandbox user login failed:', error.response?.data || error.message);
    return res.status(500).json({
      message: '❌ Sandbox user login failed',
      error: error.response?.data || error.message
    });
  }
};




// const axios = require('axios');
// const qs = require('qs');



exports.getFastLinkToken = async (req, res) => {
  try {
    // 1️⃣ Step: Generate Admin Access Token
    console.log('Generating FastLink token...');
    const tokenResponse = await axios.post(
      'https://sandbox.api.yodlee.com/ysl/auth/token',
      qs.stringify({
        clientId: YODLEE_CLIENT_ID,
        secret: YODLEE_SECRET
      }),
      {
        headers: {
          'Api-Version': '1.1',
          'loginName': YODLEE_ADMIN_LOGIN,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    console.log('✅ Admin token generated successfully');

    const adminAccessToken = tokenResponse.data.token.accessToken;
    console.log('✅ Admin token generated:', adminAccessToken);

    // 2️⃣ Step: Generate FastLink Token using Admin Token
    const fastLinkResponse = await axios.post(
      'https://sandbox.api.yodlee.com/ysl/user/accessTokens?appIds=10003600',
      {},
      {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
          'Api-Version': '1.1',
          'Content-Type': 'application/json'
        }
      }
    );

    const fastlinkToken = fastLinkResponse.data.user.accessToken;
    console.log('✅ FastLink token generated:', fastlinkToken);

    return res.status(200).json({
      message: '✅ FastLink token generated successfully',
      fastlinkToken,
      adminAccessToken // Optional, remove this line in production for security
    });
  } catch (error) {
    console.error('❌ Failed to get FastLink token:', error.response?.data || error.message);
    return res.status(500).json({
      message: '❌ Error generating FastLink token',
      error: error.response?.data || error.message
    });
  }
};
