import type { CreateNodeArgs, CreateSchemaCustomizationArgs, GatsbyNode } from "gatsby";
import type { FileSystemNode } from "gatsby-source-filesystem";
import type { PluginOptions } from "./types";
export declare const createSchemaCustomization: ({ actions, schema, reporter }: CreateSchemaCustomizationArgs, pluginOptions: PluginOptions) => void;
export declare const onCreateNode: ({ node, actions, createContentDigest, getNode, }: CreateNodeArgs<FileSystemNode>) => void;
export declare const createPages: GatsbyNode["createPages"];
