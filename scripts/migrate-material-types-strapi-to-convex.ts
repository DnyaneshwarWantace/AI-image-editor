import { ConvexHttpClient } from "convex/browser";
import axios from "axios";
import { api } from "../convex/_generated/api";

const STRAPI_URL = "https://github.kuaitu.cc";
const CONVEX_URL = "https://valiant-axolotl-992.convex.cloud";
const convex = new ConvexHttpClient(CONVEX_URL);

async function migrateMaterialTypes() {
  console.log("\n📦 Migrating Material Types from Strapi to Convex\n");
  console.log("=".repeat(60));

  try {
    // Fetch material types from Strapi
    console.log("\n📡 Fetching material types from Strapi...");
    const typesResponse = await axios.get(
      `${STRAPI_URL}/api/material-types?pagination[pageSize]=100`
    );

    const types = typesResponse.data.data;
    console.log(`✅ Found ${types.length} material types\n`);

    let successCount = 0;
    let failCount = 0;

    for (const item of types) {
      const attrs = item.attributes;
      const name = attrs.name || `Type ${item.id}`;

      console.log(`\n📦 Material Type: ${name}`);
      console.log(`   Type: ${attrs.type || "N/A"}`);

      try {
        // Create material type in Convex
        await convex.mutation(api.materials.createMaterialType as any, {
          name: name,
          type: attrs.type,
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

migrateMaterialTypes().catch(console.error);
