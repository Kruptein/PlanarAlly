import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const envFile = resolve(import.meta.dirname, "../../client/.env.development");
const match = /^VITE_VUE_URL=(?:"([^"]+)"|'([^']+)'|([^\s#]+))/m.exec(readFileSync(envFile, "utf8"));
const url = match?.[1] ?? match?.[2] ?? match?.[3];
if (url === undefined || !/^https?:\/\//.test(url)) {
  throw new Error(`VITE_VUE_URL in ${envFile} is not an http(s) URL`);
}
writeFileSync(resolve(import.meta.dirname, "../vue-dev.json"), `${JSON.stringify({ url })}\n`);
