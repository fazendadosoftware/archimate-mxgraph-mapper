import { ref, unref, Ref, computed, watch } from 'vue'
import { Buffer } from 'buffer'
import jwtDecode from 'jwt-decode'
import { format } from 'date-fns'
import { Index } from 'flexsearch'
import debounce from 'lodash.debounce'
import { create, convert } from 'xmlbuilder2'
import useSwal from './useSwal'
import { Diagram } from '../types'
import 'isomorphic-fetch'
import { XMLBuilder } from 'xmlbuilder2/lib/interfaces'

const { toast } = useSwal()

const EXTERNAL_ID_DEFAULT_PATH = 'externalId'

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
const externalIdPath = ref<string | null>(null)

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
    return accessToken as string
  } else {
    throw Error(`${JSON.stringify(body)}`)
  }
}

export const fetchVisualizerBookmarks = async () => {
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
      return data
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

export const authenticate = async (host: string, apitoken: string) => {
  if (unref(isAuthenticating)) return
  try {
    isAuthenticating.value = true
    accessToken.value = await getAccessToken(host, apitoken)
    await fetchVisualizerBookmarks()
    await checkExternalIdPath()
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

const isSelected = (bookmark: any) => {
  return bookmark.id === unref(selectedBookmark)?.id
}

const enrichXml = async (diagram: Diagram, xml: string): Promise<string> => {
  if (unref(factSheetIndex) === null) await buildFactSheetIndex(diagram)

  const doc = create()
  const _root = doc.ele('mxGraphModel').ele('root')

  const addEl = (rootEl: XMLBuilder, elTag: string, elProps: any) => {
    const el = rootEl.ele(elTag)
    const att = Object.entries(elProps)
      .filter(([key]) => key.charAt(0) === '@')
      .reduce((accumulator: any, [key, value]) => ({ ...accumulator, [key.substring(1)]: value }), {})
    el.att(att)
    Object.entries(elProps)
      .filter(([key]) => key.charAt(0) !== '@')
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .forEach(([key, value]) => Array.isArray(value) ? value.forEach(_value => addEl(el, key, _value)) : addEl(el, key, value))
  }

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
      if (mxGeometry !== null) addEl(_mxCell, 'mxGeometry', mxGeometry)
    })

  const enrichedXml = doc.end({ headless: true, prettyPrint: true })
  return enrichedXml
}

const upsertBookmark = async (diagram: Diagram, xml: string, silent?: boolean) => {
  if (unref(accessToken) === null) throw Error('not authenticated')
  const bearer = unref(accessToken) ?? ''
  const { instanceUrl } = jwtDecode<{ instanceUrl: string }>(bearer)
  const bookmarkExistsInWorkspace = Object.values(unref(bookmarkIndex))
    .find((bookmark: any) => bookmark?.state?.sparxId === diagram.id) ?? null
  const url = bookmarkExistsInWorkspace === null
    ? `${instanceUrl}/services/pathfinder/v1/bookmarks`
    : `${instanceUrl}/services/pathfinder/v1/bookmarks/${bookmarkExistsInWorkspace?.id as string}`
  const graphXml = await enrichXml(diagram, xml)
  const { name } = diagram
  const method = bookmarkExistsInWorkspace === null ? 'POST' : 'PUT'
  const body = JSON.stringify(bookmarkExistsInWorkspace === null
    ? { groupKey: 'freedraw', name, type: 'VISUALIZER', state: { graphXml, sparxId: diagram.id } }
    : { ...bookmarkExistsInWorkspace, state: { graphXml, sparxId: diagram.id } })
  const headers = { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' }
  try {
    savingBookmark.value++
    const response = await fetch(url, { method, body, headers })
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

export const fetchWorkspaceDataModel = async () => {
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

export const checkExternalIdPath = async (): Promise<string> => {
  const dataModel = await fetchWorkspaceDataModel()
  const factSheetTypes = Object.keys(dataModel.factSheets)
  const sparxIdFactSheetTypes = new Set(dataModel.externalIdFields?.sparxId?.forFactSheets ?? [])
  const hasMissingFactSheetTypes = [...factSheetTypes].filter(x => !sparxIdFactSheetTypes.has(x)).length > 0
  externalIdPath.value = hasMissingFactSheetTypes ? EXTERNAL_ID_DEFAULT_PATH : 'sparxId'
  return unref(externalIdPath) ?? EXTERNAL_ID_DEFAULT_PATH
}

export const executeGraphQL = async (query: string, variables?: any): Promise<unknown> => {
  const bearer = unref(accessToken)
  if (bearer === null || unref(jwtClaims) === null) throw Error('not authenticated')
  const { instanceUrl }: { instanceUrl: string } = unref(jwtClaims)
  const headers = { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' }
  const body = JSON.stringify({ query, variables })
  const options = { method: 'POST', headers, body }
  const response = await fetch(`${instanceUrl}/services/pathfinder/v1/graphql`, options)
  const { status } = response
  if (status === 200) {
    const responseJson = await response.json()
    const { data = null, errors = null } = responseJson
    if (errors?.length > 0) throw Error(JSON.stringify(errors))
    return data
  } else throw Error(`${JSON.stringify(body)}`)
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
  const externalIdPath = await checkExternalIdPath()
  const dataModel = await fetchWorkspaceDataModel()
  const factSheetTypes = Object.keys(dataModel.factSheets)
  const factSheetTypeExternalIdFragment = factSheetTypes
    .map(factSheetType => `...on ${factSheetType}{${externalIdPath}{externalId}}`)
    .join(' ')
  query = query.replace('{{factSheetTypeExternalIdPlaceholder}}', factSheetTypeExternalIdFragment)
  const externalIds = unref(selectedDiagram).elements.map(({ id }: { id: string }) => `${externalIdPath}/${id}`)
  const headers = { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' }
  const body = JSON.stringify({ query, variables: { externalIds } })
  const options = { method: 'POST', headers, body }
  const response = await fetch(`${instanceUrl}/services/pathfinder/v1/graphql`, options)
  const { status } = response
  if (status === 200) {
    const responseJson = await response.json()
    let edges = []
    const { data = null, errors = null } = responseJson
    if (errors?.length > 0) {
      factSheetIndex.value = null
      throw Error(JSON.stringify(errors))
    }
    if (data !== null) ({ allFactSheets: { edges = [] } } = data)
    const fsIndex = edges
      .reduce((accumulator: any, { node: factSheet }: any) => {
        const { [externalIdPath]: { externalId } } = factSheet
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
    toggleBookmarkSelection: (bookmark: any) => { selectedBookmark.value = isSelected(bookmark) ? null : bookmark },
    isSelected,
    getDate,
    jwtClaims,
    // saveBookmark,
    upsertBookmark,
    isSavingBookmark,
    factSheetIndex: computed(() => unref(factSheetIndex)),
    buildFactSheetIndex: (diagram: any) => { factSheetIndex.value = null; void debouncedBuildFactSheetIndex(diagram) },
    externalIdPath: computed(() => unref(externalIdPath))
  }
}

export default useWorkspace
