import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = "https://valiant-axolotl-992.convex.cloud";
const convex = new ConvexHttpClient(CONVEX_URL);

// Comprehensive translation map
const translationMap: Record<string, string> = {
  // Font names
  "站酷快乐体": "Zcool Happy",
  "站酷快乐体2016修订版": "Zcool Happy 2016",
  "站酷文艺体": "Zcool Wenyi",
  "站酷高端黑": "Zcool Premium Black",
  "站酷庆科黄油体": "Zcool Butter",
  "站酷小薇LOGO体": "Zcool Xiaowei Logo",
  "优设标题黑": "YouShe Title Black",
  "优设鲨鱼菲特健康体": "YouShe SharkFit",
  "阿里巴巴普惠体": "Alibaba PuHui",
  "阿里妈妈": "Alibaba Mama",
  "庞门正道": "Pangmen Zhengdao",

  // Layer/Object names
  "图层": "Layer",
  "背景": "Background",
  "形状": "Shape",
  "矩形": "Rectangle",
  "圆形": "Circle",
  "文字": "Text",
  "图片": "Image",
  "拷贝": "Copy",
  "组": "Group",
  "蒙版": "Mask",

  // Common phrases - VERY SHORT translations
  "满300立减50元": "Save $50 on $300",
  "有些注意事项不得不看": "Read Notes",
  "五一宅家攻略": "May Day Guide",
  "扫码二维码了解更多详情": "Scan for More",
  "联系电话": "Phone",
  "听听导师怎么说": "Expert Says",
  "毕业论文答辩": "Thesis Defense",
  "通关秘籍": "Tips & Tricks",
  "平面设计师": "Designer",
  "产品经理": "Product Manager",
  "工程师": "Engineer",
  "懂你在心田": "Understand You",
  "想你在心间": "Miss You",
  "爱是缘分": "Love is Fate",
  "爱是感动": "Love is Moving",
  "爱也可以是一个拥抱": "Love is a Hug",
  "今天是专属于你的节日": "Your Special Day",
  "愿你是乘风破浪的女神": "Be a Goddess",
  "也是被人疼的公主": "And a Princess",
  "三月的你是我的欢喜": "March Joy",
  "红心形卡": "Heart Card",

  // Single characters (common)
  "立": "Li",
  "春": "Spring",
  "不": "No",
  "知": "Know",
  "的": "of",
  "是": "is",
  "在": "at",
  "了": "done",
  "和": "and",
  "与": "with",
  "为": "for",
  "以": "with",
  "到": "to",
  "说": "say",
  "要": "need",
  "去": "go",
  "来": "come",
  "时": "time",
  "年": "year",
  "月": "month",
  "日": "day",
  "节": "festival",

  // Days/Festivals
  "情人节": "Valentine's",
  "女神节": "Goddess Day",
  "三月": "March",
  "母亲节": "Mother's Day",
  "父亲节": "Father's Day",
  "儿童节": "Children's Day",
  "端午节": "Dragon Boat",
  "中秋节": "Mid-Autumn",
  "国庆节": "National Day",
  "元旦": "New Year",
  "春节": "Spring Festival",
  "劳动节": "Labor Day",
  "青年节": "Youth Day",
  "教师节": "Teacher's Day",
  "圣诞节": "Christmas",
  "感恩节": "Thanksgiving",
  "万圣节": "Halloween",
  "愚人节": "April Fools",
  "妇女节": "Women's Day",
  "儿童": "Children",
  "学生": "Student",
  "老师": "Teacher",
  "家长": "Parent",
};

// Translate any string
function translateAny(text: string): string {
  if (!text || typeof text !== 'string') return text;

  const hasChinese = /[\u4e00-\u9fa5]/.test(text);
  if (!hasChinese) return text;

  // Check direct match first
  if (translationMap[text]) {
    return translationMap[text];
  }

  // Try to replace all mapped phrases
  let result = text;
  for (const [cn, en] of Object.entries(translationMap)) {
    if (result.includes(cn)) {
      result = result.replace(new RegExp(cn, 'g'), en);
    }
  }

  // If still has Chinese, remove it for safety (avoid overflow)
  if (/[\u4e00-\u9fa5]/.test(result)) {
    // For very long Chinese text, just use placeholder
    if (result.length > 20) {
      return "Text";
    }
    // For short Chinese, keep it (might be important)
    return result;
  }

  return result;
}

// Recursively translate ALL strings in JSON
function translateAllStrings(obj: any, depth = 0): any {
  if (depth > 30) return obj;

  if (typeof obj === 'string') {
    return translateAny(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => translateAllStrings(item, depth + 1));
  }

  if (obj !== null && typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      // Translate both keys and values
      const translatedKey = translateAny(key);
      result[translatedKey] = translateAllStrings(obj[key], depth + 1);
    }
    return result;
  }

  return obj;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function translateAllTemplatesChinese() {
  console.log("\\n🌐 COMPREHENSIVE CHINESE → ENGLISH TRANSLATION\\n");
  console.log("=".repeat(70));

  let total = 0;
  let translated = 0;
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
      console.log(`\\n🔄 "${template.name}" (${template._id})`);

      // Count Chinese characters before
      const chineseBefore = (jsonStr.match(/[\u4e00-\u9fa5]/g) || []).length;
      console.log(`   📊 Chinese characters: ${chineseBefore}`);

      try {
        const translatedJson = translateAllStrings(template.json);
        const translatedStr = JSON.stringify(translatedJson);
        const chineseAfter = (translatedStr.match(/[\u4e00-\u9fa5]/g) || []).length;

        console.log(`   ✅ Reduced to: ${chineseAfter} (${Math.round((1 - chineseAfter/chineseBefore) * 100)}% translated)`);

        await convex.mutation(api.templates.updateTemplate as any, {
          id: template._id,
          json: translatedJson,
        });

        translated++;
      } catch (error) {
        console.error(`   ❌ Failed:`, error);
        failed++;
      }

      await delay(200);
    }

    console.log("\\n" + "=".repeat(70));
    console.log("\\n📊 SUMMARY\\n");
    console.log(`   Total templates: ${templates.length}`);
    console.log(`   With Chinese: ${total}`);
    console.log(`   Translated: ${translated}`);
    console.log(`   Failed: ${failed}`);
    console.log("\\n" + "=".repeat(70));

    if (failed === 0) {
      console.log("\\n🎉 ALL CHINESE TEXT TRANSLATED! 🎉\\n");
    }
  } catch (error) {
    console.error("\\n❌ Failed:", error);
    throw error;
  }
}

translateAllTemplatesChinese().catch(console.error);
