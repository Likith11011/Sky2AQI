# 🌍 Sky2AQI — AI-Powered Air Quality Prediction from Sky Photos

Point a phone camera at the sky and get an instant AQI category, a confidence score, and health guidance. No hardware sensor is needed.

**Live backend:** https://sky2aqi.onrender.com  
**Live frontend:** `<your-vercel-url>`  
**Dataset:** [Air Pollution Image Dataset from India and Nepal](https://www.kaggle.com/datasets/adarshrouniyar/air-pollution-image-dataset-from-india-and-nepal) (12,240 labeled images)

---

## 📌 Problem

Air pollution is linked to more than 1.67 million deaths a year in India, and most of the country has no nearby official air quality monitor. Stations are sparse, expensive, and city-scale, so most people cannot tell how bad the air is where they are standing.

## 💡 Solution

Sky2AQI turns any smartphone into an approximate air quality sensor. A ResNet-34 CNN reads visual cues in a sky photo (haze density, color shift, visibility) and classifies the air into six AQI categories:

| Category | AQI Range |
|---|---|
| Good | 0–50 |
| Moderate | 51–100 |
| USG (Unhealthy for Sensitive Groups) | 101–150 |
| Unhealthy | 151–200 |
| Very Unhealthy | 201–300 |
| Hazardous | 301+ |

Each prediction returns the category, a confidence score, the probabilities for all six classes, and a health advisory.

---

## 🧠 Model & Results

- **Architecture:** ResNet-34 (ImageNet-pretrained), transfer learning, final layer replaced with `nn.Linear(512, 6)`
- **Training:** Adam (lr=0.001), `ReduceLROnPlateau`, early stopping (patience=5), best-checkpoint saving
- **Test accuracy:** 98.64%
- **Macro F1:** 98.70%
- **Model size:** ~81 MB

### Engineering note: the cloud-cover blind spot

Live phone photos with cloud cover were misclassified as Hazardous or USG. We found that the training dataset contains **no cloud-cover images in any AQI class**, so the model had learned to treat large pale regions as haze.

**Fix:** a custom `RandomCloudPatch` augmentation that pastes soft synthetic cloud regions onto training images across all classes, combined with stronger color jitter, rotation, and random erasing. This improved results on real cloudy photos, but it does not fully solve the problem (see Limitations).

---

## 🏗️ Architecture

```
Sky photo → Next.js frontend (Vercel) → FastAPI backend (Render) → ResNet-34 → AQI category + confidence + advisory
```

| Layer | Tech |
|---|---|
| Model training | PyTorch, torchvision |
| Backend API | FastAPI, Uvicorn |
| Frontend | Next.js, TypeScript |
| Deployment | Render (backend), Vercel (frontend) |

### API endpoints

| Endpoint | Description |
|---|---|
| `GET /health` | Service and model status |
| `POST /predict` | Upload an image and get the AQI category, confidence, all probabilities, and health advisory |
| `POST /predict-explain` | Same as `/predict`, plus a Grad-CAM heatmap (**local use only**, see notes) |
| `GET /samples` | Curated sample sky photos |
| `GET /model-stats` | Classification report and metrics |
| `GET /docs` | Swagger UI |

---

## 📁 Repository Structure

```
├── app.py                    # FastAPI backend
├── train.py                  # Model training pipeline
├── datapreparation.py        # Dataset splitting, loaders, augmentation
├── inspect_class.py          # Class-image inspection utility
├── requirements.txt
├── sky2aqi_model.pth         # Trained checkpoint
├── classification_report.json
├── confusion_matrix.png
├── training_curves.png
├── src/                      # Next.js app (components, lib, pages)
├── public/                   # Static assets and sample images
└── package.json
```

---

## 🚀 Run Locally

### 1. Backend

```bash
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
python app.py
```

The API runs at `http://localhost:8000` and the Swagger UI is at `http://localhost:8000/docs`.

> Use Python 3.11 or 3.12. PyTorch CUDA wheels are not available for Python 3.14.

### 2. Frontend

```bash
npm install
```

Create `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
npm run dev
```

### 3. (Optional) Retrain the model

Download the Kaggle dataset, extract it next to the scripts, then run:

```bash
python datapreparation.py      # creates train/val/test splits (70/15/15)
python train.py                # trains and saves sky2aqi_model.pth
```

---

## ☁️ Deployment Notes

- **Render (backend):** start command is `uvicorn app:app --host 0.0.0.0 --port $PORT`. The free tier has 512 MB of RAM, so `requirements.txt` uses CPU-only PyTorch wheels and `torch.set_num_threads(1)`. The first request after idle is slow (cold start).
- **Vercel (frontend):** set `NEXT_PUBLIC_API_URL` to the Render URL. This variable is inlined at build time, so redeploy without the build cache after changing it.
- **Grad-CAM** (`/predict-explain`) is disabled in production because it exceeds the free-tier memory limit. It works locally.

---

## ⚠️ Limitations

- Daytime sky photos only. There is no light-scattering signal to read at night.
- Heavy cloud cover and foreground objects (trees, buildings) can reduce accuracy. Augmentation improved this but did not fully solve it.
- The source dataset has limited scene diversity (many near-duplicate shots), so test accuracy overstates real-world accuracy.

## 🔮 Future Work

- Collect first-party, cloud-labeled AQI photos across devices and cities
- Day/night gating with a separate night-time model
- Multi-language health advisories and wider city coverage

---

## 👥 Team & Work Split

| Member | Role | Responsibilities |
|---|---|---|
| ** LIKITH.B ** | ML Engineer | Dataset preparation and splits (`datapreparation.py`), ResNet-34 training pipeline (`train.py`), augmentation (including `RandomCloudPatch`), evaluation (confusion matrix, classification report), diagnosing the cloud-cover failure, |
| ** KUSHITHA.B ** | Backend & Deployment | FastAPI service (`app.py`), endpoints and error handling, test-time augmentation, Grad-CAM,  |
| **Member 3** | Frontend & Presentation | Next.js interface and components, API integration (`src/lib/api.ts`), Vercel deployment, pitch deck, demo video, README |

---
## 👥 Contributors

- [Likith B](https://github.com/Likith11011)
- [KushithaBhaskar](https://github.com/KushithaBhaskar)
- [charmihalekya](https://github.com/charmihalekya)

## 📄 Licenses

Released for hackathon and educational use. Dataset credit: Adarsh Rouniyar (Kaggle).
