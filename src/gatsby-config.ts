import { GatsbyConfig } from "gatsby";
import intersection from "lodash/intersection";

import { PluginOptions } from "./types";

const getCommonFilePath = (filePaths: string[]): string => {
  const filePathsParts: string[][] = [];

  filePaths.forEach((filePath) => {
    filePathsParts.push(filePath.split("/"));
  });

  return intersection(...filePathsParts).join("/");
};

module.exports = ({ initOptions }: PluginOptions): GatsbyConfig => {
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

  if (initOptions.config.collections) {
    initOptions.config.collections.forEach((collection) => {
      if (collection && collection.name) {
        // Folder collection
        if (collection.folder) {
          fileSystemPlugins.push({
            resolve: "gatsby-source-filesystem",
            options: {
              name: collection.name,
              path: collection.folder,
            },
          });
        }

        // Files collection
        if (collection.files) {
          const files = collection.files.map((file) => file.file);

          fileSystemPlugins.push({
            resolve: "gatsby-source-filesystem",
            options: {
              name: collection.name,
              path: getCommonFilePath(files),
            },
          });
        }
      }
    });
  }

  return {
    plugins: [...fileSystemPlugins],
  };
};
