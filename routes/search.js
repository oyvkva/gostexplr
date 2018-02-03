var models = require('../models');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.post('/', function(req, res, next) {

  const search = encodeURI(req.body.search);

  models.Address.findOne({
    where: {
      address: search,
    },
  })
  .then((address) => {
    if (address) {
      res.redirect(`/address/${address.address}`);
      return;
    }
    models.Transaction.findOne({
      where: {
        txid: search,
      },
    })
    .then((transaction) => {
      if (transaction) {
        res.redirect(`/transaction/${transaction.txid}`);
        return;
      }
      models.Block.findOne({
        where: {
          hash: search,
        },
      })
      .then((block) => {
        if (block) {
          res.redirect(`/block/${block.hash}`);
          return;
        }
        res.status(404).render('404');
      });
    });
  });
});

module.exports = router;
