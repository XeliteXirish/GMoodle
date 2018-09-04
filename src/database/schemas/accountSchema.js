const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
    email: {type: String},
    password: {type: String},
    isAdmin: {type: Boolean, default: false},
});

module.exports = AccountSchema;