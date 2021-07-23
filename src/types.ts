import type { PluginOptions as OrigPluginOptions } from "gatsby";
import { CmsCollection, InitOptions } from "netlify-cms-core";

export type CmsCollectionFile = Exclude<
  CmsCollection["files"],
  undefined
>[number];

export type CmsCollectionField = Exclude<
  CmsCollection["fields"],
  undefined
>[number];

export type CmsCollectionFieldObject = Extract<
  CmsCollectionField,
  { widget: "object" }
>;

export type CmsCollectionFieldList = Extract<
  CmsCollectionField,
  { widget: "list" }
>;

export type CmsCollectionFieldNumber = Extract<
  CmsCollectionField,
  { widget: "number" }
>;

export type CmsCollectionFieldRelation = Extract<
  CmsCollectionField,
  { widget: "relation" }
>;

export type CmsCollectionFieldBoolean = Extract<
  CmsCollectionField,
  { widget: "boolean" }
>;

export type CmsCollectionFieldSelect = Extract<
  CmsCollectionField,
  { widget: "select" }
>;

export type PluginOptions = OrigPluginOptions & { initOptions: InitOptions };

export type AllPagesQuery = {
  readonly allFile: {
    readonly nodes: ReadonlyArray<{
      readonly children: ReadonlyArray<{
        readonly __typename: string;
        readonly id: string;
      }>;
    }>;
  };
};

export type AllPagesQueryVariables = {
  collections: ReadonlyArray<string>;
};
