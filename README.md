# archimate-mxgraph-mapper

![GitHub package.json version](https://img.shields.io/github/package-json/v/fazendadosoftware/archimate-mxgraph-mapper)
![GitHub all releases](https://img.shields.io/github/downloads/fazendadosoftware/archimate-mxgraph-mapper/total)

## Binaries
* [Windows](https://github.com/fazendadosoftware/archimate-mxgraph-mapper/releases/download/v0.4.0/Archimate-MXGraph-Mapper-Setup-0.4.0.exe)
* [Mac](https://github.com/fazendadosoftware/archimate-mxgraph-mapper/releases/download/v0.4.0/Archimate-MXGraph-Mapper-0.4.0.dmg)
* [Linux](https://github.com/fazendadosoftware/archimate-mxgraph-mapper/releases/download/v0.4.0/Archimate-MXGraph-Mapper-0.4.0.AppImage)

# Scripts

Run `npm run electron:dev` to work with electron in development mode.
```bash
npm run electron:dev
```

Run `npm run app:build` to build your electron app.
```bash
npm run app:build
```

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Vetur](https://marketplace.visualstudio.com/items?itemName=octref.vetur). Make sure to enable `vetur.experimental.templateInterpolationService` in settings!

### If Using `<script setup>`

[`<script setup>`](https://github.com/vuejs/rfcs/pull/227) is a feature that is currently in RFC stage. To get proper IDE support for the syntax, use [Volar](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar) instead of Vetur (and disable Vetur).

## Type Support For `.vue` Imports in TS

Since TypeScript cannot handle type information for `.vue` imports, they are shimmed to be a generic Vue component type by default. In most cases this is fine if you don't really care about component prop types outside of templates. However, if you wish to get actual prop types in `.vue` imports (for example to get props validation when using manual `h(...)` calls), you can use the following:

### If Using Volar

Run `Volar: Switch TS Plugin on/off` from VSCode command palette.

### If Using Vetur

1. Install and add `@vuedx/typescript-plugin-vue` to the [plugins section](https://www.typescriptlang.org/tsconfig#plugins) in `tsconfig.json`
2. Delete `src/shims-vue.d.ts` as it is no longer needed to provide module info to Typescript
3. Open `src/main.ts` in VSCode
4. Open the VSCode command palette
5. Search and run "Select TypeScript version" -> "Use workspace version"
