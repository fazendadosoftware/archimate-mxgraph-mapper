import {
  getXmlFromFile,
  getDocumentRaw
} from './xmlToJsonMapper'

const EXPORTED_XML_FILE_PATH = './test/data/TestExport.xml'

describe('parsing the exported xml file', () => {
  let document: any

  test('xml document has the correct namespace', async () => {
    document = await getXmlFromFile(EXPORTED_XML_FILE_PATH)
    const documentRaw = getDocumentRaw(document)
    console.log('document', documentRaw)
    // expect(ArchiMate3NS).toBe(Constants.ArchiMate3NS)
  })

  test('xml document has the correct namespace', () => {
    // const ArchiMate3NS = getArchiMate3NS(document)
    // expect(ArchiMate3NS).toBe(Constants.ArchiMate3NS)
  })
})
