import type {
  CreateSchemaCustomizationArgs,
  GatsbyGraphQLObjectType,
  GatsbyGraphQLUnionType,
} from "gatsby";

import { capitalizeFirstLetter, parseCmsFields } from "./helpers";
import type { CmsCollectionField, PluginOptions } from "./types";

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
