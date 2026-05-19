const searchUI = {
    allTickers: [],
    
    async init() {
        try {
            const data = await api.fetchTickers();
            this.allTickers = data.tickers;
        } catch (e) {
            console.error("Failed to load tickers", e);
        }
        
        const input = document.getElementById('ticker-input');
        const suggestions = document.getElementById('search-suggestions');
        const btn = document.getElementById('search-btn');
        
        input.addEventListener('input', () => {
            const val = input.value.toUpperCase();
            input.classList.remove('valid', 'invalid');
            
            if (!val) {
                suggestions.style.display = 'none';
                return;
            }
            
            if (val.length >= 3) {
                const isExactMatch = this.allTickers.includes(val);
                const hasPartialMatch = this.allTickers.some(t => t.startsWith(val));
                
                if (isExactMatch) {
                    input.classList.add('valid');
                } else if (!hasPartialMatch) {
                    input.classList.add('invalid');
                }
            }
            
            const filtered = this.allTickers.filter(t => t.startsWith(val)).slice(0, 8);
            if (filtered.length > 0) {
                suggestions.innerHTML = filtered.map(t => `<div class="suggestion-item"><span>${t}</span></div>`).join('');
                suggestions.style.display = 'block';
                
                Array.from(suggestions.children).forEach(child => {
                    child.addEventListener('click', () => {
                        input.value = child.innerText;
                        suggestions.style.display = 'none';
                        app.runAnalysis(input.value);
                    });
                });
            } else {
                suggestions.style.display = 'none';
            }
        });
        
        btn.addEventListener('click', () => {
            if (input.value) app.runAnalysis(input.value);
        });
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && input.value) {
                suggestions.style.display = 'none';
                app.runAnalysis(input.value);
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !suggestions.contains(e.target)) {
                suggestions.style.display = 'none';
            }
        });
    }
};
