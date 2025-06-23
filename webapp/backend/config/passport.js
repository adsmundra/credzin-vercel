const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require('passport');
const User = require('../models/User');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
},
async (accessToken, refreshToken, profile, done) => {
  try {
    const existingUser = await User.findOne({ googleId: profile.id });
    if (existingUser) {return done(null, existingUser);}

    const firstName = profile.name?.givenName || "";
    const lastName = profile.name?.familyName || "";

    const newUser = await User.create({
      googleId: profile.id,
      email: profile.emails[0].value,
      firstName,
      lastName
    });

    done(null, newUser);
  } catch (err) {
    console.error("Error creating user:", err);
    done(err, null);
  }
}));


passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => User.findById(id).then(user => done(null, user)));
