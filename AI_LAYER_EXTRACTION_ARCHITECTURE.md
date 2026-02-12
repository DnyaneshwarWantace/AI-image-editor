# AI Layer Extraction – Current Stack, Replacements & Why

This document describes **what we have today**, **what we can replace and with what**, **how the replacement works**, and **why each choice is best** for the image editor’s “AI Extract” and “Edit with AI” flows.

---

## 1. What we currently have

The **AI Extract** flow in `lib/ai/image-layer-extractor.ts` works like this:

| Step | What we use | Purpose |
|------|-------------|---------|
| **1. Object detection** | **COCO-SSD** (TensorFlow.js, in-browser) | Find people/products and get bounding boxes. Used to know *where* to remove background and *where* to fill. |
| **2. Background removal** | **Remove.bg API** | Send the **full image** → get back one image with subject only (transparent background). One layer at (0,0). |
| **3. Text detection** | **Tesseract.js** (in-browser) + **OCR.space** (fallback) | Find text regions and read text. We get bounding box + content; sample color from image. |
| **4. Background fill (inpainting)** | **Replicate LaMa** via `/api/inpaint` | Fill the “holes” where objects and text were so the background looks natural. Fallback: **local gradient fill** if no token. |

**Env / config:**

- Remove.bg: key is currently hardcoded (should move to e.g. `REMOVE_BG_API_KEY`).
- Replicate: `REPLICATE_API_TOKEN` → LaMa inpainting.
- Optional: `NEXT_PUBLIC_OCR_SPACE_API_KEY` for higher OCR.space limits; `NEXT_PUBLIC_INPAINT_API_URL` to override inpainting endpoint.

**Output:** `ProcessedLayers` = texts (with position + content + color), objects (boxes + optional per-object cutouts), one `fullImageWithoutBg`, one `background` image. All placed on the canvas in the right order.

---

## 1.1 Text extraction: exact place, editable, exact font & style (requirement)

When we extract text from the image, we **must** meet these requirements:

| Requirement | What it means | How we do it |
|-------------|----------------|---------------|
| **Exact same place** | Each text block appears at the **same (x, y)** and **same size (width × height)** as in the original image. No drift or scaling. | Use the **bounding box** from OCR (Tesseract/PaddleOCR/Vision) directly: place the text layer at `x`, `y` with that `width` and `height` on the canvas. Canvas coordinates = image coordinates (same dimensions). |
| **Editable** | Text is a **real text layer** (editable by the user), not a rasterized image or flattened graphic. | Create a **text object** on the canvas (Fabric.js text or equivalent) with the detected string. User can click and change the text anytime. |
| **Exact font & style** | Font family, size, weight, color (and where possible: style) match the original as closely as we can detect. | **Color:** Sample dominant color from the text region in the image (already done in extractor). **Font size:** Set from the detected box height (e.g. `fontSize = bbox.height` or scaled to canvas). **Font family:** Use OCR/engine hint if available; otherwise sensible default (e.g. Arial) and allow user to change. **Weight/style:** Infer from image if the OCR or a font-detection step provides it; else default to normal. |

**Contract for the pipeline:**

- Every extracted text layer must have: **`text`** (content), **`x`**, **`y`**, **`width`**, **`height`** (exact place), **`color`** (sampled), **`fontSize`** (from box height or OCR), **`fontFamily`** (detected or default).
- The canvas must place each text at **(x, y)** with that **fontSize** and **color**, and the layer must be **editable** (not a bitmap).
- Any upgrade (PaddleOCR, Google Vision) must still output this same structure so placement and styling stay exact.

This way the extracted poster/text looks the same as the image, but every text block is **editable** and **stylable** in place.

---

## 2. What we’re replacing (and with what)

We are **not** replacing everything at once. Each piece can be upgraded independently.

| Current | Replacing with | Why |
|--------|------------------|-----|
| **Remove.bg** (background removal) | **Nano Banana** (image-to-image with prompt “Remove the background and make it transparent”) **or** **SAM** (Segment Anything) | **Nano Banana:** One API for both “remove bg” and “edit layer by prompt”; no separate Remove.bg key. **SAM:** Pixel-accurate masks, best cutouts; can run on Replicate or self-hosted. |
| **COCO-SSD** (object detection) | **YOLO** (e.g. Ultralytics, PyTorch) **or** keep COCO-SSD | **YOLO:** More accurate and faster in practice; run on backend or Replicate. COCO-SSD stays if we want zero backend. |
| **Tesseract + OCR.space** (text) | **PaddleOCR / EasyOCR** (PyTorch) **or** **Google Cloud Vision** | **PaddleOCR/EasyOCR:** Better detection + OCR in one, exact boxes. **Google Vision:** Best accuracy, paid API. |
| **Replicate LaMa** (fill holes) | **Keep as-is** | LaMa is already one of the best options for “fill background where we removed object/text.” No need to replace unless we want a different tradeoff. |

So:

- **Background removal:** Replace with **Nano Banana** (unify with “edit layer”) or **SAM** (best masks).
- **Object detection:** Optional upgrade to **YOLO** for better boxes.
- **Text:** Optional upgrade to **PaddleOCR/EasyOCR** or **Google Vision** for better boxes + content.
- **Fill background:** **Keep Replicate LaMa.**

---

## 3. How we’re replacing (component by component)

### 3.1 Background removal: Remove.bg → Nano Banana or SAM

**Option A – Nano Banana**

- Upload the image (or a crop) to a public URL (e.g. Supabase).
- Call Nano Banana: `type: "IMAGETOIAMGE"`, `imageUrls: [publicUrl]`, `prompt: "Remove the background and make it transparent"`.
- Poll task status; get `resultImageUrl` → use as `fullImageWithoutBg`.
- **How:** New helper (or API route) that: upload image → call Nano Banana generate → poll record-info → return result image URL or data URL.

**Option B – SAM (Segment Anything)**

- Get a mask for the “main subject”: e.g. user click or a box from object detection (COCO-SSD/YOLO).
- Call Replicate SAM (or self-hosted SAM): image + point/box → mask.
- Use mask to cut out the subject (alpha = 0 where mask = 0) → that’s your “object without background” layer.
- **How:** New API route or Replicate client: image + box/point → SAM → return mask or masked image.

**Why this is best:**  
Nano Banana = one key, same API for “remove bg” and “change text / replace person.” SAM = sharpest edges and exact control; LaMa still fills the hole.

### 3.2 Object detection: COCO-SSD → YOLO (optional)

- Run **YOLO** (e.g. Ultralytics) on the image (backend or Replicate).
- Get bounding boxes (and optionally class labels).
- Use these boxes exactly as we use COCO-SSD boxes today: for inpainting mask and for any per-object logic.
- **How:** Backend route that accepts image, runs YOLO, returns `[{ class, bbox: [x,y,w,h], confidence }]`. Client calls this instead of `detectObjectsInImage()` when “use YOLO” is enabled.

**Why this is best:**  
YOLO is more accurate and robust than COCO-SSD for “person, product” in real photos; better boxes → better masks and fill.

### 3.3 Text detection: Tesseract/OCR.space → PaddleOCR / EasyOCR or Google Vision

- **PaddleOCR / EasyOCR:** Run on backend (Python). Input: image. Output: list of `{ text, box, confidence }`. Replace `detectTextInImage()` with a call to this backend (or keep Tesseract as fallback when backend unavailable).
- **Google Vision:** Call Vision API `TEXT_DETECTION` or `DOCUMENT_TEXT_DETECTION`; parse response to same `{ text, x, y, width, height }` format. No model to host.
- **How:** New API route (e.g. `/api/ocr`) that accepts image and returns text regions; in `image-layer-extractor.ts` call this instead of Tesseract when configured.

**Why this is best:**  
Better detection and reading → text layers in the **exact same place**, **editable**, with **exact font size and color** (see §1.1); fewer misreads than Tesseract on complex layouts.

### 3.4 Background fill (inpainting): keep Replicate LaMa

- No replacement. We already send image + mask (object + text regions) to `/api/inpaint` → LaMa.
- When we switch to SAM for “object without background,” we still have a **mask** (the hole). We keep using that mask with LaMa to fill the background.

**Why this is best:**  
LaMa is well-suited for “fill holes” and is already integrated; no need to change unless we want a different quality/cost tradeoff.

---

## 4. Why this stack is best (summary)

| Goal | Choice | Reason |
|------|--------|--------|
| One API for “remove bg” + “edit layer” | **Nano Banana** | Same endpoint and key; prompt controls both. |
| Sharpest cutouts (masks) | **SAM** | Pixel-level masks; best for “extract element” in same place. |
| Best object boxes | **YOLO** | More accurate than COCO-SSD; better input for SAM or inpainting. |
| Best text position + content | **PaddleOCR / EasyOCR or Google Vision** | Better than Tesseract for “exact same place” and readability. |
| Best fill where we removed object | **Replicate LaMa** | Already best-in-class for hole filling; keep it. |

So: we **replace** Remove.bg (with Nano Banana or SAM), optionally replace COCO-SSD (with YOLO) and Tesseract (with PaddleOCR/EasyOCR or Vision), and **keep** LaMa for filling the background.

---

## 5. How it works end-to-end (flow)

### 5.1 Current flow (today)

```
User uploads image
       ↓
1. COCO-SSD detects objects (boxes)
       ↓
2. Remove.bg: full image → image without background (one layer)
       ↓
3. Tesseract (or OCR.space) detects text (boxes + content); sample color
       ↓
4. Build mask = object boxes + text boxes (white = hole)
       ↓
5. Send image + mask to /api/inpaint (LaMa) → background with holes filled
       (or local gradient if no REPLICATE_API_TOKEN)
       ↓
6. Return: fullImageWithoutBg, texts, objects, background → place on canvas
```

### 5.2 Flow after replacements (target)

```
User uploads image
       ↓
1. Object detection: YOLO (or keep COCO-SSD) → boxes
       ↓
2. Background removal (choose one):
   - Nano Banana: image + "Remove background, transparent" → resultImageUrl → fullImageWithoutBg
   - SAM: image + box/point → mask → cut out subject → fullImageWithoutBg
       ↓
3. Text: PaddleOCR / EasyOCR or Google Vision (or keep Tesseract) → text regions + content; sample color
       ↓
4. Build inpainting mask = object regions + text regions (same as today)
       ↓
5. LaMa (unchanged): image + mask → filled background
       ↓
6. Return: fullImageWithoutBg, texts, objects, background → place on canvas (exact same place)
       ↓
7. Edit layer: user selects layer → "Edit with Nano Banana" → prompt → IMAGETOIAMGE → replace layer
```

So: **same high-level flow**; we only swap **who** does object detection, background removal, and text. Inpainting and canvas placement stay the same; layers still get **exact same place** (from boxes/masks and our layer model).

---

## 6. Files and config (quick reference)

| Concern | Where |
|--------|--------|
| Current extraction logic | `lib/ai/image-layer-extractor.ts` |
| Replicate LaMa | `app/api/inpaint/route.ts`, `REPLICATE_INPAINT_SETUP.md` |
| Nano Banana (edit + optional bg removal) | `NANOBANANA_SETUP.md`, env: `NANOBANANA_API_KEY`, `NEXT_PUBLIC_APP_URL` |
| Remove.bg | Currently hardcoded key in `image-layer-extractor.ts`; should use `REMOVE_BG_API_KEY` |
| OCR | Tesseract.js + OCR.space in `image-layer-extractor.ts`; optional `NEXT_PUBLIC_OCR_SPACE_API_KEY` |

---

## 7. Summary table

| Component | Current | Replacing with | Why |
|-----------|---------|----------------|-----|
| Object detection | COCO-SSD (TF.js) | YOLO (optional) | Better accuracy and speed. |
| Background removal | Remove.bg | Nano Banana or SAM | Nano Banana = one API + edit; SAM = best masks. |
| Text detection + OCR | Tesseract + OCR.space | PaddleOCR / EasyOCR or Google Vision | Exact place + better text. |
| Fill background (hole) | Replicate LaMa | **Keep** | Already best for inpainting. |
| Edit layer by prompt | (new) | Nano Banana IMAGETOIAMGE | Same API as optional bg removal; natural "change text / replace person." |
| **Text layers** | — | **Requirement (§1.1)** | **Exact same place** (x,y, size); **editable** (real text, not image); **exact font** (family, size, color) from box + sampling.

This is the **current state**, **what we replace**, **how we replace it**, **why it’s best**, and **how it works** end-to-end.
