class MediaLoader {
    constructor() {
        this.queue = [];
        this.observer = null;
        this.maxConcurrent = 1; // Strictly one download at a time
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

        // 1. VISUAL SETUP: Apply poster to wrapper background
        const wrapper = videoElement.closest('.video-wrapper') || videoElement.parentElement;
        if (wrapper) {
            // Apply loading state immediately
            wrapper.classList.add('is-loading');
            
            // Set background image from poster attribute
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
        
        // Wait if the best candidate is off-screen (score 0), 
        // unless we are idle, in which case we preload it.
        if (candidate.score === 0 && this.activeDownloads > 0) return;

        this.loadVideoBlob(candidate);
    }

    loadVideoBlob(item) {
        const video = item.element;
        const src = video.dataset.src;

        // Remove from queue
        this.queue = this.queue.filter(q => q !== item);
        this.observer.unobserve(video);
        
        this.activeDownloads++;

        if (!src) {
            this.activeDownloads--;
            return;
        }

        // --- THE BLOB STRATEGY ---
        // 1. Fetch the entire file as a blob
        fetch(src)
            .then(response => {
                if (!response.ok) throw new Error(`Failed to fetch ${src}`);
                return response.blob();
            })
            .then(blob => {
                // 2. Create a local Object URL
                const objectUrl = URL.createObjectURL(blob);
                
                // 3. Assign to video source
                video.src = objectUrl;
                
                // 4. Play (It is now "local", so it should trigger instantly)
                return video.play();
            })
            .then(() => {
                // Success: Fade in video
                const wrapper = video.closest('.video-wrapper') || video.parentElement;
                if (wrapper) {
                    wrapper.classList.remove('is-loading');
                    wrapper.classList.add('is-playing');
                    // Clean up the background image after transition to save memory/paint
                    setTimeout(() => {
                        wrapper.style.backgroundImage = 'none';
                    }, 1000); 
                }
            })
            .catch(err => {
                console.error("Video load failed:", err);
                // Fallback: If blob fails, try standard streaming
                video.src = src; 
            })
            .finally(() => {
                // 5. Cleanup and move to next video
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