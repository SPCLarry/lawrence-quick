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

        // 1. VISUAL SETUP: Inject Real Image Tag
        const wrapper = videoElement.closest('.video-wrapper') || videoElement.parentElement;
        if (wrapper) {
            wrapper.classList.add('is-loading');
            
            // Check if we already injected a poster
            if (!wrapper.querySelector('.poster-image')) {
                
                // CHANGED: Use .poster property (Absolute URL) instead of getAttribute (Relative String)
                // This fixes path resolution issues in subdirectories.
                const posterUrl = videoElement.poster; 
                
                if (posterUrl) {
                    const img = document.createElement('img');
                    img.src = posterUrl;
                    img.className = 'poster-image';
                    img.alt = "Loading Media..."; // Default alt text
                    
                    // DEBUG: Log if image fails
                    img.onerror = () => {
                        console.warn("Poster failed to load at:", img.src);
                    };

                    wrapper.insertBefore(img, videoElement); 
                }
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

    loadVideoBlob(item) {
        const video = item.element;
        const src = video.dataset.src;

        this.queue = this.queue.filter(q => q !== item);
        this.observer.unobserve(video);
        
        this.activeDownloads++;

        if (!src) {
            this.activeDownloads--;
            return;
        }

        // --- THE BLOB STRATEGY ---
        fetch(src)
            .then(response => {
                if (!response.ok) throw new Error(`Failed to fetch ${src}`);
                return response.blob();
            })
            .then(blob => {
                const objectUrl = URL.createObjectURL(blob);
                video.src = objectUrl;
                return video.play();
            })
            .then(() => {
                const wrapper = video.closest('.video-wrapper') || video.parentElement;
                if (wrapper) {
                    wrapper.classList.remove('is-loading');
                    wrapper.classList.add('is-playing');
                }
            })
            .catch(err => {
                console.error("Video load failed:", err);
                video.src = src; 
            })
            .finally(() => {
                this.activeDownloads--;
                video.dataset.mediaLoaded = "true";
                this.processQueue();
            });
    }
}

const mediaLoader = MediaLoader.getInstance();

document.addEventListener("DOMContentLoaded", () => {
    const lazyVideos = document.querySelectorAll('video.lazy-video');
    lazyVideos.forEach(v => mediaLoader.register(v));
});