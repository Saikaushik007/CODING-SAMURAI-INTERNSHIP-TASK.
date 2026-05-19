class ParticleNetwork {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.numParticles = 80;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.init();
        this.animate();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    init() {
        this.particles = [];
        for (let i = 0; i < this.numParticles; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1,
                color: Math.random() > 0.5 ? '#00dfd8' : '#ff0080' // Cyan or Pink
            });
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        for (let i = 0; i < this.numParticles; i++) {
            let p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            
            if (p.x < 0 || p.x > this.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.height) p.vy *= -1;
            
            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.fill();
            
            // Connect lines
            for (let j = i + 1; j < this.numParticles; j++) {
                let p2 = this.particles[j];
                let dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                
                if (dist < 150) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    let alpha = 1 - dist / 150;
                    
                    // Create glowing gradient line
                    let gradient = this.ctx.createLinearGradient(p.x, p.y, p2.x, p2.y);
                    gradient.addColorStop(0, `${p.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`);
                    gradient.addColorStop(1, `${p2.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`);
                    
                    this.ctx.strokeStyle = gradient;
                    this.ctx.lineWidth = 1.5;
                    this.ctx.stroke();
                }
            }
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new ParticleNetwork('bg-canvas');
});
