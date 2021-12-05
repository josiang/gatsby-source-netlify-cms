/* eslint-disable no-unused-vars */
import type {
  GatsbyGraphQLObjectType,
  GatsbyGraphQLUnionType,
  Node,
  Reporter,
} from "gatsby";
import type { FileSystemNode } from "gatsby-source-filesystem";
import { JSONPath } from "jsonpath-plus";
import type { InitOptions } from "netlify-cms-core";
import path from "path";
import slugify from "slugify";

import {
  capitalizeFirstLetter,
  enhanceMarkdown,
  parseMarkdown,
  toArray,
} from "./helpers";
import type {
  CmsCollectionField,
  CmsCollectionFieldList,
  CmsCollectionFieldNumber,
  CmsCollectionFieldObject,
  CmsCollectionFieldRelation,
  CmsCollectionFile,
} from "./types";

export const getParentPath = (
  allNodes: Node[],
  parentId: string | undefined
): string[] => {
  const pathParts: string[] = [];

  if (!parentId) {
    return pathParts;
  }

  const page: Node | undefined = allNodes.find(
    (node: Node) => node.id === parentId
  );

  if (page) {
    if (page.parentPage) {
      pathParts.push(...getParentPath(allNodes, page.parentPage as string));
    }
    pathParts.push(page.path as string);
  }

  return pathParts;
};

export const getGraphType = (field: CmsCollectionField) => {
  switch (field.widget) {
    default: {
      return "String";
    }

    case "boolean": {
      return "Boolean";
    }

    case "number": {
      const _field = field as CmsCollectionFieldNumber;
      return _field.value_type === "float" ? "Float" : "Int";
    }

    case "image":
    case "file": {
      return "File";
    }

    case "relation": {
      const _field = field as CmsCollectionFieldRelation;

      // Split JSONpath on '.' and
      // remove the last part since we want to derive
      // the typeName from the "branches" and not the "leaves"
      const parts = _field.value_field.split(".").slice(0, -1);
      let typeName = "";

      for (let index = 0; index < parts.length; index++) {
        const part = parts[index];
        if (part === "*") {
          break;
        }
        typeName = `${typeName}${capitalizeFirstLetter(part)}`;
      }

      // TODO
      // Not sure at all about this fallback on collection name
      return typeName || capitalizeFirstLetter(_field.collection);
    }
  }
};

export const getGraphResolver = (
  field: CmsCollectionField,
  initOptions: InitOptions,
  relation?: "one" | "many" | undefined
): ((source: any, args: any, context: any) => Promise<any>) | undefined => {
  switch (field.widget) {
    default: {
      return undefined;
    }

    /**
     * "path" uses the sibling property "parentPage" to handle nested pages
     */
    case "path": {
      return async (source, _, context) => {
        const { entries } = await context.nodeModel.findAll({ type: "Node" });
        const allNodes: Node[] = Array.from(entries);

        const parentPath: string[] = getParentPath(
          allNodes,
          (source?.parentPage as string) || undefined
        );

        const path = `/${parentPath
          .concat(source[field.name])
          .map((part) => slugify(part, { lower: true }))
          .join("/")}`;

        return path;
      };
    }

    case "markdown": {
      return async (source, _, context) => {
        const { entries } = await context.nodeModel.findAll({ type: "File" });
        const allFileNodes: FileSystemNode[] = Array.from(entries);
        const fileNodes: FileSystemNode[] = [];

        const markdown: string | null | undefined = source[field.name];

        const enhancedMarkdown: string | null =
          markdown !== null && markdown !== undefined
            ? enhanceMarkdown<FileSystemNode>(
                markdown,
                (file) => {
                  const base = path.basename(file);

                  const fileNode =
                    // Try to find an Image file node
                    allFileNodes.find((file) => file.base === base) ||
                    // Try to find an generated page file node
                    allFileNodes.find((file) => file.children.includes(base)) ||
                    null;

                  if (fileNode) {
                    fileNodes.push(fileNode);
                  }

                  return fileNode;
                },
                (file) => {
                  return file.id;
                }
              )
            : null;

        return {
          html:
            enhancedMarkdown !== null ? parseMarkdown(enhancedMarkdown) : null,
          files: fileNodes,
        };
      };
    }

    case "number": {
      return async (source) => {
        const value = source[field.name];
        return Number(value);
      };
    }

    case "image":
    case "file": {
      return async (source, _, context) => {
        const filePath: string | null = source[field.name];

        if (!filePath) {
          return null;
        }

        const base = path.basename(filePath);

        const { entries } = await context.nodeModel.findAll({ type: "File" });
        const allNodes: FileSystemNode[] = Array.from(entries);

        return allNodes.find((file) => file.base === base) || null;
      };
    }

    case "relation": {
      const fieldConfig = field as CmsCollectionFieldRelation;

      return async (source, _, context) => {
        const collectionConfig = initOptions.config.collections.find(
          (collection) => collection.name === fieldConfig.collection
        );

        // Ensure value is array to facilitate next steps
        const fieldValues: unknown[] = toArray(source[field.name]);

        let allResults: Record<string, unknown>[] = [];

        // The collection has files
        if (collectionConfig?.files) {
          // Find file configs
          // Either the relation asks for an explicit file,
          // or we use all the files from the collection
          const fileConfigs: (CmsCollectionFile | null)[] = fieldConfig.file
            ? [
                collectionConfig.files.find(
                  (file) => file.name === fieldConfig.file
                ) || null,
              ]
            : collectionConfig.files;

          // Find file nodes from file path
          for (const fileConfig of fileConfigs) {
            const { entries } = await context.nodeModel.findAll({
              type: "File",
            });
            const allNodes: FileSystemNode[] = Array.from(entries);

            const fileSystemNode =
              allNodes.find((fileSystemNode) =>
                fileConfig?.file
                  ? fileSystemNode?.absolutePath?.match(fileConfig.file) ||
                    false
                  : false
              ) || null;

            const targetNodeId: string | null =
              fileSystemNode?.children?.[0] || null;

            const targetNode: Node | null = targetNodeId
              ? context.nodeModel.getNodeById({ id: targetNodeId }) || null
              : null;

            // Find results in file using the value field JSONPath
            const subResults: any[] = JSONPath({
              path: fieldConfig.value_field,
              json: targetNode || {},
              resultType: "parent",
            });

            allResults = allResults.concat(...subResults);
          }
        }
        // The collection has fields
        else if (collectionConfig?.fields) {
          const { entries } = await context.nodeModel.findAll({ type: "File" });
          const allNodes: FileSystemNode[] = Array.from(entries);

          // Find file nodes from file path
          allNodes
            .filter((fileSystemNode) =>
              collectionConfig.folder
                ? fileSystemNode?.absolutePath?.match(
                    collectionConfig.folder
                  ) || false
                : false
            )
            .map((fileSystemNode) => {
              return fileSystemNode?.children?.[0] || null;
            })
            .forEach((targetNodeId) => {
              const targetNode: Node | null = targetNodeId
                ? context.nodeModel.getNodeById({ id: targetNodeId }) || null
                : null;

              // Find results in file using the value field JSONPath
              const subResults: any[] = JSONPath({
                path: fieldConfig.value_field,
                json: targetNode || {},
                resultType: "parent",
              });

              allResults = allResults.concat(...subResults);
            });
        }

        const results: unknown[] = fieldValues
          .map(
            (fieldValue) =>
              allResults.find((result) => {
                // TODO find a way to find the exact path to the value_field
                return result.id === fieldValue;
              }) || null
          )
          // Remove potential null results
          .filter(Boolean);

        if (relation === "many") {
          return results.length > 0 ? results : null;
        }

        return results.length > 0 ? results[0] : null;
      };
    }
  }
};

export const getGraphExtentions = (field: CmsCollectionField) => {
  switch (field.widget) {
    default: {
      return {};
    }

    case "datetime": {
      return {
        dateformat: {},
      };
    }
  }
};

export const parseCmsFields = ({
  fields,
  parentTypeDef,
  parentTypeName,
  initOptions,
  reporter,
}: {
  fields: CmsCollectionField[];
  parentTypeDef?: GatsbyGraphQLObjectType;
  parentTypeName: string;
  initOptions: InitOptions;
  reporter: Reporter;
}) => {
  let typeDefs: (GatsbyGraphQLObjectType | GatsbyGraphQLUnionType)[] = [];

  fields.forEach((field) => {
    switch (field.widget) {
      /**
       * Default scalar types
       * Leaves of our GraphQL tree.
       * They must be registered in a parent Object type.
       *
       * parentObject: {
       *  title: {
       *    type: String
       *  }
       * }
       */
      case undefined:
      case "boolean":
      case "color":
      case "datetime":
      case "file":
      case "hidden":
      case "image":
      case "number":
      case "string":
      case "text":
      case "select": // TODO Maybe ENUM of the values?
      case "uuid":
      case "path": {
        if (parentTypeDef) {
          // register field in the parent object type
          parentTypeDef.config.fields = {
            ...parentTypeDef.config.fields,
            [field.name]: {
              type: getGraphType(field),
              resolve: getGraphResolver(field, initOptions),
              extensions: getGraphExtentions(field),
            },
          };
        }

        break;
      }

      case "markdown": {
        const typeName = `${parentTypeName}${capitalizeFirstLetter(
          field.name
        )}`;

        const typeDef: GatsbyGraphQLObjectType = {
          kind: "OBJECT",
          config: {
            name: typeName,
            fields: {
              html: {
                type: "String",
              },
              files: {
                type: "[File]",
              },
            },
          },
        };

        typeDefs = typeDefs.concat(typeDef);

        if (parentTypeDef) {
          // register field in the parent object type
          parentTypeDef.config.fields = {
            ...parentTypeDef.config.fields,
            [field.name]: {
              type: typeName,
              resolve: getGraphResolver(field, initOptions),
              extensions: getGraphExtentions(field),
            },
          };
        }

        break;
      }

      case "relation": {
        const _field = field as CmsCollectionFieldRelation;
        const typeName = getGraphType(_field);

        if (parentTypeDef) {
          // register field in the parent object type
          parentTypeDef.config.fields = {
            ...parentTypeDef.config.fields,
            [_field.name]: {
              type: _field.multiple ? [typeName] : typeName,
              resolve: getGraphResolver(
                _field,
                initOptions,
                _field.multiple ? "many" : undefined
              ),
              extensions: getGraphExtentions(field),
            },
          };
        }

        break;
      }

      /**
       * Object type
       * Branches of our GraphQL tree.
       * They must be registered in a parent Object type.
       * They must register their children.
       *
       * The custom Object type must be registered in the typeDefs collection
       * in order to be generated by the GraphQL
       *
       * parentObject: {
       *  customObject: {
       *    type: ParentObjectCustomObject
       *  }
       * }
       */
      case "object": {
        const _field = field as CmsCollectionFieldObject;
        const typeName = `${parentTypeName}${capitalizeFirstLetter(
          _field.name
        )}`;

        const typeDef: GatsbyGraphQLObjectType = {
          kind: "OBJECT",
          config: {
            name: typeName,
          },
        };

        // prepare potential nested type definitions
        const nestedTypeDefs = parseCmsFields({
          fields: _field.fields,
          parentTypeDef: typeDef,
          parentTypeName: typeName,
          initOptions,
          reporter,
        });

        if (parentTypeDef) {
          // register field in the parent object type
          parentTypeDef.config.fields = {
            ...parentTypeDef.config.fields,
            [_field.name]: {
              type: typeName,
            },
          };
        }

        // add type definition and potential nested type definitions in build queue
        typeDefs = typeDefs.concat(typeDef, ...nestedTypeDefs);

        break;
      }

      /**
       * Array or Union type
       * Branches of our GraphQL tree.
       */
      case "list": {
        const _field = field as CmsCollectionFieldList;
        const typeName = `${parentTypeName}${capitalizeFirstLetter(
          _field.name
        )}`;

        /**
         * Repeatable single field
         * Branches of our GraphQL tree.
         * They must be registered in the parent Object.
         *
         * parentObject: {
         *  nameList: {
         *    type: [String]
         *  }
         * }
         *
         * parentObject: {
         *  customObjectList: {
         *    type: [ParentObjectCustomObjectList]
         *  }
         * }
         */
        // TODO, does not work with object or lists
        if (_field.field) {
          // prepare potential nested type definitions
          const nestedTypeDefs = parseCmsFields({
            fields: [_field.field],
            parentTypeName,
            initOptions,
            reporter,
          });

          if (parentTypeDef) {
            // register field in the parent object type
            parentTypeDef.config.fields = {
              ...parentTypeDef.config.fields,
              [_field.name]: {
                type: `[${getGraphType({
                  ..._field.field,
                  name: _field.name,
                })}]`,
                resolve: getGraphResolver(
                  {
                    ..._field.field,
                    name: _field.name,
                  },
                  initOptions,
                  "many"
                ),
                extensions: getGraphExtentions(field),
              },
            };
          }

          // add potential nested type definitions in build queue
          typeDefs = typeDefs.concat(...nestedTypeDefs);
        }

        /**
         * Repeatable fields
         * Branches of our GraphQL tree.
         * They must be registered in a parent Object.
         *
         * parentObject: {
         *  customObjectList: {
         *    type: [ParentObjectCustomObject]
         *  }
         * }
         */
        if (_field.fields) {
          const typeDef: GatsbyGraphQLObjectType = {
            kind: "OBJECT",
            config: {
              name: typeName,
            },
          };

          // prepare potential nested type definitions
          const nestedTypeDefs = parseCmsFields({
            fields: _field.fields,
            parentTypeDef: typeDef,
            parentTypeName: typeName,
            initOptions,
            reporter,
          });

          if (parentTypeDef) {
            // register field in the parent object type
            parentTypeDef.config.fields = {
              ...parentTypeDef.config.fields,
              [_field.name]: {
                type: `[${typeName}]`,
              },
            };
          }

          // add type definition and potential nested type definitions in build queue
          typeDefs = typeDefs.concat(typeDef, ...nestedTypeDefs);
        }

        /**
         * Fields union
         * Branches of our GraphQL tree.
         * They must be registered in a parent Object.
         * They must not be used as a parent Object.
         *
         * parentObject: {
         *  customObjectList: {
         *    type: [ParentObjectCustomObject]
         *  }
         * }
         *
         * ParentObjectCustomObject = CustomObject1 | CustomObject2 | CustomObject3
         */
        if (_field.types) {
          // prepare potential nested type definitions
          const nestedTypeDefs = parseCmsFields({
            fields: _field.types,
            parentTypeName,
            initOptions,
            reporter,
          });

          const unionTypes = _field.types.map(
            (type) => `${parentTypeName}${capitalizeFirstLetter(type.name)}`
          );

          const typeDef: GatsbyGraphQLUnionType = {
            kind: "UNION",
            config: {
              name: typeName,
              types: unionTypes,
              resolveType: (value) => {
                return value?.__typename
                  ? `${parentTypeName}${capitalizeFirstLetter(
                      value.__typename
                    )}`
                  : null;
              },
            },
          };

          if (parentTypeDef) {
            // register field in the parent object type
            parentTypeDef.config.fields = {
              ...parentTypeDef.config.fields,
              [_field.name]: {
                type: `[${typeName}]`,
              },
            };
          }

          // add type definition and potential nested type definitions in build queue
          typeDefs = typeDefs.concat(typeDef, ...nestedTypeDefs);
        }

        break;
      }

      default: {
        reporter?.error(
          `missing field parser for ${field.widget} in ${parentTypeName}.${field.name}`
        );
        break;
      }
    }
  });

  return typeDefs;
};
