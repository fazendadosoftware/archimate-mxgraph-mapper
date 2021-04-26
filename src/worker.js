const { Parser } = require('xml2js')
const { parseStringPromise } = new Parser()

const sortElements = (elementA = {}, elementB = {}) => {
  if ((elementA.id === elementB.parentId) || (elementA.parentId === null && elementB.parentId !== null)) return -1
  else if ((elementA.parentId === elementB.id) || (elementB.parentId === null && elementA.parentId !== null)) return 1
  else return 0
}

const getParentIndex = document => {
  const { 'xmi:XMI': { 'uml:Model': [rootElement] } } = document

  const unrollPackagedElements = (element = {}, parentId = null, index = {}) => {
    const { $: { 'xmi:id': id = null } = {}, packagedElement: packagedElements = [] } = element
    if (parentId !== null && id !== null) index[id] = parentId
    index = packagedElements.reduce((accumulator, element) => ({ ...accumulator, ...unrollPackagedElements(element, id, index) }), index)
    return index
  }

  const parentIndex = unrollPackagedElements(rootElement)
  return parentIndex
}

export async function getDiagrams(xml) {
  const document = await parseStringPromise(xml)
  let {
    'xmi:XMI': {
      'xmi:Extension': [
        {
          diagrams: [{ diagram: diagrams = [] } = {}],
          elements: [{ element: elements = [] } = {}],
          connectors: [{ connector: connectors = [] } = {}]
        } = {}
      ] = []
    }
  } = document

  const parentIndex = getParentIndex(document)

  const elementStereotypeIndex = elements
    .reduce((accumulator, element) => {
      const { $: { 'xmi:idref': id }, properties: [{ $: { stereotype = null, documentation = null } }] } = element
      accumulator[id] = { stereotype, documentation }
      return accumulator
    }, {})

  const { connectorIndex, elementIndex } = connectors
    .reduce((accumulator, connector) => {
      try {
        let { $: { 'xmi:idref': id }, extendedProperties = [], source: [source], target: [target] } = connector
        let type = ''
        if (typeof extendedProperties[0] === 'object') ([{ $: { conditional: type = '' } }] = extendedProperties)
        const { $: { 'xmi:idref': sourceId = null } } = source
        const { $: { 'xmi:idref': targetId = null } } = target
        type = type.replace(/[^\w\s]/gi, '').replace(/\r?\n|\r/g, '').trim()
        accumulator.connectorIndex[id] = { id, sourceId, targetId, type }
        for (const element of [source, target]) {
          const { $: { 'xmi:idref': id }, model: [{ $: { type, name } }] } = element
          const { [id]: { stereotype, documentation } = {} } = elementStereotypeIndex
          const parentId = parentIndex[id] || null
          accumulator.elementIndex[id] = { id, parentId, type: stereotype || type, name: name || documentation }
        }
      } catch (error) {
        console.error('getDiagrams', error)
        throw error
      }
      return accumulator
    }, { connectorIndex: {}, elementIndex: {} })

  diagrams = diagrams
    .map((diagram, idx) => {
      let {
        elements: [{ element: elements = [] } = {}] = [],
        properties: [{ $: properties }] = [],
        project: [{ $: project }] = []
      } = diagram
      let connectors
      ({ elements = [], connectors = [] } = elements
        .map(({ $ }) => $)
        .reduce((accumulator, element) => {
          const { subject = null, geometry = null } = element
          if (typeof geometry === 'string' && geometry) {
            const { Left: x0 = null, Right: x1 = null, Bottom: y1 = null, Top: y0 = null } = geometry.replace(/;/g, ' ').trim().split(' ')
              .reduce((accumulator, vertex) => {
                const [coordinate, value] = vertex.split('=')
                accumulator[coordinate] = parseInt(value)
                return accumulator
              }, {})
            if (x0 !== null) element.geometry = [x0, y0, x1 - x0, y1 - y0]
          }
          if (subject in elementIndex) accumulator.elements.push({ ...elementIndex[subject], ...element })
          else if (subject in connectorIndex) accumulator.connectors.push({ ...connectorIndex[subject], ...element })
          return accumulator
        }, { elements: [], connectors: [] }))
      elements = elements.sort(sortElements)
      return { id: idx, ...properties, ...project, elements, connectors }
    })
  return diagrams
}
