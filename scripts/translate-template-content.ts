import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import axios from "axios";

const CONVEX_URL = "https://valiant-axolotl-992.convex.cloud";
const convex = new ConvexHttpClient(CONVEX_URL);

// Concise translation map to avoid text overflow
const conciseTranslationMap: Record<string, string> = {
  // Keep translations SHORT to fit in templates
  "会员折扣": "Member Sale",
  "假日快乐": "Happy Holiday",
  "劳动节": "Labor Day",
  "变废为宝": "Upcycle",
  "拍照技巧": "Photo Tips",
  "养猫攻略": "Cat Care",
  "秋招海报": "Fall Hiring",
  "会员日": "Member Day",
  "开学换新": "Back to School",
  "旅游攻略": "Travel Guide",
  "个人防护": "Safety",
  "劳动节日": "Labor Day",
  "宠物海报": "Pet Poster",
  "假期攻略": "Holiday Tips",
  "汉堡": "Burger",
  "饮料": "Drink",
  "母亲节": "Mother's Day",
  "提拉米苏": "Tiramisu",
  "愚人节": "April Fools",
  "月饼海报": "Mooncake",
  "夏日防晒": "Sun Care",
  "招聘": "Hiring",
  "放假通知": "Holiday Notice",
  "元旦放假": "New Year Break",
  "十月": "October",
  "程序员": "Developer",
  "秋天": "Autumn",
  "十二月": "December",
  "防疫": "Safety",
  "校园招聘": "Campus Hiring",
  "冬至": "Winter Solstice",
  "圣诞节": "Christmas",
  "招聘会": "Job Fair",
  "小雪": "Light Snow",
  "购物": "Shopping",
  "圣诞快乐": "Merry Xmas",
  "双二十": "Double 20",
  "除夕": "New Year's Eve",
  "教师节": "Teacher's Day",
  "情人节": "Valentine's",
  "今日营业": "Open Today",
  "头条": "News",
  "工作报告": "Report",
  "新品上市": "New Launch",
  "劳动光荣": "Work Pride",
  "入学指南": "Student Guide",
  "种草": "Recommend",
  "口罩": "Mask",
  "登山": "Hiking",
  "求职指南": "Job Guide",
  "教师节快乐": "Happy Teacher's Day",
  "谨防倒春寒": "Cold Alert",
  "美食": "Food",
  "新品推荐": "New Item",
  "青年节": "Youth Day",
  "摄影展": "Photo Exhibit",
  "防寒": "Stay Warm",
  "守护童年": "Protect Kids",
  "五一假期": "May Holiday",
  "面包": "Bread",
  "包邮": "Free Ship",
  "奶瓶": "Bottle",
  "蓝色": "Blue",
  "水果": "Fruit",
  "五金": "Hardware",
  "饼干": "Cookie",
  "电商": "E-comm",
  "特价": "Sale",
  "模板": "Template",
  "电商图": "Product",
  "保存": "Save",
  "电商主体": "Product",
  "半遮挡主图": "Half Cover",
  "简约": "Simple",
  "主图": "Main",
  "立夏": "Summer",
  "小图": "Small",
  "放假通知": "Holiday Alert",
  "小图片": "Small Pic",
  "直播": "Live",
  "万岁": "Hooray",
  "干货": "Tips",
  "放假": "Holiday",
  "科技峰会": "Tech Summit",
  "活动": "Event",
  "号外": "Extra",
  "春分": "Spring",
  "蛋黄派": "Egg Pie",
  "石榴": "Pomegranate",
  "宠物": "Pet",
  "日签": "Daily",
  "新闻": "News",
  "海报": "Poster",
  "解读": "Analysis",
  "元旦": "New Year",
  "快图": "Quick",
  "女神": "Goddess",
  "车主": "Driver",
  "优惠": "Deal",
  "折扣": "Discount",
  "促销": "Sale",
  "限时": "Limited",
  "免费": "Free",
  "活动": "Event",
  "上新": "New",
  "推荐": "Picks",
  "精选": "Featured",
  "热销": "Hot",
  "爆款": "Trending",
  "秒杀": "Flash Sale",
  "满减": "Save More",
  "买一送一": "BOGO",
  "全场": "All Items",
  "低至": "From",
  "仅": "Only",
  "立即": "Now",
  "购买": "Buy",
  "抢购": "Grab",
  "开抢": "Start",
  "预售": "Pre-order",
  "首发": "First",
  "新品": "New",
  "限量": "Limited",
  "火热": "Hot",
  "人气": "Popular",
  "必买": "Must Have",
  "好物": "Good Stuff",
  "严选": "Selected",
  "品质": "Quality",
  "正品": "Authentic",
  "包邮": "Free Ship",
  "到手": "Final",
  "春季": "Spring",
  "夏季": "Summer",
  "秋季": "Fall",
  "冬季": "Winter",
  "周末": "Weekend",
  "本周": "This Week",
  "今日": "Today",
  "明天": "Tomorrow",
  "最后": "Last",
  "倒计时": "Countdown",
  "欢迎": "Welcome",
  "您好": "Hello",
  "谢谢": "Thanks",
  "感谢": "Thank You",
};

// Translate with concise mapping first, then API if needed
async function translateTextConcise(text: string): Promise<string> {
  const hasChinese = /[\u4e00-\u9fa5]/.test(text);
  if (!hasChinese) return text;

  // Check concise map first
  if (conciseTranslationMap[text]) {
    return conciseTranslationMap[text];
  }

  // For short text, try to translate concisely
  if (text.length <= 10) {
    try {
      const response = await axios.post(
        "https://libretranslate.com/translate",
        {
          q: text,
          source: "zh",
          target: "en",
          format: "text",
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 5000,
        }
      );
      return response.data.translatedText || text;
    } catch {
      return text;
    }
  }

  return text; // Keep long unmapped text as is
}

// Calculate font size adjustment based on text length difference
function adjustFontSize(
  originalText: string,
  translatedText: string,
  originalFontSize: number
): number {
  // Chinese characters are typically more compact than English
  // Rough estimate: 1 Chinese char ≈ 2-3 English chars in width
  const chineseCharCount = (originalText.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishCharCount = translatedText.length;

  // If English is significantly longer, reduce font size
  const ratio = englishCharCount / Math.max(chineseCharCount * 2, 1);

  if (ratio > 1.5) {
    // Much longer in English
    return Math.floor(originalFontSize * 0.75);
  } else if (ratio > 1.2) {
    // Somewhat longer
    return Math.floor(originalFontSize * 0.85);
  }

  return originalFontSize; // Keep same size
}

// Recursively translate text in template JSON
async function translateTemplateJson(obj: any, depth = 0): Promise<any> {
  if (depth > 20) return obj; // Prevent infinite recursion

  if (typeof obj === "string") {
    return await translateTextConcise(obj);
  }

  if (Array.isArray(obj)) {
    return await Promise.all(obj.map((item) => translateTemplateJson(item, depth + 1)));
  }

  if (obj !== null && typeof obj === "object") {
    const result: any = { ...obj };

    // Special handling for text objects (fabric.js text objects)
    if (obj.type === "textbox" || obj.type === "i-text" || obj.type === "text") {
      if (obj.text && /[\u4e00-\u9fa5]/.test(obj.text)) {
        const originalText = obj.text;
        const translatedText = await translateTextConcise(originalText);
        result.text = translatedText;

        // Adjust font size if needed
        if (obj.fontSize && translatedText !== originalText) {
          const newFontSize = adjustFontSize(originalText, translatedText, obj.fontSize);
          if (newFontSize !== obj.fontSize) {
            result.fontSize = newFontSize;
            console.log(
              `      📏 Adjusted font: ${obj.fontSize} → ${newFontSize} (text: "${originalText.substring(0, 15)}...")`
            );
          }
        }
      }
    }

    // Recursively translate other properties
    for (const key in obj) {
      if (key !== "text") {
        // Already handled text above
        result[key] = await translateTemplateJson(obj[key], depth + 1);
      }
    }

    return result;
  }

  return obj;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function translateAllTemplateContent() {
  console.log("\n🌐 TRANSLATING CHINESE TEXT INSIDE TEMPLATES\n");
  console.log("=".repeat(70));

  const report = {
    total: 0,
    translated: 0,
    failed: 0,
    skipped: 0,
  };

  try {
    const templates: any[] = await convex.query(api.templates.getTemplates as any, {
      isPublic: true,
      limit: 10000,
    });

    console.log(`\n📋 Found ${templates.length} templates\n`);

    for (const template of templates) {
      const jsonStr = JSON.stringify(template.json);
      const hasChinese = /[\u4e00-\u9fa5]/.test(jsonStr);

      if (!hasChinese) {
        report.skipped++;
        continue;
      }

      report.total++;
      console.log(`\n🔄 "${template.name}" (${template._id})`);

      try {
        const translatedJson = await translateTemplateJson(template.json);

        await convex.mutation(api.templates.updateTemplate as any, {
          id: template._id,
          json: translatedJson,
        });

        console.log(`   ✅ Updated`);
        report.translated++;
      } catch (error) {
        console.error(`   ❌ Failed:`, error);
        report.failed++;
      }

      await delay(300); // Small delay to avoid overwhelming API
    }

    // Summary
    console.log("\n" + "=".repeat(70));
    console.log("\n📊 TRANSLATION SUMMARY\n");
    console.log(`   Total templates: ${templates.length}`);
    console.log(`   Templates with Chinese: ${report.total}`);
    console.log(`   Successfully translated: ${report.translated}`);
    console.log(`   Failed: ${report.failed}`);
    console.log(`   Skipped (no Chinese): ${report.skipped}`);
    console.log("\n" + "=".repeat(70));

    if (report.failed === 0) {
      console.log("\n🎉 ALL TEMPLATE CONTENT SUCCESSFULLY TRANSLATED! 🎉\n");
    }
  } catch (error) {
    console.error("\n❌ Translation failed:", error);
    throw error;
  }
}

translateAllTemplateContent().catch(console.error);
