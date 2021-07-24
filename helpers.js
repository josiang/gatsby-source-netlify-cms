"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCmsFields = exports.getGraphExtentions = exports.getGraphResolver = exports.getGraphType = exports.lowercaseFirstLetter = exports.capitalizeFirstLetter = exports.toArray = void 0;
var jsonpath_plus_1 = require("jsonpath-plus");
var path_1 = __importDefault(require("path"));
var remark_1 = __importDefault(require("remark"));
var remark_breaks_1 = __importDefault(require("remark-breaks"));
var remark_gfm_1 = __importDefault(require("remark-gfm"));
var remark_html_1 = __importDefault(require("remark-html"));
var toArray = function (value) {
    return Array.isArray(value) ? value : [value];
};
exports.toArray = toArray;
var capitalizeFirstLetter = function (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
};
exports.capitalizeFirstLetter = capitalizeFirstLetter;
var lowercaseFirstLetter = function (string) {
    return string.charAt(0).toLowerCase() + string.slice(1);
};
exports.lowercaseFirstLetter = lowercaseFirstLetter;
var getGraphType = function (field) {
    switch (field.widget) {
        default: {
            return "String";
        }
        case "boolean": {
            return "Boolean";
        }
        case "number": {
            var _field = field;
            return _field.value_type === "float" ? "Float" : "Int";
        }
        case "image":
        case "file": {
            return "File";
        }
        case "relation": {
            var _field = field;
            // Split JSONpath on '.' and
            // remove the last part since we want to derive
            // the typeName from the "branches" and not the "leaves"
            var parts = _field.value_field.split(".").slice(0, -1);
            var typeName = "";
            for (var index = 0; index < parts.length; index++) {
                var part = parts[index];
                if (part === "*") {
                    break;
                }
                typeName = "" + typeName + exports.capitalizeFirstLetter(part);
            }
            // TODO
            // Not sure at all about this fallback on collection name
            return typeName || exports.capitalizeFirstLetter(_field.collection);
        }
    }
};
exports.getGraphType = getGraphType;
var getGraphResolver = function (field, initOptions, relation) {
    switch (field.widget) {
        default: {
            return undefined;
        }
        case "markdown": {
            return function (source) {
                return remark_1.default()
                    .use(remark_html_1.default)
                    .use(remark_breaks_1.default)
                    .use(remark_gfm_1.default)
                    .processSync(source[field.name]).contents;
            };
        }
        case "number": {
            return function (source) {
                var value = source[field.name];
                return Number(value);
            };
        }
        case "image":
        case "file": {
            return function (source, _, context) {
                var filePath = source[field.name];
                if (!filePath) {
                    return null;
                }
                var base = path_1.default.basename(filePath);
                return context.nodeModel
                    .getAllNodes({ type: "File" })
                    .find(function (file) { return file.base === base; });
            };
        }
        case "relation": {
            var fieldConfig_1 = field;
            return function (source, _, context) {
                var collectionConfig = initOptions.config.collections.find(function (collection) { return collection.name === fieldConfig_1.collection; });
                // Ensure value is array to facilitate next steps
                var fieldValues = exports.toArray(source[field.name]);
                var allResults = [];
                // The collection has files
                if (collectionConfig === null || collectionConfig === void 0 ? void 0 : collectionConfig.files) {
                    // Find file configs
                    // Either the relation asks for an explicit file,
                    // or we use all the files from the collection
                    var fileConfigs = fieldConfig_1.file
                        ? [
                            collectionConfig.files.find(function (file) { return file.name === fieldConfig_1.file; }) || null,
                        ]
                        : collectionConfig.files;
                    // Find file nodes from file path
                    fileConfigs.forEach(function (fileConfig) {
                        var _a;
                        var targetNodeId = ((_a = context.nodeModel
                            .getAllNodes({ type: "File" })
                            .find(function (fileSystemNode) {
                            var _a;
                            return (fileConfig === null || fileConfig === void 0 ? void 0 : fileConfig.file)
                                ? ((_a = fileSystemNode === null || fileSystemNode === void 0 ? void 0 : fileSystemNode.absolutePath) === null || _a === void 0 ? void 0 : _a.match(fileConfig.file)) ||
                                    false
                                : false;
                        }).children) === null || _a === void 0 ? void 0 : _a[0]) || null;
                        var targetNode = targetNodeId
                            ? context.nodeModel.getNodeById({ id: targetNodeId }) || null
                            : null;
                        // Find results in file using the value field JSONPath
                        var subResults = jsonpath_plus_1.JSONPath({
                            path: fieldConfig_1.value_field,
                            json: targetNode || {},
                            resultType: "parent",
                        });
                        allResults = allResults.concat.apply(allResults, subResults);
                    });
                }
                // The collection has fields
                else if (collectionConfig === null || collectionConfig === void 0 ? void 0 : collectionConfig.fields) {
                    // Find file nodes from file path
                    context.nodeModel
                        .getAllNodes({ type: "File" })
                        .filter(function (fileSystemNode) {
                        var _a;
                        return collectionConfig.folder
                            ? ((_a = fileSystemNode === null || fileSystemNode === void 0 ? void 0 : fileSystemNode.absolutePath) === null || _a === void 0 ? void 0 : _a.match(collectionConfig.folder)) || false
                            : false;
                    })
                        .map(function (fileSystemNode) {
                        var _a;
                        return ((_a = fileSystemNode === null || fileSystemNode === void 0 ? void 0 : fileSystemNode.children) === null || _a === void 0 ? void 0 : _a[0]) || null;
                    })
                        .forEach(function (targetNodeId) {
                        var targetNode = targetNodeId
                            ? context.nodeModel.getNodeById({ id: targetNodeId }) || null
                            : null;
                        // Find results in file using the value field JSONPath
                        var subResults = jsonpath_plus_1.JSONPath({
                            path: fieldConfig_1.value_field,
                            json: targetNode || {},
                            resultType: "parent",
                        });
                        allResults = allResults.concat.apply(allResults, subResults);
                    });
                }
                var results = fieldValues
                    .map(function (fieldValue) {
                    return allResults.find(function (result) {
                        // TODO find a way to find the exact path to the value_field
                        return result.id === fieldValue;
                    }) || null;
                })
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
exports.getGraphResolver = getGraphResolver;
var getGraphExtentions = function (field) {
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
exports.getGraphExtentions = getGraphExtentions;
var parseCmsFields = function (_a) {
    var fields = _a.fields, parentTypeDef = _a.parentTypeDef, parentTypeName = _a.parentTypeName, initOptions = _a.initOptions, reporter = _a.reporter;
    var typeDefs = [];
    fields.forEach(function (field) {
        var _a, _b, _c, _d, _e, _f;
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
            case "markdown":
            case "number":
            case "string":
            case "text":
            case "select": // TODO Maybe ENUM of the values?
            case "uuid":
            case "path": {
                if (parentTypeDef) {
                    // register field in the parent object type
                    parentTypeDef.config.fields = __assign(__assign({}, parentTypeDef.config.fields), (_a = {}, _a[field.name] = {
                        type: exports.getGraphType(field),
                        resolve: exports.getGraphResolver(field, initOptions),
                        extensions: exports.getGraphExtentions(field),
                    }, _a));
                }
                break;
            }
            case "relation": {
                var _field = field;
                var typeName = exports.getGraphType(_field);
                if (parentTypeDef) {
                    // register field in the parent object type
                    parentTypeDef.config.fields = __assign(__assign({}, parentTypeDef.config.fields), (_b = {}, _b[_field.name] = {
                        type: _field.multiple ? [typeName] : typeName,
                        resolve: exports.getGraphResolver(_field, initOptions, _field.multiple ? "many" : undefined),
                        extensions: exports.getGraphExtentions(field),
                    }, _b));
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
                var _field = field;
                var typeName = "" + parentTypeName + exports.capitalizeFirstLetter(_field.name);
                var typeDef = {
                    kind: "OBJECT",
                    config: {
                        name: typeName,
                    },
                };
                // prepare potential nested type definitions
                var nestedTypeDefs = exports.parseCmsFields({
                    fields: _field.fields,
                    parentTypeDef: typeDef,
                    parentTypeName: typeName,
                    initOptions: initOptions,
                    reporter: reporter,
                });
                if (parentTypeDef) {
                    // register field in the parent object type
                    parentTypeDef.config.fields = __assign(__assign({}, parentTypeDef.config.fields), (_c = {}, _c[_field.name] = {
                        type: typeName,
                    }, _c));
                }
                // add type definition and potential nested type definitions in build queue
                typeDefs = typeDefs.concat.apply(typeDefs, __spreadArray([typeDef], nestedTypeDefs));
                break;
            }
            /**
             * Array or Union type
             * Branches of our GraphQL tree.
             */
            case "list": {
                var _field = field;
                var typeName = "" + parentTypeName + exports.capitalizeFirstLetter(_field.name);
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
                    var nestedTypeDefs = exports.parseCmsFields({
                        fields: [_field.field],
                        parentTypeName: parentTypeName,
                        initOptions: initOptions,
                        reporter: reporter,
                    });
                    if (parentTypeDef) {
                        // register field in the parent object type
                        parentTypeDef.config.fields = __assign(__assign({}, parentTypeDef.config.fields), (_d = {}, _d[_field.name] = {
                            type: "[" + exports.getGraphType(__assign(__assign({}, _field.field), { name: _field.name })) + "]",
                            resolve: exports.getGraphResolver(__assign(__assign({}, _field.field), { name: _field.name }), initOptions, "many"),
                            extensions: exports.getGraphExtentions(field),
                        }, _d));
                    }
                    // add potential nested type definitions in build queue
                    typeDefs = typeDefs.concat.apply(typeDefs, nestedTypeDefs);
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
                    var typeDef = {
                        kind: "OBJECT",
                        config: {
                            name: typeName,
                        },
                    };
                    // prepare potential nested type definitions
                    var nestedTypeDefs = exports.parseCmsFields({
                        fields: _field.fields,
                        parentTypeDef: typeDef,
                        parentTypeName: typeName,
                        initOptions: initOptions,
                        reporter: reporter,
                    });
                    if (parentTypeDef) {
                        // register field in the parent object type
                        parentTypeDef.config.fields = __assign(__assign({}, parentTypeDef.config.fields), (_e = {}, _e[_field.name] = {
                            type: "[" + typeName + "]",
                        }, _e));
                    }
                    // add type definition and potential nested type definitions in build queue
                    typeDefs = typeDefs.concat.apply(typeDefs, __spreadArray([typeDef], nestedTypeDefs));
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
                    var nestedTypeDefs = exports.parseCmsFields({
                        fields: _field.types,
                        parentTypeName: parentTypeName,
                        initOptions: initOptions,
                        reporter: reporter,
                    });
                    var unionTypes = _field.types.map(function (type) { return "" + parentTypeName + exports.capitalizeFirstLetter(type.name); });
                    var typeDef = {
                        kind: "UNION",
                        config: {
                            name: typeName,
                            types: unionTypes,
                            resolveType: function (value) {
                                return (value === null || value === void 0 ? void 0 : value.__typename)
                                    ? "" + parentTypeName + exports.capitalizeFirstLetter(value.__typename)
                                    : null;
                            },
                        },
                    };
                    if (parentTypeDef) {
                        // register field in the parent object type
                        parentTypeDef.config.fields = __assign(__assign({}, parentTypeDef.config.fields), (_f = {}, _f[_field.name] = {
                            type: "[" + typeName + "]",
                        }, _f));
                    }
                    // add type definition and potential nested type definitions in build queue
                    typeDefs = typeDefs.concat.apply(typeDefs, __spreadArray([typeDef], nestedTypeDefs));
                }
                break;
            }
            default: {
                reporter === null || reporter === void 0 ? void 0 : reporter.error("missing field parser for " + field.widget + " in " + parentTypeName + "." + field.name);
                break;
            }
        }
    });
    return typeDefs;
};
exports.parseCmsFields = parseCmsFields;
