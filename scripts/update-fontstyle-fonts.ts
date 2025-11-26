import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = "https://valiant-axolotl-992.convex.cloud";
const convex = new ConvexHttpClient(CONVEX_URL);

// Map Chinese font names to English equivalents
const fontMapping: Record<string, string> = {
  // Chinese fonts → English replacements
  "站酷快乐体": "Comic Sans MS",
  "站酷快乐体2016修订版": "Comic Sans MS",
  "站酷文艺体": "Georgia",
  "站酷高端黑": "Impact",
  "站酷庆科黄油体": "Arial Rounded MT Bold",
  "站酷小薇LOGO体": "Verdana",
  "站酷仓耳渔阳体W01": "Arial",
  "站酷仓耳渔阳体W02": "Arial",
  "站酷仓耳渔阳体W03": "Arial Black",
  "站酷仓耳渔阳体W04": "Arial Black",
  "站酷仓耳渔阳体W05": "Impact",
  "优设标题黑": "Arial Black",
  "优设鲨鱼菲特健康体": "Helvetica",
  "包图小白体": "Comic Sans MS",
  "字体视界法棍体": "Arial",
  "字体视界法棍体拼音版": "Arial",
  "庞门正道粗书体": "Georgia",
  "庞门正道轻松体": "Georgia",
  "得意黑": "Impact",
  "手书体": "Comic Sans MS",
  "杨任东竹石体-Bold": "Times New Roman",
  "杨任东竹石体-Extralight": "Times New Roman",
  "杨任东竹石体-Heavy": "Times New Roman",
  "杨任东竹石体-Light": "Times New Roman",
  "杨任东竹石体-Medium": "Times New Roman",
  "杨任东竹石体-Regular": "Times New Roman",
  "杨任东竹石体-Semibold": "Times New Roman",
  "沐瑶软笔手写体": "Brush Script MT",
  "沐瑶随心手写体": "Brush Script MT",
  "联盟起艺卢帅正锐黑体": "Arial Black",
  "钉钉进步体": "Helvetica",
  "钟齐志莽行书": "Brush Script MT",
  "锐字真言体": "Impact",
  "阿里妈妈东方大楷": "Georgia",
  "阿里妈妈刀隶体": "Times New Roman",
  "阿里妈妈数黑体": "Arial Black",
  "阿里妈妈方圆体": "Verdana",
  "阿里巴巴普惠体Black": "Arial Black",
  "阿里巴巴普惠体Bold": "Arial",
  "阿里巴巴普惠体ExtraBold": "Arial Black",
  "阿里巴巴普惠体Heavy": "Impact",
  "阿里巴巴普惠体Light": "Arial",
  "阿里巴巴普惠体Medium": "Arial",
  "阿里巴巴普惠体Regular": "Arial",
  "阿里巴巴普惠体SemiBold": "Arial",
  "阿里巴巴普惠体Thin": "Arial",
};

// Replace font family in JSON recursively
function replaceFontFamily(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // If this is a font family string, replace it
    return fontMapping[obj] || obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => replaceFontFamily(item));
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (key === 'fontFamily' && typeof obj[key] === 'string') {
        // Replace Chinese font with English
        result[key] = fontMapping[obj[key]] || obj[key];
      } else {
        result[key] = replaceFontFamily(obj[key]);
      }
    }
    return result;
  }

  return obj;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function updateFontStyles() {
  console.log("\\n🔤 UPDATING FONT FAMILIES IN FONT STYLES\\n");
  console.log("=".repeat(70));

  let total = 0;
  let updated = 0;
  let failed = 0;

  try {
    const fontStyles: any[] = await convex.query(api.fonts.getFontStyles as any, {
      limit: 10000,
    });

    console.log(`\\n📋 Found ${fontStyles.length} font styles\\n`);

    for (const style of fontStyles) {
      const jsonStr = JSON.stringify(style.json);
      const hasChinese = /[\u4e00-\u9fa5]/.test(jsonStr);

      if (!hasChinese) continue;

      total++;
      console.log(`\\n🔄 "${style.name}" (${style._id})`);

      try {
        const updatedJson = replaceFontFamily(style.json);
        const updatedStr = JSON.stringify(updatedJson);
        const stillHasChinese = /[\u4e00-\u9fa5]/.test(updatedStr);

        if (stillHasChinese) {
          console.log(`   ⚠️  Still has some Chinese (non-font related)`);
        } else {
          console.log(`   ✅ All Chinese fonts replaced!`);
        }

        await convex.mutation(api.fonts.updateFontStyle as any, {
          id: style._id,
          json: updatedJson,
        });

        updated++;
      } catch (error) {
        console.error(`   ❌ Failed:`, error);
        failed++;
      }

      await delay(200);
    }

    console.log("\\n" + "=".repeat(70));
    console.log("\\n📊 SUMMARY\\n");
    console.log(`   Total font styles: ${fontStyles.length}`);
    console.log(`   Had Chinese fonts: ${total}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Failed: ${failed}`);
    console.log("\\n" + "=".repeat(70));

    if (failed === 0) {
      console.log("\\n🎉 ALL FONT STYLES UPDATED! 🎉\\n");
    }
  } catch (error) {
    console.error("\\n❌ Failed:", error);
    throw error;
  }
}

updateFontStyles().catch(console.error);
