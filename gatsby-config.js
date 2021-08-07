"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var intersection_1 = __importDefault(require("lodash/intersection"));
var getCommonFilePath = function (filePaths) {
    var filePathsParts = [];
    filePaths.forEach(function (filePath) {
        filePathsParts.push(filePath.split("/"));
    });
    return intersection_1.default.apply(void 0, filePathsParts).join("/");
};
module.exports = function (_a) {
    var initOptions = _a.initOptions;
    var fileSystemPlugins = [];
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
        initOptions.config.collections.forEach(function (collection) {
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
                    var files = collection.files.map(function (file) { return file.file; });
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
        plugins: __spreadArray([], fileSystemPlugins),
    };
};
