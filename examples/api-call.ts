// Example: Calling the GHL API from a Node.js script
// This mirrors what the GHL API Explorer does internally.

import { executeGhlRequest } from "../src/lib/ghl-client";

async function main() {
  const result = await executeGhlRequest({
    method: "GET",
    endpoint: "/contacts",
    accessToken: process.env.GHL_ACCESS_TOKEN || "demo-token",
    apiVersion: "2021-07-07",
    queryParams: { limit: "10" },
    // simulate: true forces demo responses without network calls
    simulate: !process.env.GHL_ACCESS_TOKEN,
  });

  console.log("Status:", result.statusCode);
  console.log("Duration:", result.durationMs, "ms");
  console.log("Simulated:", result.simulated);
  console.log("Body:", result.body);
}

main().catch(console.error);
