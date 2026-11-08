"""Generate the placeholder app identity (T-180): the letter K on fac/primary.

Run: python scripts/gen-app-icons.py  (needs Pillow). Output goes to assets/app/.
The designer replaces these files (H-05).
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "app"
FONT = ROOT / "assets" / "fonts" / "NotoSans_700Bold.ttf"
PRIMARY = (0x25, 0x63, 0xEB, 255)  # fac/primary (Light)
ON_PRIMARY = (255, 255, 255, 255)  # fac/on-primary
SIZE = 1024


def letter(img: Image.Image, scale: float, fill) -> None:
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(str(FONT), int(SIZE * scale))
    box = draw.textbbox((0, 0), "K", font=font)
    w, h = box[2] - box[0], box[3] - box[1]
    draw.text(((SIZE - w) / 2 - box[0], (SIZE - h) / 2 - box[1]), "K", font=font, fill=fill)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    icon = Image.new("RGBA", (SIZE, SIZE), PRIMARY)
    letter(icon, 0.62, ON_PRIMARY)
    icon.save(OUT / "icon.png")

    # Adaptive icon: keep the letter inside the 66 % safe zone.
    fg = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    letter(fg, 0.42, ON_PRIMARY)
    fg.save(OUT / "adaptive-foreground.png")
    Image.new("RGBA", (SIZE, SIZE), PRIMARY).save(OUT / "adaptive-background.png")
    mono = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    letter(mono, 0.42, (0, 0, 0, 255))
    mono.save(OUT / "adaptive-monochrome.png")

    splash = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    letter(splash, 0.5, ON_PRIMARY)
    splash.save(OUT / "splash.png")
    print("wrote", sorted(p.name for p in OUT.iterdir()))


if __name__ == "__main__":
    main()
