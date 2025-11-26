import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = "https://valiant-axolotl-992.convex.cloud";
const convex = new ConvexHttpClient(CONVEX_URL);

async function check() {
  const types: any[] = await convex.query(api.templates.getTemplateTypes as any);
  const templates: any[] = await convex.query(api.templates.getTemplates as any, { isPublic: true });
  
  console.log(`\nTemplate Types in Convex: ${types.length}`);
  console.log(`Templates in Convex: ${templates.length}\n`);
  
  if (types.length > 0) {
    console.log("Template Types:");
    types.forEach(t => console.log(`  - ${t.name}`));
  }
}

check().catch(console.error);
