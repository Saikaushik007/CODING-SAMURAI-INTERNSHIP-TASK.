const API_BASE = '/api';

async function safeFetch(url, options = {}) {
    try {
        const response = await fetch(url, options);
        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error(`API Error on ${url}: Response is not JSON`, text.substring(0, 200));
            return { error: `Server Error (${response.status}): ${text.substring(0, 50)}...` };
        }
    } catch (e) {
        return { error: `Network Error: ${e.message}` };
    }
}

const api = {
    async fetchPrediction(ticker, modelType, period, featureSet = 'technical') {
        return safeFetch(`${API_BASE}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticker, model_type: modelType, period, feature_set: featureSet })
        });
    },

    async fetchCompare(ticker, period) {
        return safeFetch(`${API_BASE}/compare`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticker, period })
        });
    },

    async fetchStockInfo(ticker) {
        return safeFetch(`${API_BASE}/stock/info?ticker=${ticker}`);
    },

    async fetchAnalysis(ticker, period) {
        return safeFetch(`${API_BASE}/analysis?ticker=${ticker}&period=${period}`);
    },

    async fetchTickers() {
        return safeFetch(`${API_BASE}/stock/tickers`);
    }
};

