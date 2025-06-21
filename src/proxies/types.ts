export type Response = {
  proxy: string;
  json: any;
};

export interface Proxy {
  resolve: (hash: string) => Promise<Response>;
  id: string;
}

export type Protocol = 'ipfs' | 'swarm';

export type ProxiesMap = Record<string, Proxy>;

export interface ResolveOptions {
  protocol: Protocol;
  hash: string;
}
