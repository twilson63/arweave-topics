# Arweave Topics

## The idea

Many social applications want users to be able to subscribe to particular topics, so that users can generate a specific feed of information with those topics. SmartWeave contracts are nice, but might be overkill for this kind of functionality. The thinking is that everytime a user subscribes to a topic to create a new transaction on arweave for that owner for that specific topic using the tags for a specific protocol and the topic name. Then use graphql to return a query of all topic transactions and then combine them into an array of topics. Then the developer can take that array of topics and use it to get a list of items in their application that matches those topics.

## What would the API look like?

``` js
// setup _topics
const _topics = Topics.init(arweave)

// get topic list
const topics = await _topics.load(owner)
//=> ['b-topic', 'c-topic']

const result = await _topics.subscribe('a-topic')
//=> { ok: true }

const result = await _topics.unsubscribe('a-topic')
//=> { ok: true }

```

## How it works?

Using dependency injection, we will inject Arweave into the `_topics` function as a closure, then within the closure we will implement the three public functions:
load, subscribe, and unsubscribe.

### load

@param: owner - wallet public address

The load function will execute a graphQl query looking for all of the transactions that were created by the owners address for Protocol: "Topic", and pluck the property Topic and Status from all of the returned transactions, then map over each object and if the status is `active` the item is added to the result list, if the status is `inactive` then the item is removed from the list. And the result will be a list of active 'topics' to be returned to the application.

### subscribe

@param: topic - string max 20 characters - unique topic to describe

The subscribe function will first check to see if the topic has already been subscribed to for that owner, if not, then the function will create and dispatch a transcation that contains the tags to identify the transaction Protocol as Topic and the Topic Value as the supplied topic in the parameter and the Status as active, if the result is successful then return `{ok: true}`.


### unsubscribe

@param: topic - string max 20 characters - unique topic to unsubscribe

The subscribe function will first check to see if the topic has already been subscribed to for that owner, if so, then the function will create and dispatch a transaction that contains the tags to identify the transaction Protocol as Topic and the Topic Value as the supplied topic in the parameter and the Status as inactive, if the result is successful then return `{ok: true}`.

## FAQ

* Why not use smartweave contracts? 

I think it is a great idea to use smartweave contracts, and originally looked at this process with another social feature, and the result was overkill for the process. First we had to either create a smart contract for each profile, then perform an interaction, the call the readState function which runs the reducer to move from initial state to final state based on each iteraction transaction. This resulted in slow transactions in sdk 1 and in sdk 2 the transactions were very sporatic, sometimes they would return and sometimes they would error. I am not sure what I could have been doing wrong, but it seemed to be complex. 

* Since all the data is public, can't a user create a transaction outside of this module to using the same protocol and potentially break the functionality?

Everything is possible with public data, but since this data set is specific to wallet, in theory topics can only be subscribed by the owner of the wallet, so no other party should be able to add or remove a topic for a user unless they somehow got access to their wallet.



