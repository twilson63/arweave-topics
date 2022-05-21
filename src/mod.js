import { crocks, R } from './deps.js'
const { Async } = crocks
const { compose, find, path, pluck, prop, propEq} = R

export function init (arweave) {
  const gql = Async.fromPromise(query => arweave.api.post('graphql', { query }))
  const createTx = Async.fromPromise(arweave.createTransaction)
  
  const signTx = Async.fromPromise(tx => arweave.transactions.sign(tx))
  const postTx = Async.fromPromise(tx => arweave.transactions.post(tx))

  async function load(owner) {
    return Async.of(owner)
      // validate owner is string and proper length
      .map(buildGql)
      .chain(gql)
      .map(getTopics)
  }

  async function subscribe(topic) {
    return Async.of(topic)
      .chain(createTx({data: topic}))
      //.map(addTags)
      //.chain(dispatch)
  }
  async function unsubscribe(topic) {

  }
  return Object.freeze(
    load,
    subscribe,
    unsubscribe
  )
}

function getTopics(res) {
  return compose(
    prop('value'), 
    find(propEq('name', 'Topic')),
    pluck('tags'),
    path(['data', 'data', 'transactions', 'edges'])
  )(res)
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
    id
    tags {
      name
      value
    }
  }
}
  `
}

