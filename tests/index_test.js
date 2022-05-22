import { test } from 'uvu'
import * as assert from 'uvu/assert'
import Arweave from 'arweave'
import Topics from '../src/index.js'
import ArLocal from 'arlocal';

test('topic tests', async () => {
  const arLocal = new ArLocal.default();
  
  await arLocal.start();

  const arweave = Arweave.init({
    host: 'localhost',
    port: 1984,
    protocol: 'http'
  })
  const w = await arweave.wallets.generate()
  const addr = await arweave.wallets.jwkToAddress(w)
  await arweave.api.get(`mint/${addr}/${arweave.ar.arToWinston('100')}`)
  global.arweaveWallet = {
    async dispatch(tx) {
      const id = tx._id
      await arweave.transactions.sign(tx, w)
      await arweave.transactions.post(tx)
      return tx
    }
  }

  const _topics = Topics(arweave)
  await _topics.subscribe('personal')
  await _topics.subscribe('public')
  await _topics.subscribe('dev')
  await _topics.unsubscribe('public')

  const topics = await _topics.load(addr)
  
  assert.equal(topics, ['personal','dev'])

  await arLocal.stop();
})

test.run()