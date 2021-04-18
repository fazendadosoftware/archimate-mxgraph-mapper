import jwtDecode from 'jwt-decode'
import { createStore } from 'vuex'
import worker from 'workerize-loader!@/worker'

const instance = worker()

export const store = createStore({
  state () {
    return {
      accessToken: null,
      loadingBookmarks: false,
      bookmarks: [],
      selectedBookmark: null,
      diagrams: [],
      selectedDiagram: null
    }
  },
  getters: {
    isAuthenticated: state => state.accessToken !== null,
    decodedJwt: state => state.accessToken !== null ? jwtDecode(state.accessToken) : {}
  },
  mutations: {
    setAccessToken(state, accessToken = null) {
      state.accessToken = accessToken
    },
    setRefreshTimeout(state, refreshTimeout = null) {
      if (typeof state.refreshTimeout === 'number') clearTimeout(state.refreshTimeout)
      state.refreshTimeout = refreshTimeout
    },
    setLoadingBookmarks(state, value = false) {
      state.loadingBookmarks = value
    },
    setBookmarks(state, bookmarks = []) {
      state.bookmarks = bookmarks
    },
    setSelectedBookmark(state, bookmark = null) {
      state.selectedBookmark = bookmark
      state.selectedDiagram = null
    },
    setDiagrams(state, diagrams = []) {
      state.diagrams = diagrams
    },
    setSelectedDiagram(state, selectedDiagram = null) {
      state.selectedDiagram = selectedDiagram
      state.selectedBookmark = null
    }
  },
  actions: {
    async getAccessToken ({ commit, dispatch }, { host: instance = null, apiToken = null } = {}) {
      if (!instance || !apiToken) throw Error('invalid credentials')
      const base64ApiToken = Buffer.from(`apitoken:${apiToken}`).toString('base64')
      const options = {
        method: 'POST',
        headers: {
          Authorization: `Basic ${base64ApiToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: Object.entries({ grant_type: 'client_credentials' }).map(([key, value]) => `${key}=${value}`).join('&')
      }
      const response = await fetch(`https://${instance}/services/mtm/v1/oauth2/token`, options)
      const { status } = response
      const body = await response.json()
      if (status === 200) {
        const { access_token: accessToken, expires_in: expiresIn } = body
        commit('setAccessToken', accessToken)
        const refreshTimeoutSeconds = expiresIn - 60
        const refreshTimeout = setTimeout(() => dispatch('getAccessToken', { host: instance, apiToken }), refreshTimeoutSeconds * 1000)
        commit('setRefreshTimeout', refreshTimeout)
      } else {
        commit('setAccessToken')
        throw Error(`${JSON.stringify(body)}`)
      }
    },
    async fetchVisualizerBookmarks ({ state: { accessToken = null }, commit }) {
      if (accessToken === null) throw Error('not authenticated')
      const { instanceUrl } = jwtDecode(accessToken)
      const url = `${instanceUrl}/services/pathfinder/v1/bookmarks?bookmarkType=VISUALIZER`
      const options = {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
      try {
        commit('setLoadingBookmarks', true)
        const response = await fetch(url, options)
        const { status } = response
        const body = await response.json()
        if (status === 200) {
          const { data: bookmarks = [] } = body
        commit('setBookmarks', bookmarks)
        } else {
          throw Error(`${JSON.stringify(body)}`)
        }
      } finally {
        commit('setLoadingBookmarks', false)
      }
    },
    async loadDiagramsFromXml ({ commit }, xmlString) {
      try {
        const diagrams = await instance.getDiagrams(xmlString)
        commit('setDiagrams', diagrams)
      } catch (error) {
        commit('setDiagrams')
        throw error
      }
    }
  }
})
