# Replicate generative fill (free credits)

AI Layer Extraction can use **Replicate’s LaMa inpainting** to fill the background where the person and text were removed. You get a real “generative fill” instead of the simple gradient.

**Exact model used:** `allenhooo/lama` (version `cdac78a1...`). Same as in the Replicate docs: image + mask in, output image URL.

## 1. Get a Replicate API token (free)

1. Go to **https://replicate.com** and sign up (or log in).
2. Open **https://replicate.com/account/api-tokens**.
3. Create a token and copy it (e.g. `r8_xxxx...`).

## 2. Free credits

- New accounts get **free usage** to try models (see [Try for free](https://replicate.com/collections/try-for-free)).
- LaMa is cheap (~\$0.0005 per run). After free usage you can add **prepaid credit** (e.g. \$5) at [replicate.com/account/billing](https://replicate.com/account/billing).

## 3. Use the token in this app

Add to your `.env` (root of `ai-image-editor`):

```env
REPLICATE_API_TOKEN=r8_your_token_here
```

Do **not** commit this file or token to git. Restart the dev server after changing `.env`.

## 4. How it’s used

- The app calls your own **`/api/inpaint`** route with the poster image and a mask (person + text regions).
- That route uses `REPLICATE_API_TOKEN` to call Replicate’s **LaMa** model and returns the inpainted image.
- If `REPLICATE_API_TOKEN` is not set, generative fill is skipped and the **local gradient fill** is used instead (no cost, lower quality).

No need to set `NEXT_PUBLIC_INPAINT_API_URL` unless you want to use a different inpainting endpoint; the default is `/api/inpaint`.
