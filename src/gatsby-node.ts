import fs from "fs";
import type {
  CreateNodeArgs,
  CreateSchemaCustomizationArgs,
  GatsbyGraphQLObjectType,
  GatsbyGraphQLUnionType,
  GatsbyNode,
  Node,
} from "gatsby";
import type { FileSystemNode } from "gatsby-source-filesystem";
import grayMatter from "gray-matter";
import path from "path";

import { capitalizeFirstLetter, parseCmsFields } from "./helpers";
import type {
  AllPagesQuery,
  AllPagesQueryVariables,
  CmsCollectionField,
  PluginOptions,
} from "./types";

export const createSchemaCustomization = (
  { actions, schema, reporter }: CreateSchemaCustomizationArgs,
  pluginOptions: PluginOptions
): void => {
  const { createTypes } = actions;
  const initOptions = pluginOptions.initOptions;

  let typeDefs: (GatsbyGraphQLObjectType | GatsbyGraphQLUnionType)[] = [];

  initOptions.config.collections.forEach((collection) => {
    let fields: CmsCollectionField[] = [];

    if (collection.fields) {
      fields = fields.concat(...collection.fields);
    }

    if (collection.files) {
      collection.files.forEach((file) => {
        fields = fields.concat(...file.fields);
      });
    }

    const typeDef: GatsbyGraphQLObjectType = {
      kind: "OBJECT",
      config: {
        name: capitalizeFirstLetter(collection.name),
        extensions: {
          infer: false,
        },
        interfaces: ["Node"],
      },
    };

    typeDefs = typeDefs.concat(
      typeDef,
      ...parseCmsFields({
        fields,
        parentTypeDef: typeDef,
        parentTypeName: "",
        initOptions,
        reporter,
      })
    );
  });

  createTypes(
    typeDefs.map((typeDef) => {
      if (typeDef.kind === "UNION") {
        reporter.info(`building UnionType ${typeDef.config.name}`);
        return schema.buildUnionType(typeDef.config);
      }

      reporter.info(`building ObjectType ${typeDef.config.name}`);
      return schema.buildObjectType(typeDef.config);
    })
  );
};

/**
 * Reacting to nodes created by the Source FileSystem plugin.
 * We create our nodes based on the files content
 * We link the new nodes the the parent FileSystem node
 */
export const onCreateNode = ({
  node,
  actions,
  createContentDigest,
}: CreateNodeArgs<FileSystemNode>): void => {
  if (node.internal?.mediaType === "text/markdown") {
    const content = fs.readFileSync(node.absolutePath, "utf-8");
    const fields = grayMatter(content).data;
    const type = capitalizeFirstLetter(node.sourceInstanceName);
    const identifier = fields?.id || `${type}-${String(node.id)}`;

    const newNode: Node = {
      ...fields,
      id: identifier,
      parent: node.id,
      children: [],
      internal: {
        type,
        owner: "",
        content: JSON.stringify(fields),
        contentDigest: createContentDigest(fields || {}),
      },
    };

    actions.createNode(newNode);
    actions.createParentChildLink({ parent: node, child: newNode });
  }
};

/**
 * Creating the site pages based on the page collection names
 */
export const createPages: GatsbyNode["createPages"] = async (
  { actions, graphql },
  pluginOptions: PluginOptions
): Promise<void> => {
  const { createPage } = actions;
  const pageCollectionNames = pluginOptions.pageCollectionNames;

  const { data } = await graphql<AllPagesQuery, AllPagesQueryVariables>(
    `
      query AllPages($collections: [String]) {
        allFile(filter: { sourceInstanceName: { in: $collections } }) {
          nodes {
            children {
              __typename
              id
              ${pageCollectionNames.map(
                (typeName) =>
                  `... on ${capitalizeFirstLetter(typeName)} { path }`
              )}
            }
          }
        }
      }
    `,
    { collections: pageCollectionNames }
  );

  data?.allFile.nodes.forEach((file) => {
    const child = file.children?.[0];
    const type = child?.__typename;
    const component = path.resolve(`./src/templates/${type}/index.tsx`);

    if (fs.existsSync(component)) {
      const pageId = child.id;
      const pagePath = child.path;

      createPage({
        path: pagePath,
        component,
        context: {
          pageId,
        },
      });
    }
  });
};
