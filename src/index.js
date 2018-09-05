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
    app.get('/apply', isLoggedIn, async (req, res) => {
        let calenders = await utils.listCalenders(req.user.token);
        res.json(calenders);
    })
}

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/auth/google');
}

init();