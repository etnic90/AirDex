import sys
import os
import requests
from io import BytesIO
from PIL import Image
from rembg import remove

def process_image(img_url, bg_path, output_path):
    if img_url.startswith("http://") or img_url.startswith("https://"):
        print(f"Downloading image from: {img_url}")
        try:
            resp = requests.get(img_url, timeout=30)
            resp.raise_for_status()
            input_image = Image.open(BytesIO(resp.content))
        except Exception as e:
            print(f"Error downloading image: {e}")
            return False
    else:
        print(f"Opening local image from: {img_url}")
        try:
            input_image = Image.open(img_url)
        except Exception as e:
            print(f"Error opening local image: {e}")
            return False

    print("Removing background using rembg with alpha matting...")
    try:
        # Run rembg to remove the background with alpha matting enabled
        transparent_image = remove(
            input_image, 
            alpha_matting=True,
            alpha_matting_foreground_threshold=240,
            alpha_matting_background_threshold=10,
            alpha_matting_erode_size=10
        )
    except Exception as e:
        print(f"Error removing background: {e}")
        return False

    print(f"Loading background template from: {bg_path}")
    try:
        background = Image.open(bg_path).convert("RGBA")
    except Exception as e:
        print(f"Error loading background: {e}")
        return False

    # Get bounding box of non-transparent elements of the plane to crop empty edges
    bbox = transparent_image.getbbox()
    if bbox:
        plane = transparent_image.crop(bbox)
    else:
        plane = transparent_image

    # Calculate scaling factor to make the plane fit nicely (e.g., 85% of background width)
    bg_w, bg_h = background.size
    plane_w, plane_h = plane.size

    target_w = int(bg_w * 0.85)
    scale_factor = target_w / plane_w
    target_h = int(plane_h * scale_factor)

    # If the scaled height is too high for the background, scale based on height instead (e.g. 70% of background height)
    if target_h > bg_h * 0.7:
        target_h = int(bg_h * 0.7)
        scale_factor = target_h / plane_h
        target_w = int(plane_w * scale_factor)

    print(f"Resizing plane to: {target_w}x{target_h}")
    plane_resized = plane.resize((target_w, target_h), Image.Resampling.LANCZOS)

    # Soft feather the edges of the cut-out to blend naturally with the background
    if "A" in plane_resized.mode:
        from PIL import ImageFilter
        print("Feathering cutout edges for natural blending...")
        alpha = plane_resized.split()[-1]
        # A tiny Gaussian blur (radius 1.0) on the alpha mask renders smooth, feathered edges
        alpha_feathered = alpha.filter(ImageFilter.GaussianBlur(radius=1.0))
        plane_resized.putalpha(alpha_feathered)

    # Calculate position to center the plane
    pos_x = (bg_w - target_w) // 2
    pos_y = (bg_h - target_h) // 2

    # Paste the plane onto the background (using the plane's alpha channel as mask)
    print("Compositing images...")
    background.paste(plane_resized, (pos_x, pos_y), plane_resized)

    # Save final image as WebP (with high quality and good compression)
    print(f"Saving composite image to: {output_path}")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    background.convert("RGB").save(output_path, "WEBP", quality=90)
    print("Success!")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python composite_image.py <image_url> <bg_path> <output_path>")
        sys.exit(1)

    url = sys.argv[1]
    bg = sys.argv[2]
    out = sys.argv[3]
    
    success = process_image(url, bg, out)
    sys.exit(0 if success else 1)
