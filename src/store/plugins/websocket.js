// broadcast/store ←→ [websocket] ←→ server

// handles websockets, and delegates events to broadcast

import nanoid from 'nanoid'

import utils from '@/utils.js'

let websocket, currentSpaceRoom, currentUserIsConnected
const clientId = nanoid()

const joinSpaceRoom = (store, mutation) => {
  if (!websocket) { return }
  const space = utils.clone(store.state.currentSpace)
  const currentSpaceHasUrl = utils.currentSpaceHasUrl(space)
  const user = utils.clone(store.state.currentUser)
  if (!currentSpaceHasUrl) { return }
  if (currentSpaceRoom === space.id) { return }
  console.log('🌜 joinSpaceRoom', space.name)
  currentSpaceRoom = space.id
  websocket.send(JSON.stringify({
    message: 'joinSpaceRoom',
    space: utils.spaceMeta(space),
    user: utils.userMeta(user, space),
    clientId
  }))
}

const sendEvent = (store, mutation, type) => {
  if (!websocket || !currentUserIsConnected) { return }
  const message = mutation.payload.type
  let updates = mutation.payload
  updates = utils.normalizeBroadcastUpdates(updates)
  if (updates.type !== 'updateRemoteUserCursor') {
    console.log('🌜', updates)
  }
  const space = utils.clone(store.state.currentSpace)
  websocket.send(JSON.stringify({
    message,
    updates,
    clientId,
    space: utils.spaceMeta(space),
    type
  }))
}

const checkIfShouldUpdateWindowUrlAndTitle = (store, data) => {
  const newName = data.updates.name
  if (data.message === 'updateSpace' && newName) {
    utils.updateWindowUrlAndTitle({
      space: utils.clone(store.state.currentSpace),
      shouldUpdateUrl: true
    })
  }
}

const closeWebsocket = (store) => {
  if (!websocket) { return }
  const space = utils.clone(store.state.currentSpace)
  websocket.close(JSON.stringify({
    clientId,
    space: utils.spaceMeta(space)
  }))
}

export default function createWebSocketPlugin () {
  return store => {
    store.subscribe((mutation, state) => {
      if (mutation.type === 'broadcast/connect') {
        const host = utils.websocketHost()
        websocket = new WebSocket(host)
        websocket.onopen = (event) => {
          currentUserIsConnected = true
          store.commit('broadcast/joinSpaceRoom')
        }
        websocket.onclose = (event) => {
          console.warn('🌚', event)
          store.dispatch('broadcast/reconnect')
        }
        websocket.onerror = (event) => {
          console.warn('🌌', event)
        }
        // receive
        websocket.onmessage = ({ data }) => {
          data = JSON.parse(data)
          if (data.clientId === clientId) { return }
          if (data.message !== 'updateRemoteUserCursor') {
            console.log('🌛', data)
          }
          let { message, user, updates } = data
          if (message === 'connected') {
          } else if (message === 'userJoinedRoom') {
            store.dispatch('currentSpace/addUserToJoinedSpace', user)
          } else if (message === 'userLeftRoom') {
            store.commit('currentSpace/removeSpectatorFromSpace', user)
          } else if (message === 'userLeftSpace') {
            store.commit('currentSpace/removeCollaboratorFromSpace', updates.user)
          } else if (message === 'addRemotePaintingCircle') {
            store.commit('triggerAddRemotePaintingCircle', updates)
          } else if (message === 'updateRemoteUserCursor') {
            store.commit('triggerUpdateRemoteUserCursor', updates)
          } else if (data.type === 'store') {
            store.commit(`${message}`, updates)
          } else {
            store.commit(`currentSpace/${message}`, updates)
            checkIfShouldUpdateWindowUrlAndTitle(store, data)
          }
        }
      }

      // send
      if (mutation.type === 'broadcast/joinSpaceRoom') {
        if (!currentUserIsConnected) {
          store.commit('broadcast/connect')
          return
        }
        joinSpaceRoom(store, mutation)
      } else if (mutation.type === 'broadcast/update') {
        const canEditSpace = store.getters['currentUser/canEditSpace']()
        if (!canEditSpace) { return }
        sendEvent(store, mutation)
      } else if (mutation.type === 'broadcast/updateUser') {
        sendEvent(store, mutation)
      } else if (mutation.type === 'broadcast/updateStore') {
        const canEditSpace = store.getters['currentUser/canEditSpace']()
        if (!canEditSpace) { return }
        sendEvent(store, mutation, 'store')
      } else if (mutation.type === 'broadcast/close') {
        closeWebsocket(store)
      } else if (mutation.type === 'broadcast/reconnect') {
        closeWebsocket(store)
        currentUserIsConnected = false
        currentSpaceRoom = null
        store.commit('broadcast/joinSpaceRoom')
      }
    })
  }
}
