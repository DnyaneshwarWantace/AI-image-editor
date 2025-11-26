import { ConvexHttpClient } from "convex/browser";
import axios from "axios";
import { api } from "../convex/_generated/api";
import * as fs from "fs";

const STRAPI_URL = "https://github.kuaitu.cc";
const API_URL = "https://api.kuaitu.cc";
const WEBSITE_URL = "https://www.kuaitu.cc";
const CONVEX_URL = "https://valiant-axolotl-992.convex.cloud";
const convex = new ConvexHttpClient(CONVEX_URL);

interface ComparisonReport {
  timestamp: string;
  materialTypes: {
    strapi: number;
    convex: number;
    api: number;
    missing: string[];
    status: string;
  };
  materials: {
    strapi: number;
    convex: number;
    api: number;
    missing: string[];
    status: string;
  };
  templateTypes: {
    strapi: number;
    convex: number;
    api: number;
    missing: string[];
    status: string;
  };
  templates: {
    strapi: number;
    convex: number;
    api: number;
    missing: string[];
    status: string;
  };
  fonts: {
    strapi: number;
    convex: number;
    api: number;
    missing: string[];
    status: string;
  };
  overall: {
    allInSync: boolean;
    issues: string[];
  };
}

async function fetchAllPages(url: string, itemName: string): Promise<any[]> {
  const items: any[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      const response = await axios.get(
        `${url}&pagination[page]=${page}&pagination[pageSize]=100`
      );

      if (response.data.data) {
        items.push(...response.data.data);
        const pagination = response.data.meta?.pagination;

        if (pagination) {
          hasMore = page < pagination.pageCount;
          page++;
        } else {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error(`Error fetching ${itemName} page ${page}:`, error);
      hasMore = false;
    }
  }

  return items;
}

async function compareDatabases(): Promise<ComparisonReport> {
  console.log("\n🔍 COMPREHENSIVE DATABASE COMPARISON\n");
  console.log("=".repeat(70));
  console.log(`\nComparing data from:`);
  console.log(`  - Strapi CMS: ${STRAPI_URL}`);
  console.log(`  - Convex DB: ${CONVEX_URL}`);
  console.log(`  - API: ${API_URL}`);
  console.log("\n" + "=".repeat(70));

  const report: ComparisonReport = {
    timestamp: new Date().toISOString(),
    materialTypes: { strapi: 0, convex: 0, api: 0, missing: [], status: "" },
    materials: { strapi: 0, convex: 0, api: 0, missing: [], status: "" },
    templateTypes: { strapi: 0, convex: 0, api: 0, missing: [], status: "" },
    templates: { strapi: 0, convex: 0, api: 0, missing: [], status: "" },
    fonts: { strapi: 0, convex: 0, api: 0, missing: [], status: "" },
    overall: { allInSync: true, issues: [] },
  };

  try {
    // ==================== MATERIAL TYPES ====================
    console.log("\n📦 Comparing Material Types...\n");

    const strapiMaterialTypes = await fetchAllPages(
      `${STRAPI_URL}/api/material-types?populate=*`,
      "material types"
    );
    const convexMaterialTypes: any[] = await convex.query(
      api.materials.getMaterialTypes as any
    );

    let apiMaterialTypes: any[] = [];
    try {
      const apiResponse = await axios.get(`${API_URL}/api/material-types`);
      apiMaterialTypes = apiResponse.data?.data || [];
    } catch (error) {
      console.log("   ⚠️  API material types endpoint not available");
    }

    report.materialTypes.strapi = strapiMaterialTypes.length;
    report.materialTypes.convex = convexMaterialTypes.length;
    report.materialTypes.api = apiMaterialTypes.length;

    console.log(`   Strapi: ${strapiMaterialTypes.length}`);
    console.log(`   Convex: ${convexMaterialTypes.length}`);
    console.log(`   API: ${apiMaterialTypes.length}`);

    const strapiTypeNames = new Set(
      strapiMaterialTypes.map((t) => t.attributes?.name || `Type ${t.id}`)
    );
    const convexTypeNames = new Set(convexMaterialTypes.map((t) => t.name));

    for (const name of strapiTypeNames) {
      if (!convexTypeNames.has(name)) {
        report.materialTypes.missing.push(name);
      }
    }

    report.materialTypes.status =
      report.materialTypes.missing.length === 0 ? "✅ In Sync" : "❌ Out of Sync";
    console.log(`   Status: ${report.materialTypes.status}`);

    // ==================== MATERIALS ====================
    console.log("\n🎨 Comparing Materials...\n");

    const strapiMaterials = await fetchAllPages(
      `${STRAPI_URL}/api/materials?populate=*`,
      "materials"
    );
    const convexMaterials: any[] = await convex.query(
      api.materials.getMaterials as any,
      { isPublic: true, limit: 10000 }
    );

    let apiMaterials: any[] = [];
    try {
      const apiResponse = await axios.get(`${API_URL}/api/materials`);
      apiMaterials = apiResponse.data?.data || [];
    } catch (error) {
      console.log("   ⚠️  API materials endpoint not available");
    }

    report.materials.strapi = strapiMaterials.length;
    report.materials.convex = convexMaterials.length;
    report.materials.api = apiMaterials.length;

    console.log(`   Strapi: ${strapiMaterials.length}`);
    console.log(`   Convex: ${convexMaterials.length}`);
    console.log(`   API: ${apiMaterials.length}`);

    const strapiMaterialNames = new Set(
      strapiMaterials.map((m) => m.attributes?.name || `Material ${m.id}`)
    );
    const convexMaterialNames = new Set(convexMaterials.map((m) => m.name));

    for (const name of strapiMaterialNames) {
      if (!convexMaterialNames.has(name)) {
        report.materials.missing.push(name);
      }
    }

    report.materials.status =
      report.materials.missing.length === 0 ? "✅ In Sync" : "❌ Out of Sync";
    console.log(`   Status: ${report.materials.status}`);
    console.log(`   Missing in Convex: ${report.materials.missing.length}`);

    // ==================== TEMPLATE TYPES ====================
    console.log("\n📋 Comparing Template Types...\n");

    const strapiTemplateTypes = await fetchAllPages(
      `${STRAPI_URL}/api/templ-types?populate=*`,
      "template types"
    );
    const convexTemplateTypes: any[] = await convex.query(
      api.templates.getTemplateTypes as any
    );

    let apiTemplateTypes: any[] = [];
    try {
      const apiResponse = await axios.get(`${API_URL}/api/templ-types`);
      apiTemplateTypes = apiResponse.data?.data || [];
    } catch (error) {
      console.log("   ⚠️  API template types endpoint not available");
    }

    report.templateTypes.strapi = strapiTemplateTypes.length;
    report.templateTypes.convex = convexTemplateTypes.length;
    report.templateTypes.api = apiTemplateTypes.length;

    console.log(`   Strapi: ${strapiTemplateTypes.length}`);
    console.log(`   Convex: ${convexTemplateTypes.length}`);
    console.log(`   API: ${apiTemplateTypes.length}`);

    const strapiTmplTypeNames = new Set(
      strapiTemplateTypes.map((t) => t.attributes?.name || `Type ${t.id}`)
    );
    const convexTmplTypeNames = new Set(convexTemplateTypes.map((t) => t.name));

    for (const name of strapiTmplTypeNames) {
      if (!convexTmplTypeNames.has(name)) {
        report.templateTypes.missing.push(name);
      }
    }

    report.templateTypes.status =
      report.templateTypes.missing.length === 0 ? "✅ In Sync" : "❌ Out of Sync";
    console.log(`   Status: ${report.templateTypes.status}`);

    // ==================== TEMPLATES ====================
    console.log("\n🖼️  Comparing Templates...\n");

    const strapiTemplates = await fetchAllPages(
      `${STRAPI_URL}/api/templs?populate=*`,
      "templates"
    );
    const convexTemplates: any[] = await convex.query(
      api.templates.getTemplates as any,
      { isPublic: true, limit: 10000 }
    );

    let apiTemplates: any[] = [];
    try {
      const apiResponse = await axios.get(`${API_URL}/api/templs`);
      apiTemplates = apiResponse.data?.data || [];
    } catch (error) {
      console.log("   ⚠️  API templates endpoint not available");
    }

    report.templates.strapi = strapiTemplates.length;
    report.templates.convex = convexTemplates.length;
    report.templates.api = apiTemplates.length;

    console.log(`   Strapi: ${strapiTemplates.length}`);
    console.log(`   Convex: ${convexTemplates.length}`);
    console.log(`   API: ${apiTemplates.length}`);

    const strapiTemplateNames = new Set(
      strapiTemplates.map((t) => t.attributes?.name || `Template ${t.id}`)
    );
    const convexTemplateNames = new Set(convexTemplates.map((t) => t.name));

    for (const name of strapiTemplateNames) {
      if (!convexTemplateNames.has(name)) {
        report.templates.missing.push(name);
      }
    }

    report.templates.status =
      report.templates.missing.length === 0 ? "✅ In Sync" : "❌ Out of Sync";
    console.log(`   Status: ${report.templates.status}`);
    console.log(`   Missing in Convex: ${report.templates.missing.length}`);

    // ==================== FONTS ====================
    console.log("\n🔤 Comparing Fonts...\n");

    const strapiFonts = await fetchAllPages(
      `${STRAPI_URL}/api/fonts?populate=*`,
      "fonts"
    );
    const convexFonts: any[] = await convex.query(api.fonts.getFonts as any, {
      limit: 10000,
    });

    let apiFonts: any[] = [];
    try {
      const apiResponse = await axios.get(`${API_URL}/api/fonts`);
      apiFonts = apiResponse.data?.data || [];
    } catch (error) {
      console.log("   ⚠️  API fonts endpoint not available");
    }

    report.fonts.strapi = strapiFonts.length;
    report.fonts.convex = convexFonts.length;
    report.fonts.api = apiFonts.length;

    console.log(`   Strapi: ${strapiFonts.length}`);
    console.log(`   Convex: ${convexFonts.length}`);
    console.log(`   API: ${apiFonts.length}`);

    const strapiFontNames = new Set(
      strapiFonts.map((f) => f.attributes?.name || `Font ${f.id}`)
    );
    const convexFontNames = new Set(convexFonts.map((f) => f.name));

    for (const name of strapiFontNames) {
      if (!convexFontNames.has(name)) {
        report.fonts.missing.push(name);
      }
    }

    report.fonts.status =
      report.fonts.missing.length === 0 ? "✅ In Sync" : "❌ Out of Sync";
    console.log(`   Status: ${report.fonts.status}`);
    console.log(`   Missing in Convex: ${report.fonts.missing.length}`);

    // ==================== OVERALL SUMMARY ====================
    console.log("\n" + "=".repeat(70));
    console.log("\n📊 OVERALL COMPARISON SUMMARY\n");
    console.log("=".repeat(70));

    const summaryData = [
      {
        category: "Material Types",
        strapi: report.materialTypes.strapi,
        convex: report.materialTypes.convex,
        api: report.materialTypes.api,
        missing: report.materialTypes.missing.length,
        status: report.materialTypes.status,
      },
      {
        category: "Materials",
        strapi: report.materials.strapi,
        convex: report.materials.convex,
        api: report.materials.api,
        missing: report.materials.missing.length,
        status: report.materials.status,
      },
      {
        category: "Template Types",
        strapi: report.templateTypes.strapi,
        convex: report.templateTypes.convex,
        api: report.templateTypes.api,
        missing: report.templateTypes.missing.length,
        status: report.templateTypes.status,
      },
      {
        category: "Templates",
        strapi: report.templates.strapi,
        convex: report.templates.convex,
        api: report.templates.api,
        missing: report.templates.missing.length,
        status: report.templates.status,
      },
      {
        category: "Fonts",
        strapi: report.fonts.strapi,
        convex: report.fonts.convex,
        api: report.fonts.api,
        missing: report.fonts.missing.length,
        status: report.fonts.status,
      },
    ];

    console.log("\n┌─────────────────┬────────┬────────┬─────┬─────────┬────────────────┐");
    console.log("│ Category        │ Strapi │ Convex │ API │ Missing │ Status         │");
    console.log("├─────────────────┼────────┼────────┼─────┼─────────┼────────────────┤");

    summaryData.forEach((row) => {
      const category = row.category.padEnd(15);
      const strapi = String(row.strapi).padStart(6);
      const convex = String(row.convex).padStart(6);
      const api = String(row.api).padStart(3);
      const missing = String(row.missing).padStart(7);
      const status = row.status.padEnd(14);
      console.log(
        `│ ${category} │ ${strapi} │ ${convex} │ ${api} │ ${missing} │ ${status} │`
      );
    });

    console.log("└─────────────────┴────────┴────────┴─────┴─────────┴────────────────┘");

    // Check for issues
    if (
      report.materialTypes.missing.length > 0 ||
      report.materials.missing.length > 0 ||
      report.templateTypes.missing.length > 0 ||
      report.templates.missing.length > 0 ||
      report.fonts.missing.length > 0
    ) {
      report.overall.allInSync = false;
      report.overall.issues.push("Some items are missing in Convex");
    }

    // Check for count mismatches
    if (report.materials.strapi !== report.materials.convex) {
      report.overall.issues.push(
        `Materials count mismatch: Strapi(${report.materials.strapi}) vs Convex(${report.materials.convex})`
      );
    }
    if (report.templates.strapi !== report.templates.convex) {
      report.overall.issues.push(
        `Templates count mismatch: Strapi(${report.templates.strapi}) vs Convex(${report.templates.convex})`
      );
    }

    console.log("\n" + "=".repeat(70));
    if (report.overall.allInSync && report.overall.issues.length === 0) {
      console.log("\n✅ ALL DATABASES ARE IN SYNC! 🎉\n");
    } else {
      console.log("\n⚠️  ISSUES FOUND:\n");
      report.overall.issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
      console.log("");
    }

    // Save detailed report
    fs.writeFileSync(
      "database-comparison-report.json",
      JSON.stringify(report, null, 2)
    );
    console.log("📝 Detailed report saved to: database-comparison-report.json\n");

    return report;
  } catch (error) {
    console.error("\n❌ Comparison failed:", error);
    throw error;
  }
}

compareDatabases().catch(console.error);
