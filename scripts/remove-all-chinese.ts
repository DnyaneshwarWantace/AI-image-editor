import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = "https://valiant-axolotl-992.convex.cloud";
const convex = new ConvexHttpClient(CONVEX_URL);

// Extended translation for remaining Chinese
const finalTranslationMap: Record<string, string> = {
  // Food related
  "冻": "Frozen",
  "干肉": "Jerky",
  "类": "Type",
  "肉": "Meat",
  "菜": "Vegetable",
  "饭": "Rice",
  "面": "Noodles",
  "汤": "Soup",
  "茶": "Tea",
  "咖啡": "Coffee",
  "奶": "Milk",
  "糖": "Sugar",
  "盐": "Salt",
  "酱": "Sauce",
  "油": "Oil",
  "蛋": "Egg",
  "鱼": "Fish",
  "虾": "Shrimp",
  "蟹": "Crab",
  "贝": "Shell",
  "果": "Fruit",
  "豆": "Bean",
  "米": "Rice",
  "粉": "Powder",
  "饼": "Cake",
  "包": "Bun",
  "卷": "Roll",

  // Common single chars
  "个": "",
  "了": "",
  "的": "",
  "和": "",
  "与": "",
  "或": "",
  "及": "",
  "等": "",
  "呢": "",
  "吧": "",
  "啊": "",
  "哦": "",
  "呀": "",
  "嘛": "",
  "吗": "",
  "么": "",
  "着": "",
  "过": "",
  "得": "",
  "很": "",
  "太": "",
  "更": "",
  "最": "",
  "都": "",
  "也": "",
  "还": "",
  "就": "",
  "只": "",
  "再": "",
  "又": "",
  "而": "",
  "但": "",
  "可": "",
  "能": "",
  "会": "",
  "要": "",
  "想": "",
  "用": "",
  "有": "",
  "无": "",
  "多": "",
  "少": "",
  "大": "Big",
  "小": "Small",
  "长": "Long",
  "短": "Short",
  "高": "High",
  "低": "Low",
  "新": "New",
  "旧": "Old",
  "好": "Good",
  "坏": "Bad",
  "对": "Right",
  "错": "Wrong",
  "真": "Real",
  "假": "Fake",
  "美": "Beauty",
  "丑": "Ugly",
  "快": "Fast",
  "慢": "Slow",
  "早": "Early",
  "晚": "Late",
  "前": "Front",
  "后": "Back",
  "上": "Up",
  "下": "Down",
  "左": "Left",
  "右": "Right",
  "中": "Center",
  "内": "Inside",
  "外": "Outside",
  "东": "East",
  "西": "West",
  "南": "South",
  "北": "North",
};

// Remove or translate ALL Chinese characters
function removeAllChinese(text: string): string {
  if (!text || typeof text !== 'string') return text;

  // First try exact matches
  if (finalTranslationMap[text] !== undefined) {
    return finalTranslationMap[text];
  }

  // Replace mapped phrases
  let result = text;
  for (const [cn, en] of Object.entries(finalTranslationMap)) {
    if (result.includes(cn)) {
      result = result.replace(new RegExp(cn, 'g'), en);
    }
  }

  // Remove ANY remaining Chinese characters
  result = result.replace(/[\u4e00-\u9fa5]/g, '');

  // Clean up extra spaces
  result = result.replace(/\s+/g, ' ').trim();

  // If empty after removing Chinese, use placeholder
  if (!result || result.length === 0) {
    return 'Text';
  }

  return result;
}

// Recursively clean all Chinese from JSON
function cleanAllChinese(obj: any, depth = 0): any {
  if (depth > 30) return obj;

  if (typeof obj === 'string') {
    return removeAllChinese(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => cleanAllChinese(item, depth + 1));
  }

  if (obj !== null && typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      const cleanedKey = removeAllChinese(key);
      result[cleanedKey] = cleanAllChinese(obj[key], depth + 1);
    }
    return result;
  }

  return obj;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function removeAllChineseFromTemplates() {
  console.log("\\n🧹 REMOVING ALL CHINESE TEXT COMPLETELY\\n");
  console.log("=".repeat(70));

  let total = 0;
  let cleaned = 0;
  let failed = 0;

  try {
    const templates: any[] = await convex.query(api.templates.getTemplates as any, {
      isPublic: true,
      limit: 10000,
    });

    console.log(`\\n📋 Found ${templates.length} templates\\n`);

    for (const template of templates) {
      const jsonStr = JSON.stringify(template.json);
      const hasChinese = /[\u4e00-\u9fa5]/.test(jsonStr);

      if (!hasChinese) continue;

      total++;
      const chineseBefore = (jsonStr.match(/[\u4e00-\u9fa5]/g) || []).length;
      console.log(`\\n🔄 "${template.name}" (${template._id})`);
      console.log(`   📊 Chinese characters: ${chineseBefore}`);

      try {
        const cleanedJson = cleanAllChinese(template.json);
        const cleanedStr = JSON.stringify(cleanedJson);
        const chineseAfter = (cleanedStr.match(/[\u4e00-\u9fa5]/g) || []).length;

        if (chineseAfter === 0) {
          console.log(`   ✅ 100% CLEAN - All Chinese removed!`);
        } else {
          console.log(`   ⚠️  Reduced to: ${chineseAfter} chars`);
        }

        await convex.mutation(api.templates.updateTemplate as any, {
          id: template._id,
          json: cleanedJson,
        });

        cleaned++;
      } catch (error) {
        console.error(`   ❌ Failed:`, error);
        failed++;
      }

      await delay(200);
    }

    console.log("\\n" + "=".repeat(70));
    console.log("\\n📊 FINAL CLEANUP SUMMARY\\n");
    console.log(`   Total templates: ${templates.length}`);
    console.log(`   Had Chinese: ${total}`);
    console.log(`   Cleaned: ${cleaned}`);
    console.log(`   Failed: ${failed}`);
    console.log("\\n" + "=".repeat(70));

    // Verify
    console.log("\\n🔍 VERIFYING - Checking for remaining Chinese...\\n");

    const verifyTemplates: any[] = await convex.query(api.templates.getTemplates as any, {
      isPublic: true,
      limit: 10000,
    });

    let stillHaveChinese = 0;
    let totalChineseRemaining = 0;

    verifyTemplates.forEach(t => {
      const jsonStr = JSON.stringify(t.json);
      const chineseChars = (jsonStr.match(/[\u4e00-\u9fa5]/g) || []).length;
      if (chineseChars > 0) {
        stillHaveChinese++;
        totalChineseRemaining += chineseChars;
      }
    });

    console.log(`   Templates with Chinese: ${stillHaveChinese}`);
    console.log(`   Total Chinese chars left: ${totalChineseRemaining}`);

    if (stillHaveChinese === 0) {
      console.log("\\n🎉 SUCCESS! NO CHINESE TEXT REMAINING! 🎉\\n");
    } else {
      console.log(`\\n⚠️  ${stillHaveChinese} templates still have Chinese (total: ${totalChineseRemaining} chars)\\n`);
    }
  } catch (error) {
    console.error("\\n❌ Failed:", error);
    throw error;
  }
}

removeAllChineseFromTemplates().catch(console.error);
