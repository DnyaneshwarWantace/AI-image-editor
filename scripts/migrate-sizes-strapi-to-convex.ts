import { ConvexHttpClient } from "convex/browser";
import axios from "axios";
import { api } from "../convex/_generated/api";

const STRAPI_URL = "https://github.kuaitu.cc";
const CONVEX_URL = "https://valiant-axolotl-992.convex.cloud";
const convex = new ConvexHttpClient(CONVEX_URL);

async function migrateSizes() {
  console.log("\n📐 Migrating Canvas Sizes from Strapi to Convex\n");
  console.log("=".repeat(60));

  try {
    // 1. Fetch canvas sizes from Strapi
    console.log("\n📡 Fetching canvas sizes from Strapi...");
    const sizesResponse = await axios.get(
      `${STRAPI_URL}/api/sizes?pagination[pageSize]=100`
    );

    const sizes = sizesResponse.data.data;
    console.log(`✅ Found ${sizes.length} canvas sizes\n`);

    let successCount = 0;
    let failCount = 0;

    for (const item of sizes) {
      const attrs = item.attributes;
      const name = attrs.name || `Size ${item.id}`;

      console.log(`\n📐 Canvas Size: ${name}`);
      console.log(`   Dimensions: ${attrs.width}x${attrs.height}${attrs.unit || 'px'}`);

      try {
        // Create canvas size in Convex
        await convex.mutation(api.sizes.createSize as any, {
          name: name,
          width: Number(attrs.width),
          height: Number(attrs.height),
          unit: attrs.unit || "px",
          sort: attrs.sort || 0,
        });

        console.log(`   ✅ Created in Convex`);
        successCount++;
      } catch (error) {
        console.error(`   ❌ Failed:`, error);
        failCount++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log(`\n✅ Migration Complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    console.log("\n" + "=".repeat(60));
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  }
}

migrateSizes().catch(console.error);
