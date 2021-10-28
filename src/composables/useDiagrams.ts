import DiagramsWorker from '../workers/diagrams?worker'
import { IXmlWorker, IDiagram } from '../workers/diagrams'
import { wrap, releaseProxy } from 'comlink'
import { ref, Ref, unref, computed } from 'vue'
import { Index } from 'flexsearch'
import useSwal from './useSwal'

const { toast } = useSwal()

const loadDiagramsFromXml = async (xml: string): Promise<any> => {
  const proxy = wrap<IXmlWorker>(new DiagramsWorker())
  try {
    const diagrams = await proxy.getDiagrams(xml)
    return diagrams
  } finally {
    proxy[releaseProxy]()
  }
}

// global state variables
const diagramIndex: Ref<Map<number, IDiagram>> = ref(new Map())
const selectedDiagram: Ref<IDiagram | null> = ref(null)

const isSelected = (diagram: IDiagram) => diagram.id === unref(selectedDiagram)?.id

const useDiagrams = () => {
  const searchQuery = ref('')
  const loading = ref(false)
  let ftsDiagramIndex = new Index()

  const loadFile = (event: any) => {
    loading.value = true
    const { target: { files } } = event
    if (files.length === 0) return
    const reader = new FileReader()
    reader.onload = async e => {
      const xml = e?.target?.result as string
      try {
        diagramIndex.value = await loadDiagramsFromXml(xml)
          .then(diagrams => diagrams
            .reduce((accumulator: Map<number, IDiagram>, diagram: IDiagram) => {
              accumulator.set(diagram.id, diagram)
              return accumulator
            }, new Map()))
      } catch (error) {
        console.error(error)
        void toast.fire({
          icon: 'error',
          title: 'Error while loading xml file!',
          text: 'Check console for more details...'
        })
        diagramIndex.value = new Map()
      } finally {
        ftsDiagramIndex = new Index()
        Object.values(unref(diagramIndex)).forEach(({ id, name }) => ftsDiagramIndex.add(id, name))
        loading.value = false
      }
    }
    reader.readAsText(files[0])
  }

  return {
    loadFile,
    searchQuery,
    loading: computed(() => unref(loading)),
    hasDiagrams: computed(() => unref(diagramIndex).size > 0),
    filteredDiagrams: computed(() => {
      if (unref(searchQuery) === '') return Array.from(unref(diagramIndex).values())
      const filteredDiagrams = ftsDiagramIndex.search(unref(searchQuery))
        .reduce((accumulator: IDiagram[], id) => {
          const diagram = unref(diagramIndex).get(id as number)
          if (diagram !== undefined) accumulator.push(diagram)
          return accumulator
        }, [])
      return filteredDiagrams
    }),
    toggleDiagramSelection: (diagram: IDiagram) => { selectedDiagram.value = isSelected(diagram) ? null : diagram },
    selectedDiagram: computed(() => unref(selectedDiagram)),
    isSelected
  }
}

export default useDiagrams
