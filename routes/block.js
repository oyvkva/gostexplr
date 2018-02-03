var models = require('../models');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/:hash', function(req, res, next) {
  const hash = encodeURI(req.params.hash);
  models.Block.findOne({
    where: {
      hash,
    },
    include: {
      model: models.Transaction,
    },
  })
  .then((block) => {
    if (block === null) {
      res.status(404).render('404');
      return;
    }
    block.dataValues.time = block.time.toUTCString();
    res.render('block', {
      block,
    });
  });
});

module.exports = router;
