const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const chalk = require('chalk');
const cookieSession = require('cookie-session');

let utils = require('./utils');

const app = exports.app = express();

const notification = chalk.green(`[!]`);
const noteError = chalk.red(`[!]`);

try {
    exports.config = require('../config');
} catch (err) {
    exports.config = {databaseUrl: '', port: '', debug: false};
}

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

    app.get('/', isLoggedIn, (req, res) => {
        res.send('ok');
    });

    app.post('/test', async (req, res) => {
        let moodleUsername = req.body.musername;
        let moodlePassword = req.body.mpassword;
        let moodleURL = req.body.murl;
        let assignments = await utils.getAssignments(moodleUsername, moodlePassword, moodleURL);
        res.json(assignments);
    })

    app.get('/apply', isLoggedIn, async (req, res) => {
        try {
            let moodleUsername = req.query.musername; //TODO change these back to req.body for post request
            let moodlePassword = req.query.mpassword;
            let moodleURL = req.query.murl;

            if (!moodleUsername || !moodlePassword || !moodleURL) return res.status(403).send(`You must submit a muasname, mpassword and murl in the body!`);

            let accessToken = req.user.token;
            if (!accessToken) return res.status(403).send(`No access token!`);

            console.log(`[DEBUG] Past token check`);

            // Check if the google calender exists or create it
            let calender = await utils.getEventCalender(accessToken);
            if (!calender) return res.status(500).send(`Unable to create calender!`);
            let calenderID = calender.id;

            console.log(`[DEBUG] Past calender creation, ID: ${calenderID}`)

            // Get the users current events to make sure we don't add duplicates, dont care about the length
            let userEvents = await utils.listEvents(calenderID, accessToken);

            // Gets users assignments
            let assignments = await utils.getAssignments(moodleUsername, moodlePassword, moodleURL);
            if (!assignments) return res.status(403).send(`Unable to log into moodle with the supplied credentials!`);

            for (let ass of assignments) {
                // Name, Course, Date, Description

                console.log(`[DEBUG] Assign ${ass.name}`);
                // We gota parse the date, Format = Friday, 7 September, 5:00 PM
                let dateTime = new Date(`${ass.date}, 2018`).toISOString();

                // Check if its a duplicate
                if (!userEvents.includes(ass.name)) utils.insetEvent(calenderID, ass.name, ass.course, dateTime, accessToken).catch(err => {
                });
                else console.log(`[DEBUG] Duplicate found, not addding ${ass.name}`);
            }


        } catch (err) {
            console.error(`Error trying to apply events, Error: ${err.stack}`);
        }


    })
}

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/auth/google');
}

init();