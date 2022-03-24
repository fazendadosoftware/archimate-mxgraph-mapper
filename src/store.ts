enum Setting {
  OverwriteDiagramInWorkspace = 'overwriteDiagramInWorkspace'
}
// @ts-expect-error
export const getOverwriteSetting = (): boolean => electron.store.get(Setting.OverwriteDiagramInWorkspace) ?? true
// @ts-expect-error
export const setOverwriteSetting = (value: boolean) => electron.store.set(Setting.OverwriteDiagramInWorkspace, value)
