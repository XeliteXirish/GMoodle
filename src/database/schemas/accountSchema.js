const mongoose = require('mongoose');

const userProfile = require('./userProfileSchema');
const moodleSettings = require('./moodleSettingsSchema');

const AccountSchema = new mongoose.Schema({
    id: {type: String},
    profile: userProfile,
    isAdmin: {type: Boolean, default: false},
    refreshToken: {type: String},
    numApplications: {type: Number, default: 0},
    autoApply: {type: Boolean, default: false},
    moodleSettings: moodleSettings,
    lastApplied: {type: Date}
});

module.exports = AccountSchema;