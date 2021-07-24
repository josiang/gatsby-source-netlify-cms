import type { GatsbyGraphQLObjectType, GatsbyGraphQLUnionType, Reporter } from "gatsby";
import type { InitOptions } from "netlify-cms-core";
import type { CmsCollectionField } from "./types";
export declare const toArray: <T>(value: T | T[]) => T[];
export declare const capitalizeFirstLetter: (string: string) => string;
export declare const lowercaseFirstLetter: (string: string) => string;
export declare const getGraphType: (field: CmsCollectionField) => string;
export declare const getGraphResolver: (field: CmsCollectionField, initOptions: InitOptions, relation?: "one" | "many" | undefined) => ((source: any, args: any, context: any) => any) | undefined;
export declare const getGraphExtentions: (field: CmsCollectionField) => {
    dateformat?: undefined;
} | {
    dateformat: {};
};
export declare const parseCmsFields: ({ fields, parentTypeDef, parentTypeName, initOptions, reporter, }: {
    fields: CmsCollectionField[];
    parentTypeDef?: GatsbyGraphQLObjectType | undefined;
    parentTypeName: string;
    initOptions: InitOptions;
    reporter: Reporter;
}) => (GatsbyGraphQLObjectType | GatsbyGraphQLUnionType)[];
