import type { AxiosInstance, AxiosStatic, InternalAxiosRequestConfig } from 'axios';
const { createCookieAgent,HttpCookieAgent,HttpsCookieAgent } = require("http-cookie-agent/http");

import type { CookieJar } from 'tough-cookie';

const httpProxyAgent = require("http-proxy-agent");
const httpsProxyAgent = require("https-proxy-agent");

const HttpProxyCookieAgent = createCookieAgent(httpProxyAgent.HttpProxyAgent);
const HttpsProxyCookieAgent = createCookieAgent(
  httpsProxyAgent.HttpsProxyAgent
);

const AGENT_CREATED_BY_AXIOS_COOKIEJAR_SUPPORT = Symbol('AGENT_CREATED_BY_AXIOS_COOKIEJAR_SUPPORT');

type AttachedAgent = {
  [AGENT_CREATED_BY_AXIOS_COOKIEJAR_SUPPORT]?: boolean;
};

declare module 'axios' {
  interface AxiosRequestConfig {
    jar?: CookieJar;
  }
}

function requestInterceptor(config: InternalAxiosRequestConfig,proxy?:any): InternalAxiosRequestConfig {
  if (!config.jar) {
    return config;
  }


  if (
    (config.httpAgent != null &&
      (config.httpAgent as AttachedAgent)[AGENT_CREATED_BY_AXIOS_COOKIEJAR_SUPPORT] !== true) ||
    (config.httpsAgent != null &&
      (config.httpsAgent as AttachedAgent)[AGENT_CREATED_BY_AXIOS_COOKIEJAR_SUPPORT] !== true)
  ) {
    throw new Error('axios-cookiejar-support does not support for use with other http(s).Agent.');
  }


  if(proxy){
    config.httpAgent= new HttpProxyCookieAgent({
      cookies: { jar : config.jar },
      hostname: proxy.host,
      port: proxy.port,
      username: proxy.username,
      password: proxy.password,
    }),
    config.httpsAgent= new HttpsProxyCookieAgent({
      cookies: { jar : config.jar },
      hostname: proxy.host,
      port: proxy.port,
      username: proxy.username,
      password: proxy.password,
    })
  } else {
    config.httpAgent = new HttpCookieAgent({ cookies: { jar: config.jar } });
    Object.defineProperty(config.httpAgent, AGENT_CREATED_BY_AXIOS_COOKIEJAR_SUPPORT, {
      configurable: false,
      enumerable: false,
      value: true,
      writable: false,
    });
  
    config.httpsAgent = new HttpsCookieAgent({ cookies: { jar: config.jar } });
    Object.defineProperty(config.httpsAgent, AGENT_CREATED_BY_AXIOS_COOKIEJAR_SUPPORT, {
      configurable: false,
      enumerable: false,
      value: true,
      writable: false,
    });
  
  }
  return config;
}

export function wrapper<T extends AxiosStatic | AxiosInstance>(axios: T,proxy?:any): T {
  const isWrapped = axios.interceptors.request.handlers.find(({ fulfilled }) => fulfilled === requestInterceptor);

  if (isWrapped) {
    return axios;
  }

  axios.interceptors.request.use((config) => {
    return requestInterceptor(config,proxy); // Gọi interceptor gốc
  });

  if ('create' in axios) {
    const create = axios.create.bind(axios);
    axios.create = (...args) => {
      const instance = create.apply(axios, args);
      instance.interceptors.request.use((config)=> requestInterceptor(config,proxy));
      return instance;
    };
  }

  return axios;
}
