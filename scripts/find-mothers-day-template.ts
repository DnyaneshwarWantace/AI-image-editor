import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as fs from "fs";
import * as path from "path";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://valiant-axolotl-992.convex.cloud";
const convex = new ConvexHttpClient(CONVEX_URL);

async function findMothersDayTemplate() {
  try {
    console.log("🔍 Searching for Mother's Day template in Convex...\n");

    // Search for templates with "mother" in the name
    const allTemplates: any[] = await convex.query(api.templates.getTemplates as any, {
      isPublic: true,
      limit: 10000,
    });

    // Filter for Mother's Day templates
    const mothersDayTemplates = allTemplates.filter((t) =>
      t.name.toLowerCase().includes("mother") || 
      t.name.toLowerCase().includes("mom")
    );

    if (mothersDayTemplates.length === 0) {
      console.log("❌ No Mother's Day templates found in Convex");
      return;
    }

    console.log(`✅ Found ${mothersDayTemplates.length} Mother's Day template(s):\n`);

    for (const template of mothersDayTemplates) {
      console.log(`📝 Template: ${template.name}`);
      console.log(`   ID: ${template._id}`);
      console.log(`   Has JSON: ${template.json ? 'YES' : 'NO'}`);
      
      if (template.json) {
        const jsonStr = JSON.stringify(template.json, null, 2);
        const jsonSize = (jsonStr.length / 1024).toFixed(1);
        console.log(`   JSON size: ${jsonSize} KB`);

        // Save JSON to file
        const fileName = `mothers-day-template-${template._id}.json`;
        const filePath = path.join(process.cwd(), "scripts", fileName);
        
        fs.writeFileSync(filePath, jsonStr, "utf-8");
        console.log(`   ✅ JSON saved to: ${filePath}\n`);

        // Also log the JSON to console (first 500 chars)
        console.log("   JSON preview (first 500 chars):");
        console.log(jsonStr.substring(0, 500) + "...\n");
      } else {
        console.log("   ⚠️ Template has no JSON data\n");
      }
    }
  } catch (error) {
    console.error("❌ Error finding template:", error);
  }
}

findMothersDayTemplate().catch(console.error);




