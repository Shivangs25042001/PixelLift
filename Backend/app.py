from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import cv2
import base64
import os
import sys
import types

# -------------------------------------------------------------------
# PixelLift compatibility patch:
# Real-ESRGAN / basicsr expect an old module:
#   torchvision.transforms.functional_tensor
# Newer torchvision removed it. We recreate that module here and
# forward the call to the new API:
#   torchvision.transforms.functional.rgb_to_grayscale
# This MUST run before we import realesrgan / gfpgan.
# -------------------------------------------------------------------
try:
    # If the old module exists, do nothing
    import torchvision.transforms.functional_tensor as _ft  # type: ignore
except Exception:
    try:
        from torchvision.transforms import functional as F

        # Create a fake module object
        functional_tensor_module = types.ModuleType(
            "torchvision.transforms.functional_tensor"
        )

        # Recreate the function Real-ESRGAN expects
        def rgb_to_grayscale(img, num_output_channels=1):
            return F.rgb_to_grayscale(img, num_output_channels)

        # Attach it to the fake module
        functional_tensor_module.rgb_to_grayscale = rgb_to_grayscale  # type: ignore

        # Register our fake module so that
        # "from torchvision.transforms.functional_tensor import rgb_to_grayscale"
        # works without errors
        sys.modules[
            "torchvision.transforms.functional_tensor"
        ] = functional_tensor_module

        print("[PixelLift] Patched torchvision.transforms.functional_tensor ✅")
    except Exception as e:
        # If this fails, Real-ESRGAN may still not work,
        # but the rest of the app will run.
        print(
            "[PixelLift] Warning: could not patch torchvision.functional_tensor:",
            repr(e),
        )

"""
PixelLift backend with AI upscaling

- Uses Real-ESRGAN for high quality upscaling when available
- Uses GFPGAN for face restoration when available
- Falls back to classic OpenCV-based enhancement if models are not installed

Before running this in "AI" mode you must:
1. Install dependencies inside your virtualenv:
   - pip install realesrgan gfpgan basicsr facexlib
   - install a compatible version of torch/torchvision following instructions from pytorch.org
2. Create a "weights" folder next to this app.py and put:
   - RealESRGAN_x4plus.pth
   - GFPGANv1.4.pth
"""

app = FastAPI(title="PixelLift API")

# Allow the HTML page (opened from file:// or localhost) to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # keep * for now while testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Optional AI model imports
# ---------------------------------------------------------------------------

REAL_ESRGAN_AVAILABLE = False
GFPGAN_AVAILABLE = False

UPSAMPLER = None
FACE_RESTORER = None

try:
    from realesrgan import RealESRGANer
    from basicsr.archs.rrdbnet_arch import RRDBNet

    REAL_ESRGAN_AVAILABLE = True
except Exception as e:  # optional dependency
    print("[PixelLift] Real-ESRGAN not available:", repr(e))

try:
    from gfpgan import GFPGANer

    GFPGAN_AVAILABLE = True
except Exception as e:  # optional dependency
    print("[PixelLift] GFPGAN not available:", repr(e))


def init_models():
    """
    Initialise Real-ESRGAN and GFPGAN models (if libraries + weights exist).

    The app will still run if this fails; it will just use classic enhancement.
    """
    global UPSAMPLER, FACE_RESTORER

    weights_dir = os.path.join(os.path.dirname(__file__), "weights")

    # --- Real-ESRGAN upsampler ---
    if REAL_ESRGAN_AVAILABLE and UPSAMPLER is None:
        try:
            model = RRDBNet(
                num_in_ch=3,
                num_out_ch=3,
                num_feat=64,
                num_block=23,
                num_grow_ch=32,
                scale=4,
            )
            model_path = os.path.join(weights_dir, "RealESRGAN_x4plus.pth")
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Missing Real-ESRGAN weights at {model_path}")

            UPSAMPLER = RealESRGANer(
                scale=4,
                model_path=model_path,
                model=model,
                tile=0,       # you can set tile>0 if GPU memory is low
                tile_pad=10,
                pre_pad=0,
                half=False,   # set True manually if you know you have CUDA + fp16
            )
            print("[PixelLift] Real-ESRGAN initialised.")
        except Exception as e:
            print("[PixelLift] Failed to init Real-ESRGAN:", repr(e))
            UPSAMPLER = None

    # --- GFPGAN face restorer (uses Real-ESRGAN as background upsampler) ---
    if GFPGAN_AVAILABLE and UPSAMPLER is not None and FACE_RESTORER is None:
        try:
            gfpgan_model_path = os.path.join(weights_dir, "GFPGANv1.4.pth")
            if not os.path.exists(gfpgan_model_path):
                raise FileNotFoundError(f"Missing GFPGAN weights at {gfpgan_model_path}")

            FACE_RESTORER = GFPGANer(
                model_path=gfpgan_model_path,
                upscale=2,
                arch="clean",
                channel_multiplier=2,
                bg_upsampler=UPSAMPLER,
            )
            print("[PixelLift] GFPGAN initialised.")
        except Exception as e:
            print("[PixelLift] Failed to init GFPGAN:", repr(e))
            FACE_RESTORER = None


# Try to load models when the server starts.
try:
    init_models()
except Exception as e:
    print("[PixelLift] Model initialisation error:", repr(e))
    UPSAMPLER = None
    FACE_RESTORER = None

# ---------------------------------------------------------------------------
# Small helper functions
# ---------------------------------------------------------------------------


def read_image_from_bytes(data: bytes):
    arr = np.frombuffer(data, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    return img


def image_to_data_uri(img):
    ok, encoded = cv2.imencode(".png", img)
    if not ok:
        raise ValueError("encode failed")
    b64 = base64.b64encode(encoded.tobytes()).decode("utf-8")
    return f"data:image/png;base64,{b64}"


def run_realesrgan(img: np.ndarray, outscale: float = 2.0) -> np.ndarray:
    """
    Helper: upscale using Real-ESRGAN if available, otherwise return original.
    """
    if UPSAMPLER is None:
        return img
    try:
        # RealESRGANer expects BGR np.uint8, same as OpenCV
        out, _ = UPSAMPLER.enhance(img, outscale=outscale)
        return out
    except Exception as e:
        print("[PixelLift] Real-ESRGAN enhance failed, falling back:", repr(e))
        return img


def run_gfpgan(img: np.ndarray, strength: int = 70) -> np.ndarray:
    """
    Helper: restore faces with GFPGAN if available.

    strength (0-100) controls blending between restored and original:
    - 100 = full restored image
    - lower = more of the original kept

    NOTE: we call this ONLY in Photo + Old Photo modes to keep things fast.
    """
    if FACE_RESTORER is None:
        return img

    try:
        _, _, restored_img = FACE_RESTORER.enhance(
            img,
            has_aligned=False,
            only_center_face=False,
            paste_back=True,
        )
        alpha = max(0.3, min(1.0, strength / 100.0))
        blended = cv2.addWeighted(restored_img, alpha, img, 1.0 - alpha, 0)
        return blended
    except Exception as e:
        print("[PixelLift] GFPGAN enhance failed, falling back:", repr(e))
        return img


def enhance_doc(img, strength: int):
    """
    Document / OCR mode – fast, OpenCV-only (no heavy AI).
    """
    strength = max(10, min(100, strength))

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    scale = 1.0 + (strength / 100.0) * 1.5
    new_w = int(gray.shape[1] * scale)
    new_h = int(gray.shape[0] * scale)
    gray = cv2.resize(gray, (new_w, new_h), interpolation=cv2.INTER_CUBIC)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    contrast = clahe.apply(gray)

    blur = cv2.GaussianBlur(contrast, (0, 0), sigmaX=1.0)
    amount = 0.5 + (strength / 100.0) * 1.0
    sharp = cv2.addWeighted(contrast, 1 + amount, blur, -amount, 0)

    bw = cv2.adaptiveThreshold(
        sharp,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        35,
        15,
    )
    result = cv2.cvtColor(bw, cv2.COLOR_GRAY2BGR)
    return result, "Document / OCR – maximized text clarity and contrast."


def enhance_photo_classic(img, strength: int):
    """
    Previous photo pipeline – used as fallback when AI models are not available.
    Natural, denoised, mildly sharpened.
    """
    strength = max(0, min(100, strength))

    scale = 1.0 + 0.8 * (strength / 100.0)
    new_w = int(img.shape[1] * scale)
    new_h = int(img.shape[0] * scale)
    base = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_CUBIC)

    lab = cv2.cvtColor(base, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clip = 1.0 + 1.5 * (strength / 100.0)
    clahe = cv2.createCLAHE(clipLimit=clip, tileGridSize=(8, 8))
    l2 = clahe.apply(l)
    lab2 = cv2.merge((l2, a, b))
    contrast = cv2.cvtColor(lab2, cv2.COLOR_LAB2BGR)

    d = 5 + int(3 * (strength / 100.0))
    sigmaColor = 30 + int(40 * (strength / 100.0))
    sigmaSpace = 15 + int(25 * (strength / 100.0))
    smoothed = cv2.bilateralFilter(contrast, d, sigmaColor, sigmaSpace)

    blur = cv2.GaussianBlur(smoothed, (0, 0), sigmaX=1.0)
    amount = 0.15 + 0.35 * (strength / 100.0)
    sharp = cv2.addWeighted(smoothed, 1 + amount, blur, -amount, 0)

    original_resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
    alpha = 0.4 + 0.4 * (strength / 100.0)
    output = cv2.addWeighted(sharp, alpha, original_resized, 1 - alpha, 0)

    info = "Photo mode – natural detail recovery with soft contrast, denoising and blending."
    return output, info


def enhance_old_classic(img, strength: int):
    """
    Old photo fallback when AI is not available.
    """
    strength = max(0, min(100, strength))

    scale = 1.0 + (strength / 100.0) * 0.6
    new_w = int(img.shape[1] * scale)
    new_h = int(img.shape[0] * scale)
    resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_CUBIC)

    lab = cv2.cvtColor(resized, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(l)

    clip = 1.2 + (strength / 100.0) * 1.3
    clahe = cv2.createCLAHE(clipLimit=clip, tileGridSize=(8, 8))
    cl = clahe.apply(l)
    limg = cv2.merge((cl, a, b))
    contrast = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)

    h_val = 5 + int((strength / 100.0) * 10)
    denoised = cv2.fastNlMeansDenoisingColored(
        contrast, None, h_val, h_val, 7, 21
    )

    blur = cv2.GaussianBlur(denoised, (0, 0), sigmaX=1.0)
    amount = 0.15 + (strength / 100.0) * 0.35
    sharp = cv2.addWeighted(denoised, 1 + amount, blur, -amount, 0)

    gamma = 1.0 + (strength / 100.0) * 0.05
    table = ((np.arange(256) / 255.0) ** gamma * 255).astype("uint8")
    tone = cv2.LUT(sharp, table)

    alpha = 0.5 + (strength / 100.0) * 0.3
    original_resized = cv2.resize(
        img, (new_w, new_h), interpolation=cv2.INTER_CUBIC
    )
    output = cv2.addWeighted(tone, alpha, original_resized, 1 - alpha, 0)

    info = "Restoration – noise reduced and tones revived, with highlights protected."
    return output, info


def white_balance_gray_world(img: np.ndarray) -> np.ndarray:
    """
    Simple gray-world white balance, used for product images.
    """
    result = img.astype(np.float32)
    b, g, r = cv2.split(result)

    mean_b = np.mean(b)
    mean_g = np.mean(g)
    mean_r = np.mean(r)
    mean_gray = (mean_b + mean_g + mean_r) / 3.0

    b *= mean_gray / (mean_b + 1e-6)
    g *= mean_gray / (mean_g + 1e-6)
    r *= mean_gray / (mean_r + 1e-6)

    result = cv2.merge((b, g, r))
    result = np.clip(result, 0, 255).astype(np.uint8)
    return result


# ---------------------------------------------------------------------------
# Image size limits for AI (speed optimisation)
# ---------------------------------------------------------------------------

# These values cap how big an image can be before AI models see it.
# Larger images will be shrunk down to this "longest side".
MAX_SIDE_PHOTO = 1600      # Photo mode (faces, general)
MAX_SIDE_OLD = 1600        # Old Photo mode
MAX_SIDE_PRODUCT = 1600    # Product photos
MAX_SIDE_PRINT = 2200      # Print mode (a bit higher, for quality)


def resize_for_ai(img: np.ndarray, max_side: int) -> np.ndarray:
    """
    Downscale very large images before sending them to heavy AI models.
    This keeps quality good but reduces the number of pixels a LOT,
    which makes Real-ESRGAN / GFPGAN much faster on CPU.
    """
    h, w = img.shape[:2]
    longest = max(h, w)
    if longest <= max_side:
        return img  # already small enough

    scale = max_side / float(longest)
    new_w = int(w * scale)
    new_h = int(h * scale)

    resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
    return resized


# ---------------------------------------------------------------------------
# AI-enhanced wrapper functions per mode
# ---------------------------------------------------------------------------


def enhance_photo(img, strength: int):
    """
    Photo mode with AI:
    - If GFPGAN/Real-ESRGAN are available, use them.
    - Otherwise fall back to classic enhancement.

    Optimisations:
    - Image is first resized to MAX_SIDE_PHOTO before AI,
      to speed up processing.
    - GFPGAN is used ONLY in this mode and 'old' mode.
    """
    if UPSAMPLER is None and FACE_RESTORER is None:
        return enhance_photo_classic(img, strength)

    strength = max(0, min(100, strength))

    # 0) Downscale huge images before AI
    work = resize_for_ai(img, MAX_SIDE_PHOTO)

    # 1) Face restoration (only for Photo/Old modes)
    work = run_gfpgan(work, strength)

    # 2) Upscale with Real-ESRGAN (roughly 1.5x–3x depending on strength)
    outscale = 1.5 + 1.5 * (strength / 100.0)
    upscaled = run_realesrgan(work, outscale=outscale)

    info = "Photo mode – AI upscaled with Real-ESRGAN and face restoration via GFPGAN (when available)."
    return upscaled, info


def enhance_print(img, strength: int):
    """
    Print mode with AI:
    - Heavy upscaling for high-DPI print
    - Crisp detail from Real-ESRGAN

    Optimisations:
    - No GFPGAN here (faces are not the focus).
    - Image is capped to MAX_SIDE_PRINT before Real-ESRGAN.
    """
    if UPSAMPLER is None:
        # Fall back to previous non-AI print pipeline (using photo classic then mild sharpen)
        enhanced, _ = enhance_photo_classic(img, strength)
        info = "Print mode – classic upscale and sharpen (AI models not available)."
        return enhanced, info

    strength = max(0, min(100, strength))

    # 0) Downscale huge inputs to keep speed acceptable
    work = resize_for_ai(img, MAX_SIDE_PRINT)

    # For print we push outscale higher (2.5x–4x)
    outscale = 2.5 + 1.5 * (strength / 100.0)  # 2.5 → 4.0
    upscaled = run_realesrgan(work, outscale=outscale)
    info = "Print mode – AI upscaled with Real-ESRGAN for crisp, print-ready output."
    return upscaled, info


def enhance_old(img, strength: int):
    """
    Old photo mode with AI:
    - Optional face restoration (GFPGAN)
    - Moderate upscale with Real-ESRGAN
    - Gentle color/contrast revival

    Optimisations:
    - Image is capped to MAX_SIDE_OLD before AI.
    """
    if UPSAMPLER is None and FACE_RESTORER is None:
        return enhance_old_classic(img, strength)

    strength = max(0, min(100, strength))

    # 0) Downscale huge images
    base = resize_for_ai(img, MAX_SIDE_OLD)

    # 1) Fix faces first (only Photo + Old modes use GFPGAN)
    base = run_gfpgan(base, strength)

    # 2) Upscale with Real-ESRGAN
    outscale = 1.8 + 0.7 * (strength / 100.0)  # 1.8 → ~2.5
    upscaled = run_realesrgan(base, outscale=outscale)

    # 3) Soft LAB contrast for vintage feel
    lab = cv2.cvtColor(upscaled, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clip = 1.1 + 1.0 * (strength / 100.0)
    clahe = cv2.createCLAHE(clipLimit=clip, tileGridSize=(8, 8))
    l2 = clahe.apply(l)
    lab2 = cv2.merge((l2, a, b))
    revived = cv2.cvtColor(lab2, cv2.COLOR_LAB2BGR)

    info = "Restoration mode – AI face repair with GFPGAN and detail recovery with Real-ESRGAN."
    return revived, info


def enhance_product(img, strength: int):
    """
    Product mode with AI:
    - Neutral white balance
    - Background & surface cleanup
    - Strong edge clarity (good for catalog images)

    Optimisations:
    - Uses Real-ESRGAN only (no GFPGAN).
    - Image is capped to MAX_SIDE_PRODUCT before Real-ESRGAN.
    """
    strength = max(0, min(100, strength))

    # White balance and denoise
    balanced = white_balance_gray_world(img)
    h_val = 3 + int(7 * (strength / 100.0))
    cleaned = cv2.fastNlMeansDenoisingColored(
        balanced, None, h_val, h_val, 7, 21
    )

    # Downscale huge images before AI
    work = resize_for_ai(cleaned, MAX_SIDE_PRODUCT)

    if UPSAMPLER is not None:
        outscale = 1.8 + 1.0 * (strength / 100.0)  # 1.8 → 2.8
        upscaled = run_realesrgan(work, outscale=outscale)
    else:
        upscaled = work

    # Sharpen edges
    blur = cv2.GaussianBlur(upscaled, (0, 0), sigmaX=1.0)
    amount = 0.3 + 0.5 * (strength / 100.0)
    sharp = cv2.addWeighted(upscaled, 1 + amount, blur, -amount, 0)

    info = "Product mode – neutral white balance and AI upscaling for crisp e-commerce visuals."
    return sharp, info


def run_pipeline(img, mode: str, strength: int):
    """
    Route the image through the correct mode pipeline.
    """
    mode = (mode or "photo").lower()
    if mode == "doc":
        return enhance_doc(img, strength)
    if mode == "print":
        return enhance_print(img, strength)
    if mode == "old":
        return enhance_old(img, strength)
    if mode == "product":
        return enhance_product(img, strength)
    return enhance_photo(img, strength)


# ---------------------------------------------------------------------------
# FastAPI endpoint
# ---------------------------------------------------------------------------


class EnhanceResponse(BaseModel):
    image_data: str
    width: int
    height: int
    summary: str


@app.post("/api/enhance", response_model=EnhanceResponse)
async def enhance_api(
    file: UploadFile = File(...),
    mode: str = Form("photo"),
    strength: int = Form(50),
):
    data = await file.read()
    img = read_image_from_bytes(data)
    if img is None:
        raise ValueError("could not decode image")

    enhanced, info = run_pipeline(img, mode, strength)
    h, w = enhanced.shape[:2]
    uri = image_to_data_uri(enhanced)
    summary = f"{info} Strength {strength}/100."

    return EnhanceResponse(
        image_data=uri,
        width=w,
        height=h,
        summary=summary,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
