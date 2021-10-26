import DiagramsWorker from '../workers/diagrams?worker'
import { IXmlWorker } from '../workers/diagrams'
import { wrap, releaseProxy } from 'comlink'
import { ref, Ref, unref, computed } from 'vue'
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

const useDiagrams = () => {
  const searchQuery = ref('')
  const loading = ref(false)
  const diagrams: Ref<any> = ref(null)
  const selectedDiagram: Ref<any | null> = ref(null)

  const loadFile = (event: any) => {
    loading.value = true
    const { target: { files } } = event
    if (files.length === 0) return
    const reader = new FileReader()
    reader.onload = async e => {
      const xml = e?.target?.result as string
      try {
        diagrams.value = await loadDiagramsFromXml(xml)
      } catch (error) {
        console.error(error)
        void toast.fire({
          icon: 'error',
          title: 'Error while loading xml file!',
          text: 'Check console for more details...'
        })
      } finally {
        loading.value = false
      }
    }
    reader.readAsText(files[0])
  }
  return {
    loadFile,
    loading: computed(() => unref(loading)),
    diagrams: computed(() => unref(diagrams)),
    filteredDiagrams: computed(() => unref(diagrams)),
    selectedDiagram: computed({
      get: () => unref(selectedDiagram),
      set: diagram => {
        console.log('SETTING SELECTED DIAGRAM', diagram)
      }
    }),
    searchQuery: computed({
      get: () => unref(searchQuery),
      set: value => { searchQuery.value = value }
    })
  }
}

export default useDiagrams
