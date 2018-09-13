const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
    name: {type: String},
    picture: {type: String},
    gender: {type: String},
    plusURL: {type: String}
});

module.exports = AccountSchema;