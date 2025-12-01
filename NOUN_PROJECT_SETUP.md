# Noun Project API Setup Guide

## Step 1: Get Your API Credentials

1. Go to [Noun Project Developer Portal](https://thenounproject.com/developers/)
2. Sign up or log in
3. Create a new app:
   - Go to: https://thenounproject.com/developers/apps/
   - Click "Create a new app"
   - Fill in:
     - App Name: Your app name
     - Description: Brief description
     - Website: Your website URL
   - Click "Create"
4. After creating, you'll get:
   - **Client Key** (API Key) - You already have this: `d962da44a0c44681ad545892c454b8a2`
   - **Client Secret** (API Secret) - You need to get this from the app page

## Step 2: Add Credentials to Environment Variables

Add to your `.env.local` file:

```env
NEXT_PUBLIC_NOUN_PROJECT_API_KEY=your_client_key_here
NEXT_PUBLIC_NOUN_PROJECT_API_SECRET=your_client_secret_here
```

## Step 3: Install OAuth Library

Run this command in your terminal:

```bash
npm install oauth-1.0a crypto
```

## Step 4: The Code is Already Updated

The API route has been updated to use OAuth 1.0a. Just make sure:
- You have the Client Secret
- Environment variables are set
- Library is installed

## Step 5: Test

1. Restart your dev server
2. Go to the Stickers tab
3. Try searching in Noun Project tab

## Troubleshooting

### If you get 401/403 errors:
- Check that both API Key and Secret are correct
- Make sure environment variables are loaded (restart server)
- Verify your app is approved in Noun Project dashboard

### If you get 404 errors:
- Check the API endpoint URL is correct
- Verify your app has access to the API

## Important Notes

- **Free tier**: Limited to public domain icons only
- **Paid tier**: Access to all icons
- **Attribution**: Free icons require attribution when used
- **Rate limits**: Check your plan's rate limits

