import type { NextConfig } from "next";

const config: NextConfig = {
  // Pin the workspace root so Next does not guess from lockfiles above the repo.
  turbopack: { root: new URL("../..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1") },
};

export default config;
