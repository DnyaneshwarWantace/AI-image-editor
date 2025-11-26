import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = "https://valiant-axolotl-992.convex.cloud";
const convex = new ConvexHttpClient(CONVEX_URL);

// Translation map for font style placeholder text
const contentTranslationMap: Record<string, string> = {
  // Color names
  "渐变": "Gradient",
  "黑色": "Black",
  "蓝色": "Blue",
  "红色": "Red",
  "绿色": "Green",
  "黄色": "Yellow",
  "白色": "White",
  "灰色": "Gray",
  "橙色": "Orange",
  "紫色": "Purple",
  "粉色": "Pink",
  "棕色": "Brown",
  "金色": "Gold",
  "银色": "Silver",

  // Common text elements
  "标签": "Label",
  "标题": "Title",
  "文字": "Text",
  "副标题": "Subtitle",
  "描述": "Description",
  "内容": "Content",
  "样式": "Style",
  "字体": "Font",
  "效果": "Effect",
  "阴影": "Shadow",
  "描边": "Stroke",
  "填充": "Fill",

  // Single common characters
  "的": "",
  "了": "",
  "和": "",
  "与": "",
  "或": "",
  "个": "",
};

// Remove or translate Chinese text
function translateContent(text: string): string {
  if (!text || typeof text !== 'string') return text;

  // Check for exact match
  if (contentTranslationMap[text] !== undefined) {
    return contentTranslationMap[text];
  }

  // Replace mapped phrases
  let result = text;
  for (const [cn, en] of Object.entries(contentTranslationMap)) {
    if (result.includes(cn)) {
      result = result.replace(new RegExp(cn, 'g'), en);
    }
  }

  // Remove any remaining Chinese characters
  result = result.replace(/[\u4e00-\u9fa5]/g, '');

  // Clean up extra spaces
  result = result.replace(/\s+/g, ' ').trim();

  // If empty after removing Chinese, use placeholder
  if (!result || result.length === 0) {
    return 'Text';
  }

  return result;
}

// Recursively translate all Chinese text in JSON
function translateAllContent(obj: any, depth = 0): any {
  if (depth > 30) return obj;

  if (typeof obj === 'string') {
    return translateContent(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => translateAllContent(item, depth + 1));
  }

  if (obj !== null && typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      // Don't translate the fontFamily key - it's already been updated
      if (key === 'fontFamily') {
        result[key] = obj[key];
      } else {
        const cleanedKey = translateContent(key);
        result[cleanedKey] = translateAllContent(obj[key], depth + 1);
      }
    }
    return result;
  }

  return obj;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function translateFontStyleContent() {
  console.log("\n🌐 TRANSLATING FONT STYLE CONTENT\n");
  console.log("=".repeat(70));

  let total = 0;
  let translated = 0;
  let failed = 0;

  try {
    const fontStyles: any[] = await convex.query(api.fonts.getFontStyles as any, {
      limit: 10000,
    });

    console.log(`\n📋 Found ${fontStyles.length} font styles\n`);

    for (const style of fontStyles) {
      const jsonStr = JSON.stringify(style.json);
      const hasChinese = /[\u4e00-\u9fa5]/.test(jsonStr);

      if (!hasChinese) continue;

      total++;
      const chineseBefore = (jsonStr.match(/[\u4e00-\u9fa5]/g) || []).length;
      console.log(`\n🔄 "${style.name}" (${style._id})`);
      console.log(`   📊 Chinese characters: ${chineseBefore}`);

      try {
        const translatedJson = translateAllContent(style.json);
        const translatedStr = JSON.stringify(translatedJson);
        const chineseAfter = (translatedStr.match(/[\u4e00-\u9fa5]/g) || []).length;

        if (chineseAfter === 0) {
          console.log(`   ✅ 100% CLEAN - All Chinese removed!`);
        } else {
          console.log(`   ⚠️  Reduced to: ${chineseAfter} chars`);
        }

        await convex.mutation(api.fonts.updateFontStyle as any, {
          id: style._id,
          json: translatedJson,
        });

        translated++;
      } catch (error) {
        console.error(`   ❌ Failed:`, error);
        failed++;
      }

      await delay(200);
    }

    console.log("\n" + "=".repeat(70));
    console.log("\n📊 SUMMARY\n");
    console.log(`   Total font styles: ${fontStyles.length}`);
    console.log(`   Had Chinese content: ${total}`);
    console.log(`   Translated: ${translated}`);
    console.log(`   Failed: ${failed}`);
    console.log("\n" + "=".repeat(70));

    // Verify
    console.log("\n🔍 VERIFYING - Checking for remaining Chinese...\n");

    const verifyStyles: any[] = await convex.query(api.fonts.getFontStyles as any, {
      limit: 10000,
    });

    let stillHaveChinese = 0;
    let totalChineseRemaining = 0;

    verifyStyles.forEach(s => {
      const jsonStr = JSON.stringify(s.json);
      const chineseChars = (jsonStr.match(/[\u4e00-\u9fa5]/g) || []).length;
      if (chineseChars > 0) {
        stillHaveChinese++;
        totalChineseRemaining += chineseChars;
      }
    });

    console.log(`   Font styles with Chinese: ${stillHaveChinese}`);
    console.log(`   Total Chinese chars left: ${totalChineseRemaining}`);

    if (stillHaveChinese === 0) {
      console.log("\n🎉 SUCCESS! NO CHINESE CONTENT REMAINING! 🎉\n");
    } else {
      console.log(`\n⚠️  ${stillHaveChinese} font styles still have Chinese (total: ${totalChineseRemaining} chars)\n`);
    }
  } catch (error) {
    console.error("\n❌ Failed:", error);
    throw error;
  }
}

translateFontStyleContent().catch(console.error);
