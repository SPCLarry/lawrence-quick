class MediaLoader {
    constructor() {
        this.queue = [];
        this.observer = null;
        this.maxConcurrent = 1; // CHANGED: Serial loading (1 at a time) to prevent stutter
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

        // 1. VISUAL FIX: Apply poster to the wrapper background
        // This ensures the image stays visible even if the video element flickers
        const wrapper = videoElement.closest('.video-wrapper') || videoElement.parentElement;
        if (wrapper) {
            wrapper.classList.add('is-loading');
            const posterUrl = videoElement.getAttribute('poster');
            if (posterUrl) {
                wrapper.style.backgroundImage = `url('${posterUrl}')`;
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

        // Sort: Highest score first
        this.queue.sort((a, b) => b.score - a.score);
        this.processQueue();
    }

    processQueue() {
        if (this.activeDownloads >= this.maxConcurrent) return;
        if (this.queue.length === 0) return;

        const candidate = this.queue[0];
        
        // If candidate is off-screen (score 0) and we have other downloads, wait.
        // But if nothing is happening, start downloading the off-screen one (background prep).
        if (candidate.score === 0 && this.activeDownloads > 0) return;

        this.loadVideo(candidate);
    }

    loadVideo(item) {
        const video = item.element;
        
        this.queue = this.queue.filter(q => q !== item);
        this.observer.unobserve(video);
        
        this.activeDownloads++;

        const src = video.dataset.src;
        if (src) {
            video.src = src;
            video.load(); 
        }

        // PERFORMANCE FIX: use 'canplaythrough' to ensure buffer is healthy
        const onReady = () => {
            const wrapper = video.closest('.video-wrapper') || video.parentElement;
            
            // Try to play
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // Only fade in once we are successfully playing
                    if (wrapper) {
                        wrapper.classList.remove('is-loading');
                        wrapper.classList.add('is-playing');
                    }
                }).catch((e) => {
                    console.warn("Autoplay prevented:", e);
                    // Even if autoplay fails, show the video so controls appear (if enabled)
                    if (wrapper) wrapper.classList.add('is-playing');
                });
            }

            this.activeDownloads--;
            this.processQueue(); 
        };

        // Fallback: If canplaythrough takes too long (5s), force show to prevent permanent spinner
        const safetyTimeout = setTimeout(() => {
            console.log("Load timeout for", src);
            onReady();
        }, 8000);

        video.addEventListener('canplaythrough', () => {
            clearTimeout(safetyTimeout);
            onReady();
        }, { once: true });

        video.dataset.mediaLoaded = "true";
    }
}

const mediaLoader = MediaLoader.getInstance();

document.addEventListener("DOMContentLoaded", () => {
    const lazyVideos = document.querySelectorAll('video.lazy-video');
    lazyVideos.forEach(v => mediaLoader.register(v));
});