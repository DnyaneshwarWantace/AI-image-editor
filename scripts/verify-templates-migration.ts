import { ConvexHttpClient } from "convex/browser";
import axios from "axios";
import { api } from "../convex/_generated/api";

const STRAPI_URL = "https://github.kuaitu.cc";
const CONVEX_URL = "https://valiant-axolotl-992.convex.cloud";
const convex = new ConvexHttpClient(CONVEX_URL);

async function verifyTemplatesMigration() {
  console.log("\n>>> Verifying Templates Migration <<<\n");
  console.log("=".repeat(60));

  try {
    // 1. Fetch template types from Strapi
    console.log("\nFetching template types from Strapi...");
    const strapiTypesResponse = await axios.get(
      `${STRAPI_URL}/api/templ-types?pagination[pageSize]=100`
    );
    const strapiTypes = strapiTypesResponse.data.data;
    console.log(`Found ${strapiTypes.length} template types in Strapi`);

    // 2. Fetch template types from Convex
    console.log("\nFetching template types from Convex...");
    const convexTypes: any[] = await convex.query(api.templates.getTemplateTypes as any);
    console.log(`Found ${convexTypes.length} template types in Convex\n`);

    // 3. Fetch templates from Strapi
    console.log("Fetching templates from Strapi...");
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

    console.log(`Found ${strapiTemplates.length} templates in Strapi`);

    // 4. Fetch templates from Convex
    console.log("\nFetching templates from Convex...");
    const convexTemplates: any[] = await convex.query(api.templates.getTemplates as any, {
      isPublic: true,
      limit: 10000,
    });
    console.log(`Found ${convexTemplates.length} templates in Convex\n`);

    // 5. Compare counts
    console.log("=".repeat(60));
    console.log("\nCOMPARISON SUMMARY:\n");
    console.log("Template Types:");
    console.log(`   Strapi Total: ${strapiTypes.length}`);
    console.log(`   Convex Total: ${convexTypes.length}`);
    console.log(
      `   Missing: ${Math.max(0, strapiTypes.length - convexTypes.length)}`
    );
    console.log("\nTemplates:");
    console.log(`   Strapi Total: ${strapiTemplates.length}`);
    console.log(`   Convex Total: ${convexTemplates.length}`);
    console.log(
      `   Missing: ${Math.max(0, strapiTemplates.length - convexTemplates.length)}\n`
    );

    // 6. Check each template type in detail
    console.log("=".repeat(60));
    console.log("\nDETAILED VERIFICATION - TEMPLATE TYPES:\n");

    const strapiTypeMap = new Map<string, any>();
    strapiTypes.forEach((type: any) => {
      strapiTypeMap.set(type.attributes.name || `Type ${type.id}`, type);
    });

    const convexTypeMap = new Map<string, any>();
    convexTypes.forEach((type: any) => {
      convexTypeMap.set(type.name, type);
    });

    let missingTypes = 0;
    for (const [name, strapiType] of strapiTypeMap.entries()) {
      if (convexTypeMap.has(name)) {
        console.log(`   ✅ ${name}`);
      } else {
        console.log(`   ❌ MISSING: ${name}`);
        missingTypes++;
      }
    }

    // 7. Check each template in detail
    console.log("\n" + "=".repeat(60));
    console.log("\nDETAILED VERIFICATION - TEMPLATES:\n");

    const strapiTemplateMap = new Map<string, any>();
    strapiTemplates.forEach((template: any) => {
      strapiTemplateMap.set(
        template.attributes.name || `Template ${template.id}`,
        template
      );
    });

    const convexTemplateMap = new Map<string, any>();
    convexTemplates.forEach((template: any) => {
      convexTemplateMap.set(template.name, template);
    });

    let missingTemplates = 0;
    let templatesWithIssues = 0;

    for (const [name, strapiTemplate] of strapiTemplateMap.entries()) {
      const convexTemplate = convexTemplateMap.get(name);

      if (!convexTemplate) {
        console.log(`   ❌ MISSING: ${name}`);
        missingTemplates++;
      } else {
        // Check if template has all required data
        const issues: string[] = [];

        if (!convexTemplate.json) {
          issues.push("no JSON");
        }

        if (strapiTemplate.attributes.img?.data && !convexTemplate.imageUrl) {
          issues.push("missing preview image");
        }

        if (issues.length > 0) {
          console.log(`   ⚠️  ${name} (${issues.join(", ")})`);
          templatesWithIssues++;
        } else {
          console.log(`   ✅ ${name}`);
        }
      }
    }

    // 8. Final summary
    console.log("\n" + "=".repeat(60));
    console.log("\nFINAL SUMMARY:\n");
    console.log("Template Types:");
    console.log(`   ✅ Successfully migrated: ${convexTypes.length}`);
    console.log(`   ❌ Missing: ${missingTypes}`);
    console.log("\nTemplates:");
    console.log(`   ✅ Successfully migrated: ${convexTemplates.length}`);
    console.log(`   ⚠️  With issues: ${templatesWithIssues}`);
    console.log(`   ❌ Missing: ${missingTemplates}`);
    console.log("\n" + "=".repeat(60));

    if (missingTypes === 0 && missingTemplates === 0 && templatesWithIssues === 0) {
      console.log("\n🎉 ALL TEMPLATES SUCCESSFULLY MIGRATED! 🎉\n");
    } else {
      console.log(
        `\n⚠️  Migration incomplete. Run the migration script again to add missing items.\n`
      );
    }
  } catch (error) {
    console.error("\n❌ Verification failed:", error);
    throw error;
  }
}

verifyTemplatesMigration().catch(console.error);
