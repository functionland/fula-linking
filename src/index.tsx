import type { PeerId } from '@libp2p/interface-peer-id'


export function encodeIdentity(decodedIdentity: {
  did: string;
  peerId: PeerId;
}): Promise<string> {
  let encodedIdentity = JSON.stringify({
    did: decodedIdentity.did,
    peerId: decodedIdentity.peerId,
  });
  return Promise.resolve(encodedIdentity);
}

export function decodeIdentity(
  encodedIdentity: string
): Promise<{ did: string; peerId: PeerId } | string> {
  try {
    let decodedIdentity = JSON.parse(encodedIdentity);
    return Promise.resolve(decodedIdentity);
  } catch (e) {
    let error = '';
    if (e instanceof Error) {
      error = e.message;
    } else {
      error = String(e);
    }
    Promise.reject(error);
  }
  return Promise.resolve('');
}
