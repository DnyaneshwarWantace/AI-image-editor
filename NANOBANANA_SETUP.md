# Nano Banana – layer extraction & edit by prompt

## Does Nano Banana give images without background?

**Yes.** Nano Banana (nanobananaapi.ai) does **not** have a separate “remove background” endpoint. You get **images without background** by using the same **Generate or Edit** API in **image-to-image** mode:

- **Endpoint:** `POST /api/v1/nanobanana/generate`
- **Body:** `type: "IMAGETOIAMGE"`, `imageUrls: [<public image URL>]`, `prompt: "Remove the background and make it transparent"` (or similar, e.g. “Keep only the main subject with transparent background”).
- The API returns a **taskId**; you poll **Get Task Details** (`record-info?taskId=...`); when `successFlag === 1`, `data.response.resultImageUrl` is the edited image (subject only, transparent background).

So you can use **Nano Banana for everything**: background removal (via that prompt), changing text, replacing a person, or any other edit—all through the same image-to-image API with different prompts.

## How it fits in

1. **Extract layers (AI Extract)**  
   When the user uploads an image and clicks **AI Extract**, the app can use **Nano Banana** for the “no background” step:
   - Send the full image (or per-object crops) to Nano Banana with prompt **“Remove the background and make it transparent”**.
   - Use the **resultImageUrl** as the “object without background” layer.
   - Continue with text detection (Tesseract/OCR) and background layer as today; place all layers on the canvas.

2. **Edit any layer with Nano Banana**  
   When the user selects a layer and uses **Edit with Nano Banana**:
   - They describe the change, e.g. “Change the text to Hello World”, “Replace this person with a woman in a red dress”, “Make the background blue”.
   - The app sends that layer (as image URL) + prompt to Nano Banana (**IMAGETOIAMGE**).
   - The result replaces the selected layer on the canvas.

## Setup

1. **API key**  
   Sign up at [nanobananaapi.ai](https://nanobananaapi.ai) and create an API key at [API Key Management](https://nanobananaapi.ai/api-key).

2. **Env**  
   In `.env` (root of `ai-image-editor`):

   ```env
   NANOBANANA_API_KEY=your_api_key_here
   ```

3. **Callback URL (production)**  
   Nano Banana requires a callback URL. Use your deployed app URL, e.g.:

   ```env
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```

   The app will use `NEXT_PUBLIC_APP_URL + '/api/nanobanana/callback'` as `callBackUrl`.  
   For local dev you can leave this unset; the app will poll task status instead.

## Flow summary

- **Extract:** User uploads image → AI Extract → objects (no bg) + text + background → all placed on canvas.
- **Edit:** User selects a layer → “Edit with Nano Banana” → enters prompt → that layer is replaced by Nano Banana’s result, in the same place.
