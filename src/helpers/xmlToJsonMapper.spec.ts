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
    expect(typeof document).toEqual('object')
    expect(document).toHaveProperty('exporter')
    expect(document).toHaveProperty('exporterID')
    expect(document).toHaveProperty('exporterVersion')
    expect(document).toHaveProperty('diagrams')
    expect(document).toHaveProperty('archiMate3Index')
    expect(document.exporter).toBe('Enterprise Architect')
    expect(document.exporterID).toBe('1554')
    expect(document.exporterVersion).toBe('6.5')
    expect(typeof document.archiMate3Index).toBe('object')
    expect(Array.isArray(document.diagrams)).toBe(true)

    document.diagrams
      .forEach(diagram => {
        expect(typeof diagram.id).toBe('string')
        expect(typeof diagram.name).toBe('string')
        expect(typeof diagram.type).toBe('string')
        expect(typeof diagram.project).toBe('object')
        expect(typeof diagram.project.author).toBe('string')
        expect(typeof diagram.project.version).toBe('string')
        expect(typeof diagram.project.created).toBe('string')
        expect(typeof diagram.project.modified).toBe('string')
        expect(Array.isArray(diagram.elements)).toBe(true)
        expect(Array.isArray(diagram.links)).toBe(true)
        diagram.elements.forEach(element => {
          expect(typeof element.id).toBe('string')
          expect(typeof element.id).toBeTruthy()
          expect(element).toHaveProperty('name')
          expect(element).toHaveProperty('type')
          expect(element).toHaveProperty('category')
          expect(element).toHaveProperty('parent')
          expect(element).toHaveProperty('children')
          expect(element).toHaveProperty('seqno')
          expect(typeof element.hierarchyLevel).toBe('number')
          expect(typeof element.geometry).toBe('string')
          if (element.rect !== null) {
            expect(typeof element.rect.x0).toBe('number')
            expect(typeof element.rect.y0).toBe('number')
            expect(typeof element.rect.width).toBe('number')
            expect(typeof element.rect.height).toBe('number')
          }
        })

        const diagramElementIds = diagram.elements.map(({ id }) => id)

        diagram.links.forEach(link => {
          expect(typeof link.id).toBe('string')
          expect(typeof link.type).toBe('string')
          expect(typeof link.end).toBe('string')
          expect(typeof link.start).toBe('string')
          expect(typeof link.isExternal).toBe('boolean')
          if (link.isExternal === false) {
            expect(diagramElementIds.includes(link.start)).toBe(true)
            expect(diagramElementIds.includes(link.end)).toBe(true)
          } else {
            const startNodeInDiagram = diagramElementIds.includes(link.start) === true ? 1 : 0
            const endNodeInDiagram = diagramElementIds.includes(link.end) === true ? 1 : 0
            // only one node in the link should belong to the diagram
            expect(startNodeInDiagram + endNodeInDiagram).toEqual(1)
          }
        })
      })
  })
})
