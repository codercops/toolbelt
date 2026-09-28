import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

// Every page renders per request (the CSP nonce comes from the request), and
// the GitHub star count in the header and footer is a fetch with an hour's
// revalidate. That fetch cache lives in R2 so GitHub is called once an hour
// rather than on every page view, and the Durable Object queue refreshes it in
// the background. Nothing calls revalidateTag, so no tag cache is needed.
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: doQueue,
  // Off because of opennextjs-cloudflare#1334 (fix pending in #1348): with
  // interception on, Next.js 16.3's segment prefetches for prerendered pages
  // get the full page back, and the router re-requests them endlessly (signal's
  // home page: about 15 requests a second per open tab). Pages still come from
  // the cache, through the Next.js handler. Turn it back on once #1348 ships.
  enableCacheInterception: false,
});
