import {
  getXmlFromFile,
  mapDocument
} from './xmlToJsonMapper'

const EXPORTED_XML_FILE_PATH = './test/data/TestExport.xml'

describe('parsing the exported xml file', () => {
  let rawDocument: any

  test('xml document has the correct namespace', async () => {
    rawDocument = await getXmlFromFile(EXPORTED_XML_FILE_PATH)
    const document = mapDocument(rawDocument)
    console.log('document', document)
    // expect(ArchiMate3NS).toBe(Constants.ArchiMate3NS)
  })

  test('xml document has the correct namespace', () => {
    // const ArchiMate3NS = getArchiMate3NS(document)
    // expect(ArchiMate3NS).toBe(Constants.ArchiMate3NS)
  })
})
