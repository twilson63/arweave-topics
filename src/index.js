import crocks from 'crocks'
import * as R from 'ramda'
const { Async } = crocks
const { compose, equals, find, map, path, pluck, prop, propEq, reduce, reject, uniq} = R

/**
 * @param {Arweave} arweave
 */
export default function (arweave) {
  const post =  Async.fromPromise(arweave.api.post.bind(arweave.api))
  const gql = query => post('graphql', { query })
  const createTx = Async.fromPromise(arweave.createTransaction.bind(arweave))
  // const signTx = Async.fromPromise(arweave.transactions.sign.bind(arweave.transactions))
  // const postTx = Async.fromPromise(arweave.transactions.post.bind(arweave.transactions)
  const dispatch = Async.fromPromise(async (tx) => {
    if (global.arweaveWallet) {
      return await arweaveWallet.dispatch(tx)
    }
    await arweave.transactions.sign(tx)
    await arweave.transactions.post(tx)
  })

  /**
   * @param {string} owner
   * @returns {Promise<string[]>}
   */
  function load(owner) {
    return Async.of(owner)
      // validate owner is string and proper length
      .map(buildGql)
      .chain(gql)
      .chain(isSuccess)
      .map(getTopics)
      .toPromise()
  }

  /**
   * @param {string} topic
   * @returns {Promise<Record>}
   */
  async function subscribe(topic) {
    return Async.of({data: topic})
      .chain(createTx)
      .map(tx => {
        map(t => tx.addTag(t.name, t.value), addTags(topic))
        return tx
      })
      .chain(dispatch)
      .map(() => ({ok: true}))
      .toPromise()
  }

  /**
   * @param {string} topic
   * @returns {Promise<Record>}
   */
  async function unsubscribe(topic) {
    return Async.of({data: topic})
      .chain(createTx)
      .map(tx => {
        map(t => tx.addTag(t.name, t.value), addTags(topic))
        return tx
      })
      .map(tx => {
        tx.addTag('Status', 'inactive')
        return tx
      })
      .chain(dispatch)
      .map(() => ({ok: true}))
      .toPromise()
  }

  return Object.freeze({
    load,
    subscribe,
    unsubscribe
  })
}

// PURE Functions

function addTags(topic) {
  return [
    { name: 'Content-Type', value: 'text/plain'},
    { name: 'Protocol', value: 'Topic'},
    { name: 'Topic', value: topic}
  ]
}

function isSuccess(res) {
  if (res.status === 200) {
    return Async.Resolved(res.data)
  } else {
    return Async.Rejected(res.data)
  }
}

function getTopics(res) {
  return compose(
   uniq,
   buildTopicList,
   pluck('node'),
   path(['data', 'transactions', 'edges'])
  )(res)
}

function buildTopicList(nodes) {
  return reduce(
    (acc, v) => {
      const s = find(propEq('name', 'Status'), prop('tags', v))
      const t = find(propEq('name', 'Topic'), prop('tags', v))
      
      if (propEq('value', 'inactive', s)) {
        // remove topic from list
        acc = reject(equals(prop('value', t)), acc)
      } else {
        // append topic to list
        acc = [...acc, prop('value', t)]
      }
      
      return acc
    },
    [],
    nodes.reverse()
  )
}

function buildGql(owner) {
  return `
query {
  transactions(
    first: 100,
    owners: ["${owner}"],
    tags: [
      {name: "Content-Type", values: ["text/plain"]},
      {name: "Protocol", values: ["Topic"]}
    ]
  ) {
    edges {
      node {
        id
        tags {
          name
          value
        }
      }
    }
  }
}
  `
}

