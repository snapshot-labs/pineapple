export type ProviderType = 'image' | 'json';
export type Protocol = 'ipfs';
export type UploadData = Buffer | object;

export interface Provider {
  set: (data: UploadData) => Promise<{ cid: string; provider: string }>;
  isConfigured: () => boolean;
  id: string;
}

export type ProviderMap = Record<string, Provider>;

export interface UploadOptions {
  protocol: Protocol;
  type: ProviderType;
  params: UploadData;
  customProviderIds?: string[];
}
