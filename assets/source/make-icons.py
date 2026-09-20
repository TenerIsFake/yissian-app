#!/usr/bin/env python3
"""Generate Yissian's app icons from a single vector source.

Run from the repo root:  python3 assets/source/make-icons.py
Requires: cairosvg, Pillow.

The mark is a geometric Y — the app's initial — whose stem finishes in a small
hook, a nod to the -iss / -rid suffix the dialect is built on. It is drawn as
vector paths rather than set in a typeface, so the weight is exact and no font
has to be redistributed with the app.

Colours are the app's own: the violet ramp and near-black ground that the UI
already uses.

Two things here are not arbitrary and should not be "tidied":

1. `icon.png` is written as RGB with NO alpha channel. iOS rejects an app icon
   that carries transparency.
2. The mark is positioned optically, not mathematically. A Y is top-heavy, so
   a mark centred on the exact canvas centre looks high; the ink is centred
   slightly below it. Likewise the Android foreground is scaled by MEASURING
   the rendered ink and fitting that to the safe zone, rather than trusting a
   number computed from the path coordinates.
"""
import io
from pathlib import Path

import cairosvg
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent.parent
ASSETS = ROOT / "assets"
ANDROID_RES = ROOT / "android/app/src/main/res"
S = 1024                      # master canvas
STROKE = 122                  # ~12% of canvas: heavy enough to hold at 40px
TOP, JUNCT, BOT = 313, 556, 785
SPREAD = 178                  # arm half-spread from the centre line
CX = S // 2

# Android adaptive icons reserve the inner 66% of the canvas; anything outside
# it can be cropped by the launcher's mask.
ANDROID_SAFE = 0.66

VIOLET_LIGHT, VIOLET_DEEP = "#c4b5fd", "#7c3aed"
GROUND_LIGHT, GROUND_DEEP = "#1a1a2e", "#0f0f14"


def mark_svg(background, scale=1.0):
    """The Y, optionally on the app's ground gradient, optionally scaled."""
    d = (f"M {CX-SPREAD} {TOP} L {CX} {JUNCT} L {CX+SPREAD} {TOP} "
         f"M {CX} {JUNCT} L {CX} {BOT-38} "
         f"Q {CX} {BOT} {CX+74} {BOT-14}")
    ground = (f'<rect width="{S}" height="{S}" fill="url(#ground)"/>'
              if background else "")
    # scale about the canvas centre
    off = (1 - scale) * CX
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{S}" height="{S}"
     viewBox="0 0 {S} {S}">
  <defs>
    <linearGradient id="mark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{VIOLET_LIGHT}"/>
      <stop offset="1" stop-color="{VIOLET_DEEP}"/>
    </linearGradient>
    <linearGradient id="ground" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{GROUND_LIGHT}"/>
      <stop offset="1" stop-color="{GROUND_DEEP}"/>
    </linearGradient>
  </defs>
  {ground}
  <g transform="translate({off:.2f} {off:.2f}) scale({scale:.4f})"
     fill="none" stroke="url(#mark)" stroke-width="{STROKE}"
     stroke-linecap="round" stroke-linejoin="round">
    <path d="{d}"/>
  </g>
</svg>"""


def render(src, size=S):
    png = cairosvg.svg2png(bytestring=src.encode(),
                           output_width=size, output_height=size)
    return Image.open(io.BytesIO(png)).convert("RGBA")


def ink_radius(img):
    """Half-diagonal of the drawn ink — the conservative fit against a circle."""
    bbox = img.getbbox()
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    return ((w / 2) ** 2 + (h / 2) ** 2) ** 0.5


def android_scale():
    """Largest scale whose RENDERED ink fits the adaptive-icon safe circle.

    Computing this from the path coordinates alone is off by a pixel or two:
    antialiasing widens the rendered ink beyond the geometry, and the first
    version of this overflowed the safe circle by exactly 1px. So the scale is
    derived, then checked against the actual render and shrunk until it fits.
    """
    limit = S * ANDROID_SAFE / 2
    scale = min(1.0, limit / ink_radius(render(mark_svg(background=False))))
    for _ in range(8):
        if ink_radius(render(mark_svg(background=False, scale=scale))) <= limit:
            return scale
        scale *= 0.98
    raise SystemExit("could not fit the mark inside the Android safe zone")


# Android densities. The launcher icons under android/ have to be written
# directly: this project commits its android/ folder, so `expo prebuild` does
# not regenerate them and EAS Build explicitly does NOT sync `icon` from
# app.json (expo-doctor says so — it is the one check this repo knowingly
# fails). Updating only assets/icon.png therefore fixes iOS and silently
# leaves Android on whatever is already committed.
#
# The existing files are named *.webp but hold PNG data, which is what Expo's
# prebuild wrote and what the Android build already accepts. That is preserved
# exactly — the format is deliberately not "corrected" here.
LAUNCHER = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
FOREGROUND = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}
SPLASH_LOGO = {"mdpi": 288, "hdpi": 432, "xhdpi": 576, "xxhdpi": 864, "xxxhdpi": 1152}


def circle_crop(img):
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).ellipse([0, 0, img.size[0] - 1, img.size[1] - 1], fill=255)
    out = img.copy()
    out.putalpha(mask)
    return out


def write_android(scale):
    if not ANDROID_RES.is_dir():
        print("no android/ folder — skipping launcher icons")
        return
    # Every density directory must be present before anything is written. The
    # splash loop used to skip a missing one silently, which is the failure
    # this whole script exists to prevent: a run that reports success having
    # quietly left one density on the old icon. Either all of it is
    # regenerated or the run stops and says which directory is missing.
    missing = [str(d.relative_to(ROOT)) for d in
               [ANDROID_RES / f"mipmap-{k}" for k in LAUNCHER] +
               [ANDROID_RES / f"drawable-{k}" for k in SPLASH_LOGO]
               if not d.is_dir()]
    if missing:
        raise SystemExit("android resource directories missing: " + ", ".join(missing))

    opaque = mark_svg(background=True)
    foreground = mark_svg(background=False, scale=scale)
    splash = mark_svg(background=False, scale=scale * 0.82)
    written = 0
    for density, px in LAUNCHER.items():
        square = render(opaque, px)
        # PNG data under a .webp name: matches what is already committed.
        square.save(ANDROID_RES / f"mipmap-{density}/ic_launcher.webp", format="PNG")
        circle_crop(square).save(
            ANDROID_RES / f"mipmap-{density}/ic_launcher_round.webp", format="PNG")
        render(foreground, FOREGROUND[density]).save(
            ANDROID_RES / f"mipmap-{density}/ic_launcher_foreground.webp", format="PNG")
        written += 3
    for density, px in SPLASH_LOGO.items():
        render(splash, px).save(
            ANDROID_RES / f"drawable-{density}/splashscreen_logo.png")
        written += 1
    print(f"android: {written} launcher/splash files written")


def main():
    scale = android_scale()

    # iOS / store icon: opaque, no alpha channel.
    icon = render(mark_svg(background=True)).convert("RGB")
    icon.save(ASSETS / "icon.png")

    # Android adaptive foreground: transparent; app.json supplies the colour.
    render(mark_svg(background=False, scale=scale)).save(ASSETS / "adaptive-icon.png")

    # Splash: transparent, drawn a little smaller so it does not fill the screen.
    render(mark_svg(background=False, scale=scale * 0.82)).save(ASSETS / "splash-icon.png")

    # Web favicon.
    render(mark_svg(background=True), 48).save(ASSETS / "favicon.png")

    write_android(scale)

    limit = S * ANDROID_SAFE / 2
    fit = ink_radius(Image.open(ASSETS / "adaptive-icon.png"))
    assert fit <= limit, f"adaptive icon ink {fit:.0f}px exceeds safe radius {limit:.0f}px"
    print(f"android/splash scale {scale:.3f} — ink radius {fit:.0f}px "
          f"within safe radius {limit:.0f}px")
    for name in ("icon.png", "adaptive-icon.png", "splash-icon.png", "favicon.png"):
        im = Image.open(ASSETS / name)
        print(f"  {name:20} {im.size[0]}x{im.size[1]} {im.mode}")


if __name__ == "__main__":
    main()
