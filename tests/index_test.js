import { test } from 'uvu'
import * as assert from 'uvu/assert'
import Arweave from 'arweave'
import * as Topics from '../src/index.js'

test('Hello World', async () => {
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

  const _topics = Topics.init(arweave)
  const result = await _topics.subscribe('personal')
  const result2 = await _topics.subscribe('public')
  assert.ok(result.ok)

  const topics = await _topics.load(addr)
  assert.equal(topics, ['public', 'personal'])
})

test.run()