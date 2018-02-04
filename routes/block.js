var models = require('../models');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/:hash', async function(req, res, next) {
  const hash = encodeURI(req.params.hash);
  const block = await models.Block.findOne({
    where: {
      hash,
    },
    include: {
      model: models.Transaction,
    },
  });
  if (block === null) {
    res.status(404).render('404');
    return;
  }
  const lastBlock = await models.Block.findOne({
    attributes: [
      [models.sequelize.fn('MAX', models.sequelize.col('height')), 'maxheight']
    ],
  });
  block.dataValues.confirmations = lastBlock.dataValues.maxheight - block.height + 1;
  block.dataValues.time = block.time.toUTCString();
  res.render('block', {
    block,
  });

});

module.exports = router;
