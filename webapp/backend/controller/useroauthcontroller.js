const { google } = require('googleapis');
const axios = require('axios');
const userOauthDetails = require("../models/user_oauth_details")
const User = require("../models/User")
const GmailMessage = require("../models/gmail_messages")
const refreshTokenMiddleware = require("../middlewares/tokenRefresh");
const fs = require('fs').promises;
const path = require('path');

const client_secret = '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';
const client_id = '877634687727-5vce2nfr61eeopaikbhgk100670vplkg.apps.googleusercontent.com';
const redirect_uris = ['http://localhost:5000/api/v1/auth/oauth2callback'];

const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
);
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/userinfo.email'];
exports.getAuthUrl = async (req, res) => {
    try {




        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: SCOPES,
        });
        console.log(authUrl);
        return authUrl
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: `error in fetching authurl`,
            error: error.message
        })

    }
}

exports.oauthCallback = async (req, res) => {
    try {
        const { code } = req.query;
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        console.log(tokens);
        const oauth2 = google.oauth2({
            auth: oAuth2Client,
            version: 'v2',
        });

        const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`,
            },
        });

        console.log('User Email:', response.data);

        const user_email = response.data.email;
        const access_token = tokens.access_token;
        const refresh_token = tokens.refresh_token;

        const expiry_date = tokens.expiry_date;
        const refresh_token_expires_in = tokens.refresh_token_expires_in;
        const created_at = null;
        console.log("===============here==========================");
        const user = await User.findOne({ email: user_email })
        if (!user) {
            return res.status(400).json({
                success: false,
                message: `No user found`
            })
        };
        const user_oauth_details = await userOauthDetails.create({
            user_email,
            access_token,
            refresh_token,
            created_at,
            expiry_date,
            refresh_token_expires_in,
        });
        user_oauth_details.save();
        return res.status(200).json({
            success:true,
            message:`saved `,
            details:user_oauth_details
        })

    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: `error in saving the refrsh token`,
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
        const response = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/messages', {
            headers: {
                'Authorization': `Bearer ${oauthDetails.access_token}`
            },
            params: {
                maxResults: 10
            }
        });

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
            body = body.substring(0, 200) + (body.length > 200 ? '...' : '');

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

        // Save to local file
        const outputDir = path.join(__dirname, '../../data/gmail_messages');
        await fs.mkdir(outputDir, { recursive: true });
        
        const fileName = `${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.json`;
        const filePath = path.join(outputDir, fileName);
        
        await fs.writeFile(
            filePath,
            JSON.stringify(processedMessages, null, 2)
        );

        return res.status(200).json({
            success: true,
            message: 'Gmail messages fetched and saved successfully',
            messages: processedMessages,
            saved_to: filePath
        });

    } catch (error) {
        console.error('Error fetching Gmail messages:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching Gmail messages',
            error: error.message
        });
    }
}
