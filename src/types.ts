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
export type CmsCollectionFieldBoolean = Extract<
  CmsField,
  { widget: "boolean" }
>;
export type CmsCollectionFieldCode = Extract<CmsField, { widget: "code" }>;
export type CmsCollectionFieldColor = Extract<CmsField, { widget: "color" }>;
export type CmsCollectionFieldDateTime = Extract<
  CmsField,
  { widget: "datetime" }
>;
export type CmsCollectionFieldFileOrImage = Extract<
  CmsField,
  { widget: "file" | "image" }
>;
export type CmsCollectionFieldList = Extract<CmsField, { widget: "list" }>;
export type CmsCollectionFieldMap = Extract<CmsField, { widget: "map" }>;
export type CmsCollectionFieldMarkdown = Extract<
  CmsField,
  { widget: "markdown" }
>;
export type CmsCollectionFieldNumber = Extract<CmsField, { widget: "number" }>;
export type CmsCollectionFieldObject = Extract<CmsField, { widget: "object" }>;
export type CmsCollectionFieldRelation = Extract<
  CmsField,
  { widget: "relation" }
>;
export type CmsCollectionFieldSelect = Extract<CmsField, { widget: "select" }>;
export type CmsCollectionFieldHidden = Extract<CmsField, { widget: "hidden" }>;
export type CmsCollectionFieldStringOrText = Extract<
  CmsField,
  { widget: "string" | "text" }
>;
export type CmsCollectionFieldMeta = Extract<CmsField, { widget: "meta" }>;
