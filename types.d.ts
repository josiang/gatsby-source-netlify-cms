import type { PluginOptions as OrigPluginOptions } from "gatsby";
import { CmsCollection, InitOptions } from "netlify-cms-core";
export declare type CmsCollectionFile = Exclude<CmsCollection["files"], undefined>[number];
export declare type CmsCollectionField = Exclude<CmsCollection["fields"], undefined>[number];
export declare type CmsCollectionFieldObject = Extract<CmsCollectionField, {
    widget: "object";
}>;
export declare type CmsCollectionFieldList = Extract<CmsCollectionField, {
    widget: "list";
}>;
export declare type CmsCollectionFieldNumber = Extract<CmsCollectionField, {
    widget: "number";
}>;
export declare type CmsCollectionFieldRelation = Extract<CmsCollectionField, {
    widget: "relation";
}>;
export declare type CmsCollectionFieldBoolean = Extract<CmsCollectionField, {
    widget: "boolean";
}>;
export declare type CmsCollectionFieldSelect = Extract<CmsCollectionField, {
    widget: "select";
}>;
export declare type PluginOptions = OrigPluginOptions & {
    initOptions: InitOptions;
};
export declare type AllPagesQuery = {
    readonly allFile: {
        readonly nodes: ReadonlyArray<{
            readonly children: ReadonlyArray<{
                readonly __typename: string;
                readonly id: string;
            }>;
        }>;
    };
};
export declare type AllPagesQueryVariables = {
    collections: ReadonlyArray<string>;
};
