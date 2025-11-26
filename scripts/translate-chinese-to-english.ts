import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import axios from "axios";

const CONVEX_URL = "https://valiant-axolotl-992.convex.cloud";
const convex = new ConvexHttpClient(CONVEX_URL);

// Free translation API
async function translateText(text: string): Promise<string> {
  try {
    // Check if text contains Chinese characters
    const hasChinese = /[\u4e00-\u9fa5]/.test(text);
    if (!hasChinese) {
      return text; // Already in English or no Chinese
    }

    // Use LibreTranslate API (free, open-source)
    const response = await axios.post(
      "https://libretranslate.com/translate",
      {
        q: text,
        source: "zh",
        target: "en",
        format: "text",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.translatedText || text;
  } catch (error) {
    console.error(`   ⚠️  Translation failed for "${text}":`, error);
    return text; // Return original if translation fails
  }
}

// Add delay to avoid rate limiting
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function translateAllNames() {
  console.log("\n🌐 TRANSLATING ALL CHINESE NAMES TO ENGLISH\n");
  console.log("=".repeat(70));

  let totalTranslated = 0;
  let totalFailed = 0;

  try {
    // ==================== TRANSLATE MATERIAL TYPES ====================
    console.log("\n📦 Translating Material Types...\n");

    const materialTypes: any[] = await convex.query(
      api.materials.getMaterialTypes as any
    );

    for (const type of materialTypes) {
      if (/[\u4e00-\u9fa5]/.test(type.name)) {
        console.log(`   🔄 "${type.name}" -> `, { end: "" });

        const englishName = await translateText(type.name);
        console.log(`"${englishName}"`);

        try {
          // Update in Convex (you'll need to create this mutation)
          // For now, just log what would be updated
          console.log(`      ✅ Would update to: "${englishName}"`);
          totalTranslated++;
        } catch (error) {
          console.error(`      ❌ Failed to update`);
          totalFailed++;
        }

        await delay(1000); // Avoid rate limiting
      } else {
        console.log(`   ✅ "${type.name}" (already in English)`);
      }
    }

    // ==================== TRANSLATE MATERIALS ====================
    console.log("\n🎨 Translating Materials...\n");

    const materials: any[] = await convex.query(
      api.materials.getMaterials as any,
      { isPublic: true, limit: 10000 }
    );

    let materialCount = 0;
    for (const material of materials) {
      if (/[\u4e00-\u9fa5]/.test(material.name)) {
        console.log(`   🔄 "${material.name}" -> `, { end: "" });

        const englishName = await translateText(material.name);
        console.log(`"${englishName}"`);

        console.log(`      ✅ Would update to: "${englishName}"`);
        totalTranslated++;
        materialCount++;

        await delay(1000);

        // Stop after a few to avoid overwhelming the free API
        if (materialCount >= 5) {
          console.log(
            `\n   ⚠️  Pausing material translation (processed ${materialCount} samples)`
          );
          console.log(
            `   💡 Total materials with Chinese names: ${
              materials.filter((m) => /[\u4e00-\u9fa5]/.test(m.name)).length
            }`
          );
          break;
        }
      }
    }

    // ==================== TRANSLATE TEMPLATE TYPES ====================
    console.log("\n📋 Translating Template Types...\n");

    const templateTypes: any[] = await convex.query(
      api.templates.getTemplateTypes as any
    );

    for (const type of templateTypes) {
      if (/[\u4e00-\u9fa5]/.test(type.name)) {
        console.log(`   🔄 "${type.name}" -> `, { end: "" });

        const englishName = await translateText(type.name);
        console.log(`"${englishName}"`);

        console.log(`      ✅ Would update to: "${englishName}"`);
        totalTranslated++;

        await delay(1000);
      } else {
        console.log(`   ✅ "${type.name}" (already in English)`);
      }
    }

    // ==================== TRANSLATE TEMPLATES ====================
    console.log("\n🖼️  Translating Templates...\n");

    const templates: any[] = await convex.query(
      api.templates.getTemplates as any,
      { isPublic: true, limit: 10000 }
    );

    let templateCount = 0;
    for (const template of templates) {
      if (/[\u4e00-\u9fa5]/.test(template.name)) {
        console.log(`   🔄 "${template.name}" -> `, { end: "" });

        const englishName = await translateText(template.name);
        console.log(`"${englishName}"`);

        console.log(`      ✅ Would update to: "${englishName}"`);
        totalTranslated++;
        templateCount++;

        await delay(1000);

        if (templateCount >= 10) {
          console.log(
            `\n   ⚠️  Pausing template translation (processed ${templateCount} samples)`
          );
          console.log(
            `   💡 Total templates with Chinese names: ${
              templates.filter((t) => /[\u4e00-\u9fa5]/.test(t.name)).length
            }`
          );
          break;
        }
      }
    }

    // ==================== TRANSLATE FONTS ====================
    console.log("\n🔤 Translating Fonts...\n");

    const fonts: any[] = await convex.query(api.fonts.getFonts as any, {
      limit: 10000,
    });

    for (const font of fonts) {
      if (/[\u4e00-\u9fa5]/.test(font.name)) {
        console.log(`   🔄 "${font.name}" -> `, { end: "" });

        const englishName = await translateText(font.name);
        console.log(`"${englishName}"`);

        console.log(`      ✅ Would update to: "${englishName}"`);
        totalTranslated++;

        await delay(1000);
      } else {
        console.log(`   ✅ "${font.name}" (already in English)`);
      }
    }

    // ==================== SUMMARY ====================
    console.log("\n" + "=".repeat(70));
    console.log("\n📊 TRANSLATION SUMMARY\n");
    console.log(`   ✅ Successfully translated: ${totalTranslated}`);
    console.log(`   ❌ Failed: ${totalFailed}`);
    console.log("\n" + "=".repeat(70));

    console.log("\n⚠️  NOTE: This was a DRY RUN - no changes were made to the database");
    console.log(
      "To actually update the database, we need to create update mutations first.\n"
    );
  } catch (error) {
    console.error("\n❌ Translation failed:", error);
    throw error;
  }
}

translateAllNames().catch(console.error);
