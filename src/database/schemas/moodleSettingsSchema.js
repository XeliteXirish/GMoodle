const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
    id: {type: String},
    moodleUsername: {type: String},
    moodlePassword: {type: String},
    moodleURL: {type: String}
});

module.exports = AccountSchema;