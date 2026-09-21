# File: inspect_classes.py
"""Quick diagnostic: view sample training images from Good/Moderate classes
to check whether cloud-heavy skies are represented in the low-AQI categories."""

import os
import random
from pathlib import Path
import matplotlib.pyplot as plt
from PIL import Image

SPLIT_DATA_DIR = "sky2aqi_data"
CLASSES_TO_CHECK = ["Good", "Moderate"]
N_SAMPLES = 12

for cls in CLASSES_TO_CHECK:
    cls_dir = os.path.join(SPLIT_DATA_DIR, "train", cls)
    img_files = [f for f in os.listdir(cls_dir) if Path(f).suffix.lower() in {".jpg", ".jpeg", ".png"}]
    samples = random.sample(img_files, min(N_SAMPLES, len(img_files)))

    fig, axes = plt.subplots(3, 4, figsize=(14, 10))
    fig.suptitle(f"Training images labeled: {cls}", fontsize=14)
    for ax, fname in zip(axes.flat, samples):
        img = Image.open(os.path.join(cls_dir, fname)).convert("RGB")
        ax.imshow(img)
        ax.axis("off")
    plt.tight_layout()
    plt.savefig(f"inspect_{cls}.png", dpi=120)
    plt.close(fig)
    print(f"Saved inspect_{cls}.png")