#!/usr/bin/env node
var exec = require('child_process').exec;
var models = require('../models');
var env = require('../config/config.json')['env'] || 'development';
var config = require(__dirname + '/../config/config.json')['database'][env];

if (process.argv.length < 4) {
  console.log('Provide root user name and password for mysql');
  process.exit(0);
}

const dropUserDB = `mysql -u${process.argv[2]} -p${process.argv[3]} -e "drop database ${config.database};drop user ${config.username}"`
const createdb = `mysql -u${process.argv[2]} -p${process.argv[3]} -e "create database ${config.database}"`;
const createUser = `mysql -u${process.argv[2]} -p${process.argv[3]} -e "create user ${config.username} identified by '${config.password}'"`;
const grantAccess = `mysql -u${process.argv[2]} -p${process.argv[3]} -e "grant all on ${config.database}.* to ${config.username}"`;

exec(dropUserDB, function(err,stdout,stderr) {
  console.log(stdout);
  exec(createdb, function(err,stdout,stderr) {
    if (err) {
      console.log(err);
      process.exit(0);
    } else {
      console.log(stdout);
      exec(createUser, function(err, stdout, stderr) {
        if (err) {
          console.log(err);
          process.exit(0);
        } else {
          console.log(stdout);
          exec(grantAccess, function(err, stdout, stderr) {
            if (err) {
              console.log(err);
            } else {
              console.log(stdout);
              models.sequelize.sync({force: true})
              .then(() => {
                console.log(`\nUSER (${config.username}) AND DATABASE (${config.database}) CREATED SUCCESSFULLY`);
                process.exit(0);
              })
              .catch((err) => {
                console.log(err);
                process.exit(0);
              });
            }
          });
        }
      });
    }
  });
});
