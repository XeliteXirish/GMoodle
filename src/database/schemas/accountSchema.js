const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
    id: {type: String},
    name: {type: String},
    picture: {type: String},
    gender: {type: String},
    plusURL: {type: String},
    isAdmin: {type: Boolean, default: false},
    refreshToken: {type: String}
});

module.exports = AccountSchema;