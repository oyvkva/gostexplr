var models = require('../models');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', async function (req, res, next) {

  var blocks = await models.Block.findAll({
    attributes: ['height', 'hash', 'time', 'difficulty'],
    order: [['height', 'DESC']],
    limit: 100,
  });
  blocks.forEach(function (arrayItem) {
    arrayItem.ago = arrayItem.time.toUTCString().substring(5);
  });
  res.render('index', {
    blocks,
  });
});

module.exports = router;
