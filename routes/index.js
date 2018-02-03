var models = require('../models');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  models.Block.findAll({
    order: [['height', 'DESC']],
    limit: 30,
  })
  .then((blocks) => {
    res.render('index', {
      blocks,
    });
  });

});

module.exports = router;
