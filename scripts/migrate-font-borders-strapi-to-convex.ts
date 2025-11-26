import { ConvexHttpClient } from "convex/browser";
import axios from "axios";
import { api } from "../convex/_generated/api";

const STRAPI_URL = "https://github.kuaitu.cc";
const CONVEX_URL = "https://valiant-axolotl-992.convex.cloud";
const convex = new ConvexHttpClient(CONVEX_URL);

async function downloadAndUploadToConvex(
  strapiUrl: string,
  filename: string,
  contentType: string
): Promise<string | null> {
  try {
    console.log(`   📥 Downloading: ${filename}`);

    // Download from Strapi
    const response = await axios.get(strapiUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
    });

    const blob = new Blob([response.data], { type: contentType });

    // Get upload URL from Convex
    const uploadUrl = await convex.mutation(api.files.generateUploadUrl as any);

    // Upload to Convex
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: blob,
    });

    const { storageId } = await uploadResponse.json();

    // Get the Convex file URL
    const fileUrl = await convex.query(api.files.getFileUrl as any, {
      storageId,
    });

    console.log(`   ✅ Uploaded to Convex`);
    return fileUrl;
  } catch (error) {
    console.error(`   ❌ Failed to upload ${filename}:`, error);
    return null;
  }
}

async function migrateFontBorders() {
  console.log("\n🎨 Migrating Font Borders from Strapi to Convex\n");
  console.log("=".repeat(60));

  try {
    // Fetch font borders from Strapi
    console.log("\n📡 Fetching font borders from Strapi...");
    const bordersResponse = await axios.get(
      `${STRAPI_URL}/api/font-borders?populate=*&pagination[pageSize]=100`
    );

    const borders = bordersResponse.data.data;
    console.log(`✅ Found ${borders.length} font borders\n`);

    let successCount = 0;
    let failCount = 0;

    for (const item of borders) {
      const attrs = item.attributes;
      const name = attrs.name || `Border ${item.id}`;

      console.log(`\n🎨 Font Border: ${name}`);

      try {
        // Upload preview image if exists
        let previewImageUrl: string | null = null;
        if (attrs.img?.data?.attributes?.url) {
          const imageUrl = `${STRAPI_URL}${attrs.img.data.attributes.url}`;
          previewImageUrl = await downloadAndUploadToConvex(
            imageUrl,
            attrs.img.data.attributes.name,
            "image/png"
          );
        }

        // Create font border in Convex
        await convex.mutation(api.fontBorders.createFontBorder as any, {
          name: name,
          json: attrs.json,
          imageUrl: previewImageUrl,
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

migrateFontBorders().catch(console.error);
