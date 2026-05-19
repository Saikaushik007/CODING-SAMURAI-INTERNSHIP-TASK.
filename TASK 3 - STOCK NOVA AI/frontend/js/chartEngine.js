const chartEngine = {
    priceChart: null,
    donutChart: null,
    sparklines: [],

    init() {
        Chart.defaults.color = '#9ca3af';
        Chart.defaults.font.family = 'Inter, sans-serif';
    },

    renderPriceChart(chartData, futurePreds, metrics) {
        const canvas = document.getElementById('price-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (this.priceChart) this.priceChart.destroy();

        let labels = [...chartData.dates];
        let actualData = [...chartData.actual_prices];
        let predData = [...chartData.test_predictions];
        
        let upperData = new Array(actualData.length).fill(null);
        let lowerData = new Array(actualData.length).fill(null);
        
        if (futurePreds && futurePreds.length > 0) {
            futurePreds.forEach(fp => {
                labels.push(fp.date);
                actualData.push(null);
                predData.push(fp.price);
                upperData.push(fp.upper_bound);
                lowerData.push(fp.lower_bound);
            });
            // Connect the last historical point to the first future point
            upperData[chartData.actual_prices.length - 1] = chartData.actual_prices[chartData.actual_prices.length - 1];
            lowerData[chartData.actual_prices.length - 1] = chartData.actual_prices[chartData.actual_prices.length - 1];
            predData[chartData.actual_prices.length - 1] = chartData.actual_prices[chartData.actual_prices.length - 1];
        }

        // Determine risk color for confidence band fill
        const lastPrice = chartData.actual_prices[chartData.actual_prices.length - 1];
        let bandFillColor = 'rgba(0, 223, 216, 0.1)'; // Cyan by default
        if (futurePreds && futurePreds.length > 0) {
            const lastLowerBound = futurePreds[futurePreds.length - 1].lower_bound;
            if (lastLowerBound < lastPrice) {
                bandFillColor = 'rgba(255, 51, 85, 0.15)'; // Bear red tint
            }
        }

        // Gradients
        const actualGrad = ctx.createLinearGradient(0, 0, 0, 400);
        actualGrad.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
        actualGrad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

        const predGrad = ctx.createLinearGradient(0, 0, 0, 400);
        predGrad.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
        predGrad.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

        this.priceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Actual Price',
                        data: actualData,
                        borderColor: '#10b981',
                        backgroundColor: actualGrad,
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0,
                        pointHitRadius: 10
                    },
                    {
                        label: 'Forecast',
                        data: predData,
                        borderColor: '#3b82f6',
                        backgroundColor: predGrad,
                        borderWidth: 2,
                        borderDash: [5, 5],
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0,
                    },
                    {
                        label: 'Upper Bound',
                        data: upperData,
                        borderColor: 'transparent',
                        backgroundColor: 'transparent',
                        fill: false,
                        pointRadius: 0,
                        pointHitRadius: 0
                    },
                    {
                        label: 'Lower Bound',
                        data: lowerData,
                        borderColor: 'transparent',
                        backgroundColor: bandFillColor,
                        fill: '-1', // Fill to Upper Bound
                        pointRadius: 0,
                        pointHitRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: (context) => {
                            if (!context.tooltip.dataPoints) return '#111827';
                            const index = context.tooltip.dataPoints[0].dataIndex;
                            if (index > 0 && actualData[index] !== null && actualData[index-1] !== null) {
                                return actualData[index] >= actualData[index-1] ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)';
                            }
                            return '#111827';
                        },
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#1f2937',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: true,
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                        ticks: { maxTicksLimit: 8 }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                        position: 'right'
                    }
                }
            }
        });
    },

    renderDonutChart(modelMetrics) {
        const canvas = document.getElementById('donut-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (this.donutChart) this.donutChart.destroy();

        // Convert R2 scores to a distribution showing relative confidence
        const labels = Object.keys(modelMetrics).map(m => m.toUpperCase());
        const data = Object.values(modelMetrics).map(m => Math.max(0, m.r2)); // Ensure no negative weights
        const colors = ['#3b82f6', '#8b5cf6', '#10b981'];

        this.donutChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#9ca3af', usePointStyle: true, padding: 20 }
                    }
                }
            }
        });
    },

    renderSparklines(actualPrices) {
        // Sparkline canvases replaced by micro-bars — this is a no-op
        return;
    },

    renderRSIChart(dates, rsiData) {
        const ctx = document.getElementById('rsi-chart')?.getContext('2d');
        if (!ctx) return;
        if (this.rsiChart) this.rsiChart.destroy();

        this.rsiChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Overbought (70)',
                        data: new Array(dates.length).fill(70),
                        borderColor: 'transparent',
                        pointRadius: 0,
                        fill: false
                    },
                    {
                        label: 'RSI',
                        data: rsiData,
                        borderColor: '#8b5cf6',
                        borderWidth: 2,
                        tension: 0.3,
                        pointRadius: 0,
                        fill: {
                            target: '-1',
                            above: 'rgba(239, 68, 68, 0.2)', // Red tint when > 70
                            below: 'transparent'
                        }
                    },
                    {
                        label: 'Oversold (30)',
                        data: new Array(dates.length).fill(30),
                        borderColor: 'transparent',
                        pointRadius: 0,
                        fill: {
                            target: 1, // Fill to RSI dataset
                            above: 'transparent',
                            below: 'rgba(16, 185, 129, 0.2)' // Green tint when < 30
                        }
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { position: 'right', min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' } }
                },
                plugins: {
                    annotation: {
                        annotations: {
                            line1: { type: 'line', yMin: 70, yMax: 70, borderColor: '#ef4444', borderWidth: 1, borderDash: [5, 5] },
                            line2: { type: 'line', yMin: 30, yMax: 30, borderColor: '#10b981', borderWidth: 1, borderDash: [5, 5] }
                        }
                    }
                }
            }
        });
    },

    renderMACDChart(dates, macdLine, signalLine, macdHist) {
        const ctx = document.getElementById('macd-chart')?.getContext('2d');
        if (!ctx) return;
        if (this.macdChart) this.macdChart.destroy();

        this.macdChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'MACD',
                        data: macdLine,
                        borderColor: '#06b6d4',
                        borderWidth: 1.5,
                        tension: 0.3,
                        pointRadius: 0
                    },
                    {
                        label: 'Signal',
                        data: signalLine,
                        borderColor: '#f59e0b',
                        borderWidth: 1.5,
                        tension: 0.3,
                        pointRadius: 0
                    },
                    {
                        type: 'bar',
                        label: 'Histogram',
                        data: macdHist,
                        backgroundColor: macdHist.map(v => v >= 0 ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'),
                        borderWidth: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { position: 'right', grid: { color: 'rgba(255,255,255,0.05)' } }
                }
            }
        });
    }
};
