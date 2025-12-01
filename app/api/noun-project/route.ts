import { NextRequest, NextResponse } from 'next/server';
import OAuth from 'oauth';

const NOUN_PROJECT_API_KEY = process.env.NEXT_PUBLIC_NOUN_PROJECT_API_KEY || "d962da44a0c44681ad545892c454b8a2";
const NOUN_PROJECT_API_SECRET = process.env.NEXT_PUBLIC_NOUN_PROJECT_API_SECRET || "7de499e477634687b0bbe9c30790400f";

// Create OAuth client
const oauth = new OAuth.OAuth(
  'https://api.thenounproject.com',
  'https://api.thenounproject.com',
  NOUN_PROJECT_API_KEY,
  NOUN_PROJECT_API_SECRET,
  '1.0',
  null,
  'HMAC-SHA1'
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const limit = searchParams.get('limit') || '20';

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required', icons: [] },
        { status: 400 }
      );
    }

    // Build the API URL
    const apiUrl = `https://api.thenounproject.com/v2/icon/search?query=${encodeURIComponent(query)}&limit=${limit}`;

    // Make OAuth-authenticated request using Promise
    const data = await new Promise((resolve, reject) => {
      oauth.get(
        apiUrl,
        null, // token
        null, // token secret
        (error: any, data: any, response: any) => {
          if (error) {
            console.error('Noun Project OAuth error:', error);
            reject(error);
          } else {
            try {
              const parsedData = JSON.parse(data);
              resolve(parsedData);
            } catch (parseError) {
              console.error('Error parsing response:', parseError);
              reject(parseError);
            }
          }
        }
      );
    });

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error: any) {
    console.error('Error fetching Noun Project icons:', error);
    
    // Return error but with empty icons array so UI doesn't break
    return NextResponse.json(
      { 
        error: 'Failed to fetch from Noun Project API', 
        message: error.message || 'Unknown error',
        icons: [] // Return empty array so UI doesn't break
      },
      { status: 200 } // Return 200 with error in body
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
