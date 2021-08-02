# gatsby-source-netlify-cms

**Work in progress, come back later :)**

Use `https://github.com/hugomrdias/connect-deps/` to link and develop

This source plugins:

- Creates the Gatsby datalayer corresponding to your `netlify-cms` options (The options need to be a JS object)
- Creates a SourceFileSystem instance per CMS collection (required by the internal structure of this plugin)
- Feeds the Gatsby datalayer the files content
- Creates Gatsby pages based on the `pageCollectionNames` option

## TODO

- Document pageCollectionNames option
- Document expected page node fields (`id`, `path`, `parentPage`)
- Document expected list types settings (`typeKey: "__typename"`)
- Document page creation process (`fileSystem child __typename -> type -> ./src/templates/${type}/index.tsx`)
