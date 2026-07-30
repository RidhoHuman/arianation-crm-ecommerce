const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const knex = require('./knex');
const { config } = require('./env');
const cuid = require('cuid');
const bcrypt = require('bcryptjs');

if (config.google.clientId && config.google.clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: `${process.env.BASE_URL || 'http://localhost:3001'}/api/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

          if (!email) {
            return done(new Error('No email found from Google profile'), false);
          }

          // Check if user already exists
          let user = await knex('user').where({ email }).first();

          if (!user) {
            // Create a new user for Google login
            const randomPassword = cuid() + Date.now().toString();
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            const newUser = {
              id: cuid(),
              email: email,
              password: hashedPassword,
              fullName: profile.displayName || 'Google User',
              role: 'CUSTOMER',
              isActive: true,
              emailVerified: true, // Google emails are already verified
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            await knex.transaction(async (trx) => {
              await trx('user').insert(newUser);
              const now = new Date();
              await trx('customerProfile').insert({
                id: cuid(),
                userId: newUser.id,
                createdAt: now,
                updatedAt: now,
              });
              await trx('customerMetrics').insert({
                id: cuid(),
                userId: newUser.id,
                createdAt: now,
                updatedAt: now,
              });
              await trx('shoppingCart').insert({
                id: cuid(),
                userId: newUser.id,
                createdAt: now,
                updatedAt: now,
              });
            });
            user = newUser;
          }

          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );
}

if (config.facebook.appId && config.facebook.appSecret) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: config.facebook.appId,
        clientSecret: config.facebook.appSecret,
        callbackURL: `${process.env.BASE_URL || 'http://localhost:3001'}/api/auth/facebook/callback`,
        profileFields: ['id', 'emails', 'name', 'displayName'],
        graphAPIVersion: 'v19.0',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

          if (!email) {
            return done(
              new Error(
                'No email found from Facebook profile. Ensure your Facebook account has an email address.'
              ),
              false
            );
          }

          // Check if user already exists
          let user = await knex('user').where({ email }).first();

          if (!user) {
            // Create a new user for Facebook login
            const randomPassword = cuid() + Date.now().toString();
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            const newUser = {
              id: cuid(),
              email: email,
              password: hashedPassword,
              fullName:
                profile.displayName ||
                (profile.name
                  ? `${profile.name.givenName} ${profile.name.familyName}`.trim()
                  : 'Facebook User'),
              role: 'CUSTOMER',
              isActive: true,
              emailVerified: true, // Facebook emails are already verified
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            await knex.transaction(async (trx) => {
              await trx('user').insert(newUser);
              const now = new Date();
              await trx('customerProfile').insert({
                id: cuid(),
                userId: newUser.id,
                createdAt: now,
                updatedAt: now,
              });
              await trx('customerMetrics').insert({
                id: cuid(),
                userId: newUser.id,
                createdAt: now,
                updatedAt: now,
              });
              await trx('shoppingCart').insert({
                id: cuid(),
                userId: newUser.id,
                createdAt: now,
                updatedAt: now,
              });
            });
            user = newUser;
          }

          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );
}

module.exports = passport;
