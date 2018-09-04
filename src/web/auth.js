const config = require('../index').config;

const passport = require('passport');
const GoogleStrategy = require('passport-google-auth').Strategy;

const SCOPES = ['https://www.googleapis.com/auth/calendar', 'profile'];

exports.init = function (app) {
    app.use(passport.initialize());

    passport.serializeUser(function (user, done) {
        done(null, user);
    });

    passport.deserializeUser(function (obj, done) {
        done(null, obj);
    });

    // Use the GoogleStrategy within Passport.
    //   Strategies in passport require a `validate` function, which accept
    //   credentials (in this case, an OpenID identifier and profile), and invoke a
    //   callback with a user object.
    passport.use(new GoogleStrategy({
            clientId: config.client_id,
            clientSecret: config.client_secret,
            callbackURL: config.callback_url,
            scope: SCOPES,
            skipUserProfile: false

        },
        (token, refreshToken, profile, done) => {
            console.log(token);
            console.log(profile)
            return done(null, {
                profile: profile,
                token: token
            });
        }));

    setupAuthRoutes(app);
};

function setupAuthRoutes(app) {
    try {
        app.get('/auth/google', passport.authenticate('google'));

        app.get('/auth/user', (req, res) => {
            console.log(req.user);
            res.json(req.user || {err: 'Not logged in'});
        });

        app.get('/auth/google/callback',
            passport.authenticate('google', {
                failureRedirect: '/auth/user'
            }),
            (req, res) => {
                res.redirect('/')
            }
        );
    } catch (err) {
        // Do something I guess
    }
}

