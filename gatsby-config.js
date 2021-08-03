const getCommonFilePath = require("./helpers").getCommonFilePath;

/**
 * @param { import("./src/types").PluginOptions }
 * @returns { import("gatsby").GatsbyConfig }
 */
module.exports = ({ initOptions }) => {
  const fileSystemPlugins = [];

  if (initOptions.config.media_folder) {
    fileSystemPlugins.push({
      resolve: "gatsby-source-filesystem",
      options: {
        name: "media",
        path: initOptions.config.media_folder,
      },
    });
  }

  initOptions?.config?.collections?.forEach((collection) => {
    if (collection?.name && collection.folder) {
      fileSystemPlugins.push({
        resolve: "gatsby-source-filesystem",
        options: {
          name: collection.name,
          path: collection.folder,
        },
      });
    }

    if (collection?.name && collection.files) {
      const files = collection.files.map((file) => file.file);
      fileSystemPlugins.push({
        resolve: "gatsby-source-filesystem",
        options: {
          name: collection.name,
          path: getCommonFilePath(files),
        },
      });
    }
  });

  return {
    plugins: [...fileSystemPlugins],
  };
};
