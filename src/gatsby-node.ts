import fs from "fs";
import type {
  CreateNodeArgs,
  CreatePagesArgs,
  CreateSchemaCustomizationArgs,
  GatsbyGraphQLObjectType,
  GatsbyGraphQLUnionType,
  GatsbyNode,
  Node,
} from "gatsby";
import type { FileSystemNode } from "gatsby-source-filesystem";
import grayMatter from "gray-matter";
import path from "path";
import slugify from "slugify";

import {
  capitalizeFirstLetter,
  lowercaseFirstLetter,
  parseCmsFields,
} from "./helpers";
import type {
  AllPagesQuery,
  AllPagesQueryVariables,
  CmsCollectionField,
  PluginOptions,
} from "./types";

const loadNodeContent = (fileSystemNode: FileSystemNode) => {
  return fs.readFileSync(fileSystemNode.absolutePath, "utf-8");
};

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

export const onCreateNode = ({
  node,
  actions,
  createContentDigest,
  getNode,
}: CreateNodeArgs<FileSystemNode>): void => {
  if (node.internal?.mediaType === "text/markdown") {
    const content = loadNodeContent(node);
    const fields = grayMatter(content).data;
    const type = capitalizeFirstLetter(node.sourceInstanceName as string);
    const identifier = fields?.id || `${type}-${String(node.id)}`;
    let nodePath: string | undefined = undefined;

    if ("path" in fields) {
      const pathParts: string[] = [];
      // TODO type this
      // @ts-ignore
      const parentPagePath = getNode("settings-general")?.parentPages?.find(
        (relation: any) => {
          return (
            relation?.collection ===
            lowercaseFirstLetter(node.sourceInstanceName as string)
          );
        }
      )?.path;

      if (parentPagePath) {
        pathParts.push(parentPagePath);
      }

      pathParts.push(fields.path);

      nodePath = `/${pathParts
        .map((part) => slugify(part, { lower: true }))
        .join("/")}`;
    }

    const newNode: Node = {
      ...fields,
      id: identifier,
      path: nodePath,
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

export const createPages: GatsbyNode["createPages"] = async (
  { actions, graphql, getNode }: CreatePagesArgs,
  pluginOptions: PluginOptions
): Promise<void> => {
  const { createPage } = actions;
  const initOptions = pluginOptions.initOptions;

  const collections = initOptions.config.collections
    .filter((collection) => collection.create)
    .map((collection) => collection.name);

  const { data } = await graphql<AllPagesQuery, AllPagesQueryVariables>(
    `
      query AllPages($collections: [String]) {
        allFile(filter: { sourceInstanceName: { in: $collections } }) {
          nodes {
            children {
              __typename
              id
            }
          }
        }
      }
    `,
    { collections }
  );

  data?.allFile.nodes.forEach((file) => {
    const child = file.children?.[0];
    const type = child.__typename;
    const component = path.resolve(`./src/templates/${type}/index.tsx`);

    if (fs.existsSync(component)) {
      const pageId = child.id;
      const node = getNode(pageId);

      const path = String(node.path);

      createPage({
        path,
        component,
        context: {
          pageId,
        },
      });
    }
  });
};
