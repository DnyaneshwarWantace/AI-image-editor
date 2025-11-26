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

async function migrateFonts() {
  console.log("\n=$ Migrating Fonts from Strapi to Convex\n");
  console.log("=".repeat(60));

  try {
    // 1. Fetch fonts from Strapi
    console.log("\n=á Fetching fonts from Strapi...");
    const fontsResponse = await axios.get(
      `${STRAPI_URL}/api/fonts?populate=*&pagination[pageSize]=100`
    );

    const fonts = fontsResponse.data.data;
    console.log(` Found ${fonts.length} fonts\n`);

    let successCount = 0;
    let failCount = 0;

    for (const item of fonts) {
      const attrs = item.attributes;
      const name = attrs.name || `Font ${item.id}`;

      console.log(`\n=Ý Font: ${name}`);
      console.log(`   Font Family: ${attrs.fontFamily || "N/A"}`);

      try {
        // Upload font file
        let fontFileUrl: string | null = null;
        if (attrs.file?.data?.attributes?.url) {
          const fontUrl = `${STRAPI_URL}${attrs.file.data.attributes.url}`;
          const ext = attrs.file.data.attributes.ext || ".woff2";
          const contentType =
            ext === ".woff2"
              ? "font/woff2"
              : ext === ".ttf"
              ? "font/ttf"
              : "font/woff";

          fontFileUrl = await downloadAndUploadToConvex(
            fontUrl,
            attrs.file.data.attributes.name,
            contentType
          );
        }

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

        // Create font in Convex
        await convex.mutation(api.fonts.createFont as any, {
          name: name,
          fontFamily: attrs.fontFamily || name,
          type: attrs.type || "cn",
          url: fontFileUrl,
          imageUrl: previewImageUrl,
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
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    console.log("\n" + "=".repeat(60));
  } catch (error) {
    console.error("\nL Migration failed:", error);
    throw error;
  }
}

migrateFonts().catch(console.error);
