var http = require('http');
var models = require('../models');
var rpcConfig = require('../config/config')['rpc'];

const {username, password, hostname, port} = rpcConfig;

function MakeRPCRequest(postData) {
  return new Promise(function(resolve, reject) {
    var post_options = {
      host: hostname,
      port: port,
      auth: `${username}:${password}`,
      path: '/',
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
      }
    };
    var post_req = http.request(post_options, function(res) {
      res.setEncoding("utf8");
      let body = "";
      res.on("data", data => {
        body += data;
      });
      res.on("end", () => {
        resolve(body);
      });
    });
    post_req.write(postData);
    post_req.end();
  });
}

async function saveTransaction(txid, blockHeight) {
  const res_tx = await MakeRPCRequest(JSON.stringify({
    method: 'getrawtransaction',
    params: [txid, 1],
    id: 1
  }));
  const tx = JSON.parse(res_tx)['result'];
  // console.log('tx:', tx);
  if (tx === null) {
    await models.Failure.create({
      msg: `${txid} fetching failed`,
    });
    return;
  }
  const transaction = await models.Transaction.create({
    txid: tx.txid,
    BlockHeight: blockHeight,
  });
  for (var i = 0; i < tx.vout.length; i++) {
    const vout = tx.vout[i];
    const m_vout = await models.Vout.create({
      value: vout.value,
    });
    for (var y = 0; y < vout.scriptPubKey.addresses.length; y++) {
      const address = vout.scriptPubKey.addresses[y];
      let m_address = await models.Address.findOne({
        where: {
          address,
        },
      });
      if (m_address === null) {
        m_address = await models.Address.create({
          address,
        });
      }
      await m_vout.addAddresses(m_address);
    }
    await transaction.addVouts(m_vout);
  }
  for (var i = 0; i < tx.vin.length; i++) {
    const vin = tx.vin[i];
    if (vin.txid) {
      const trans = await models.Transaction.findOne({
        where: {
          txid: vin.txid,
        },
      });
      if (trans) {
        await transaction.addTxtx(trans);
      }
    }
  }
}

async function syncNextBlock(syncedHeight) {
  const height = syncedHeight + 1;
  const res_hash = await MakeRPCRequest(JSON.stringify({
    method: 'getblockhash',
    params: [height],
    id: 1
  }));
  const blockHash = JSON.parse(res_hash)['result'];
  const res_block = await MakeRPCRequest(JSON.stringify({
    method: 'getblock',
    params: [blockHash],
    id: 1
  }));
  const block = JSON.parse(res_block)['result'];
  block.time = new Date(block.time * 1000);
  await models.Block.create(block);
  for (var i = 0; i < block.tx.length; i++) {
    await saveTransaction(block.tx[i], block.height);
  }
  if (block.height > 1) {
    await models.Block.update({
      nextblockhash: block.hash
    },{
      where: {
        hash: block.previousblockhash
      }
    });
  }
  return height;
}

async function getCurrentHeight() {
  const result = await MakeRPCRequest(JSON.stringify({
    method: 'getblockcount',
    params: [],
    id: 1
  }));

  return JSON.parse(result)['result'];
}

async function getSyncedHeight() {
  const result = await models.Block.findOne({
    attributes: ['height'],
    order: [['height', 'DESC']],
    limit: 1
  });
  const height = result ? result.height : -1;
  return height;
}

async function syncBlockchain() {
  let syncedHeight = await getSyncedHeight();
  console.log('\x1b[36m%s\x1b[0m', 'syncedHeight is', syncedHeight);

  let currentHeight = await getCurrentHeight();
  console.log('\x1b[36m%s\x1b[0m', 'currentHeight is', currentHeight);
  while (syncedHeight < currentHeight) {
    syncedHeight = await syncNextBlock(syncedHeight);
    console.log('\x1b[36m%s\x1b[0m', 'syncedHeight: ', syncedHeight)
  }
  process.exit(0);
}

var postData = JSON.stringify({
      'method': 'getinfo',
      'params': [],
      'id': 1
    });

syncBlockchain();
