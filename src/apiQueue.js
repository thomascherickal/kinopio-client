import debounce from 'lodash-es/debounce'
import merge from 'lodash-es/merge'

import api from '@/api.js'
import cache from '@/cache.js'
import utils from '@/utils.js'

window.onload = () => {
  self.process()
  // setInterval(() => {
  //   self.process()
  // }, 5 * 1000) // 5 seconds
}

const processQueue = debounce(async () => {
  self.process()
}, 500, {
  leading: true
})

const self = {

  async add (name, body) {
    // const userIsContributor = cache.space(space.id).contributorKey or key stored in user
    body = utils.clone(body)
    body.spaceId = body.spaceId || cache.user().lastSpaceId
    const userIsSignedIn = cache.user().apiKey
    if (!userIsSignedIn) { return }
    let queue = cache.queue()
    const request = {
      name,
      body
    }
    queue.push(request)
    cache.saveQueue(queue)
    processQueue()
  },

  squash (queue) {
    let squashed = []
    queue.forEach(request => {
      // check if request has already been squashed
      const isSquashed = squashed.find(item => {
        return item.name === request.name && item.body.id === request.body.id
      })
      if (isSquashed) { return }
      // merge queue items with the same operation name and matching entity id
      const matches = queue.filter(item => {
        return item.name === request.name && item.body.id === request.body.id
      })
      const reduced = matches.reduce((accumulator, currentValue) => merge(accumulator, currentValue))
      reduced.name = request.name
      squashed.push(reduced)
    })
    return squashed
  },

  requeue (items) {
    items.forEach(item => {
      let queue = cache.queue()
      queue.push(item)
      cache.saveQueue(queue)
    })
    console.log('🚑 requeue', cache.queue())
  },

  async process () {
    if (!window.navigator.onLine) { return }
    const queue = cache.queue()
    const items = this.squash(queue)
    cache.clearQueue()
    try {
      await api.processQueue(items)
    } catch (error) {
      console.error('🚒', error, items)
      this.requeue(items)
    }
  }

}

export default self
