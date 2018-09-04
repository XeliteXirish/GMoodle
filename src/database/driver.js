const index = require('../index');
const mongoose = require('mongoose');

let db = exports.db = null;

exports.connect = function () {

    try {

        // Connect
        mongoose.connect(index.config.db_url, {
            autoReconnect: true,
            connectTimeoutMS: 30000,
            socketTimeoutMS: 30000,
            keepAlive: 120,
            poolSize: 100
        }, (err) => {
            if (err) console.error('Mongo couldnt connect to database! Fix!');
        });

        db = mongoose.connection;
        mongoose.Promise = global.Promise;

        loadSchemas();

        db.on('err', (err) => {
            console.error(`A worker suffered an error during connection to MongoDB!, Error: ${err.stack}`);
            return false;
        });

        db.once('open', function () {
            return true;
        });

    } catch (err) {
        console.error(`A worker suffered an error while setting up MongoDB!, Error: ${err.stack}`);
    }
};

exports.getModals = function () {
    return mongoose.models;
};

exports.getConnection = function () {
    return mongoose.connection;
};

function loadSchemas() {
    mongoose.model('Account', require('./schemas/accountSchema'));
}
