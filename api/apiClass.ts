/*
 * API Response Formatter
 * Formats API responses from Strapi CMS
 */

import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import qs from 'qs';
import * as _ from 'lodash-es';

// Extend Axios types to include custom skipResponse property
declare module 'axios' {
  interface AxiosRequestConfig {
    skipResponse?: boolean;
  }
  interface InternalAxiosRequestConfig {
    skipResponse?: boolean;
  }
}

const baseURL = process.env.NEXT_PUBLIC_MATERIAL_API || 'https://github.kuaitu.cc';
// No auth needed - removed token functionality

const getValue = (item: any) => {
  const newData: any = {
    id: item.id,
  };

  Object.keys(item.attributes).forEach((key) => {
    const info = item.attributes[key];
    newData[key] = info;
    if (_.isObject(info)) {
      const itemId = _.get(info, 'data.id');
      const itemUrl = _.get(info, 'data.attributes.url');
      const itemImgFormats = _.get(info, 'data.attributes.formats');
      // Add id, url, and image format properties
      if (itemId) {
        newData[key + 'Id'] = itemId;
      }
      if (itemUrl) {
        newData[key + 'Url'] = baseURL + itemUrl;
      }
      if (itemImgFormats) {
        addImgFormat(newData, key, itemImgFormats);
      }
    }
  });
  return newData;
};

const addImgFormat = (data: any, key: string, item: any) => {
  Object.keys(item).forEach((imgKey) => {
    data[key + 'Url' + _.capitalize(imgKey)] = baseURL + item[imgKey].url;
  });
};

const mapValue = (arr: any) => {
  return arr.map((item: any) => getValue(item));
};

interface IPageParams {
  [key: string]: any;
  pagination?: {
    page: number;
    pageSize: number;
  };
}

export default class ServerApi {
  instance: AxiosInstance;
  apiPath: string;
  constructor(path: string, hasToken?: boolean) {
    this.apiPath = path;
    this.instance = this._initInstance(hasToken);
  }

  _initInstance(hasToken?: boolean) {
    const instance = axios.create({ baseURL });

    // Request interceptor (auth removed)
    instance.interceptors.request.use(function (config: any) {
      return config;
    });

    // Response interceptor
    instance.interceptors.response.use(function (response: AxiosResponse) {
      // console.log(, 'response');

      if (!response.config.skipResponse) {
        if (response.data?.data?.attributes) {
          response.data.data = getValue(response.data.data);
        }
        if (response.data?.data?.length) {
          response.data.data = mapValue(response.data.data);
        }
        if (response.data?.meta?.pagination) {
          response.data.pagination = response.data.meta.pagination;
          delete response.data.meta;
        }
      }
      return response.data;
    });
    return instance;
  }
  // Get by ID
  get(id: string | number, data = {}) {
    return this.instance.get(`${this.apiPath}/${id}?${qs.stringify(data)}`);
  }
  // Create
  add(data = {}) {
    return this.instance.post(this.apiPath, data);
  }
  // Delete
  del(id: string | number) {
    return this.instance.delete(`${this.apiPath}/${id}`);
  }
  // Find/List
  find(data = {} as IPageParams, pageSize?: number) {
    if (pageSize) {
      data.pagination = {
        page: 1,
        pageSize: 50,
      };
    }
    return this.instance.get(`${this.apiPath}/?${qs.stringify(data)}`);
  }
  // Update
  update(id: string, data = {}) {
    return this.instance.put(`${this.apiPath}/${id}`, data);
  }

  IGet(data = {}, skip = true) {
    return this.instance.get(`${this.apiPath}`, {
      params: data,
      skipResponse: skip,
    });
  }
  IPost(data = {}, skip = true) {
    return this.instance.post(`${this.apiPath}`, data, {
      skipResponse: skip,
    });
  }
}
