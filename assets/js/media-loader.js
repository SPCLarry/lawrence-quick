class MediaLoader {
    constructor() {
        this.queue = [];
        this.observer = null;
        this.maxConcurrent = 2; // Only load 2 videos at once
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
        // Observer tracks if a video is in the viewport
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const videoData = this.queue.find(item => item.element === entry.target);
                if (videoData) {
                    videoData.inView = entry.isIntersecting;
                    
                    // Force update priorities when view changes
                    this.updatePriorities();
                }
            });
        }, {
            rootMargin: '200px 0px', // Detect items 200px before they appear
            threshold: 0.1
        });
    }

    /**
     * Register a video element to be managed
     * @param {HTMLVideoElement} videoElement 
     * @param {Boolean} isHighPriority (Optional force priority)
     */
    register(videoElement, isHighPriority = false) {
        // Prevent double registration
        if (videoElement.dataset.mediaLoaded === "true") return;
        if (this.queue.some(item => item.element === videoElement)) return;

        // Add visual loading state class
        const wrapper = videoElement.closest('.video-wrapper') || videoElement.parentElement;
        if (wrapper) wrapper.classList.add('is-loading');

        // Add to tracking
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

        // Find next candidate (that isn't already loading)
        const candidate = this.queue[0];

        // If even the best candidate has 0 score (off screen), wait.
        // Unless queue is small, then just clear it out slowly.
        if (candidate.score === 0 && this.activeDownloads > 0) return;

        this.loadVideo(candidate);
    }

    loadVideo(item) {
        const video = item.element;
        
        // Remove from queue
        this.queue = this.queue.filter(q => q !== item);
        this.observer.unobserve(video);
        
        this.activeDownloads++;

        // 1. Move data-src to src
        const src = video.dataset.src;
        if (src) {
            video.src = src;
            video.load(); // Trigger download
        }

        // 2. Listen for 'canplay' to remove spinner
        video.addEventListener('canplay', () => {
            // Remove loading spinner
            const wrapper = video.closest('.video-wrapper') || video.parentElement;
            if (wrapper) {
                wrapper.classList.remove('is-loading');
                wrapper.classList.add('is-playing');
            }
            
            // Try to play
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // Autoplay prevented (browser policy), standard fallback
                    console.log("Autoplay prevented for", src);
                });
            }

            this.activeDownloads--;
            this.processQueue(); // Load next
        }, { once: true });

        // Mark as processed
        video.dataset.mediaLoaded = "true";
    }
}

// Global accessor
const mediaLoader = MediaLoader.getInstance();

// Auto-register any lazy videos found on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    const lazyVideos = document.querySelectorAll('video.lazy-video');
    lazyVideos.forEach(v => mediaLoader.register(v));
});