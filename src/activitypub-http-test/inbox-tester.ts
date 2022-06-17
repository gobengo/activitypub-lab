import * as assertModule from "assert";
import { InboxGetRequest, InboxGetResponse } from "../activitypub-inbox/inbox";

/**
 * General Purpose ActivityPub Inbox test suite.
 * The goal is to be able to use this to test ap:inbox over any number of protocols
 * because e.g. the `getInbox` method is pluggable.
 */
export class InboxTester {
    constructor(
        private assert: typeof assertModule,
        private getInbox: (req: InboxGetRequest) => Promise<InboxGetResponse>,
    ) {}
    async testGetInbox() {
        const inbox = await this.getInbox({});
        this.assert.equal(typeof inbox.totalItems, 'number');
    }
}
