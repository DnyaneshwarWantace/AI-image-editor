import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import axios from "axios";
import * as fs from "fs";

const CONVEX_URL = "https://valiant-axolotl-992.convex.cloud";
const convex = new ConvexHttpClient(CONVEX_URL);

// Translation mapping for common Chinese terms
const translationMap: Record<string, string> = {
  // Material types
  "卡通人物": "Cartoon Character",
  "文字标签": "Text Label",
  "箭头线条": "Arrow Line",
  "植物花朵": "Plants & Flowers",
  "卡通萌宠": "Cute Cartoon Pet",
  "传统印章": "Traditional Seal",
  "轮廓形状": "Outline Shape",
  "趣味手势": "Fun Gesture",
  "中国元素": "Chinese Element",
  "食物饮料": "Food & Beverage",
  "贴纸装饰": "Sticker Decoration",
  "表情天气": "Emoji & Weather",
  "星点彩带": "Stars & Ribbons",
  "科技数码": "Technology & Digital",
  "卡通贴图": "Cartoon Sticker",
  "装饰素材": "Decorative Material",
  "标签背景": "Label Background",
  "装饰元素": "Decorative Element",
  "趣味卡通": "Fun Cartoon",
  "卡通印花": "Cartoon Print",
  "萌宠印花": "Cute Pet Print",
  "卡通纹理": "Cartoon Texture",
  "花草纹理": "Floral Texture",

  // Template types
  "小红书": "Xiaohongshu Post",
  "公众号头图": "WeChat Header",
  "公众号小图": "WeChat Small Image",
  "日签": "Daily Quote",
  "电商主图": "E-commerce Main Image",
  "详情图": "Detail Image",
  "海报": "Poster",
  "定制商品": "Custom Product",
  "吧唧设计": "Badge Design",

  // Templates
  "会员折扣": "Member Discount",
  "假日快乐": "Happy Holiday",
  "劳动节": "Labor Day",
  "变废为宝": "Waste to Treasure",
  "拍照技巧": "Photography Tips",
  "养猫攻略": "Cat Care Guide",
  "秋招海报": "Autumn Recruitment Poster",
  "会员日": "Member Day",
  "开学换新": "Back to School",
  "旅游攻略": "Travel Guide",
  "个人防护": "Personal Protection",
  "劳动节日": "Labor Day Holiday",
  "宠物海报": "Pet Poster",
  "假期攻略": "Holiday Guide",
  "汉堡": "Burger",
  "饮料": "Beverage",
  "母亲节": "Mother's Day",
  "提拉米苏": "Tiramisu",
  "愚人节": "April Fools' Day",
  "月饼海报": "Mooncake Poster",
  "夏日防晒": "Summer Sunscreen",
  "招聘": "Recruitment",
  "放假通知": "Holiday Notice",
  "元旦放假": "New Year Holiday",
  "十月": "October",
  "程序员": "Programmer",
  "秋天": "Autumn",
  "十二月": "December",
  "防疫": "Epidemic Prevention",
  "校园招聘": "Campus Recruitment",
  "冬至": "Winter Solstice",
  "圣诞节": "Christmas",
  "招聘会": "Job Fair",
  "小雪": "Light Snow",
  "购物": "Shopping",
  "圣诞快乐": "Merry Christmas",
  "双二十": "Double Twenty",
  "除夕": "New Year's Eve",
  "教师节": "Teachers' Day",
  "情人节": "Valentine's Day",
  "今日营业": "Open Today",
  "头条": "Headlines",
  "工作报告": "Work Report",
  "新品上市": "New Launch",
  "劳动光荣": "Labor is Glorious",
  "入学指南": "Enrollment Guide",
  "种草": "Product Recommendation",
  "口罩": "Face Mask",
  "登山": "Mountain Climbing",
  "求职指南": "Job Hunting Guide",
  "教师节快乐": "Happy Teachers' Day",
  "谨防倒春寒": "Beware of Late Spring Cold",
  "美食": "Food",
  "新品推荐": "New Product",
  "青年节": "Youth Day",
  "摄影展": "Photo Exhibition",
  "防寒": "Cold Protection",
  "守护童年": "Protecting Childhood",
  "五一假期": "May Day Holiday",
  "面包": "Bread",
  "包邮": "Free Shipping",
  "奶瓶": "Baby Bottle",
  "蓝色": "Blue",
  "水果": "Fruit",
  "五金": "Hardware",
  "饼干": "Cookie",
  "电商": "E-commerce",
  "特价": "Special Price",
  "模板": "Template",
  "电商图": "E-commerce Image",
  "保存": "Save",
  "电商主体": "E-commerce Main",
  "半遮挡主图": "Half-covered Main Image",
  "简约": "Minimalist",
  "主图": "Main Image",
  "立夏": "Start of Summer",
  "小图": "Small Image",
  "小图片": "Small Picture",
  "直播": "Live Stream",
  "万岁": "Hooray",
  "干货": "Dry Goods",
  "放假": "Holiday",
  "科技峰会": "Tech Summit",
  "活动": "Event",
  "号外": "Extra",
  "春分": "Spring Equinox",
  "蛋黄派": "Egg Yolk Pie",
  "石榴": "Pomegranate",
  "宠物": "Pet",
  "日签": "Daily Quote",
  "新闻": "News",
  "海报": "Poster",
  "解读": "Interpretation",
  "元旦": "New Year's Day",
  "快图": "Quick Image",
  "女神": "Goddess",
  "车主": "Car Owner",
  "女士短袖": "Women's Short Sleeve",
  "商品模板": "Product Template",
  "童装": "Children's Clothing",
  "围裙": "Apron",
  "帆布包": "Canvas Bag",
  "雨伞": "Umbrella",
  "内衣": "Underwear",
  "布袋子": "Cloth Bag",
  "丝巾": "Silk Scarf",
  "卫衣": "Hoodie",
  "球拍": "Racket",
  "遮阳帽": "Sun Hat",
  "鞋子": "Shoes",
  "毛巾": "Towel",
  "手机壳": "Phone Case",
  "卫衣背面": "Hoodie Back",
  "绒布": "Flannel",
  "毛衣": "Sweater",
  "泳衣": "Swimsuit",
  "圆形吧唧": "Round Badge",
  "猫耳吧唧": "Cat Ear Badge",
  "水滴吧唧": "Water Drop Badge",
  "方形吧唧": "Square Badge",
  "长条吧唧": "Long Badge",
  "椭圆吧唧": "Oval Badge",

  // Fonts
  "优设标题黑": "YouShe Title Black",
  "优设鲨鱼菲特健康体": "YouShe SharkFit Health",
  "包图小白体": "Baotu Xiaobai",
  "字体视界法棍体": "Font World Baguette",
  "字体视界法棍体拼音版": "Font World Baguette Pinyin",
  "庞门正道粗书体": "Pangmen Zhengdao Bold",
  "庞门正道轻松体": "Pangmen Zhengdao Light",
  "得意黑": "Deyi Black",
  "手书体": "Handwriting",
  "杨任东竹石体-Bold": "Yang Rendong Bamboo Stone Bold",
  "杨任东竹石体-Extralight": "Yang Rendong Bamboo Stone Extralight",
  "杨任东竹石体-Heavy": "Yang Rendong Bamboo Stone Heavy",
  "杨任东竹石体-Light": "Yang Rendong Bamboo Stone Light",
  "杨任东竹石体-Medium": "Yang Rendong Bamboo Stone Medium",
  "杨任东竹石体-Regular": "Yang Rendong Bamboo Stone Regular",
  "杨任东竹石体-Semibold": "Yang Rendong Bamboo Stone Semibold",
  "沐瑶软笔手写体": "Muyao Soft Brush",
  "沐瑶随心手写体": "Muyao Casual Handwriting",
  "站酷仓耳渔阳体W01": "Zcool Cangeryuyang W01",
  "站酷仓耳渔阳体W02": "Zcool Cangeryuyang W02",
  "站酷仓耳渔阳体W03": "Zcool Cangeryuyang W03",
  "站酷仓耳渔阳体W04": "Zcool Cangeryuyang W04",
  "站酷仓耳渔阳体W05": "Zcool Cangeryuyang W05",
  "站酷小薇LOGO体": "Zcool Xiaowei Logo",
  "站酷庆科黄油体": "Zcool Qingke Butter",
  "站酷快乐体": "Zcool Happy",
  "站酷快乐体2016修订版": "Zcool Happy 2016 Revision",
  "站酷文艺体": "Zcool Wenyi",
  "站酷高端黑": "Zcool Premium Black",
  "联盟起艺卢帅正锐黑体": "Union Qiyi Lushuai Black",
  "钉钉进步体": "DingTalk JinBu",
  "钟齐志莽行书": "Zhongqi Zhimang",
  "锐字真言体": "Ruizi Zhenyan",
  "阿里妈妈东方大楷": "Alibaba Mama Dongfang Dakai",
  "阿里妈妈刀隶体": "Alibaba Mama Daoli",
  "阿里妈妈数黑体": "Alibaba Mama Number Black",
  "阿里妈妈方圆体": "Alibaba Mama Fangyuan",
  "阿里巴巴普惠体Black": "Alibaba PuHui Black",
  "阿里巴巴普惠体Bold": "Alibaba PuHui Bold",
  "阿里巴巴普惠体ExtraBold": "Alibaba PuHui ExtraBold",
  "阿里巴巴普惠体Heavy": "Alibaba PuHui Heavy",
  "阿里巴巴普惠体Light": "Alibaba PuHui Light",
  "阿里巴巴普惠体Medium": "Alibaba PuHui Medium",
  "阿里巴巴普惠体Regular": "Alibaba PuHui Regular",
  "阿里巴巴普惠体SemiBold": "Alibaba PuHui SemiBold",
  "阿里巴巴普惠体Thin": "Alibaba PuHui Thin",
};

// Fallback to API translation if not in map
async function translateText(text: string): Promise<string> {
  // Check if text contains Chinese characters
  const hasChinese = /[\u4e00-\u9fa5]/.test(text);
  if (!hasChinese) {
    return text;
  }

  // Check translation map first
  if (translationMap[text]) {
    return translationMap[text];
  }

  // Try API translation as fallback
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
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    return response.data.translatedText || text;
  } catch (error) {
    console.error(`   ⚠️  Translation API failed for "${text}"`);
    return text; // Return original if translation fails
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function translateAndUpdate() {
  console.log("\n🌐 TRANSLATING AND UPDATING ALL CHINESE NAMES\n");
  console.log("=".repeat(70));

  const report = {
    materialTypes: { total: 0, translated: 0, failed: 0 },
    materials: { total: 0, translated: 0, failed: 0, skipped: 0 },
    templateTypes: { total: 0, translated: 0, failed: 0 },
    templates: { total: 0, translated: 0, failed: 0, skipped: 0 },
    fonts: { total: 0, translated: 0, failed: 0 },
  };

  try {
    // ==================== MATERIAL TYPES ====================
    console.log("\n📦 Translating Material Types...\n");

    const materialTypes: any[] = await convex.query(
      api.materials.getMaterialTypes as any
    );

    for (const type of materialTypes) {
      if (/[\u4e00-\u9fa5]/.test(type.name)) {
        report.materialTypes.total++;
        const englishName = await translateText(type.name);
        console.log(`   🔄 "${type.name}" → "${englishName}"`);

        try {
          await convex.mutation(api.materials.updateMaterialType as any, {
            id: type._id,
            name: englishName,
          });
          console.log(`      ✅ Updated`);
          report.materialTypes.translated++;
        } catch (error) {
          console.error(`      ❌ Failed:`, error);
          report.materialTypes.failed++;
        }

        await delay(500);
      }
    }

    // ==================== TEMPLATE TYPES ====================
    console.log("\n📋 Translating Template Types...\n");

    const templateTypes: any[] = await convex.query(
      api.templates.getTemplateTypes as any
    );

    for (const type of templateTypes) {
      if (/[\u4e00-\u9fa5]/.test(type.name)) {
        report.templateTypes.total++;
        const englishName = await translateText(type.name);
        console.log(`   🔄 "${type.name}" → "${englishName}"`);

        try {
          await convex.mutation(api.templates.updateTemplateType as any, {
            id: type._id,
            name: englishName,
          });
          console.log(`      ✅ Updated`);
          report.templateTypes.translated++;
        } catch (error) {
          console.error(`      ❌ Failed:`, error);
          report.templateTypes.failed++;
        }

        await delay(500);
      }
    }

    // ==================== TEMPLATES ====================
    console.log("\n🖼️  Translating Templates...\n");

    const templates: any[] = await convex.query(
      api.templates.getTemplates as any,
      { isPublic: true, limit: 10000 }
    );

    console.log(`   Total templates: ${templates.length}`);
    const chineseTemplates = templates.filter((t) =>
      /[\u4e00-\u9fa5]/.test(t.name)
    );
    console.log(`   Templates with Chinese names: ${chineseTemplates.length}\n`);

    for (const template of chineseTemplates) {
      report.templates.total++;
      const englishName = await translateText(template.name);
      console.log(`   🔄 "${template.name}" → "${englishName}"`);

      try {
        await convex.mutation(api.templates.updateTemplate as any, {
          id: template._id,
          name: englishName,
        });
        console.log(`      ✅ Updated`);
        report.templates.translated++;
      } catch (error) {
        console.error(`      ❌ Failed:`, error);
        report.templates.failed++;
      }

      await delay(500);
    }

    // ==================== FONTS ====================
    console.log("\n🔤 Translating Fonts...\n");

    const fonts: any[] = await convex.query(api.fonts.getFonts as any, {
      limit: 10000,
    });

    console.log(`   Total fonts: ${fonts.length}`);
    const chineseFonts = fonts.filter((f) => /[\u4e00-\u9fa5]/.test(f.name));
    console.log(`   Fonts with Chinese names: ${chineseFonts.length}\n`);

    for (const font of chineseFonts) {
      report.fonts.total++;
      const englishName = await translateText(font.name);
      console.log(`   🔄 "${font.name}" → "${englishName}"`);

      try {
        await convex.mutation(api.fonts.updateFont as any, {
          id: font._id,
          name: englishName,
        });
        console.log(`      ✅ Updated`);
        report.fonts.translated++;
      } catch (error) {
        console.error(`      ❌ Failed:`, error);
        report.fonts.failed++;
      }

      await delay(1000); // Longer delay for API calls
    }

    // ==================== SUMMARY ====================
    console.log("\n" + "=".repeat(70));
    console.log("\n📊 TRANSLATION SUMMARY\n");
    console.log("┌──────────────────┬───────┬────────────┬────────┐");
    console.log("│ Category         │ Total │ Translated │ Failed │");
    console.log("├──────────────────┼───────┼────────────┼────────┤");
    console.log(
      `│ Material Types   │ ${String(report.materialTypes.total).padStart(5)} │ ${String(
        report.materialTypes.translated
      ).padStart(10)} │ ${String(report.materialTypes.failed).padStart(6)} │`
    );
    console.log(
      `│ Template Types   │ ${String(report.templateTypes.total).padStart(5)} │ ${String(
        report.templateTypes.translated
      ).padStart(10)} │ ${String(report.templateTypes.failed).padStart(6)} │`
    );
    console.log(
      `│ Templates        │ ${String(report.templates.total).padStart(5)} │ ${String(
        report.templates.translated
      ).padStart(10)} │ ${String(report.templates.failed).padStart(6)} │`
    );
    console.log(
      `│ Fonts            │ ${String(report.fonts.total).padStart(5)} │ ${String(
        report.fonts.translated
      ).padStart(10)} │ ${String(report.fonts.failed).padStart(6)} │`
    );
    console.log("└──────────────────┴───────┴────────────┴────────┘");

    const totalTranslated =
      report.materialTypes.translated +
      report.templateTypes.translated +
      report.templates.translated +
      report.fonts.translated;

    const totalFailed =
      report.materialTypes.failed +
      report.templateTypes.failed +
      report.templates.failed +
      report.fonts.failed;

    console.log(`\n   ✅ Total Successfully Translated: ${totalTranslated}`);
    console.log(`   ❌ Total Failed: ${totalFailed}`);
    console.log("\n" + "=".repeat(70));

    // Save report
    fs.writeFileSync("translation-report.json", JSON.stringify(report, null, 2));
    console.log("\n📝 Report saved to: translation-report.json\n");

    if (totalFailed === 0) {
      console.log("🎉 ALL NAMES SUCCESSFULLY TRANSLATED! 🎉\n");
    } else {
      console.log(`⚠️  ${totalFailed} items failed to translate\n`);
    }
  } catch (error) {
    console.error("\n❌ Translation failed:", error);
    throw error;
  }
}

translateAndUpdate().catch(console.error);
