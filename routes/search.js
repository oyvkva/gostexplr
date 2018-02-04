var models = require('../models');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.post('/', async function(req, res, next) {

  let search = encodeURI(req.body.search).trim();

  // checking extra -000 in the end
  if (search.endsWith('-000')) {
    search = search.slice(0, -4);
  }

  // checking if it is block index
  const blockIndex = parseInt(search);
  if (isNaN(blockIndex) === false && blockIndex.toString() === search) {
    const block = await models.Block.findOne({
      where: {
        height: blockIndex,
      },
    });
    if (block) {
      res.redirect(`/block/${block.hash}/`);
      return;
    }
  }

  if (search.length === 34) {
    // looking for address
    const address = await models.Address.findOne({
      where: {
        address: search,
      },
    });
    if (address) {
      res.redirect(`/address/${address.address}/`);
      return;
    }
  } else if(search.length === 64) {
    // looking for transaction
    const transaction = await models.Transaction.findOne({
      where: {
        txid: search,
      },
    });
    if (transaction) {
      res.redirect(`/transaction/${transaction.txid}/`);
      return;
    }

    // looking for block
    const block = await models.Block.findOne({
      where: {
        hash: search,
      },
    });
    if (block) {
      res.redirect(`/block/${block.hash}/`);
      return;
    }
  }

  res.status(404).render('404');
});

module.exports = router;
