import type { PluginOptions as OrigPluginOptions } from "gatsby";
import { CmsField, InitOptions } from "netlify-cms-core";

export type {
  CmsCollection,
  CmsCollectionFile,
  CmsField,
  CmsWidgetControlProps,
  InitOptions,
  PreviewTemplateComponentProps,
} from "netlify-cms-core";

export type PluginOptions = OrigPluginOptions & {
  initOptions: InitOptions;
  pageCollectionNames: string[];
};

export type AllPagesQuery = {
  readonly allFile: {
    readonly nodes: ReadonlyArray<{
      readonly children: ReadonlyArray<{
        readonly __typename: string;
        readonly id: string;
        readonly path: string;
      }>;
    }>;
  };
};

export type AllPagesQueryVariables = {
  collections: ReadonlyArray<string>;
};

export type CmsCollectionField = CmsField;
export type CmsCollectionFieldObject = Extract<CmsField, { widget: "object" }>;
export type CmsCollectionFieldList = Extract<CmsField, { widget: "list" }>;
export type CmsCollectionFieldNumber = Extract<CmsField, { widget: "number" }>;
export type CmsCollectionFieldRelation = Extract<
  CmsField,
  { widget: "relation" }
>;
export type CmsCollectionFieldBoolean = Extract<
  CmsField,
  { widget: "boolean" }
>;
export type CmsCollectionFieldSelect = Extract<CmsField, { widget: "select" }>;
