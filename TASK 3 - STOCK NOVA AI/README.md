---
title: StockNova Terminal 3.0
emoji: 📈
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
---

# 🌌 StockNova AI Terminal 3.0

StockNova Terminal 3.0 is a professional-grade, dark-mode, glassmorphic financial dashboard that predicts 7-day stock movements using Machine Learning (RidgeCV, Gradient Boosting, Neural Networks, and Ensembling). It operates exclusively in the browser with an AI backend, deploying easily via Hugging Face Spaces.

## 🚀 Features
- **Color Temperature Engine**: The entire UI changes its active accent color based on daily performance (Green for Bull, Red for Bear).
- **Ensemble Machine Learning**: Dynamically weights and combines Ridge Regression, Polynomial Regression, and Gradient Boosting for state-of-the-art accuracy.
- **Log-Returns & Stationarity**: Performs ADF stationarity testing and predicts logarithmic returns for quantitative mathematical stability.
- **Interactive Confidence Bands**: Risk-aware future bounds overlaid directly on the price chart, changing color dynamically when downside risk is high.
- **Micro-Bar Visualizations & Flashes**: Data-dense aesthetic with tight typography, `tabular-nums`, and flash-on-update animations.
- **Synthetic Fallback Mode**: If `yfinance` API rate limits are hit, the system seamlessly defaults to a Geometric Brownian Motion data generator without interrupting the UI.

## 🛠 Tech Stack
- **Frontend**: HTML5, CSS3 Variables, Vanilla JS, Chart.js.
- **Backend**: Python 3.10, Flask, Gunicorn.
- **Data/ML**: Scikit-Learn, Statsmodels, Pandas, NumPy, yfinance.
- **Deployment**: Hugging Face Spaces (Docker).

## ⚡ Running Locally

```bash
# 1. Install dependencies
cd backend
pip install -r requirements.txt

# 2. Run the server
python server.py
# Server starts at http://127.0.0.1:7860
```

## 🐳 Hugging Face Deployment
This repository contains a Hugging Face compatible `Dockerfile`. It configures a non-root user and maps Gunicorn to port `7860`.

1. Create a **Blank Docker Space** on Hugging Face.
2. Link this GitHub repository.
3. The Space will automatically build the image and deploy the Terminal.

> **Note**: Hugging Face Spaces are completely free and eliminate the need for credit cards required by Render or Heroku.

## 📈 Architecture Note
The AI engine runs standard `TimeSeriesSplit` cross-validation iteratively to compute backtesting Alpha and Directional Accuracy. To ensure fast API response times (<3 seconds), heavy hyperparameter tuning is bypassed in favor of robust L2-regularized `RidgeCV` and small-footprint models.
