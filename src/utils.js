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
        console.log(`[DEBUG] Calender not found, creating`);
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
        console.log(accessToken);
        let res = await axios.post(`https://www.googleapis.com/calendar/v3/calendars?access_token=${accessToken}`, {
            summary: calenderName,
        });
        return res.data;
    } catch (err) {
        console.error(`Error creating calender, Error: ${err}`);
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
        console.error(`Error listing calenders, Error: ${err.stack}`);
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
                dateTime: `${dateTime}`
            },
            end: {
                dateTime: `${dateTime}`
            },
            summary: title,
            description: description
        });

        return res.data;

    } catch (err) {
        console.error(`Error creating new event, Error: ${err}`);
        if (err.response) console.error(err.response.data)
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
    }
};

