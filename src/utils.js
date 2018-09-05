const index = require('./index');
const axios = require('axios');

exports.getEventCalender = async function (accessToken) {
    try {

        let calenders = exports.listCalenders(accessToken);
        for (let cal of calenders) {
            if (cal.name === index.config.calenderName) return cal;
        }

        // If its not defined by here we need to create
        return await exports.createCalender(index.config.calenderName, accessToken);

    } catch (err) {
        console.error(`Error fetching calender, Error: ${err.stack}`);
    }
};

exports.createCalender = async function (calenderName, accessToken) {
    try {
        return await axios.post(`https://www.googleapis.com/calendar/v3/calendars?access_token=${accessToken}`, {
            summery: calenderName,
        });
    } catch (err) {
        console.error(`Error creating calender, Error: ${err.stack}`);
    }
};

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