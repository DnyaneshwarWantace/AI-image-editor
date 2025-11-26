import { ConvexHttpClient } from "convex/browser";
import axios from "axios";
import { api } from "../convex/_generated/api";

const STRAPI_URL = "https://github.kuaitu.cc";
const CONVEX_URL = "https://valiant-axolotl-992.convex.cloud";
const convex = new ConvexHttpClient(CONVEX_URL);

async function verifyFontsMigration() {
  console.log("\n>>> Verifying Fonts Migration <<<\n");
  console.log("=".repeat(60));

  try {
    // 1. Fetch fonts from Strapi
    console.log("\nFetching fonts from Strapi...");
    const strapiResponse = await axios.get(
      `${STRAPI_URL}/api/fonts?populate=*&pagination[pageSize]=100`
    );
    const strapiFonts = strapiResponse.data.data;
    console.log(`Found ${strapiFonts.length} fonts in Strapi`);

    // 2. Fetch fonts from Convex
    console.log("\nFetching fonts from Convex...");
    const convexFonts: any[] = await convex.query(api.fonts.getFonts as any, {
      limit: 10000,
    });
    console.log(`Found ${convexFonts.length} fonts in Convex\n`);

    // 3. Compare counts
    console.log("=".repeat(60));
    console.log("\nCOMPARISON SUMMARY:\n");
    console.log(`   Strapi Total: ${strapiFonts.length}`);
    console.log(`   Convex Total: ${convexFonts.length}`);
    console.log(
      `   Missing: ${Math.max(0, strapiFonts.length - convexFonts.length)}\n`
    );

    // 4. Check each font in detail
    console.log("=".repeat(60));
    console.log("\nDETAILED VERIFICATION:\n");

    const strapiMap = new Map<string, any>();
    strapiFonts.forEach((font: any) => {
      strapiMap.set(font.attributes.name || `Font ${font.id}`, font);
    });

    const convexMap = new Map<string, any>();
    convexFonts.forEach((font: any) => {
      convexMap.set(font.name, font);
    });

    let completeCount = 0;
    let missingFontFile = 0;
    let missingPreviewImage = 0;
    let notMigrated = 0;

    for (const [name] of strapiMap.entries()) {
      const convexFont = convexMap.get(name);

      if (!convexFont) {
        console.log(`[X] NOT MIGRATED: ${name}`);
        notMigrated++;
        continue;
      }

      const hasFontFile = !!convexFont.url;
      const hasPreview = !!convexFont.imageUrl;

      if (!hasFontFile && !hasPreview) {
        console.log(
          `[!] ${name}: Missing both font file and preview image`
        );
        missingFontFile++;
        missingPreviewImage++;
      } else if (!hasFontFile) {
        console.log(`[!] ${name}: Missing font file`);
        missingFontFile++;
      } else if (!hasPreview) {
        console.log(`[!] ${name}: Missing preview image`);
        missingPreviewImage++;
      } else {
        console.log(`[OK] ${name}: Complete (has font file + preview)`);
        completeCount++;
      }
    }

    // 5. Final summary
    console.log("\n" + "=".repeat(60));
    console.log("\nVERIFICATION COMPLETE!\n");
    console.log(`   [OK] Complete (with font file + preview): ${completeCount}`);
    console.log(`   [!] Missing font file: ${missingFontFile}`);
    console.log(`   [!] Missing preview image: ${missingPreviewImage}`);
    console.log(`   [X] Not migrated: ${notMigrated}`);
    console.log("\n" + "=".repeat(60));

    // 6. Check for extra fonts in Convex not in Strapi
    console.log("\nChecking for extra fonts in Convex...\n");
    let extraCount = 0;
    for (const [name] of convexMap.entries()) {
      if (!strapiMap.has(name)) {
        console.log(`   Extra in Convex: ${name}`);
        extraCount++;
      }
    }
    if (extraCount === 0) {
      console.log("   [OK] No extra fonts found");
    } else {
      console.log(`\n   Total extra: ${extraCount}`);
    }

    console.log("\n" + "=".repeat(60));
  } catch (error) {
    console.error("\n[ERROR] Verification failed:", error);
    throw error;
  }
}

verifyFontsMigration().catch(console.error);
