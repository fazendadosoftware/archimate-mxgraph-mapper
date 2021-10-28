import { ref, unref, Ref, computed } from 'vue'
import { Buffer } from 'buffer'
import jwtDecode from 'jwt-decode'
import { format } from 'date-fns'
import useSwal from './useSwal'

const { toast } = useSwal()

const isAuthenticating = ref(false)
const accessToken: Ref<null | string> = ref(null)
const loading = ref(0)
const isLoading = computed(() => unref(loading) > 0)
const bookmarks: Ref<any[]> = ref([])
const selectedBookmark: Ref<any> = ref(null)

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
      bookmarks.value = data
    } else {
      console.error(body)
      void toast.fire({
        icon: 'error',
        title: 'Error while fetching diagrams',
        text: 'Check console for more details'
      })
      bookmarks.value = []
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

const logout = async () => { accessToken.value = null }

const isSelected = (bookmark: any) => bookmark.id === unref(selectedBookmark)?.id

const useWorkspace = () => {
  return {
    authenticate,
    isAuthenticating,
    isAuthenticated: computed(() => unref(accessToken) !== null),
    logout,
    fetchVisualizerBookmarks,
    isLoading,
    bookmarks: computed(() => unref(bookmarks)),
    filteredBookmarks: computed(() => unref(bookmarks)),
    selectedBookmark,
    toggleBookmarkSelection: (bookmark: any) => { selectedBookmark.value = isSelected(bookmark) ? null : bookmark },
    isSelected,
    getDate
  }
}

export default useWorkspace
