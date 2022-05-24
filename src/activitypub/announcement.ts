import { DID } from "@ipld/dag-ucan/src/ucan";

export type AnnounceActivityPubCom = {
  "@context": "https://www.w3.org/ns/activitystreams";
  id: string;
  type: "Announce";
  actor: "activitypub.com";
};

// sample activity

export function createAnnounceActivityPubCom(
  id: DID = "did:key:z6Mkvy3ZJUpwtvFpkMUFi5AxJaMhc8TK8LAXTR5RdyBPHWM1"
): AnnounceActivityPubCom {
  return {
    "@context": "https://www.w3.org/ns/activitystreams",
    id,
    type: "Announce",
    actor: "activitypub.com",
  };
}
