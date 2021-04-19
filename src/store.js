import jwtDecode from 'jwt-decode'
import { createStore } from 'vuex'
import FlexSearch from 'flexsearch'
import styles from '@/assets/data/styles.json'
import worker from 'workerize-loader!@/worker'

const instance = worker()

export const store = createStore({
  state () {
    return {
      accessToken: null,
      loadingBookmarks: false,
      bookmarks: [],
      selectedBookmark: null,
      ftsBookmarkIndex: new FlexSearch({ async: true }),
      diagrams: [],
      selectedDiagram: null,
      ftsDiagramIndex: new FlexSearch({ async: true }),
      styles,
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
      if (bookmarks.length === 0) state.selectedBookmark = null
    },
    setFilteredBookmarks(state, filteredBookmarks = []) {
      state.filteredBookmarks = filteredBookmarks
    },
    setSelectedBookmark(state, bookmark = null) {
      state.selectedBookmark = bookmark
      state.selectedDiagram = null
    },
    setDiagrams(state, diagrams = []) {
      state.diagrams = diagrams
      if (diagrams.length === 0) state.selectedDiagram = null
    },
    setFilteredDiagrams(state, filteredDiagrams = []) {
      state.filteredDiagrams = filteredDiagrams
    },
    setSelectedDiagram(state, selectedDiagram = null) {
      state.selectedDiagram = selectedDiagram
      state.selectedBookmark = null
    },
    setStyles(state, styles = {}) {
      state.styles = styles
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
    async fetchVisualizerBookmarks ({ state, commit, dispatch }) {
      if (state.accessToken === null) throw Error('not authenticated')
      const { instanceUrl } = jwtDecode(state.accessToken)
      const url = `${instanceUrl}/services/pathfinder/v1/bookmarks?bookmarkType=VISUALIZER`
      const options = {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${state.accessToken}`
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
        state.ftsBookmarkIndex.clear()
        state.bookmarks.forEach(({ name }, idx) => state.ftsBookmarkIndex.add(idx, name))
        } else {
          throw Error(`${JSON.stringify(body)}`)
        }
      } finally {
        commit('setLoadingBookmarks', false)
        await dispatch('searchFTSBookmarkIndex')
      }
    },
    async loadDiagramsFromXml ({ commit, state, dispatch }, xmlString) {
      try {
        const diagrams = await instance.getDiagrams(xmlString)
        commit('setDiagrams', diagrams)
        state.ftsDiagramIndex.clear()
        state.diagrams.forEach(({ id, name }) => state.ftsDiagramIndex.add(id, name))
      } catch (error) {
        commit('setDiagrams')
        throw error
      } finally {
        await dispatch('searchFTSDiagramIndex')
      }
    },
    async searchFTSDiagramIndex ({ commit, state }, query = '') {
      if (!query) {
        commit('setFilteredDiagrams', state.diagrams)
        return state.diagrams
      }
      const itemsIndex = await state.ftsDiagramIndex.search(query)
      const filteredDiagrams = itemsIndex.map(idx => state.diagrams[idx])
      commit('setFilteredDiagrams', filteredDiagrams)
      return filteredDiagrams
    },
    // eslint-disable-next-line
    async searchFTSBookmarkIndex ({ commit, state }, query = '') {
      if (!query) {
        commit('setFilteredBookmarks', state.bookmarks)
        return state.bookmarks
      }
      const itemsIndex = await state.ftsBookmarkIndex.search(query)
      const filteredBookmarks = itemsIndex.map(idx => state.bookmarks[idx])
      commit('setFilteredBookmarks', filteredBookmarks)
      return filteredBookmarks
    }
  }
})
