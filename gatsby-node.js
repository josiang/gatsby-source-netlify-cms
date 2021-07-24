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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
exports.createPages = exports.onCreateNode = exports.createSchemaCustomization = void 0;
var fs_1 = __importDefault(require("fs"));
var gray_matter_1 = __importDefault(require("gray-matter"));
var path_1 = __importDefault(require("path"));
var slugify_1 = __importDefault(require("slugify"));
var helpers_1 = require("./helpers");
var loadNodeContent = function (fileSystemNode) {
    return fs_1.default.readFileSync(fileSystemNode.absolutePath, "utf-8");
};
var createSchemaCustomization = function (_a, pluginOptions) {
    var actions = _a.actions, schema = _a.schema, reporter = _a.reporter;
    var createTypes = actions.createTypes;
    var initOptions = pluginOptions.initOptions;
    var typeDefs = [];
    initOptions.config.collections.forEach(function (collection) {
        var fields = [];
        if (collection.fields) {
            fields = fields.concat.apply(fields, collection.fields);
        }
        if (collection.files) {
            collection.files.forEach(function (file) {
                fields = fields.concat.apply(fields, file.fields);
            });
        }
        var typeDef = {
            kind: "OBJECT",
            config: {
                name: helpers_1.capitalizeFirstLetter(collection.name),
                extensions: {
                    infer: false,
                },
                interfaces: ["Node"],
            },
        };
        typeDefs = typeDefs.concat.apply(typeDefs, __spreadArray([typeDef], helpers_1.parseCmsFields({
            fields: fields,
            parentTypeDef: typeDef,
            parentTypeName: "",
            initOptions: initOptions,
            reporter: reporter,
        })));
    });
    createTypes(typeDefs.map(function (typeDef) {
        if (typeDef.kind === "UNION") {
            reporter.info("building UnionType " + typeDef.config.name);
            return schema.buildUnionType(typeDef.config);
        }
        reporter.info("building ObjectType " + typeDef.config.name);
        return schema.buildObjectType(typeDef.config);
    }));
};
exports.createSchemaCustomization = createSchemaCustomization;
var onCreateNode = function (_a) {
    var _b, _c, _d, _e;
    var node = _a.node, actions = _a.actions, createContentDigest = _a.createContentDigest, getNode = _a.getNode;
    if (((_b = node.internal) === null || _b === void 0 ? void 0 : _b.mediaType) === "text/markdown") {
        var content = loadNodeContent(node);
        var fields = gray_matter_1.default(content).data;
        var type = helpers_1.capitalizeFirstLetter(node.sourceInstanceName);
        var identifier = (fields === null || fields === void 0 ? void 0 : fields.id) || type + "-" + String(node.id);
        var nodePath = undefined;
        if ("path" in fields) {
            var pathParts = [];
            // TODO type this
            // @ts-ignore
            var parentPagePath = (_e = (_d = (_c = getNode("settings-general")) === null || _c === void 0 ? void 0 : _c.parentPages) === null || _d === void 0 ? void 0 : _d.find(function (relation) {
                return ((relation === null || relation === void 0 ? void 0 : relation.collection) ===
                    helpers_1.lowercaseFirstLetter(node.sourceInstanceName));
            })) === null || _e === void 0 ? void 0 : _e.path;
            if (parentPagePath) {
                pathParts.push(parentPagePath);
            }
            pathParts.push(fields.path);
            nodePath = "/" + pathParts
                .map(function (part) { return slugify_1.default(part, { lower: true }); })
                .join("/");
        }
        var newNode = __assign(__assign({}, fields), { id: identifier, path: nodePath, parent: node.id, children: [], internal: {
                type: type,
                owner: "",
                content: JSON.stringify(fields),
                contentDigest: createContentDigest(fields || {}),
            } });
        actions.createNode(newNode);
        actions.createParentChildLink({ parent: node, child: newNode });
    }
};
exports.onCreateNode = onCreateNode;
var createPages = function (_a, pluginOptions) {
    var actions = _a.actions, graphql = _a.graphql, getNode = _a.getNode;
    return __awaiter(void 0, void 0, void 0, function () {
        var createPage, initOptions, collections, data;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    createPage = actions.createPage;
                    initOptions = pluginOptions.initOptions;
                    collections = initOptions.config.collections
                        .filter(function (collection) { return collection.create; })
                        .map(function (collection) { return collection.name; });
                    return [4 /*yield*/, graphql("\n      query AllPages($collections: [String]) {\n        allFile(filter: { sourceInstanceName: { in: $collections } }) {\n          nodes {\n            children {\n              __typename\n              id\n            }\n          }\n        }\n      }\n    ", { collections: collections })];
                case 1:
                    data = (_b.sent()).data;
                    data === null || data === void 0 ? void 0 : data.allFile.nodes.forEach(function (file) {
                        var _a;
                        var child = (_a = file.children) === null || _a === void 0 ? void 0 : _a[0];
                        var type = child.__typename;
                        var component = path_1.default.resolve("./src/templates/" + type + "/index.tsx");
                        if (fs_1.default.existsSync(component)) {
                            var pageId = child.id;
                            var node = getNode(pageId);
                            var path_2 = String(node.path);
                            createPage({
                                path: path_2,
                                component: component,
                                context: {
                                    pageId: pageId,
                                },
                            });
                        }
                    });
                    return [2 /*return*/];
            }
        });
    });
};
exports.createPages = createPages;
