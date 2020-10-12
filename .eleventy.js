const pluginSyntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight')
const fs = require('fs')

const md = require('./data/md')
const { isDraftOrScheduledPost, isProd } = require('./data/utils')
const transformHeadingAnchorLinks = require('./transforms/heading-anchor-links')

module.exports = (config) => {
  config.addCollection('blogPosts', (collections) =>
    collections
      .getFilteredByGlob('./content/blog/**/*.md')
      .filter((page) => isProd() ? !isDraftOrScheduledPost(page.data) : true)
      .reverse()
  )
  config.addCollection('blogTags', (collections) => {
    const tags = new Set(
      collections.getAll().flatMap((item) => item.data.tags || [])
    )
    return [...tags].sort()
  })

  config.addPassthroughCopy({ './assets/favicon/': '/' })

  config.addPlugin(pluginSyntaxHighlight, { alwaysWrapLineHighlights: true })

  config.addTransform('heading-anchor-links', transformHeadingAnchorLinks)

  config.setBrowserSyncConfig({
    callbacks: {
      ready(err, browserSync) {
        browserSync.addMiddleware('/blog/', (req, res) => {
          res.writeHead(302, { location: '/' })
          res.end()
        })

        // Provides the 404 content without redirect. Source:
        // https://github.com/11ty/eleventy-base-blog/blob/v5.0.2/.eleventy.js#L56-L64
        const notFoundContent = fs.readFileSync('./_site/404.html')
        browserSync.addMiddleware('*', (req, res) => {
          res.write(notFoundContent)
          res.end()
        })
      },
    },
    files: './_site/main.css',
    ghostMode: false,
    ui: false,

    /* Uncomment this to create a public URL (`something.loca.lt`); useful when
     * testing with mobile devices */
    // tunnel: true,
  })

  // "This will likely become the default in an upcoming major version."
  // See https://www.11ty.dev/docs/data-deep-merge/
  config.setDataDeepMerge(true)

  config.setLibrary('md', md)

  return {
    dir: {
      input: 'content',

      // These are relative to the input dir
      data: '../data',
      includes: '../layouts',
    },
  }
}
