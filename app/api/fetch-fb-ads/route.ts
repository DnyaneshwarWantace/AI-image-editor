import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

const SCRAPOR_API_KEY = process.env.SCRAPOR_API_KEY || "";

export async function POST(request: NextRequest) {
  try {
    const { pageId, userId } = await request.json();

    if (!pageId) {
      return NextResponse.json(
        { error: "Page ID is required" },
        { status: 400 }
      );
    }

    if (!SCRAPOR_API_KEY) {
      return NextResponse.json(
        { error: "Scrapor API key not configured" },
        { status: 500 }
      );
    }

    // Fetch ads using Scrape Creators API
    const response = await fetch(
      `https://api.scrapecreators.com/v1/facebook/adLibrary/company/ads?pageId=${pageId}`,
      {
        headers: {
          "x-api-key": SCRAPOR_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Failed to fetch ads: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Save scraped ads to Supabase database
    const savedAds: any[] = [];
    if (data.results && data.results.length > 0) {
      try {
        const adsToSave = data.results.map((ad: any) => ({
          facebook_ad_id: ad.ad_archive_id || ad.collation_id,
          page_id: pageId,
          page_name: ad.page_name,
          title: ad.snapshot?.body?.text || ad.snapshot?.title || "Untitled Ad",
          description: ad.snapshot?.link_description || "",
          image_url: ad.snapshot?.videos?.[0]?.video_preview_image_url ||
                   ad.snapshot?.images?.[0] ||
                   ad.snapshot?.videos?.[0]?.video_sd_url || "",
          cta: ad.snapshot?.cta_text || "",
          link: ad.snapshot?.link_url || "",
          raw_data: ad,
          user_id: userId,
        }));

        const { data: insertedData, error } = await supabase
          .from('ads')
          .insert(adsToSave)
          .select();

        if (error) {
          console.error("Error saving ads to database:", error);
        } else {
          savedAds.push(...(insertedData || []));
        }
      } catch (saveError) {
        console.error("Error saving ads to database:", saveError);
      }
    }

    // Transform API response to match our expected format with Supabase IDs
    const transformedData = {
      ads: data.results?.map((ad: any, index: number) => ({
        id: savedAds[index]?.id || ad.ad_archive_id || ad.collation_id, // Use Supabase ID if available
        facebookAdId: ad.ad_archive_id || ad.collation_id,
        title: ad.snapshot?.body?.text || ad.snapshot?.title || "Untitled Ad",
        description: ad.snapshot?.link_description || "",
        image: ad.snapshot?.videos?.[0]?.video_preview_image_url ||
               ad.snapshot?.images?.[0] ||
               ad.snapshot?.videos?.[0]?.video_sd_url || "",
        cta: ad.snapshot?.cta_text || "",
        link: ad.snapshot?.link_url || "",
        pageName: ad.page_name,
      })) || [],
      pageName: data.results?.[0]?.page_name || "",
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("Error fetching Facebook ads:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
