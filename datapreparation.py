"""
Sky2AQI - Part 1: Data Preparation
Organizes the manually-downloaded Kaggle "Air Pollution Image Dataset from
India and Nepal" (Combined_Dataset/IND_and_NEP) into train/val/test splits,
and defines PyTorch Dataset/DataLoader classes with augmentation.
"""

import os
import random
import shutil
from pathlib import Path
from typing import List, Tuple, Dict

import matplotlib.pyplot as plt
from PIL import Image

import torch
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
# Points directly at the combined dataset folder found on disk.
# Adjust this path if you move the extracted dataset elsewhere.
RAW_DATA_DIR = (
    r"Air Pollution Image Dataset\Air Pollution Image Dataset"
    r"\Combined_Dataset\IND_and_NEP"
)
SPLIT_DATA_DIR = "sky2aqi_data"
TRAIN_RATIO = 0.70
VAL_RATIO = 0.15
TEST_RATIO = 0.15
SEED = 42
IMG_SIZE = 224
BATCH_SIZE = 32
NUM_WORKERS = 2

# Explicit mapping: our AQI class name -> exact source folder name on disk.
# The dataset uses "f_Severe" for the top category; we relabel it "Hazardous".
CLASS_FOLDER_MAP = {
    "Good": "a_Good",
    "Moderate": "b_Moderate",
    "USG": "c_Unhealthy_for_Sensitive_Groups",
    "Unhealthy": "d_Unhealthy",
    "Very_Unhealthy": "e_Very_Unhealthy",
    "Hazardous": "f_Severe",
}
AQI_CLASSES = list(CLASS_FOLDER_MAP.keys())

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

random.seed(SEED)


# ---------------------------------------------------------------------------
# Step 1: Organize images into train/val/test splits
# ---------------------------------------------------------------------------
def find_class_folders(raw_dir: str) -> Dict[str, str]:
    """
    Resolves each AQI class to its exact source folder using CLASS_FOLDER_MAP,
    and verifies the folder actually exists on disk.
    """
    if not os.path.isdir(raw_dir):
        raise FileNotFoundError(
            f"'{raw_dir}' not found. Check RAW_DATA_DIR matches your extracted "
            f"dataset location."
        )

    class_folders = {}
    missing = []
    for aqi_class, folder_name in CLASS_FOLDER_MAP.items():
        candidate = os.path.join(raw_dir, folder_name)
        if os.path.isdir(candidate):
            class_folders[aqi_class] = candidate
        else:
            missing.append(f"{aqi_class} (expected '{folder_name}')")

    if missing:
        raise FileNotFoundError(
            f"Could not find these class folders under {raw_dir}: {missing}. "
            f"Check CLASS_FOLDER_MAP against the actual folder names."
        )

    return class_folders


def create_splits(raw_dir: str = RAW_DATA_DIR,
                   split_dir: str = SPLIT_DATA_DIR,
                   train_ratio: float = TRAIN_RATIO,
                   val_ratio: float = VAL_RATIO,
                   test_ratio: float = TEST_RATIO) -> None:
    """
    Splits each class's images into train/val/test folders (70/15/15 by default).
    Resulting structure:
        sky2aqi_data/train/<class>/*.jpg
        sky2aqi_data/val/<class>/*.jpg
        sky2aqi_data/test/<class>/*.jpg
    """
    assert abs(train_ratio + val_ratio + test_ratio - 1.0) < 1e-6, "Ratios must sum to 1.0"

    class_folders = find_class_folders(raw_dir)

    for split in ["train", "val", "test"]:
        for aqi_class in AQI_CLASSES:
            os.makedirs(os.path.join(split_dir, split, aqi_class), exist_ok=True)

    valid_exts = {".jpg", ".jpeg", ".png"}

    for aqi_class, folder in class_folders.items():
        images = [f for f in os.listdir(folder)
                  if Path(f).suffix.lower() in valid_exts]
        random.shuffle(images)

        n_total = len(images)
        n_train = int(n_total * train_ratio)
        n_val = int(n_total * val_ratio)

        splits = {
            "train": images[:n_train],
            "val": images[n_train:n_train + n_val],
            "test": images[n_train + n_val:],
        }

        for split_name, file_list in splits.items():
            for fname in file_list:
                src = os.path.join(folder, fname)
                dst = os.path.join(split_dir, split_name, aqi_class, fname)
                shutil.copy2(src, dst)

        print(f"{aqi_class}: {n_total} total -> "
              f"train={len(splits['train'])}, val={len(splits['val'])}, test={len(splits['test'])}")

    print(f"Split dataset written to: {split_dir}")


# ---------------------------------------------------------------------------
# Step 2: PyTorch Dataset and DataLoader
# ---------------------------------------------------------------------------
class SkyAQIDataset(Dataset):
    """Custom Dataset that loads sky images and their AQI class labels."""

    def __init__(self, root_dir: str, transform: transforms.Compose = None):
        self.root_dir = root_dir
        self.transform = transform
        self.classes = sorted(os.listdir(root_dir))
        self.class_to_idx = {cls_name: idx for idx, cls_name in enumerate(self.classes)}

        self.samples: List[Tuple[str, int]] = []
        for cls_name in self.classes:
            cls_dir = os.path.join(root_dir, cls_name)
            for fname in os.listdir(cls_dir):
                if Path(fname).suffix.lower() in {".jpg", ".jpeg", ".png"}:
                    self.samples.append((os.path.join(cls_dir, fname), self.class_to_idx[cls_name]))

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int]:
        img_path, label = self.samples[idx]
        image = Image.open(img_path).convert("RGB")

        if self.transform:
            image = self.transform(image)

        return image, label


# ---------------------------------------------------------------------------
# Step 3: Data augmentation transforms
# ---------------------------------------------------------------------------
import numpy as np
from PIL import ImageDraw, ImageFilter

class RandomCloudPatch:
    """
    Pastes 0-3 soft, blurred white/grey elliptical patches onto the image to
    simulate cloud cover. Applied across ALL classes during training so the
    model learns that large pale regions alone don't indicate haze/pollution
    severity -- it has to rely on color tint/saturation instead.
    """

    def __init__(self, p: float = 0.5, max_patches: int = 3):
        self.p = p
        self.max_patches = max_patches

    def __call__(self, img):
        if random.random() > self.p:
            return img

        img = img.convert("RGB")
        overlay = img.copy()
        draw = ImageDraw.Draw(overlay)
        w, h = img.size

        n_patches = random.randint(1, self.max_patches)
        for _ in range(n_patches):
            patch_w = random.randint(w // 5, w // 2)
            patch_h = random.randint(h // 6, h // 3)
            x0 = random.randint(0, max(1, w - patch_w))
            y0 = random.randint(0, max(1, h - patch_h))
            shade = random.randint(215, 250)  # near-white, like real clouds
            draw.ellipse(
                [x0, y0, x0 + patch_w, y0 + patch_h],
                fill=(shade, shade, min(255, shade + 5)),
            )

        overlay = overlay.filter(ImageFilter.GaussianBlur(radius=random.randint(8, 20)))
        blend_alpha = random.uniform(0.35, 0.65)
        blended = Image.blend(img, overlay, blend_alpha)
        return blended


train_transform = transforms.Compose([
    transforms.RandomResizedCrop(IMG_SIZE, scale=(0.7, 1.0)),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomRotation(degrees=25),
    RandomCloudPatch(p=0.5, max_patches=3),
    transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.3, hue=0.05),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    transforms.RandomErasing(p=0.25, scale=(0.02, 0.15), ratio=(0.3, 3.3)),
])

eval_transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])


def build_dataloaders(split_dir: str = SPLIT_DATA_DIR,
                       batch_size: int = BATCH_SIZE,
                       num_workers: int = NUM_WORKERS) -> Tuple[DataLoader, DataLoader, DataLoader, List[str]]:
    """Builds train/val/test DataLoaders with the appropriate transforms."""
    train_ds = SkyAQIDataset(os.path.join(split_dir, "train"), transform=train_transform)
    val_ds = SkyAQIDataset(os.path.join(split_dir, "val"), transform=eval_transform)
    test_ds = SkyAQIDataset(os.path.join(split_dir, "test"), transform=eval_transform)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True,
                               num_workers=num_workers, pin_memory=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False,
                             num_workers=num_workers, pin_memory=True)
    test_loader = DataLoader(test_ds, batch_size=batch_size, shuffle=False,
                              num_workers=num_workers, pin_memory=True)

    print(f"Train samples: {len(train_ds)} | Val samples: {len(val_ds)} | Test samples: {len(test_ds)}")

    return train_loader, val_loader, test_loader, train_ds.classes


# ---------------------------------------------------------------------------
# Step 4: Display sample images from each AQI category
# ---------------------------------------------------------------------------
def show_sample_images(split_dir: str = SPLIT_DATA_DIR, split: str = "train", n_per_class: int = 2) -> None:
    """Plots a grid of sample images, n_per_class per AQI category."""
    class_dir_root = os.path.join(split_dir, split)
    classes = sorted(os.listdir(class_dir_root))

    fig, axes = plt.subplots(len(classes), n_per_class, figsize=(n_per_class * 3, len(classes) * 3))

    for row, cls_name in enumerate(classes):
        cls_path = os.path.join(class_dir_root, cls_name)
        img_files = [f for f in os.listdir(cls_path) if Path(f).suffix.lower() in {".jpg", ".jpeg", ".png"}]
        sample_files = random.sample(img_files, min(n_per_class, len(img_files)))

        for col, fname in enumerate(sample_files):
            img = Image.open(os.path.join(cls_path, fname)).convert("RGB")
            ax = axes[row, col] if len(classes) > 1 else axes[col]
            ax.imshow(img)
            ax.set_title(cls_name, fontsize=10)
            ax.axis("off")

    plt.tight_layout()
    plt.savefig("sample_images.png", dpi=150)
    plt.show()
    print("Sample grid saved to sample_images.png")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    create_splits()
    train_loader, val_loader, test_loader, class_names = build_dataloaders()
    print(f"Classes: {class_names}")
    show_sample_images()