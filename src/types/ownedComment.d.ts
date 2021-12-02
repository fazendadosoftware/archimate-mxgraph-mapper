export interface OwnedComment {
  // comment id
  id: string
  // comment string (note: it may be an xml param or a child element)
  body: string
  // the annotated element id, will not exist if OwnedComment is child of PackagedElement
  annotatedElement?: string
}
