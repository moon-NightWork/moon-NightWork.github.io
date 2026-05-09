const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  publicPath: './',     // 必须加，否则白屏
  outputDir: '../docs' // 打包直接输出到仓库根目录的 docs 文件夹
})
