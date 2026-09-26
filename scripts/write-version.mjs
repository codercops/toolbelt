// Writes public/version.txt with the commit being built. The release smoke
// test polls it to know the new deploy is live before checking the site.
// Workers Builds sets WORKERS_CI_COMMIT_SHA; local builds write "dev".
import { writeFileSync } from 'node:fs';

writeFileSync('public/version.txt', `${process.env.WORKERS_CI_COMMIT_SHA || 'dev'}\n`);
