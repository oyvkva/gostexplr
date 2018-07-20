var models = require('../models');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', async function(req, res, next) {

  const blocks = await models.Block.findAll({
    attributes: ['height', 'hash', 'time', 'difficulty'],
    order: [['height', 'DESC']],
    limit: 30,
  });
  res.render('index', {
    blocks,
  });
});

module.exports = router;
