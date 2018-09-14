const driver = require('./driver');

exports.fetchUser = async function (userID) {
    try {
        let user = await driver.getModals().Account.findOne({id: userID});
        if (!user) return null;
        return user;
    } catch (e) {
        console.error(`Unable to fetch user with ID: ${userID}`);
    }
};

/**
 * Returns an array of all user objects
 * @returns {Promise<Array>}
 */
exports.fetchAllUsers = async function () {
    try {
        return await driver.getModals().Account.find({}) || [];
    } catch (err) {
        console.error(`Unable to fetch all users, Error: ${err.stack}`)
    }
};

/**
 * Save a new user to the database
 * @param userID
 * @param name
 * @param picture
 * @param gender
 * @param plusURL
 * @param emails
 * @param refreshToken
 * @param autoApply
 * @param moodleUsername
 * @param moodlePassword
 * @param moodleURL
 * @returns {Promise<void>}
 */
exports.saveUser = async function (userID, name, picture, gender, plusURL, emails, refreshToken, autoApply, moodleUsername, moodlePassword, moodleURL) {
    try {
        // See if user exists
        let user = await exports.fetchUser(userID);
        if (user) {
            // They exist, so update their data
            user.profile.name = name;
            user.profile.picture = picture;
            user.profile.gender = gender;
            user.profile.plusURL = plusURL;
            user.profile.emails = emails;

            if (refreshToken) user.refreshToken = refreshToken;

            // Don't want to update refresh token since we only get it once

            user.save();

        } else {
            // They dont exist, so create one
            let newUser = new driver.getModals().Account({
                id: userID,
                profile: {
                    name: name,
                    picture: picture,
                    gender: gender,
                    plusURL: plusURL,
                    emails: emails
                },
                refreshToken: refreshToken,
                autoApply: autoApply,
                moodleSettings: {
                    moodleUsername: moodleUsername,
                    moodlePassword: moodlePassword,
                    moodleURL: moodleURL
                }
            });

            newUser.save();
        }
    } catch (err) {
        console.error(`Unable to save new user with ID ${userID}, Error: ${err.stack}`);
    }
};