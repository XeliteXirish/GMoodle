const driver = require('./driver');

exports.fetchUser = async function (userID) {
    try {
        let user = await driver.getModals().Account.findOne({id: userID});
        if (!user) return {};
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
 * @returns {Promise<void>}
 */
exports.saveUser = async function (userID, name, picture, gender, plusURL) {
    try {
        // See if user exists
        let user = await exports.fetchUser(userID);
        if (user) {
            // They exist, so update their data
            user.name = name;
            user.picture = picture;
            user.gender = gender;
            user.plusURL = plusURL;

            user.save();

        } else {
            // They dont exist, so create one
            let newUser = new driver.getModals().Account({
                id: userID,
                name: name,
                email: email,
                picture: picture,
                gender: gender,
                plusURL: plusURL
            });

            newUser.save();
        }
    } catch (err) {
        console.error(`Unable to save new user with ID ${userID}, Error: ${err.stack}`);
    }
};