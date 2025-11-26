import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api";

const CONVEX_URL = "https://valiant-axolotl-992.convex.cloud";
const convex = new ConvexHttpClient(CONVEX_URL);

async function checkTemplateJSON() {
  const templates: any[] = await convex.query(api.templates.getTemplates as any, {
    isPublic: true,
    limit: 5,
  });

  console.log(`\n📊 Found ${templates.length} templates in Convex\n`);

  for (const template of templates) {
    console.log(`\n📝 Template: ${template.name}`);
    console.log(`   Has JSON: ${template.json ? 'YES' : 'NO'}`);
    
    if (template.json) {
      const jsonStr = JSON.stringify(template.json);
      console.log(`   JSON size: ${(jsonStr.length / 1024).toFixed(1)} KB`);
      
      // Check for embedded images
      const imageMatches = jsonStr.match(/\/uploads\/[^"\\]+\.(png|jpg|jpeg|webp|svg)/gi);
      console.log(`   Embedded images: ${imageMatches ? imageMatches.length : 0}`);
      
      // Check for text objects
      const hasText = jsonStr.includes('"type":"textbox"') || jsonStr.includes('"type":"text"');
      console.log(`   Has editable text: ${hasText ? 'YES' : 'NO'}`);
      
      // Show first 200 chars of JSON
      console.log(`   JSON preview: ${jsonStr.substring(0, 200)}...`);
    }
  }
}

checkTemplateJSON().catch(console.error);
