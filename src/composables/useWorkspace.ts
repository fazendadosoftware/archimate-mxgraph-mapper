import { ref, unref, Ref, computed, watch } from 'vue'
import { Buffer } from 'buffer'
import jwtDecode from 'jwt-decode'
import { format } from 'date-fns'
import { Index } from 'flexsearch'
import debounce from 'lodash.debounce'
import { create, convert } from 'xmlbuilder2'
import useSwal from './useSwal'
import { Diagram } from '../types'

const { toast } = useSwal()

const isAuthenticating = ref(false)
const accessToken: Ref<null | string> = ref(null)
const loading = ref(0)
const isLoading = computed(() => unref(loading) > 0)
const bookmarkIndex: Ref<Record<string, any>> = ref({})
const selectedBookmark: Ref<any> = ref(null)
const ftsBookmarkIndex = ref(new Index())
const savingBookmark = ref(0)
const isSavingBookmark = computed(() => unref(savingBookmark) > 0)
const factSheetIndex: any = ref(null)

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
  const { instanceUrl } = jwtDecode<{ instanceUrl: string }>(bearer)
  const url = `${instanceUrl}/services/pathfinder/v1/bookmarks?bookmarkType=VISUALIZER`
  const options = { method: 'GET', headers: { Authorization: `Bearer ${bearer}` } }
  try {
    loading.value++
    const response = await fetch(url, options)
    const { status } = response
    const body = await response.json()
    if (status === 200) {
      const { data = [] } = body
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

const isSelected = (bookmark: any) => bookmark.id === unref(selectedBookmark)?.id

const enrichXml = async (diagram: Diagram, xml: string): Promise<string> => {
  if (unref(factSheetIndex) === null) await buildFactSheetIndex(diagram)

  const doc = create()
  const _root = doc.ele('mxGraphModel').ele('root')
  // @ts-expect-error
  convert(xml, { format: 'object' })?.mxGraphModel?.root?.mxCell
    .forEach((mxCell: any) => {
      const { attrs, children } = Object.entries(mxCell)
        .reduce((accumulator: any, [key, value]) => {
          if (key[0] === '@') accumulator.attrs[key.substring(1)] = value
          else accumulator.children.push({ [key]: value })
          return accumulator
        }, { attrs: {}, children: [] })
      const { id, ...mxCellAttrs } = attrs
      const { [id]: factSheet = null } = unref(factSheetIndex)
      let _rootEle = _root
      if (factSheet !== null) {
        const objectAttrs = {
          type: 'factSheet',
          autoSize: 1,
          layoutType: 'auto',
          collapsed: 1,
          resourceId: factSheet.id,
          label: factSheet.name,
          resource: factSheet.type,
          subType: '',
          factSheetId: factSheet.id,
          id: id
        }
        _rootEle = _root.ele('object', objectAttrs)
        delete mxCellAttrs.value
      }
      const _mxCell = _rootEle.ele('mxCell', factSheet === null ? { ...mxCellAttrs, id } : mxCellAttrs)
      const [{ mxGeometry } = { mxGeometry: null }] = children ?? []
      if (mxGeometry !== null) {
        const mxGeometryAttrs = Object.entries(mxGeometry).reduce((accumulator, [key, value]) => ({ ...accumulator, [key.substring(1)]: value }), {})
        _mxCell.ele('mxGeometry', mxGeometryAttrs)
      }
    })

  const enrichedXml = doc.end({ headless: true, prettyPrint: true })
  return enrichedXml
}

const saveBookmark = async (diagram: Diagram, xml: string, silent?: boolean) => {
  if (unref(accessToken) === null) throw Error('not authenticated')
  const bearer = unref(accessToken) ?? ''
  const { instanceUrl } = jwtDecode<{ instanceUrl: string }>(bearer)
  const url = `${instanceUrl}/services/pathfinder/v1/bookmarks`

  const graphXml = await enrichXml(diagram, xml)
  const { name } = diagram
  const bookmark = { groupKey: 'freedraw', name, type: 'VISUALIZER', state: { graphXml } }

  const options = {
    method: 'POST',
    body: JSON.stringify(bookmark),
    headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' }
  }

  try {
    savingBookmark.value++
    const response = await fetch(url, options)
    const { ok, status } = response
    if (ok) {
      const { data: bookmark } = await response.json()
      if (silent !== true) {
        void toast.fire({
          icon: 'success',
          title: 'Saved bookmark',
          text: `${diagram.name} was saved in workspace`
        })
      }
      return bookmark
    }
    throw Error(`${status} while creating bookmark`)
  } catch (err) {
    if (silent !== true) {
      console.error(err, diagram)
      void toast.fire({
        icon: 'error',
        title: 'Error while saving bookmark',
        text: 'Check console for more details'
      })
    } else throw err
  } finally {
    savingBookmark.value--
  }
}

const fetchWorkspaceDataModel = async () => {
  const bearer = unref(accessToken)
  if (bearer === null || unref(jwtClaims) === null) throw Error('not authenticated')
  const { instanceUrl }: { instanceUrl: string } = unref(jwtClaims)
  const options = { method: 'GET', headers: { Authorization: `Bearer ${bearer}` } }
  const response = await fetch(`${instanceUrl}/services/pathfinder/v1/models/dataModel`, options)
  const { status } = response
  const body = await response.json()
  if (status === 200) return body.data
  else {
    throw Error(JSON.stringify(body))
  }
}

const buildFactSheetIndex = async (selectedDiagram: Diagram) => {
  factSheetIndex.value = null
  let query = `
        query($externalIds: [String!]) {
          allFactSheets(filter: { externalIds: $externalIds }) {
            edges {
              node {
                id
                type
                name
                {{factSheetTypeExternalIdPlaceholder}}
              }
            }
          }
        }
      `
  const bearer = unref(accessToken)
  if (bearer === null || unref(jwtClaims) === null) throw Error('not authenticated')
  const { instanceUrl }: { instanceUrl: string } = unref(jwtClaims)
  const factSheetTypes = await fetchWorkspaceDataModel()
    .then(dataModel => Object.keys(dataModel.factSheets))
  const factSheetTypeExternalIdFragment = factSheetTypes
    .map(factSheetType => `...on ${factSheetType}{externalId{externalId}}`)
    .join(' ')
  query = query.replace('{{factSheetTypeExternalIdPlaceholder}}', factSheetTypeExternalIdFragment)
  const externalIds = unref(selectedDiagram).elements.map(({ id }: { id: string }) => `externalId/${id}`)
  const options = {
    method: 'POST',
    headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { externalIds } })
  }
  const response = await fetch(`${instanceUrl}/services/pathfinder/v1/graphql`, options)
  const { status } = response
  const body = await response.json()
  if (status === 200) {
    const { data: { allFactSheets: { edges = [] } } } = body
    const fsIndex = edges
      .reduce((accumulator: any, { node: factSheet }: any) => {
        const { externalId: { externalId } } = factSheet
        accumulator[externalId] = factSheet
        return accumulator
      }, {})
    factSheetIndex.value = fsIndex
  } else {
    factSheetIndex.value = null
    throw Error(`${JSON.stringify(body)}`)
  }
}

const debouncedBuildFactSheetIndex = debounce(async (selectedDiagram: any) => await buildFactSheetIndex(selectedDiagram), 500)

const logout = async (searchQuery?: Ref<string>) => {
  accessToken.value = null
  bookmarkIndex.value = {}
  selectedBookmark.value = null
  if (searchQuery !== undefined) searchQuery.value = ''
}

const jwtClaims = computed(() => unref(accessToken) === null ? null : jwtDecode<any>(unref(accessToken) ?? ''))

const useWorkspace = () => {
  const searchQuery = ref('')

  return {
    authenticate,
    isAuthenticating,
    isAuthenticated: computed(() => unref(accessToken) !== null),
    logout: async () => await logout(searchQuery),
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
    selectedBookmark: computed(() => unref(selectedBookmark)),
    toggleBookmarkSelection: (bookmark: any) => { selectedBookmark.value = isSelected(bookmark) ? null : bookmark; console.log(bookmark) },
    isSelected,
    getDate,
    jwtClaims,
    saveBookmark,
    isSavingBookmark,
    factSheetIndex: computed(() => unref(factSheetIndex)),
    buildFactSheetIndex: (diagram: any) => { factSheetIndex.value = null; void debouncedBuildFactSheetIndex(diagram) }
  }
}

export default useWorkspace
