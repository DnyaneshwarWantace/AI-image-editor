/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ads from "../ads.js";
import type * as banners from "../banners.js";
import type * as files from "../files.js";
import type * as fontBorders from "../fontBorders.js";
import type * as fonts from "../fonts.js";
import type * as materials from "../materials.js";
import type * as projects from "../projects.js";
import type * as sizes from "../sizes.js";
import type * as templates from "../templates.js";
import type * as textVariations from "../textVariations.js";
import type * as webSite from "../webSite.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  ads: typeof ads;
  banners: typeof banners;
  files: typeof files;
  fontBorders: typeof fontBorders;
  fonts: typeof fonts;
  materials: typeof materials;
  projects: typeof projects;
  sizes: typeof sizes;
  templates: typeof templates;
  textVariations: typeof textVariations;
  webSite: typeof webSite;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
