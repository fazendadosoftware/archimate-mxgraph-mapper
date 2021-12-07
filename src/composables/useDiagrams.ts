import MapperWorker from '../helpers/xmlToJsonMapper?worker'
import { IMapperWorker } from '../helpers/xmlToJsonMapper'
import { ExportedDocument, Diagram } from '../types'
import { wrap, releaseProxy } from 'comlink'
import { ref, Ref, unref, computed } from 'vue'
import { Index } from 'flexsearch'
import useSwal from './useSwal'

const { toast } = useSwal()

const parseDocumentFromXml = async (xml: string, file: File & { path: string }): Promise<any> => {
  const proxy = wrap<IMapperWorker>(new MapperWorker())
  // const proxy = wrap<IXmlWorker>(new DiagramsWorker())
  try {
    const document = await proxy.mapExportedDocument(xml)
    document.file = file
    return document
  } catch (err: any) {
    console.error(err)
    if (err.message === 'invalid xml') {
      void toast.fire({
        icon: 'error',
        title: 'Error',
        text: 'Invalid xml format'
      })
    }
    return []
  } finally {
    proxy[releaseProxy]()
  }
}

// global state variables
const document: Ref<ExportedDocument | null> = ref(null)
const selectedDiagram: Ref<Diagram | null> = ref(null)

const isSelected = (diagram: Diagram) => diagram.id === unref(selectedDiagram)?.id

const useDiagrams = () => {
  const searchQuery = ref('')
  const loading = ref(false)
  let ftsDiagramIndex = new Index()

  const loadFile = (event: any) => {
    loading.value = true
    const { target: { files } } = event
    const file: File & { path: string } = files[0] ?? null
    if (file === null) return
    const reader = new FileReader()
    reader.onload = async e => {
      const xml = e?.target?.result as string
      try {
        const { name, path, size, lastModified } = file
        document.value = await parseDocumentFromXml(xml, { name, path, size, lastModified })
      } catch (error) {
        console.error(error)
        void toast.fire({
          icon: 'error',
          title: 'Error while loading xml file!',
          text: 'Check console for more details...'
        })
        document.value = null
      } finally {
        ftsDiagramIndex = new Index()
        unref(document)?.diagrams.forEach(({ id, name }) => ftsDiagramIndex.add(id, name))
        loading.value = false
      }
    }
    reader.readAsText(files[0])
  }

  return {
    loadFile,
    searchQuery,
    loading: computed(() => unref(loading)),
    hasDiagrams: computed(() => unref(document)?.diagrams?.length ?? -1 > 0),
    filteredDiagrams: computed(() => {
      if (unref(searchQuery) === '') return unref(document)?.diagrams ?? []
      const filteredDiagrams = ftsDiagramIndex.search(unref(searchQuery))
        .reduce((accumulator: Diagram[], id) => {
          const diagram = unref(document)?.diagrams.find(({ id: _id }) => _id === id)
          if (diagram !== undefined) accumulator.push(diagram)
          return accumulator
        }, [])
      return filteredDiagrams
    }),
    toggleDiagramSelection: (diagram: Diagram) => { selectedDiagram.value = isSelected(diagram) ? null : diagram },
    selectedDiagram: computed(() => unref(selectedDiagram)),
    isSelected,
    document: computed(() => unref(document))
  }
}

export default useDiagrams
