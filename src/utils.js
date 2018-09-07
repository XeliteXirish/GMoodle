const index = require('./index');

const axios = require('axios');
const MoodleUser = require('elite-moodle-scraper').MoodleUser;

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

exports.runApply = async function (userID, moodleUsername, moodlePassword, moodleURL, refreshToken) {
    try {

        // We're just going to send a request to our own endpoint! #CodeDuplication
        axios.post('/apply', {
            musername: moodleUsername,
            mpassword: moodlePassword,
            murl: moodleURL
        })

    } catch (err) {
        console.error(`Unable to automatically run apply for ID: ${userID}, Error: ${err.stack}`);
    }
}
