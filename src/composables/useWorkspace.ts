import { ref, unref, Ref, computed, watch } from 'vue'
import { Buffer } from 'buffer'
import jwtDecode from 'jwt-decode'
import { format } from 'date-fns'
import { Index } from 'flexsearch'
import useSwal from './useSwal'

const { toast } = useSwal()

const isAuthenticating = ref(false)
const accessToken: Ref<null | string> = ref(null)
const loading = ref(0)
const isLoading = computed(() => unref(loading) > 0)
const bookmarkIndex: Ref<Record<string, any>> = ref({})
const selectedBookmark: Ref<any> = ref(null)
const ftsBookmarkIndex = ref(new Index())

watch(bookmarkIndex, bookmarkIndex => {
  ftsBookmarkIndex.value = new Index()
  Object.values(bookmarkIndex).forEach(({ id, name }) => unref(ftsBookmarkIndex).add(id, name))
})

const getDate = (dateString: string = '') => format(Date.parse(dateString), 'MM/dd/yyyy HH:mm:ss')

const getAccessToken = async (host: string, apitoken: string) => {
  if (typeof host !== 'string' || typeof apitoken !== 'string' || host === '' || apitoken === '') throw Error('invalid credentials')
  const base64ApiToken = Buffer.from(`apitoken:${apitoken}`).toString('base64')
  const options = {
    method: 'POST',
    headers: {
      Authorization: `Basic ${base64ApiToken}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: Object.entries({ grant_type: 'client_credentials' }).map(([key, value]) => `${key}=${value}`).join('&')
  }
  const response = await fetch(`https://${host}/services/mtm/v1/oauth2/token`, options)
  const { status } = response
  const body = await response.json()
  if (status === 200) {
    const { access_token: accessToken } = body
    return accessToken
  } else {
    throw Error(`${JSON.stringify(body)}`)
  }
}

const fetchVisualizerBookmarks = async () => {
  if (unref(accessToken) === null) throw Error('not authenticated')
  const bearer = unref(accessToken) ?? ''
  const { instanceUrl } = jwtDecode(bearer) as { instanceUrl: string }
  const url = `${instanceUrl}/services/pathfinder/v1/bookmarks?bookmarkType=VISUALIZER`
  const options = { method: 'GET', headers: { Authorization: `Bearer ${bearer}` } }
  try {
    loading.value++
    const response = await fetch(url, options)
    const { status } = response
    const body = await response.json()
    if (status === 200) {
      const { data = [] } = body
      console.log(data.map(({ id, ...bookmark }: any) => ({ id, bookmark })))
      bookmarkIndex.value = data
        .reduce((accumulator: any, bookmark: any) => ({ ...accumulator, [bookmark.id]: bookmark }), {})
    } else {
      console.error(body)
      void toast.fire({
        icon: 'error',
        title: 'Error while fetching diagrams',
        text: 'Check console for more details'
      })
      bookmarkIndex.value = {}
    }
  } finally {
    loading.value--
  }
}

const authenticate = async (host: string, apitoken: string) => {
  if (unref(isAuthenticating)) return
  try {
    isAuthenticating.value = true
    accessToken.value = await getAccessToken(host, apitoken)
    await fetchVisualizerBookmarks()
  } catch (err) {
    console.error(err)
    void toast.fire({
      title: 'Error while loggin in',
      text: 'Check console for more details',
      icon: 'error'
    })
    accessToken.value = null
  } finally {
    isAuthenticating.value = false
  }
}

const logout = async () => {
  accessToken.value = null
  bookmarkIndex.value = {}
  selectedBookmark.value = null
}

const isSelected = (bookmark: any) => bookmark.id === unref(selectedBookmark)?.id

const useWorkspace = () => {
  const searchQuery = ref('')
  return {
    authenticate,
    isAuthenticating,
    isAuthenticated: computed(() => unref(accessToken) !== null),
    logout,
    searchQuery,
    fetchVisualizerBookmarks,
    isLoading,
    filteredBookmarks: computed(() => {
      const filteredDiagrams = unref(searchQuery) === ''
        ? Object.values(unref(bookmarkIndex))
        : unref(ftsBookmarkIndex).search(unref(searchQuery))
          .reduce((accumulator: any, id) => {
            const bookmark = unref(bookmarkIndex)[id]
            if (bookmark !== undefined) accumulator.push(bookmark)
            return accumulator
          }, [])
      return filteredDiagrams
    }),
    selectedBookmark,
    toggleBookmarkSelection: (bookmark: any) => { selectedBookmark.value = isSelected(bookmark) ? null : bookmark },
    isSelected,
    getDate
  }
}

export default useWorkspace
