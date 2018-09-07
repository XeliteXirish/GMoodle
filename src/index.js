const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const chalk = require('chalk');
const cookieSession = require('cookie-session');
const chrono = require('chrono-node');

const utils = require('./utils');
const schemaUtils = require('./database/schemaUtils');

const app = exports.app = express();

const notification = chalk.green(`[!]`);
const noteUser = chalk.green(`[~${chalk.red('!')}~]`);
const noteError = chalk.red(`[!]`);

try {
    exports.config = require('../config');
} catch (err) {
    throw `You must supply a config file! Copy the example ex_config.js to config.js!`;
}

exports.isLoggedIn = function (req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/auth/google');
};

function init() {
    require('./database/driver').connect();
    initWeb();
}

function initWeb() {

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(express.static('Web'));
    app.set('view engine', 'ejs');
    app.use(cors());

    app.use(cookieSession({
        name: 'loginSession',
        keys: ['gmoodle', exports.config.session_secret],
        maxAge: 2 * 60 * 60 * 1000 //48 Hours
    }));

    app.use('/', express.static(`${__dirname}/web/static`));
    app.set('views', `${__dirname}/web/views/`);

    require('./web/auth').init(app);
    setupRoutes();

    // Set up final server
    try {
        const httpServer = http.createServer(app);
        let port = process.env.PORT || exports.config.port || 80;
        httpServer.listen(port, err => {
            if (err) {
                console.error(`${noteError} FAILED TO OPEN WEB SERVER, ERROR: ${err.stack}`);
                return;
            }
            console.info(`${notification} Successfully started web server... listening on port: ${chalk.green(port)}`);
        })
    } catch (err) {
        console.error(`${noteError} Error starting up server, Error: ${err.stack}`)
    }
}

function setupRoutes() {

    app.get('/', exports.isLoggedIn, (req, res) => {
        res.render('index', {
            user: req.user
        });
    });

    app.post('/apply', exports.isLoggedIn, async (req, res) => {
        try {
            let moodleUsername = req.body.musername;
            let moodlePassword = req.body.mpassword;
            let moodleURL = req.body.murl;

            if (!moodleUsername || !moodlePassword || !moodleURL) return res.status(403).send(`You must submit a muasname, mpassword and murl in the body!`);

            let accessToken = req.user.token;
            if (!accessToken) return res.status(403).send(`No access token!`);

            // We'll check if their token is any good
            let validToken = await utils.checkAccessToken(accessToken);
            if (!validToken) {
                let userObj = await schemaUtils.fetchUser(req.user.profile.id);
                if (!userObj) return res.status(500).send(`Unable to apply, no user object was found saved with a valid refresh token, try logging out and logging back in!`);
                accessToken = await utils.getAccessToken(userObj.refreshToken);
            }

            // Check if the google calender exists or create it
            let calender = await utils.getEventCalender(accessToken);
            if (!calender) return res.status(500).send(`Unable to fetch calender!`);
            let calenderID = calender.id;

            // Get the users current events to make sure we don't add duplicates, dont care about the length
            let userEvents = await utils.listEvents(calenderID, accessToken);

            // Gets users assignments
            let assignments = await utils.getAssignments(moodleUsername, moodlePassword, moodleURL);
            if (!assignments) return res.status(403).send(`Unable to log into moodle with the supplied credentials!`);

            console.info(`${noteUser} Added events for user ${chalk.bold(req.user.profile.displayName)}`);

            for (let ass of assignments) {

                // We gota parse the date, Format = Friday, 7 September, 5:00 PM
                let dateTime = new Date(chrono.parseDate(`${ass.date}, 2018`)).toISOString();

                // Check if its a duplicate, if it doesn't insert it'll try again on next try
                if (!userEvents.includes(ass.name)) utils.insetEvent(calenderID, ass.name, ass.course, dateTime, accessToken).catch(err => {
                });
            }

            res.status(200).send(`Events have been successfully added ${assignments.length} to the calender!`);

        } catch (err) {
            console.error(`Error trying to apply events, Error: ${err.stack}`);
        }
    })
}
init();