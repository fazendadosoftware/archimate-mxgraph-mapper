module.exports = {
  chainWebpack: config => {
    config.module
      .rule('graphql')
      .test(/\.(graphql|gql)$/)
      .use('graphql-tag/loader')
      .loader('graphql-tag/loader')
      .end()
  },
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        // options placed here will be merged with default configuration and passed to electron-builder
        // Do not generate blockmap artifacts
        // https://github.com/electron-userland/electron-builder/issues/2900
        nsis: {
          differentialPackage: false
        },
        linux: {
          differentialPackage: false
        },
        dmg: {
          writeUpdateInfo: false
        }
      }
    }
  }
}
