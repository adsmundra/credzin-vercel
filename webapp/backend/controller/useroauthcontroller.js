const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const userOauthDetails = require("../models/user_oauth_details")
const User = require("../models/User")
const GmailMessage = require("../models/gmail_messages")
const refreshTokenMiddleware = require("../middlewares/tokenRefresh");
const fs = require('fs').promises;
const path = require('path');
// Import the signup function from Auth.js
const { signup } = require('./Auth');
const { isBuffer } = require('util');

const client_secret = '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';
const client_id = '877634687727-5vce2nfr61eeopaikbhgk100670vplkg.apps.googleusercontent.com';

// Use environment variable for redirect URI or default to port 4000
const PORT = 5000;
const redirect_uri = `https://api.app.credzin.com/api/v1/auth/oauth/oauth2callback`
// const redirect_uri = `http://localhost:5000/api/v1/auth/oauth/oauth2callback`

const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uri
);
delete oAuth2Client.codeVerifier;
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'];

exports.getAuthUrl = async (req, res) => {
    try {
        // Generate auth URL and redirect directly
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: "consent",
            scope: SCOPES,
        });
        console.log('Redirecting to auth URL');

        // Redirect the user directly to Google OAuth
        res.redirect(authUrl);
    }
    catch (error) {
        console.error('Error in getAuthUrl:', error);
        return res.status(500).json({
            success: false,
            message: `error in fetching authurl`,
            error: error.message
        })
    }
}

exports.oauthCallback = async (req, res) => {
    try {
        const { code, error } = req.query;
        // Check for OAuth errors
        if (error) {
            console.error('OAuth error:', error);
            return res.status(400).json({
                success: false,
                message: `OAuth error: ${error}`
            });
        }

        // Validate authorization code
        if (!code) {
            console.error('No authorization code received');
            return res.status(400).json({
                success: false,
                message: 'No authorization code received'
            });
        }

        console.log('Received authorization code:', code);

        try {
            // Exchange authorization code for tokens (no code_verifier needed for web apps)
            console.log('Attempting to exchange code for tokens...');


            //const { tokens } = await oAuth2Client.getToken(code);
            const tokens = await axios.post('https://oauth2.googleapis.com/token', null, {
                params: {
                    code,
                    client_id: client_id,
                    client_secret: client_secret,
                    redirect_uri: redirect_uri,
                    grant_type: 'authorization_code',
                    // 🔥 DO NOT include `code_verifier` here
                },
            });

            console.log('Token exchange successful:', tokens.data);
            const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: {
                    Authorization: `Bearer ${tokens.data.access_token}`,
                },
            });

            console.log('User Email:', response.data);

            const email = response.data.email;

            const access_token = tokens.data.access_token;
            const refresh_token = tokens.data.refresh_token;
            const expiry_date = tokens.data.expires_in;
            const refresh_token_expires_in = tokens.data.expires_in;
            const created_at = new Date();
            let password = null;
            let lastName = null;
            let firstName = null;
            if (response.data.name) {
                const user_name = response.data.name;
                lastName = user_name.split(" ")[1];
                firstName = user_name.split(" ")[0];

            }
            let contact = null;
            console.log("===============here==========================");

            // Check if user exists
            const existing_user = await User.findOne({ email: email });
            if (existing_user) {
                const newJwt = jwt.sign({ id: existing_user._id }, process.env.JWT_SECRET, {
                    expiresIn: '1h',
                });
                existing_user.token = newJwt;
                await existing_user.save();
                req.user = { email: email };
                await exports.fetchGmailMessages(req, res);

                return res.redirect(`https://app.credzin.com/home?token=${existing_user.token}`);


            }
            // Prepare user data for signup  /additional-details
            const user = await User.create({
                firstName,
                lastName,
                email,
                password,
                contact,
            });
            const jwt_token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
                expiresIn: '1h',
            });
            user.token = jwt_token;
            await user.save();

            // Save OAuth details
            const user_email = email;
            const user_oauth_details = await userOauthDetails.create({
                user_email,
                access_token,
                refresh_token,
                created_at,
                expiry_date,
                refresh_token_expires_in,
            });
            await user_oauth_details.save();

            console.log('OAuth details saved successfully for user:', email);

            req.user = { email: user_email };
            console.log('user:', user);
            await exports.fetchGmailMessages(req, res);
            return res.redirect(`https://app.credzin.com/googleAdditionaldetails?token=${user.token}`);



            //oAuth2Client.setCredentials(response);


        } catch (tokenError) {
            console.error('Token exchange failed:', tokenError);
            console.error('Token error details:', {
                message: tokenError.message,
                code: tokenError.code,
                status: tokenError.status
            });
            return res.status(400).json({
                success: false,
                message: 'Failed to exchange authorization code for tokens',
                error: tokenError.message
            });
        }

    }
    catch (error) {
        console.error('Error in oauthCallback:', error);
        return res.status(500).json({
            success: false,
            message: `error in saving the refresh token`,
            error: error.message
        })

    }
}

exports.fetchGmailMessages = async (req, res) => {
    try {
        // Get user email from request
        const userEmail = req.user.email;

        // Find user's OAuth details
        const oauthDetails = await userOauthDetails.findOne({ user_email: userEmail });
        if (!oauthDetails) {
            return res.status(401).json({
                success: false,
                message: 'No OAuth details found for user'
            });
        }

        // Fetch messages using the access token directly
        console.log('Fetching Gmail messages for user:', userEmail);
        const response = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/messages', {
            headers: {
                'Authorization': `Bearer ${oauthDetails.access_token}`
            },
            params: {
                maxResults: 10
            }
        });
        console.log('Gmail messages fetched successfully:', response.data);
        const messages = response.data.messages || [];
        const processedMessages = [];

        // Process each message
        for (const message of messages) {
            const detail = await axios.get(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`, {
                headers: {
                    'Authorization': `Bearer ${oauthDetails.access_token}`
                }
            });

            const messageData = detail.data;

            // Extract headers
            const headers = messageData.payload.headers;
            const subject = headers.find(h => h.name === 'Subject')?.value || '';
            const from = headers.find(h => h.name === 'From')?.value || '';
            const to = headers.find(h => h.name === 'To')?.value || '';

            // Get message body
            let body = '';
            if (messageData.payload.parts) {
                const textPart = messageData.payload.parts.find(part => part.mimeType === 'text/plain');
                if (textPart && textPart.body.data) {
                    body = Buffer.from(textPart.body.data, 'base64').toString();
                }
            } else if (messageData.payload.body.data) {
                body = Buffer.from(messageData.payload.body.data, 'base64').toString();
            }

            // Limit body to first 200 characters
            body = body.substring(0, 800) + (body.length > 200 ? '...' : '');

            // Create message object
            const processedMessage = {
                user_email: userEmail,
                message_id: messageData.id,
                thread_id: messageData.threadId,
                subject,
                from,
                to,
                snippet: messageData.snippet,
                body,
                received_at: new Date(parseInt(messageData.internalDate)),
                labels: messageData.labelIds || []
            };

            // Save to database
            await GmailMessage.findOneAndUpdate(
                { message_id: messageData.id },
                processedMessage,
                { upsert: true, new: true }
            );

            processedMessages.push(processedMessage);
        }

        return processedMessages;

    } catch (error) {
        console.error('Error fetching Gmail messages:', error);
        return error;
    }
}