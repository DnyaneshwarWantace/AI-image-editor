/*
 * Material API
 * Fetches templates, materials, fonts, and other resources
 */

import qs from 'qs';
import axios from 'axios';

import ApiClass from './apiClass';

const baseURL = process.env.NEXT_PUBLIC_MATERIAL_API || 'https://github.kuaitu.cc';

const instance = axios.create({ baseURL });

// Get website info
export const getWebInfo = () => instance.get('/api/web-site?populate=*');

// Get material types/categories
export const getMaterialTypes = () => instance.get('/api/material-types');

// Get materials list
export const getMaterials = (data: any) => instance.get('/api/materials?' + data);

// Get materials by type
export const getMaterialsByType = (data: any) =>
  instance.get('/api/materials?' + qs.stringify(data));

// Get font style types
export const getFontStyleTypes = () => instance.get('/api/font-style-types');

// Get font styles list
export const getFontStyles = (data: any) => instance.get('/api/font-styles?' + data);

// Get font styles by type
export const getFontStyleListByType = (data: any) =>
  instance.get('/api/font-styles?' + qs.stringify(data));

// Get template types
export const getTmplTypes = () => instance.get('/api/templ-types');
// Get templates list
export const getTmplList = (data: any) => instance.get('/api/templs?' + data);

// Get banners
// export const getBannerList = (data: any) => instance.get('/api/banners?' + data);

// New API Classes
// Templates API
export const templsApi = new ApiClass('/api/templs');
// Template dynamics API
export const customDynamicsApi = new ApiClass('/api/custom/dynamics');
// Template render API
export const customRenderApi = new ApiClass('/api/custom/render');
// Materials API
export const commonMaterialsApi = new ApiClass('/api/materials');
// Material types API
export const commonMaterialsTypeApi = new ApiClass('/api/material-types');
// Template types API
export const commonTmplTypeApi = new ApiClass('/api/templ-types');
// Templates API
export const commonTmplApi = new ApiClass('/api/templs');
// Font style types API
export const commonFontGroupTypeApi = new ApiClass('/api/font-style-types');
// Font styles API
export const commonFontGroupApi = new ApiClass('/api/font-styles');
// Fonts API
export const commonFontApi = new ApiClass('/api/fonts');
// Font borders API
export const commonFontStyleApi = new ApiClass('/api/fontborders');
// Canvas sizes API
export const commonSizeApi = new ApiClass('/api/sizes');
// Banners API
export const commonBannerApi = new ApiClass('/api/banners');
