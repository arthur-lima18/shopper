require('dotenv').config()

const db = require('mysql2');

var pool = db.createPool({
    "user": "root",
    "password" : "123456",
    "database" : "db_shopper",
    "host" : "localhost",
    "port" : 3306
});

exports.pool = pool;