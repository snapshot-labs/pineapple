export type Response = {
  proxy: string;
  json: any;
};

export interface Proxy {
  resolve: (hash: string) => Promise<Response> | Promise<Response>[];
  id: string;
}

export type Protocol = 'ipfs';

export type ProxiesMap = Record<string, Proxy>;
