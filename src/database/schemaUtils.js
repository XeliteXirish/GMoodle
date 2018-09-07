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
 * Save a new user to the database
 * @param userID
 * @param name
 * @param picture
 * @param gender
 * @param plusURL
 * @param refreshToken
 * @returns {Promise<void>}
 */
exports.saveUser = async function (userID, name, picture, gender, plusURL, refreshToken) {
    try {
        // See if user exists
        let user = await exports.fetchUser(userID);
        if (user) {
            // They exist, so update their data
            user.name = name;
            user.picture = picture;
            user.gender = gender;
            user.plusURL = plusURL;

            if (refreshToken) user.refreshToken = refreshToken;

            // Don't want to update refresh token since we only get it once

            user.save();

        } else {
            // They dont exist, so create one
            let newUser = new driver.getModals().Account({
                id: userID,
                name: name,
                picture: picture,
                gender: gender,
                plusURL: plusURL,
                refreshToken: refreshToken
            });

            newUser.save();
        }
    } catch (err) {
        console.error(`Unable to save new user with ID ${userID}, Error: ${err.stack}`);
    }
};