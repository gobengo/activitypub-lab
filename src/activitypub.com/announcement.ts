import { DID } from "@ipld/dag-ucan/src/ucan";
import { Identifier } from "../activity/activity";

export type AnnounceActivityPubCom = {
  "@context": "https://www.w3.org/ns/activitystreams";
  id: Identifier;
  type: "Announce";
  actor: "activitypub.com";
};

// sample activity

export function createAnnounceActivityPubCom(
  id: DID = "did:key:z6Mkvy3ZJUpwtvFpkMUFi5AxJaMhc8TK8LAXTR5RdyBPHWM1"
): AnnounceActivityPubCom {
  return {
    "@context": "https://www.w3.org/ns/activitystreams" as const,
    id,
    type: "Announce" as const,
    actor: "activitypub.com" as const,
  };
}
