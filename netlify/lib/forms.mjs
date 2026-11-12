// Store for website form submissions shown on the admin dashboard.
import { getStore } from "@netlify/blobs";
export const formsStore = (context) => getStore({ name: "forms-" + ((context && context.deploy && context.deploy.context) || "dev"), consistency: "strong" });
