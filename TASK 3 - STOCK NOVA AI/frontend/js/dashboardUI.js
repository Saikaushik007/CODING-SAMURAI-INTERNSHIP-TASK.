const dashboardUI = {
    renderTickerHero(info) {
        document.getElementById('dashboard-grid').style.display = 'block';
        
        document.getElementById('greeting').textContent = `${info.name} (${info.symbol})`;
        
        const priceEl = document.getElementById('hero-price');
        this.animateNumberChange(priceEl, info.currentPrice, { prefix: '$', decimals: 2 });
        
        const changeEl = document.getElementById('hero-change');
        const sign = info.change >= 0 ? '+' : '';
        const changePct = Number(info.changePct || 0);
        
        setTimeout(() => {
            changeEl.textContent = `${sign}${changePct.toFixed(2)}%`;
            changeEl.className = `card-badge ${info.change >= 0 ? '' : 'red'}`;
            
            const root = document.documentElement;
            if(info.change < 0) {
                changeEl.style.background = 'rgba(239, 68, 68, 0.1)';
                changeEl.style.color = 'var(--accent-red)';
                root.style.setProperty('--live-accent', 'var(--bear-red)');
            } else {
                changeEl.style.background = 'rgba(16, 185, 129, 0.1)';
                changeEl.style.color = 'var(--accent-green)';
                root.style.setProperty('--live-accent', 'var(--bull-green)');
            }
        }, 300);
        
        const statusEl = document.getElementById('hero-status');
        statusEl.innerHTML = `<span class="dot ${info.marketStatus === 'OPEN' ? 'live-dot' : ''}"></span> MKT ${info.marketStatus}`;
        if(info.marketStatus === 'OPEN') {
            statusEl.classList.add('live');
        } else {
            statusEl.classList.remove('live');
        }
    },

    renderMetrics(metrics, price = 100) {
        this.animateNumberChange(document.getElementById('metric-mae'), metrics.mae, { prefix: '$', decimals: 2 });
        this.animateNumberChange(document.getElementById('metric-rmse'), metrics.rmse, { prefix: '$', decimals: 2 });
        this.animateNumberChange(document.getElementById('metric-r2'), metrics.r2, { decimals: 4 });
        
        // R2 Color Intelligence & Micro Bar
        const r2Card = document.getElementById('metric-r2').closest('.metric-card');
        const r2Bar = document.getElementById('bar-r2');
        if (r2Card) {
            r2Card.classList.remove('score-high', 'score-med', 'score-low');
            let color = 'var(--bear-red)';
            if (metrics.r2 >= 0.90) { r2Card.classList.add('score-high'); color = 'var(--bull-green)'; }
            else if (metrics.r2 >= 0.70) { r2Card.classList.add('score-med'); color = 'var(--accent-gold)'; }
            else { r2Card.classList.add('score-low'); }
            
            r2Bar.style.width = `${Math.max(0, Math.min(100, metrics.r2 * 100))}%`;
            r2Bar.style.background = color;
        }
        
        // Error Bars (lower is better, red if high)
        const maePct = (metrics.mae / price) * 100;
        const maeWidth = Math.min(100, maePct * 10);
        const rmsePct = (metrics.rmse / price) * 100;
        const rmseWidth = Math.min(100, rmsePct * 10);
        
        document.getElementById('bar-mae').style.width = `${maeWidth}%`;
        document.getElementById('bar-mae').style.background = maePct > 2 ? 'var(--bear-red)' : 'var(--bull-green)';
        
        document.getElementById('bar-rmse').style.width = `${rmseWidth}%`;
        document.getElementById('bar-rmse').style.background = rmsePct > 2 ? 'var(--bear-red)' : 'var(--bull-green)';
        
        // Strategy Alpha trend
        document.getElementById('mae-trend').textContent = `DIR ACC: ${metrics.direction_accuracy || 0}%`;
        document.getElementById('rmse-trend').textContent = `ALPHA: ${metrics.strategy_alpha > 0 ? '+' : ''}${metrics.strategy_alpha || 0}%`;
        document.getElementById('rmse-trend').className = `card-badge ${metrics.strategy_alpha > 0 ? '' : 'red'}`;
        document.getElementById('mae-trend').className = `card-badge ${metrics.direction_accuracy > 50 ? '' : 'red'}`;
        
        const r2Trend = document.getElementById('r2-trend');
        r2Trend.textContent = metrics.verdict;
        if(metrics.r2 > 0.8) {
            r2Trend.style.color = 'var(--accent-green)';
            r2Trend.style.background = 'rgba(16, 185, 129, 0.1)';
        }
        
        const verdictEl = document.getElementById('model-verdict');
        verdictEl.textContent = `SYSTEM VERDICT: ${metrics.verdict}`;
    },

    renderPredictionTable(predictions) {
        const tbody = document.getElementById('prediction-table-body');
        tbody.innerHTML = '';
        
        if (!predictions || predictions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="color:var(--text-muted); text-align:center;">No predictions available</td></tr>';
            return;
        }
        
        predictions.forEach((pred, i) => {
            // Backend sends: { date, price, lower_bound, upper_bound }
            const date  = pred.date  || pred.Date  || 'N/A';
            const close = Number(pred.price || pred.Predicted_Close || 0);
            const lower = Number(pred.lower_bound || pred.Lower_Bound || 0);
            const upper = Number(pred.upper_bound || pred.Upper_Bound || 0);
            
            const dayLabel = i === 0 ? 'Tomorrow' : `Day +${i + 1}`;
            const trend    = i === 0 ? '' : (close > Number(predictions[i-1].price || predictions[i-1].Predicted_Close || 0) ? '▲' : '▼');
            const trendColor = trend === '▲' ? 'var(--bull-green)' : 'var(--bear-red)';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <span style="font-weight:700; color:var(--text-primary);">${dayLabel}</span>
                    <span style="display:block; font-size:10px; color:var(--text-muted);">${date}</span>
                </td>
                <td style="color: var(--live-accent); font-weight: 700;">
                    $${close.toFixed(2)}
                    <span style="color:${trendColor}; font-size:11px; margin-left:4px;">${trend}</span>
                </td>
                <td style="color: var(--text-secondary);">
                    $${lower.toFixed(2)} &ndash; $${upper.toFixed(2)}
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    renderComparison(data) {
        const grid = document.getElementById('comparison-grid');
        grid.innerHTML = '';
        
        Object.entries(data.metrics).forEach(([model, metrics]) => {
            const isBest = model === data.best_model;
            const div = document.createElement('div');
            div.className = `compare-card ${isBest ? 'best' : ''}`;
            
            div.innerHTML = `
                <div class="comp-model">${model}</div>
                <div class="comp-score">${metrics.r2}</div>
                <div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">${metrics.verdict}</div>
            `;
            grid.appendChild(div);
        });
    },

    showLoading(msg) {
        const overlay = document.getElementById('loading-overlay');
        overlay.classList.add('active');
        
        const msgEl = document.getElementById('loading-msg');
        msgEl.textContent = '';
        let i = 0;
        clearInterval(this.typingInterval);
        this.typingInterval = setInterval(() => {
            if (i < msg.length) {
                msgEl.textContent += msg.charAt(i).toUpperCase();
                i++;
            } else {
                clearInterval(this.typingInterval);
            }
        }, 30);
    },

    hideLoading() {
        document.getElementById('loading-overlay').classList.remove('active');
        clearInterval(this.typingInterval);
    },
    
    animateNumberChange(element, newValue, options = {}) {
        const { prefix = '', suffix = '', decimals = 0, duration = 1000 } = options;
        
        if (isNaN(newValue) || element.dataset.value == newValue) {
            element.textContent = `${prefix}${newValue}${suffix}`;
            return;
        }

        const startValue = parseFloat(element.dataset.value || 0);
        const endValue = Number(newValue) || 0;
        const startTime = performance.now();

        element.dataset.value = endValue;
        element.classList.add('num-value');
        
        // Flash Effect
        const flashClass = endValue > startValue ? 'flash-up' : 'flash-down';
        element.classList.add(flashClass);
        setTimeout(() => element.classList.remove(flashClass), 300);

        const animate = (currentTime) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            
            const currentVal = startValue + (endValue - startValue) * easeProgress;
            
            element.textContent = `${prefix}${currentVal.toFixed(decimals)}${suffix}`;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = `${prefix}${endValue.toFixed(decimals)}${suffix}`;
            }
        };

        requestAnimationFrame(animate);
    }
};
