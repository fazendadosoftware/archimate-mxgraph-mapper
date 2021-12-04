import {
  getXmlFromFile,
  mapExportedDocument
} from './xmlToJsonMapper'

const EXPORTED_XML_FILE_PATH = './test/data/TestExport.xml'

describe('parsing the exported xml file', () => {
  let rawDocument: any

  test('xml document has the correct namespace', async () => {
    rawDocument = await getXmlFromFile(EXPORTED_XML_FILE_PATH)
    const document = mapExportedDocument(rawDocument)
    console.log('document', document)
    // expect(ArchiMate3NS).toBe(Constants.ArchiMate3NS)
    // test if all connector source and target ids have entries in the elements array
  })
})
