import { Workbook } from 'exceljs'
import { authenticate, checkExternalIdPath, executeGraphQL, fetchWorkspaceDataModel } from './useWorkspace'

beforeAll(async () => {
  const { default: credentials } = await import('../../lxr.json')
  expect(credentials).toEqual({ apitoken: expect.any(String), host: expect.any(String) })
  await authenticate(credentials.host, credentials.apitoken)
})

describe('The workspace', () => {
  it('has the sparxId external id defined in the model', async () => {
    const externalId = await checkExternalIdPath()
    expect(externalId).toBe('sparxId')
  }, 5000)

  it('has the sparxId external id is defined for all factsheet types that exist on the workspace', async () => {
    const { factSheetTypes, forFactSheets }: { factSheetTypes: string[], forFactSheets: string[] } = await fetchWorkspaceDataModel()
      .then(({ factSheets, externalIdFields: { sparxId: { forFactSheets } } }) => ({
        factSheetTypes: Object.keys(factSheets),
        forFactSheets
      }))
    expect(factSheetTypes.length).toBe(forFactSheets.length)
    const missingFactSheetTypesForSparx = factSheetTypes.filter(factSheetType => !forFactSheets.includes(factSheetType))
    expect(missingFactSheetTypesForSparx.length).toBe(0)
  }, 5000)

  it.skip('executes a GraphQL query and exports the result as an excel file', async () => {
    const factSheetTypes = await fetchWorkspaceDataModel().then(({ factSheets }) => Object.keys(factSheets))
    const query = `
    query($after: String) {
      allFactSheets(after: $after, first: 18000) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            type
            name
            ${factSheetTypes.map(factSheetType => `...on ${factSheetType}{sparxId{externalId}}`).join('\n')}
          }
        }
      }
    }
    `

    const mapPage = ({
      allFactSheets: { totalCount, edges, pageInfo: { hasNextPage, endCursor } }
    }: any) => ({
      totalCount,
      pageCount: edges.length,
      factSheets: edges
        .reduce((accumulator: Array<{ id: string, type: string, name: string, sparxId: string }>, { node: { id, type, name, sparxId } }: any) => {
          // if (sparxId !== null) accumulator.push({ id, type, name, sparxId: sparxId.externalId })
          accumulator.push({ id, type, name, sparxId: sparxId?.externalId ?? null })
          return accumulator
        }, []),
      hasNextPage,
      endCursor
    })

    let totalCount = 0
    let doneCount = 0
    let hasNextPage = true
    let after = ''
    let factSheets = []
    const allFactSheets = []
    let pageCount = 0
    do {
      ({ totalCount, pageCount, factSheets, hasNextPage, endCursor: after } = await executeGraphQL(query, { after }).then(mapPage))
      doneCount += pageCount
      allFactSheets.push(...factSheets)
    } while (hasNextPage)
    expect(doneCount).toBe(totalCount)
    const wb = new Workbook()
    const ws = wb.addWorksheet(
      'FactSheets',
      {
        headerFooter: { firstHeader: 'exported factsheets' },
        views: [{ state: 'frozen', ySplit: 1 }]
      }
    )
    ws.columns = [
      { header: 'FactSheet ID', key: 'id', width: 40 },
      { header: 'SparxId', key: 'sparxId', width: 40 },
      { header: 'FactSheet Type', key: 'type', width: 20 },
      { header: 'FactSheet Name', key: 'name', width: 60 }
    ]
    ws.addRows(allFactSheets)
    ws.getRow(1).font = { bold: true }
    ws.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: ws.columns.length }
    }
    await wb.xlsx.writeFile('exported_full.xlsx')
  }, 60000)
})
