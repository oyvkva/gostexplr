#!/usr/bin/env node
var models = require('../models');

models.sequelize.sync({force: true})
.then(() => {
  console.log('Tables created');
  process.exit(0);
})
.catch((err) => {
  console.log(err);
  process.exit(0);
});
