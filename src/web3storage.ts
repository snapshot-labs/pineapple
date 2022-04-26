import { Web3Storage, Blob, File } from 'web3.storage';
import { sha256 } from './utils';

const provider = 'web3storage';
const client = new Web3Storage({ token: process.env.WEB3STORAGE_API_TOKEN || '' });

export async function set(json) {
  const start = Date.now();
  const blob = new Blob([JSON.stringify(json)], { type: 'application/json' });
  const files = [new File([blob], sha256(JSON.stringify(json)))];
  const cid = await client.put(files);
  const ms = Date.now() - start;
  console.log(cid, provider, ms);
  return { cid, provider, ms };
}

/**
CREATE TABLE votes_copy2 (
  id VARCHAR(66) NOT NULL,
  ipfs VARCHAR(64) NOT NULL,
  voter VARCHAR(64) NOT NULL,
  created INT(11) NOT NULL,
  space VARCHAR(64) NOT NULL,
  proposal VARCHAR(66) NOT NULL,
  choice JSON NOT NULL,
  metadata JSON NOT NULL,
  vp DECIMAL(64,30) NOT NULL,
  vp_by_strategy JSON NOT NULL,
  vp_state VARCHAR(24) NOT NULL,
  cb INT(11) NOT NULL,
  PRIMARY KEY (voter, space, proposal),
  UNIQUE KEY id (id),
  INDEX ipfs (ipfs),
  INDEX voter (voter),
  INDEX created (created),
  INDEX space (space),
  INDEX proposal (proposal),
  INDEX vp (vp),
  INDEX vp_state (vp_state),
  INDEX cb (cb)
);
*/
