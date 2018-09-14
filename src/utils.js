const index = require('./index');
const schemaUtils = require('./database/schemaUtils');

const axios = require('axios');
const chrono = require('chrono-node');
const chalk = require('chalk');
const schedule = require('node-schedule');
const MoodleUser = require('elite-moodle-scraper').MoodleUser;

const notification = chalk.green(`[!]`);
const noteUser = chalk.green(`[~${chalk.red('!!')}~]`);

/**
 * Returns the calender with the name in config or creates one
 * @param accessToken - The users google calender access token
 * @returns {Promise<*>}
 */
exports.getEventCalender = async function (accessToken) {
    try {

        let calenders = await exports.listCalenders(accessToken);
        for (let cal of calenders) {
            if (cal.name === index.config.calenderName) return cal;
        }

        // If its not defined by here we need to create
        let calObj = await createCalender(index.config.calenderName, accessToken);
        return {
            id: calObj.id,
            name: calObj.summary,
            timezone: calObj.timeZone,
            permission: calObj.accessRole
        }

    } catch (err) {
        console.error(`Error fetching calender, Error: ${err.stack}`);
    }
};

/**
 * Creates a calender with the specific name
 * @param calenderName {String} - The name of the calender to create
 * @param accessToken {String} - The users google calender access token
 * @returns {Promise<*>}
 */
async function createCalender(calenderName, accessToken) {
    try {
        let res = await axios.post(`https://www.googleapis.com/calendar/v3/calendars?access_token=${accessToken}`, {
            summary: calenderName,
        });
        return res.data;
    } catch (err) {
        console.error(`Error creating calender, Error: ${err}`);
        if (err.response) console.error(err.response.data)
    }
}

/**
 * Lists the users google calenders
 * @param accessToken {String} - The users google calender access token
 * @returns {Promise<*>}
 */
exports.listCalenders = async function (accessToken) {
    try {
        let res = await axios.get(`https://www.googleapis.com/calendar/v3/users/me/calendarList?access_token=${accessToken}`);
        return res.data.items.map(cal => {
            return {
                id: cal.id,
                name: cal.summary,
                timezone: cal.timeZone,
                permission: cal.accessRole
            }
        });
    } catch (err) {
        console.error(`Error listing calenders, Error: ${err}`);
        if (err.response) console.error(err.response.data)
    }
};

/**
 * We only need the events name to make sure we don't have duplicates
 * @param calenderID {String} - The calender ID to insert the event into
 * @param accessToken {String} - The users google calender access token
 * @param raw {Boolean} - Send the raw data object from the result
 * @returns {Promise<*>}
 */
exports.listEvents = async function (calenderID, accessToken, raw = false) {
    try {
        let res = await axios.get(`https://www.googleapis.com/calendar/v3/calendars/${calenderID}/events?access_token=${accessToken}`);
        if (raw) return res.data;
        return res.data.items.map(ev => ev.summary);

    } catch (err) {
        console.error(`Unable to list calender events, Error: ${err}`);
        if (err.response) console.error(err.response.data);
        return false;
    }
};

/**
 * Inserts an event into the users google calender
 * @param calenderID {String} - The calender ID to insert the event into
 * @param title {String} - The title of the event, the assignment title
 * @param description {String} - The description, the assignment description
 * @param dateTime {String} - The due date for the assignment
 * @param accessToken - The users google calender access token
 * @returns {Promise<void>}
 */
exports.insetEvent = async function (calenderID, title, description, dateTime, accessToken) {
    try {
        let res = await axios.post(`https://www.googleapis.com/calendar/v3/calendars/${calenderID}/events?access_token=${accessToken}`, {
            start: {
                dateTime: dateTime
            },
            end: {
                dateTime: dateTime
            },
            summary: title,
            description: description
        });

        return res.data;

    } catch (err) {
        console.error(`Error creating new event, Error: ${err}`);
        if (err.response) console.error(err.response.data);
    }
};

/**
 * Returns the users assignments
 * @param {String} username - The users moodle username
 * @param {String} password - The users moodle password
 * @param {String} moodleURL - The moodle websites address
 * @returns {Promise<*>}
 */
exports.getAssignments = async function (username, password, moodleURL) {
    try {
        let user = new MoodleUser(username, password, moodleURL);
        let loggedIn = await user.login();
        if (!loggedIn) return false;

        return await user.fetchCalender();

    } catch (err) {
        console.error(`Error fetching moodle user, Error: ${err.stack}`);
        return false;
    }
};

/**
 * Verify's the google account is still valid
 * @param {String} accessToken - The current users access token
 * @returns {Promise<boolean>} - If the user is still valid
 */
exports.checkAccessToken = async function (accessToken) {
    try {
        if (!accessToken) return false;
        let res = await axios.post(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`);

        return res.status === 400;
    } catch (err) {
        console.error(`Unable to verify google account, Error: ${err.stack}`);
        if (err.response) console.error(err.response.data);
        return false;
    }
};

/**
 * Fetches a new access token for a user
 * @param refreshToken - The refresh token for a user
 * @returns {Promise<>} - The new access token for the user
 */
exports.getAccessToken = async function (refreshToken) {
    try {
        if (!refreshToken) return false;

        let res = await axios.post(`https://www.googleapis.com/oauth2/v4/token`, {
            client_id: index.config.client_id,
            client_secret: index.config.client_secret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token'
        });

        if (res.status === 200) return res.data.access_token;
        else return false;
    } catch (err) {
        console.error(`Unable to fetch new access token, Error: ${err.stack}`);
        if (err.response) console.error(err.response.data);
        return false;
    }
};

/**
 * Returns the difference in days between the last applied date
 * @param lastApplied {Date} - The last applied date for a user
 * @returns {number} - The number of days since last apply
 */
exports.calDaysDifferent = function (lastApplied) {
    return Math.ceil(Math.abs(new Date().getTime() - lastApplied.getTime()) / (1000 * 3600 * 24));
};

exports.startSchedule = function (time) {
    try {

        let sch = schedule.scheduleJob(time, async function () {
            console.info(`${notification} Running auto apply for all users, Time: ${new Date().toISOString()}`);

            let allUsers = await schemaUtils.fetchAllUsers();
            if (!allUsers) return;
            for (let user of allUsers) {
                // Check if the user has auto apply enabled
                if (!user.autoApply) continue;

                let moodleUsername = user.moodleSettings.moodleUsername;
                let moodlePassword = user.moodleSettings.moodlePassword;
                let moodleUrl = user.moodleSettings.moodleURL;

                // Get a new access token for the user
                if (!user.refreshToken) continue;
                let accessToken = exports.getAccessToken(user.refreshToken);

                if (!moodleUsername || !moodlePassword || !moodleUrl || !accessToken) continue;

                exports.runApply(user.id, moodleUsername, moodlePassword, moodleUrl, accessToken, true).catch(() => {
                    // Dont care it'll try again in a week
                });
            }
        })

    } catch (err) {
        console.error(`Unable to start auto apply schedule, Error: ${err.stack}`);
    }
};

/**
 * Runs the application and adds all events to the users calender
 * @param userID {String} - The users ID
 * @param moodleUsername {String} - The moodle username of the user
 * @param moodlePassword {String} - The moodle password of the user
 * @param moodleURL {String} - The base url for the users moodle site
 * @param accessToken - The access token for the users google account
 * @param autoRan {Boolean} - If apply was ran automatically, default to false
 * @returns {Promise<Object>} - Object with key 'suc' and error message 'msg'
 */
exports.runApply = async function (userID, moodleUsername, moodlePassword, moodleURL, accessToken, autoRan = false) {
    try {

        let userObj = await schemaUtils.fetchUser(userID);
        if (!userObj) return {
            suc: false,
            msg: `Unable to apply, no user object was found saved with a valid refresh token, try logging out and logging back in!`
        };

        // We'll check if their token is any good
        let validToken = await exports.checkAccessToken(accessToken);
        if (!validToken) {
            accessToken = await exports.getAccessToken(userObj.refreshToken);
        }

        // Check if the google calender exists or create it
        let calender = await exports.getEventCalender(accessToken);
        if (!calender) return {suc: false, msg: `Unable to fetch calender!`};
        let calenderID = calender.id;

        // Get the users current events to make sure we don't add duplicates, dont care about the length
        let userEvents = await exports.listEvents(calenderID, accessToken);

        // Gets users assignments
        let assignments = await exports.getAssignments(moodleUsername, moodlePassword, moodleURL);
        if (!assignments) return {suc: false, msg: `Unable to log into moodle with the supplied credentials!`};

        console.info(`${(autoRan ? chalk.red('[AUTO RUN] ') : '')}${noteUser} Added ${chalk.red(assignments.length)} events for user ${chalk.bold(userObj.profile.name)}`);

        for (let ass of assignments) {

            // We gota parse the date, Format = Friday, 7 September, 5:00 PM
            let dateTime = new Date(chrono.parseDate(`${ass.date}, ${new Date().getFullYear()}`)).toISOString();

            // Check if its a duplicate, if it doesn't insert it'll try again on next try
            if (!userEvents.includes(ass.name)) exports.insetEvent(calenderID, ass.name, ass.course, dateTime, accessToken).catch(err => {
            });
        }

        // Store their moodle credentials if they checked it if theyre not set
        if (!userObj.moodleSettings.moodleUsername || !userObj.moodleSettings.moodlePassword || !userObj.moodleSettings.moodleURL) {
            userObj.moodleSettings.moodleUsername = moodleUsername;
            userObj.moodleSettings.moodlePassword = moodlePassword;
            userObj.moodleSettings.moodleURL = moodleURL;
        }

        // Update the users last applied date and increment uses count
        userObj.lastApplied = new Date().toISOString();
        userObj.numApplication++;
        userObj.save();

        return {suc: true};

    } catch (err) {
        console.error(`Unable to automatically run apply for ID: ${userID}, Error: ${err.stack}`);
    }
};
