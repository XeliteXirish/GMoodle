const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
    id: {type: String},
    name: {type: String},
    picture: {type: String},
    gender: {type: String},
    plusURL: {type: String},
    isAdmin: {type: Boolean, default: false},
    refreshToken: {type: String},
    numApplication: {type: Number, default: 0},
    automaticApplication: {type: Boolean, default: false},
    lastApplied: {type: Date}
});

module.exports = AccountSchema;