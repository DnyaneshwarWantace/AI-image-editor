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
    console.log(`      📥 Downloading: ${filename}`);

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

    console.log(`      ✅ Uploaded to Convex`);
    return fileUrl;
  } catch (error) {
    console.error(`      ❌ Failed to upload ${filename}:`, error);
    return null;
  }
}

async function migrateMaterials() {
  console.log("\n🎨 Migrating Materials from Strapi to Convex\n");
  console.log("=".repeat(60));

  try {
    // 1. Fetch material types to create mapping
    console.log("\n📡 Fetching material types from Convex...");
    const convexTypes: any[] = await convex.query(api.materials.getMaterialTypes as any);

    const typeMap = new Map<string, string>();
    convexTypes.forEach((type) => {
      typeMap.set(type.name, type._id);
    });
    console.log(`✅ Found ${convexTypes.length} material types in Convex\n`);

    // 2. Fetch materials from Strapi with pagination
    console.log("📡 Fetching materials from Strapi...");
    let page = 1;
    let hasMore = true;
    let totalMaterials = 0;
    let successCount = 0;
    let failCount = 0;

    while (hasMore) {
      const materialsResponse = await axios.get(
        `${STRAPI_URL}/api/materials?populate=*&pagination[page]=${page}&pagination[pageSize]=25`
      );

      const materials = materialsResponse.data.data;
      const pagination = materialsResponse.data.meta.pagination;

      totalMaterials = pagination.total;
      console.log(`\n📄 Page ${page}/${pagination.pageCount} - Processing ${materials.length} materials...`);

      for (const item of materials) {
        const attrs = item.attributes;
        const name = attrs.name || `Material ${item.id}`;

        console.log(`\n   🎨 Material: ${name}`);

        try {
          // Upload full size image (required)
          let fullImageUrl: string | null = null;
          if (attrs.img?.data?.attributes?.url) {
            const imageUrl = `${STRAPI_URL}${attrs.img.data.attributes.url}`;
            fullImageUrl = await downloadAndUploadToConvex(
              imageUrl,
              `full_${attrs.img.data.attributes.name}`,
              attrs.img.data.attributes.mime || "image/png"
            );
          }

          if (!fullImageUrl) {
            console.log(`      ⚠️  Skipping - no image`);
            failCount++;
            continue;
          }

          // Upload small size image (optional)
          let smallImageUrl: string | null = null;
          if (attrs.img?.data?.attributes?.formats?.small?.url) {
            const imageUrl = `${STRAPI_URL}${attrs.img.data.attributes.formats.small.url}`;
            smallImageUrl = await downloadAndUploadToConvex(
              imageUrl,
              `small_${attrs.img.data.attributes.name}`,
              attrs.img.data.attributes.formats.small.mime || "image/png"
            );
          }

          // Upload thumbnail size image (optional)
          let thumbnailImageUrl: string | null = null;
          if (attrs.img?.data?.attributes?.formats?.thumbnail?.url) {
            const imageUrl = `${STRAPI_URL}${attrs.img.data.attributes.formats.thumbnail.url}`;
            thumbnailImageUrl = await downloadAndUploadToConvex(
              imageUrl,
              `thumb_${attrs.img.data.attributes.name}`,
              attrs.img.data.attributes.formats.thumbnail.mime || "image/png"
            );
          }

          // Get material type ID
          let materialTypeId: string | undefined = undefined;
          const strapiTypeName = attrs.material_type?.data?.attributes?.name;
          if (strapiTypeName && typeMap.has(strapiTypeName)) {
            materialTypeId = typeMap.get(strapiTypeName);
          }

          // Create material in Convex
          await convex.mutation(api.materials.createMaterial as any, {
            name: name,
            desc: attrs.desc,
            imageUrl: fullImageUrl,
            smallUrl: smallImageUrl,
            thumbnailUrl: thumbnailImageUrl,
            materialTypeId: materialTypeId,
            isPublic: true,
            sort: attrs.sort || 0,
          });

          console.log(`      ✅ Created in Convex`);
          successCount++;
        } catch (error) {
          console.error(`      ❌ Failed:`, error);
          failCount++;
        }
      }

      // Check if there are more pages
      hasMore = page < pagination.pageCount;
      page++;

      // Add a small delay between pages to avoid rate limiting
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log(`\n✅ Migration Complete!`);
    console.log(`   Total Materials: ${totalMaterials}`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    console.log("\n" + "=".repeat(60));
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  }
}

migrateMaterials().catch(console.error);
