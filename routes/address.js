var models = require('../models');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/:address/:offset*?', async function(req, res, next) {

  const addrss = encodeURI(req.params.address);
  const limit = 30;
  const paramPage = parseInt(req.params.offset);
  const page = isNaN(paramPage) || paramPage < 1 ? 1 : paramPage;
  const offset = 30 * (page - 1);
  const txes = await models.sequelize.query(`
    SELECT txid
    FROM Transactions as t
    LEFT JOIN Vouts as v
    ON v.TransactionId=t.id
    LEFT JOIN AddressVouts as av
    ON v.id=av.VoutId
    LEFT JOIN Addresses as a
    ON a.id=av.AddressId
    WHERE a.address='${addrss}'
    LIMIT ${limit}
    OFFSET ${offset};
  `);

  if (txes === null) {
    res.status(404).render('404');
    return;
  }

  const nextpage = txes[0].length === 30 ? page + 1 : null;
  const prevpage = page > 1 ? page - 1 : null;
  
  res.render('address', {
    address: addrss,
    txes: txes[0],
    nextpage,
    prevpage,
  });
});

module.exports = router;
