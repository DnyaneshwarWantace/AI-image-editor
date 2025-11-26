import { ConvexHttpClient } from "convex/browser";
import axios from "axios";
import { api } from "../convex/_generated/api";
import * as fs from "fs";

const STRAPI_URL = "https://github.kuaitu.cc";
const CONVEX_URL = "https://valiant-axolotl-992.convex.cloud";
const convex = new ConvexHttpClient(CONVEX_URL);

// Cache for migrated images to avoid re-uploading
const imageUrlCache = new Map<string, string>();

async function downloadAndUploadToConvex(
  strapiUrl: string,
  filename: string,
  contentType: string
): Promise<string | null> {
  // Check cache first
  if (imageUrlCache.has(strapiUrl)) {
    console.log(`      ♻️  Using cached: ${filename}`);
    return imageUrlCache.get(strapiUrl)!;
  }

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

    // Cache the result
    imageUrlCache.set(strapiUrl, fileUrl);

    console.log(`      ✅ Uploaded to Convex`);
    return fileUrl;
  } catch (error) {
    console.error(`      ❌ Failed to upload ${filename}:`, error);
    return null;
  }
}

// Recursively find and replace Strapi URLs in JSON with Convex URLs
async function migrateUrlsInJson(obj: any): Promise<any> {
  if (typeof obj === "string") {
    // Check if it's a Strapi URL
    if (obj.includes(STRAPI_URL) || obj.startsWith("/uploads/")) {
      const fullUrl = obj.startsWith("/uploads/") ? `${STRAPI_URL}${obj}` : obj;

      // Extract filename for logging
      const filename = fullUrl.split("/").pop() || "unknown";

      // Determine content type
      let contentType = "image/png";
      if (obj.includes(".jpg") || obj.includes(".jpeg")) contentType = "image/jpeg";
      if (obj.includes(".svg")) contentType = "image/svg+xml";
      if (obj.includes(".webp")) contentType = "image/webp";

      const convexUrl = await downloadAndUploadToConvex(fullUrl, filename, contentType);
      return convexUrl || obj; // Return original if upload failed
    }
    return obj;
  } else if (Array.isArray(obj)) {
    return await Promise.all(obj.map((item) => migrateUrlsInJson(item)));
  } else if (obj !== null && typeof obj === "object") {
    const result: any = {};
    for (const key in obj) {
      result[key] = await migrateUrlsInJson(obj[key]);
    }
    return result;
  }
  return obj;
}

async function checkAndMigrateTemplates() {
  console.log("\n🔍 Checking Template Migration Status\n");
  console.log("=".repeat(60));

  const report: any = {
    templateTypes: { total: 0, inConvex: 0, missing: [] },
    templates: { total: 0, inConvex: 0, missing: [] },
  };

  try {
    // 1. Check Template Types
    console.log("\n📦 Checking Template Types...\n");

    const strapiTypesResponse = await axios.get(
      `${STRAPI_URL}/api/templ-types?pagination[pageSize]=100`
    );
    const strapiTypes = strapiTypesResponse.data.data;
    report.templateTypes.total = strapiTypes.length;

    const convexTypes: any[] = await convex.query(api.templates.getTemplateTypes as any);
    report.templateTypes.inConvex = convexTypes.length;

    const convexTypeNames = new Set(convexTypes.map((t) => t.name));

    console.log(`   Strapi has: ${strapiTypes.length} template types`);
    console.log(`   Convex has: ${convexTypes.length} template types`);

    // Find missing
    for (const strapiType of strapiTypes) {
      const name = strapiType.attributes.name || `Type ${strapiType.id}`;
      if (!convexTypeNames.has(name)) {
        report.templateTypes.missing.push({
          name,
          sort: strapiType.attributes.sort || 0,
        });
      }
    }

    console.log(`   Missing: ${report.templateTypes.missing.length} template types\n`);

    // 2. Check Templates
    console.log("\n🎨 Checking Templates...\n");

    let page = 1;
    let hasMore = true;
    const strapiTemplates: any[] = [];

    while (hasMore) {
      const templatesResponse = await axios.get(
        `${STRAPI_URL}/api/templs?populate=*&pagination[page]=${page}&pagination[pageSize]=25`
      );

      strapiTemplates.push(...templatesResponse.data.data);
      const pagination = templatesResponse.data.meta.pagination;

      console.log(`   Fetched page ${page}/${pagination.pageCount}...`);

      hasMore = page < pagination.pageCount;
      page++;

      if (hasMore) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    report.templates.total = strapiTemplates.length;

    const convexTemplates: any[] = await convex.query(api.templates.getTemplates as any, {
      isPublic: true,
    });
    report.templates.inConvex = convexTemplates.length;

    const convexTemplateNames = new Set(convexTemplates.map((t) => t.name));

    console.log(`\n   Strapi has: ${strapiTemplates.length} templates`);
    console.log(`   Convex has: ${convexTemplates.length} templates`);

    // Find missing
    for (const strapiTemplate of strapiTemplates) {
      const name = strapiTemplate.attributes.name || `Template ${strapiTemplate.id}`;
      if (!convexTemplateNames.has(name)) {
        report.templates.missing.push({
          id: strapiTemplate.id,
          name,
          strapiData: strapiTemplate,
        });
      }
    }

    console.log(`   Missing: ${report.templates.missing.length} templates\n`);

    // 3. Print Summary
    console.log("\n" + "=".repeat(60));
    console.log("\n📊 MIGRATION REPORT\n");
    console.log("Template Types:");
    console.log(`   Total in Strapi: ${report.templateTypes.total}`);
    console.log(`   Total in Convex: ${report.templateTypes.inConvex}`);
    console.log(`   Missing: ${report.templateTypes.missing.length}`);
    console.log("\nTemplates:");
    console.log(`   Total in Strapi: ${report.templates.total}`);
    console.log(`   Total in Convex: ${report.templates.inConvex}`);
    console.log(`   Missing: ${report.templates.missing.length}`);
    console.log("\n" + "=".repeat(60));

    // Save report
    fs.writeFileSync(
      "template-migration-report.json",
      JSON.stringify(report, null, 2)
    );
    console.log("\n✅ Report saved to template-migration-report.json\n");

    // 4. Migrate missing items
    if (report.templateTypes.missing.length > 0 || report.templates.missing.length > 0) {
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
  console.log("\n🚀 Resuming Template Migration\n");
  console.log("=".repeat(60));

  let successCount = 0;
  let failCount = 0;

  // 1. Add missing template types
  if (report.templateTypes.missing.length > 0) {
    console.log("\n📦 Adding Missing Template Types...\n");

    for (const type of report.templateTypes.missing) {
      console.log(`   Adding: ${type.name}`);
      try {
        await convex.mutation(api.templates.createTemplateType as any, {
          name: type.name,
          sort: type.sort,
        });
        console.log(`   ✅ Added`);
        successCount++;
      } catch (error) {
        console.error(`   ❌ Failed:`, error);
        failCount++;
      }
    }

    // Refresh convex types for template mapping
    convexTypes = await convex.query(api.templates.getTemplateTypes as any);
  }

  // 2. Add missing templates
  if (report.templates.missing.length > 0) {
    console.log("\n🎨 Adding Missing Templates...\n");

    const typeMap = new Map<string, string>();
    convexTypes.forEach((type) => {
      typeMap.set(type.name, type._id);
    });

    for (const template of report.templates.missing) {
      console.log(`\n   🎨 Template: ${template.name}`);

      try {
        const attrs = template.strapiData.attributes;

        // 1. Migrate preview image
        let imageUrl: string | undefined = undefined;
        if (attrs.img?.data?.attributes?.url) {
          const strapiImageUrl = `${STRAPI_URL}${attrs.img.data.attributes.url}`;
          imageUrl = await downloadAndUploadToConvex(
            strapiImageUrl,
            `template_${attrs.img.data.attributes.name}`,
            attrs.img.data.attributes.mime || "image/png"
          ) || undefined;
        }

        // 2. Migrate URLs in template JSON
        console.log(`      🔄 Processing template JSON...`);
        let migratedJson = attrs.json;
        if (attrs.json) {
          migratedJson = await migrateUrlsInJson(attrs.json);
        }

        // 3. Migrate pro images if they exist
        let proImages = attrs.proImages;
        if (proImages) {
          console.log(`      🔄 Processing pro images...`);
          proImages = await migrateUrlsInJson(proImages);
        }

        // 4. Get template type ID
        let templateTypeId: string | undefined = undefined;
        const strapiTypeName = attrs.templ_type?.data?.attributes?.name || attrs.template_type?.data?.attributes?.name;
        if (strapiTypeName && typeMap.has(strapiTypeName)) {
          templateTypeId = typeMap.get(strapiTypeName);
        }

        // 5. Create template in Convex
        const templateData: any = {
          name: template.name,
          json: migratedJson,
          isPublic: true,
        };

        // Add optional fields only if they have values
        if (attrs.desc) templateData.desc = attrs.desc;
        if (imageUrl) templateData.imageUrl = imageUrl;
        if (templateTypeId) templateData.templateTypeId = templateTypeId;
        if (attrs.width) templateData.width = attrs.width;
        if (attrs.height) templateData.height = attrs.height;
        if (attrs.price) templateData.price = attrs.price;
        if (attrs.proInfo) templateData.proInfo = attrs.proInfo;
        if (proImages) templateData.proImages = proImages;
        if (attrs.sort !== undefined) templateData.sort = attrs.sort;

        await convex.mutation(api.templates.createTemplate as any, templateData);

        console.log(`      ✅ Created in Convex`);
        successCount++;

        // Clear cache periodically to prevent memory issues
        if (successCount % 10 === 0) {
          console.log(`      🧹 Clearing image cache (${imageUrlCache.size} entries)`);
          imageUrlCache.clear();
        }

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

checkAndMigrateTemplates().catch(console.error);
