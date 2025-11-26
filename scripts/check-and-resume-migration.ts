import { ConvexHttpClient } from "convex/browser";
import axios from "axios";
import { api } from "../convex/_generated/api";
import * as fs from "fs";

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

    const response = await axios.get(strapiUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
    });

    const blob = new Blob([response.data], { type: contentType });

    const uploadUrl = await convex.mutation(api.files.generateUploadUrl as any);

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: blob,
    });

    const { storageId } = await uploadResponse.json();

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

async function checkAndResumeMigration() {
  console.log("\n🔍 Checking Migration Status\n");
  console.log("=".repeat(60));

  const report: any = {
    materialTypes: { total: 0, inConvex: 0, missing: [] },
    materials: { total: 0, inConvex: 0, missing: [] },
  };

  try {
    // 1. Check Material Types
    console.log("\n📦 Checking Material Types...\n");

    // Get from Strapi
    const strapiTypesResponse = await axios.get(
      `${STRAPI_URL}/api/material-types?pagination[pageSize]=100`
    );
    const strapiTypes = strapiTypesResponse.data.data;
    report.materialTypes.total = strapiTypes.length;

    // Get from Convex
    const convexTypes: any[] = await convex.query(api.materials.getMaterialTypes as any);
    report.materialTypes.inConvex = convexTypes.length;

    const convexTypeNames = new Set(convexTypes.map((t) => t.name));

    console.log(`   Strapi has: ${strapiTypes.length} material types`);
    console.log(`   Convex has: ${convexTypes.length} material types`);

    // Find missing
    for (const strapiType of strapiTypes) {
      const name = strapiType.attributes.name || `Type ${strapiType.id}`;
      if (!convexTypeNames.has(name)) {
        report.materialTypes.missing.push({
          name,
          type: strapiType.attributes.type,
          sort: strapiType.attributes.sort || 0,
        });
      }
    }

    console.log(`   Missing: ${report.materialTypes.missing.length} material types\n`);

    // 2. Check Materials
    console.log("\n🎨 Checking Materials...\n");

    // Get all from Strapi with pagination
    let page = 1;
    let hasMore = true;
    const strapiMaterials: any[] = [];

    while (hasMore) {
      const materialsResponse = await axios.get(
        `${STRAPI_URL}/api/materials?populate=*&pagination[page]=${page}&pagination[pageSize]=25`
      );

      strapiMaterials.push(...materialsResponse.data.data);
      const pagination = materialsResponse.data.meta.pagination;

      console.log(`   Fetched page ${page}/${pagination.pageCount}...`);

      hasMore = page < pagination.pageCount;
      page++;

      if (hasMore) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    report.materials.total = strapiMaterials.length;

    // Get all from Convex
    const convexMaterials: any[] = await convex.query(api.materials.getMaterials as any, {
      isPublic: true,
    });
    report.materials.inConvex = convexMaterials.length;

    const convexMaterialNames = new Set(convexMaterials.map((m) => m.name));

    console.log(`\n   Strapi has: ${strapiMaterials.length} materials`);
    console.log(`   Convex has: ${convexMaterials.length} materials`);

    // Find missing
    for (const strapiMaterial of strapiMaterials) {
      const name = strapiMaterial.attributes.name || `Material ${strapiMaterial.id}`;
      if (!convexMaterialNames.has(name)) {
        report.materials.missing.push({
          id: strapiMaterial.id,
          name,
          strapiData: strapiMaterial,
        });
      }
    }

    console.log(`   Missing: ${report.materials.missing.length} materials\n`);

    // 3. Print Summary
    console.log("\n" + "=".repeat(60));
    console.log("\n📊 MIGRATION REPORT\n");
    console.log("Material Types:");
    console.log(`   Total in Strapi: ${report.materialTypes.total}`);
    console.log(`   Total in Convex: ${report.materialTypes.inConvex}`);
    console.log(`   Missing: ${report.materialTypes.missing.length}`);
    console.log("\nMaterials:");
    console.log(`   Total in Strapi: ${report.materials.total}`);
    console.log(`   Total in Convex: ${report.materials.inConvex}`);
    console.log(`   Missing: ${report.materials.missing.length}`);
    console.log("\n" + "=".repeat(60));

    // Save report
    fs.writeFileSync(
      "migration-report.json",
      JSON.stringify(report, null, 2)
    );
    console.log("\n✅ Report saved to migration-report.json\n");

    // 4. Ask if user wants to resume migration
    if (report.materialTypes.missing.length > 0 || report.materials.missing.length > 0) {
      console.log("🔄 Starting to add missing items...\n");
      await resumeMigration(report, convexTypes);
    } else {
      console.log("✅ No missing items. Migration is complete!\n");
    }
  } catch (error) {
    console.error("\n❌ Check failed:", error);
    throw error;
  }
}

async function resumeMigration(report: any, convexTypes: any[]) {
  console.log("\n🚀 Resuming Migration\n");
  console.log("=".repeat(60));

  let successCount = 0;
  let failCount = 0;

  // 1. Add missing material types
  if (report.materialTypes.missing.length > 0) {
    console.log("\n📦 Adding Missing Material Types...\n");

    for (const type of report.materialTypes.missing) {
      console.log(`   Adding: ${type.name}`);
      try {
        await convex.mutation(api.materials.createMaterialType as any, {
          name: type.name,
          type: type.type,
          sort: type.sort,
        });
        console.log(`   ✅ Added`);
        successCount++;
      } catch (error) {
        console.error(`   ❌ Failed:`, error);
        failCount++;
      }
    }

    // Refresh convex types for material mapping
    convexTypes = await convex.query(api.materials.getMaterialTypes as any);
  }

  // 2. Add missing materials
  if (report.materials.missing.length > 0) {
    console.log("\n🎨 Adding Missing Materials...\n");

    const typeMap = new Map<string, string>();
    convexTypes.forEach((type) => {
      typeMap.set(type.name, type._id);
    });

    for (const material of report.materials.missing) {
      console.log(`\n   🎨 Material: ${material.name}`);

      try {
        const attrs = material.strapiData.attributes;

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
        const materialData: any = {
          name: material.name,
          desc: attrs.desc,
          imageUrl: fullImageUrl,
          isPublic: true,
          sort: attrs.sort || 0,
        };

        // Only add optional fields if they have values
        if (smallImageUrl) materialData.smallUrl = smallImageUrl;
        if (thumbnailImageUrl) materialData.thumbnailUrl = thumbnailImageUrl;
        if (materialTypeId) materialData.materialTypeId = materialTypeId;

        await convex.mutation(api.materials.createMaterial as any, materialData);

        console.log(`      ✅ Created in Convex`);
        successCount++;
      } catch (error) {
        console.error(`      ❌ Failed:`, error);
        failCount++;
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n✅ Resume Migration Complete!`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Failed: ${failCount}`);
  console.log("\n" + "=".repeat(60));
}

checkAndResumeMigration().catch(console.error);
