class MediaLoader {
    constructor() {
        this.queue = [];
        this.observer = null;
        this.maxConcurrent = 1; 
        this.activeDownloads = 0;

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

        // 1. VISUAL SETUP: Inject Cup Loader & Poster
        const wrapper = videoElement.closest('.video-wrapper') || videoElement.parentElement;
        if (wrapper) {
            wrapper.classList.add('is-loading');
            
            // A. Inject Poster Image
            if (!wrapper.querySelector('.poster-image')) {
                const posterUrl = videoElement.poster; 
                if (posterUrl) {
                    const img = document.createElement('img');
                    img.src = posterUrl;
                    img.className = 'poster-image';
                    img.alt = "Loading Media...";
                    img.onerror = () => { console.warn("Poster failed:", img.src); };
                    wrapper.insertBefore(img, videoElement); 
                }
            }

            // B. Inject Coffee Cup Loader (if not exists)
            if (!wrapper.querySelector('.loader-cup-container')) {
                const loader = document.createElement('div');
                loader.className = 'loader-cup-container';
                loader.innerHTML = `
                    <div class="steam-container">
                        <span class="steam-puff"></span>
                        <span class="steam-puff"></span>
                        <span class="steam-puff"></span>
                    </div>
                    <div class="cup-body">
                        <div class="liquid"></div>
                    </div>
                    <div class="cup-handle"></div>
                `;
                // Append it into the wrapper
                wrapper.appendChild(loader);
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

    async loadVideoBlob(item) {
        const video = item.element;
        const src = video.dataset.src;
        const wrapper = video.closest('.video-wrapper');
        const loaderContainer = wrapper ? wrapper.querySelector('.loader-cup-container') : null;

        // Remove from queue
        this.queue = this.queue.filter(q => q !== item);
        this.observer.unobserve(video);
        
        this.activeDownloads++;

        if (!src) {
            this.activeDownloads--;
            return;
        }

        try {
            // --- STREAMING FETCH ---
            const response = await fetch(src);
            if (!response.ok) throw new Error(`Failed to fetch ${src}`);

            // 1. Get total size for progress calc
            const contentLength = response.headers.get('content-length');
            const total = parseInt(contentLength, 10);
            let loaded = 0;

            // 2. Setup Reader
            const reader = response.body.getReader();
            const chunks = [];

            while(true) {
                const {done, value} = await reader.read();
                if (done) break;
                
                chunks.push(value);
                loaded += value.length;

                // 3. Update Progress UI
                if (total && loaderContainer) {
                    const percent = (loaded / total) * 100;
                    loaderContainer.style.setProperty('--progress', `${percent}%`);
                }
            }

            // 4. Assemble Blob
            const blob = new Blob(chunks);
            const objectUrl = URL.createObjectURL(blob);
            
            video.src = objectUrl;
            
            await video.play();

            // Success
            if (wrapper) {
                wrapper.classList.remove('is-loading');
                wrapper.classList.add('is-playing');
                
                // Cleanup loader after animation
                setTimeout(() => {
                    if (loaderContainer) loaderContainer.remove();
                }, 1000);
            }

        } catch (err) {
            console.error("Video load failed:", err);
            // Fallback to basic streaming
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