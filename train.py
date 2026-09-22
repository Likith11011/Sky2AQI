# File: train.py
"""
Sky2AQI - Part 2: Model Training
Trains a ResNet-34 (ImageNet-pretrained) classifier on the sky-image AQI
dataset prepared in Part 1. Produces sky2aqi_model.pth, training curves,
a confusion matrix, and a classification report.
"""

import matplotlib
matplotlib.use("Agg")  # non-interactive backend: never opens a blocking window

import copy
import json
from typing import Dict, List, Tuple

import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, classification_report
from tqdm import tqdm

import torch
import torch.nn as nn
import torch.optim as optim
from torch.optim.lr_scheduler import ReduceLROnPlateau
from torchvision import models

from datapreparation import build_dataloaders, SPLIT_DATA_DIR

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
NUM_EPOCHS = 30
LEARNING_RATE = 0.001
EARLY_STOP_PATIENCE = 5
LR_SCHEDULER_PATIENCE = 2
LR_SCHEDULER_FACTOR = 0.5
MODEL_SAVE_PATH = "sky2aqi_model.pth"
CURVES_SAVE_PATH = "training_curves.png"
CONFUSION_MATRIX_SAVE_PATH = "confusion_matrix.png"
CLASSIFICATION_REPORT_SAVE_PATH = "classification_report.json"

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------
def build_model(num_classes: int) -> nn.Module:
    """Loads pretrained ResNet-34 and replaces the final FC layer."""
    model = models.resnet34(weights=models.ResNet34_Weights.IMAGENET1K_V1)
    model.fc = nn.Linear(model.fc.in_features, num_classes)
    return model.to(DEVICE)


# ---------------------------------------------------------------------------
# Training / validation loops
# ---------------------------------------------------------------------------
def run_epoch(model: nn.Module,
              loader: torch.utils.data.DataLoader,
              criterion: nn.Module,
              optimizer: optim.Optimizer = None,
              desc: str = "") -> Tuple[float, float]:
    """
    Runs one epoch of training (if optimizer is given) or evaluation.
    Returns (average_loss, accuracy) for the epoch.
    """
    is_train = optimizer is not None
    model.train() if is_train else model.eval()

    running_loss = 0.0
    correct = 0
    total = 0

    torch.set_grad_enabled(is_train)
    progress_bar = tqdm(loader, desc=desc, leave=False)
    for images, labels in progress_bar:
        images, labels = images.to(DEVICE), labels.to(DEVICE)

        if is_train:
            optimizer.zero_grad()

        outputs = model(images)
        loss = criterion(outputs, labels)

        if is_train:
            loss.backward()
            optimizer.step()

        running_loss += loss.item() * images.size(0)
        _, preds = torch.max(outputs, 1)
        batch_correct = (preds == labels).sum().item()
        correct += batch_correct
        total += labels.size(0)

        progress_bar.set_postfix(loss=loss.item(), acc=batch_correct / labels.size(0))

    torch.set_grad_enabled(True)

    epoch_loss = running_loss / total
    epoch_acc = correct / total
    return epoch_loss, epoch_acc


def train_model(model: nn.Module,
                 train_loader: torch.utils.data.DataLoader,
                 val_loader: torch.utils.data.DataLoader,
                 num_epochs: int = NUM_EPOCHS) -> Tuple[nn.Module, Dict[str, List[float]]]:
    """
    Full training loop with validation, LR scheduling on plateau,
    early stopping, and best-model checkpointing (kept in memory,
    written to disk once at the end).
    """
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
    scheduler = ReduceLROnPlateau(optimizer, mode="min",
                                   factor=LR_SCHEDULER_FACTOR,
                                   patience=LR_SCHEDULER_PATIENCE)

    history = {"train_loss": [], "train_acc": [], "val_loss": [], "val_acc": []}

    best_val_loss = float("inf")
    best_model_state = copy.deepcopy(model.state_dict())
    epochs_without_improvement = 0

    for epoch in range(1, num_epochs + 1):
        train_loss, train_acc = run_epoch(model, train_loader, criterion, optimizer,
                                           desc=f"Epoch {epoch} [train]")
        val_loss, val_acc = run_epoch(model, val_loader, criterion, optimizer=None,
                                       desc=f"Epoch {epoch} [val]")

        scheduler.step(val_loss)

        history["train_loss"].append(train_loss)
        history["train_acc"].append(train_acc)
        history["val_loss"].append(val_loss)
        history["val_acc"].append(val_acc)

        current_lr = optimizer.param_groups[0]["lr"]
        print(f"Epoch {epoch}/{num_epochs} | "
              f"train_loss={train_loss:.4f} train_acc={train_acc:.4f} | "
              f"val_loss={val_loss:.4f} val_acc={val_acc:.4f} | lr={current_lr:.6f}")

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_model_state = copy.deepcopy(model.state_dict())
            epochs_without_improvement = 0
        else:
            epochs_without_improvement += 1

        if epochs_without_improvement >= EARLY_STOP_PATIENCE:
            print(f"Early stopping triggered after {epoch} epochs "
                  f"(no val_loss improvement for {EARLY_STOP_PATIENCE} epochs).")
            break

    model.load_state_dict(best_model_state)
    return model, history


# ---------------------------------------------------------------------------
# Plotting
# ---------------------------------------------------------------------------
def plot_training_curves(history: Dict[str, List[float]], save_path: str = CURVES_SAVE_PATH) -> None:
    """Plots and saves loss and accuracy curves for train/val (no blocking window)."""
    epochs_range = range(1, len(history["train_loss"]) + 1)

    fig, axes = plt.subplots(1, 2, figsize=(12, 5))

    axes[0].plot(epochs_range, history["train_loss"], label="Train Loss")
    axes[0].plot(epochs_range, history["val_loss"], label="Val Loss")
    axes[0].set_xlabel("Epoch")
    axes[0].set_ylabel("Loss")
    axes[0].set_title("Loss Curves")
    axes[0].legend()

    axes[1].plot(epochs_range, history["train_acc"], label="Train Accuracy")  
    axes[1].plot(epochs_range, history["val_acc"], label="Val Accuracy")
    axes[1].set_xlabel("Epoch")
    axes[1].set_ylabel("Accuracy")
    axes[1].set_title("Accuracy Curves")
    axes[1].legend() 

    plt.tight_layout()
    plt.savefig(save_path, dpi=150)
    plt.close(fig)
    print(f"Training curves saved to {save_path}")


# ---------------------------------------------------------------------------
# Test-set evaluation
# ---------------------------------------------------------------------------
def evaluate_on_test_set(model: nn.Module,
                          test_loader: torch.utils.data.DataLoader,
                          class_names: List[str]) -> None:
    """Runs inference on the test set and saves a confusion matrix + classification report."""
    model.eval()
    all_preds: List[int] = []
    all_labels: List[int] = []

    with torch.no_grad():
        for images, labels in tqdm(test_loader, desc="Evaluating test set"):
            images = images.to(DEVICE)
            outputs = model(images)
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy().tolist())
            all_labels.extend(labels.numpy().tolist())

    cm = confusion_matrix(all_labels, all_preds)
    fig = plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=class_names, yticklabels=class_names)
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.title("Confusion Matrix - Test Set")
    plt.tight_layout()
    plt.savefig(CONFUSION_MATRIX_SAVE_PATH, dpi=150)
    plt.close(fig)
    print(f"Confusion matrix saved to {CONFUSION_MATRIX_SAVE_PATH}")

    report = classification_report(all_labels, all_preds, target_names=class_names, output_dict=True)
    with open(CLASSIFICATION_REPORT_SAVE_PATH, "w") as f:
        json.dump(report, f, indent=2)
    print(f"Classification report saved to {CLASSIFICATION_REPORT_SAVE_PATH}")
    print(classification_report(all_labels, all_preds, target_names=class_names))


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print(f"Using device: {DEVICE}")

    train_loader, val_loader, test_loader, class_names = build_dataloaders(split_dir=SPLIT_DATA_DIR)
    print(f"Classes (index order): {class_names}")

    model = build_model(num_classes=len(class_names))
    model, history = train_model(model, train_loader, val_loader)

    # Save the model IMMEDIATELY after training, before any plotting/evaluation,
    # so a plotting error or crash can never cost you the trained weights again.
    torch.save({
        "model_state_dict": model.state_dict(),
        "class_names": class_names,
        "img_size": 224,
    }, MODEL_SAVE_PATH)
    print(f"Model saved to {MODEL_SAVE_PATH}")

    plot_training_curves(history)
    evaluate_on_test_set(model, test_loader, class_names)

    print("All done.")