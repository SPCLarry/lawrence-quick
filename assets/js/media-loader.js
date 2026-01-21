class MediaLoader {
    constructor() {
        this.queue = [];
        this.observer = null;
        this.maxConcurrent = 1; 
        this.activeDownloads = 0;
        
        // CLI Animation Helpers
        this.spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        this.spinnerIdx = 0;

        this.initObserver();
    }

    static getInstance() {
        if (!window.mediaLoaderInstance) {
            window.mediaLoaderInstance = new MediaLoader();
        }
        return window.mediaLoaderInstance;
    }

    initObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const videoData = this.queue.find(item => item.element === entry.target);
                if (videoData) {
                    videoData.inView = entry.isIntersecting;
                    this.updatePriorities();
                }
            });
        }, {
            rootMargin: '200px 0px',
            threshold: 0.1
        });
    }

    register(videoElement, isHighPriority = false) {
        if (videoElement.dataset.mediaLoaded === "true") return;
        if (this.queue.some(item => item.element === videoElement)) return;

        const wrapper = videoElement.closest('.video-wrapper') || videoElement.parentElement;
        if (wrapper) {
            wrapper.classList.add('is-loading');
            
            // 1. Inject Poster
            if (!wrapper.querySelector('.poster-image')) {
                const posterUrl = videoElement.poster; 
                if (posterUrl) {
                    const img = document.createElement('img');
                    img.src = posterUrl;
                    img.className = 'poster-image';
                    img.alt = ""; // Decorative
                    img.onerror = () => { console.warn("Poster failed:", img.src); };
                    wrapper.insertBefore(img, videoElement); 
                }
            }

            // 2. Inject Terminal Loader (CLI Style)
            if (!wrapper.querySelector('.loader-terminal-container')) {
                const term = document.createElement('div');
                term.className = 'loader-terminal-container';
                term.innerHTML = `
                    <div class="term-row-status">
                        <span><span class="term-spinner">⠋</span> FETCH_BLOB</span>
                        <span class="term-percent">0%</span>
                    </div>
                    <div class="term-progress-bar">[....................]</div>
                    <div class="term-hex-dump">0x00000000</div>
                `;
                wrapper.appendChild(term);
            }
        }

        this.queue.push({
            element: videoElement,
            inView: false,
            forcedPriority: isHighPriority,
            score: 0
        });

        this.observer.observe(videoElement);
        this.updatePriorities();
    }

    updatePriorities() {
        this.queue.forEach(item => {
            let score = 0;
            if (item.forcedPriority) score += 100;
            if (item.inView) score += 50;
            item.score = score;
        });

        this.queue.sort((a, b) => b.score - a.score);
        this.processQueue();
    }

    processQueue() {
        if (this.activeDownloads >= this.maxConcurrent) return;
        if (this.queue.length === 0) return;

        const candidate = this.queue[0];
        if (candidate.score === 0 && this.activeDownloads > 0) return;

        this.loadVideoBlob(candidate);
    }

    // --- UTILS FOR CLI ANIMATION ---
    getProgressBar(percent) {
        const totalChars = 20;
        const filledChars = Math.floor((percent / 100) * totalChars);
        const emptyChars = totalChars - filledChars;
        return '[' + '▓'.repeat(filledChars) + '░'.repeat(emptyChars) + ']';
    }

    getRandomHex() {
        // Generates fake memory addresses like 0x4A1F...
        return '0x' + Math.floor(Math.random()*16777215).toString(16).toUpperCase().padStart(8, '0') + 
               ' :: ' + Math.floor(Math.random()*16777215).toString(16).toUpperCase().padStart(8, '0');
    }

    async loadVideoBlob(item) {
        const video = item.element;
        const src = video.dataset.src;
        const wrapper = video.closest('.video-wrapper');
        
        // UI References
        const termContainer = wrapper ? wrapper.querySelector('.loader-terminal-container') : null;
        const uiSpinner = termContainer ? termContainer.querySelector('.term-spinner') : null;
        const uiPercent = termContainer ? termContainer.querySelector('.term-percent') : null;
        const uiBar = termContainer ? termContainer.querySelector('.term-progress-bar') : null;
        const uiHex = termContainer ? termContainer.querySelector('.term-hex-dump') : null;

        this.queue = this.queue.filter(q => q !== item);
        this.observer.unobserve(video);
        this.activeDownloads++;

        if (!src) {
            this.activeDownloads--;
            return;
        }

        try {
            const response = await fetch(src);
            if (!response.ok) throw new Error(`Failed to fetch ${src}`);

            const contentLength = response.headers.get('content-length');
            const total = parseInt(contentLength, 10);
            let loaded = 0;

            const reader = response.body.getReader();
            const chunks = [];

            // Frame counter to slow down spinner speed slightly
            let frameTick = 0; 

            while(true) {
                const {done, value} = await reader.read();
                if (done) break;
                
                chunks.push(value);
                loaded += value.length;

                // UPDATE UI
                if (total && termContainer) {
                    const percent = Math.floor((loaded / total) * 100);
                    
                    // Update Text
                    if (uiPercent) uiPercent.innerText = `${percent}%`;
                    if (uiBar) uiBar.innerText = this.getProgressBar(percent);
                    
                    // Update Hex (Rapid change)
                    if (uiHex) uiHex.innerText = this.getRandomHex();

                    // Update Spinner (Cycle every 5 ticks to not be too crazy)
                    frameTick++;
                    if (uiSpinner && frameTick % 5 === 0) {
                        this.spinnerIdx = (this.spinnerIdx + 1) % this.spinnerFrames.length;
                        uiSpinner.innerText = this.spinnerFrames[this.spinnerIdx];
                    }
                }
            }

            const blob = new Blob(chunks);
            const objectUrl = URL.createObjectURL(blob);
            video.src = objectUrl;
            
            await video.play();

            if (wrapper) {
                wrapper.classList.remove('is-loading');
                wrapper.classList.add('is-playing');
                // Cleanup UI
                setTimeout(() => {
                    if (termContainer) termContainer.remove();
                }, 500);
            }

        } catch (err) {
            console.error("Video load failed:", err);
            video.src = src; 
        } finally {
            this.activeDownloads--;
            video.dataset.mediaLoaded = "true";
            this.processQueue();
        }
    }
}

const mediaLoader = MediaLoader.getInstance();

document.addEventListener("DOMContentLoaded", () => {
    const lazyVideos = document.querySelectorAll('video.lazy-video');
    lazyVideos.forEach(v => mediaLoader.register(v));
});