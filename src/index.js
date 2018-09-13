const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const chalk = require('chalk');
const cookieSession = require('cookie-session');

const utils = require('./utils');
const schemaUtils = require('./database/schemaUtils');

const app = exports.app = express();

const notification = chalk.green(`[!]`);
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

    // Start auto apply schedule for every sunday at 00:15
    utils.startSchedule({hour: 0, minute: 15, dayOfWeek: 0})
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

            let accessToken = req.user.token || req.body.access_token;
            if (!accessToken) return res.status(403).send(`No access token!`);

            let userID = req.user.profile.id;

            let res = await utils.runApply(userID, moodleUsername, moodlePassword, moodleURL, accessToken);
            if (!res.suc) {
                return res.status(500).json(res);
            }

            res.status(200).send(`Events have been successfully added to the calender!`);

        } catch (err) {
            console.error(`Error trying to apply events, Error: ${err.stack}`);
            res.status(500).send(`An unexpected server error occurred, please contact @XeliteXirish or try again later!`);
        }
    })
}
init();