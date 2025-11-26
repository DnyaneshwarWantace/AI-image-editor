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
    console.log(`   =å Downloading: ${filename}`);

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

    console.log(`    Uploaded to Convex`);
    return fileUrl;
  } catch (error) {
    console.error(`   L Failed to upload ${filename}:`, error);
    return null;
  }
}

async function migrateFontStyles() {
  console.log("\n<¨ Migrating Font Styles from Strapi to Convex\n");
  console.log("=".repeat(60));

  try {
    // 1. Migrate Font Style Types first
    console.log("\n=á Fetching font style types from Strapi...");
    const typesResponse = await axios.get(
      `${STRAPI_URL}/api/font-style-types?pagination[pageSize]=100`
    );

    const types = typesResponse.data.data;
    console.log(` Found ${types.length} font style types\n`);

    const typeMap = new Map<number, string>(); // Strapi ID -> Convex ID

    for (const item of types) {
      const attrs = item.attributes;
      const name = attrs.name || `Type ${item.id}`;

      console.log(`=Â Font Style Type: ${name}`);

      try {
        const convexId = await convex.mutation(
          api.fonts.createFontStyleType as any,
          {
            name: name,
            sort: attrs.sort || 0,
          }
        );

        typeMap.set(item.id, convexId);
        console.log(`    Created in Convex`);
      } catch (error) {
        console.error(`   L Failed:`, error);
      }
    }

    // 2. Migrate Font Styles
    console.log("\n" + "=".repeat(60));
    console.log("\n=á Fetching font styles from Strapi...");
    const stylesResponse = await axios.get(
      `${STRAPI_URL}/api/font-styles?populate=*&pagination[pageSize]=100`
    );

    const styles = stylesResponse.data.data;
    console.log(` Found ${styles.length} font styles\n`);

    let successCount = 0;
    let failCount = 0;

    for (const item of styles) {
      const attrs = item.attributes;
      const name = attrs.name || `Style ${item.id}`;

      console.log(`\n=Ý Font Style: ${name}`);

      try {
        // Upload preview image
        let previewImageUrl: string | null = null;
        if (attrs.img?.data?.attributes?.url) {
          const imageUrl = `${STRAPI_URL}${attrs.img.data.attributes.url}`;
          previewImageUrl = await downloadAndUploadToConvex(
            imageUrl,
            attrs.img.data.attributes.name,
            "image/png"
          );
        }

        // Get font style type ID
        let fontStyleTypeId: string | undefined = undefined;
        const strapiTypeId = attrs.font_style_type?.data?.id;
        if (strapiTypeId && typeMap.has(strapiTypeId)) {
          fontStyleTypeId = typeMap.get(strapiTypeId);
        }

        // Create font style in Convex
        await convex.mutation(api.fonts.createFontStyle as any, {
          name: name,
          desc: attrs.desc,
          json: attrs.json,
          imageUrl: previewImageUrl,
          fontStyleTypeId: fontStyleTypeId,
          sort: attrs.sort || 0,
        });

        console.log(`    Created in Convex`);
        successCount++;
      } catch (error) {
        console.error(`   L Failed:`, error);
        failCount++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log(`\n Migration Complete!`);
    console.log(`   Font Style Types: ${typeMap.size}`);
    console.log(`   Font Styles Success: ${successCount}`);
    console.log(`   Font Styles Failed: ${failCount}`);
    console.log("\n" + "=".repeat(60));
  } catch (error) {
    console.error("\nL Migration failed:", error);
    throw error;
  }
}

migrateFontStyles().catch(console.error);
