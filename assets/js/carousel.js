document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Initialize Page Carousels
    const pageCarousels = document.querySelectorAll('.media-carousel:not(.modal-style)');
    
    pageCarousels.forEach((container) => {
        // Collect raw media items (img/video) before we modify DOM
        // Note: We look for .carousel-item which are hidden by default in HTML
        // OR we just use children. 
        // Based on new HTML structure, we will expect children to be wrapped or raw.
        // Let's filter for just elements.
        const rawMediaItems = Array.from(container.children).filter(el => el.tagName === 'IMG' || el.tagName === 'VIDEO' || el.classList.contains('video-wrapper'));
        
        // Initialize the standard carousel
        initCarousel(container, rawMediaItems);
    });

    // --- Modal Elements ---
    const modal = document.getElementById('media-modal');
    const modalCloseBtn = document.querySelector('.modal-close');
    const modalRoot = document.getElementById('modal-carousel-root');

    // --- Helper: Core Carousel Logic ---
    function initCarousel(container, mediaSource, startIndex = 0, isModal = false) {
        
        container.innerHTML = ''; // Clear existing (safe reset)

        if (mediaSource.length === 0) return;

        // 1. Build Track
        const track = document.createElement('div');
        track.classList.add('carousel-track');

        mediaSource.forEach((mediaItem, index) => {
            const slide = document.createElement('div');
            slide.classList.add('carousel-slide');

            // Clone the media item
            const mediaClone = mediaItem.cloneNode(true);

            // Handle Video Wrappers (from Media Loader logic)
            let videoEl = null;
            if (mediaClone.classList.contains('video-wrapper')) {
                videoEl = mediaClone.querySelector('video');
            } else if (mediaClone.tagName === 'VIDEO') {
                videoEl = mediaClone;
            }

            // Clean up cloned video state
            if (videoEl) {
                videoEl.removeAttribute('src'); // Ensure it doesn't auto-download yet
                videoEl.dataset.mediaLoaded = "false"; // Reset loader state
                videoEl.classList.remove('lazy-video'); // Remove auto-loader class (we manually register below)
                
                // If it was wrapped, reset wrapper classes
                if (mediaClone.classList.contains('video-wrapper')) {
                    mediaClone.classList.remove('is-playing', 'is-loading');
                }
            }

            slide.appendChild(mediaClone);
            track.appendChild(slide);

            // Register with Media Loader
            // If it's the first slide (startIndex), give it high priority
            if (videoEl && window.mediaLoaderInstance) {
                // If this is the active slide, prioritize it
                const isHighPriority = (index === startIndex);
                window.mediaLoaderInstance.register(videoEl, isHighPriority);
            }

            // CLICK EVENT: Open Modal
            if (!isModal) {
                slide.addEventListener('click', () => {
                    openModal(mediaSource, index);
                });
            }
        });

        container.appendChild(track);

        // 2. Navigation
        let currentIndex = startIndex;
        const maxIndex = mediaSource.length - 1;

        const updateTrack = () => {
            const translateX = -(currentIndex * 100);
            track.style.transform = `translateX(${translateX}%)`;
            
            // Register priority for current visible slide
            const currentSlide = track.children[currentIndex];
            const video = currentSlide.querySelector('video');
            if (video && window.mediaLoaderInstance) {
                window.mediaLoaderInstance.register(video, true);
            }
        };
        
        // Run once
        updateTrack();

        // Only add buttons if > 1 item
        if (mediaSource.length > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.innerHTML = '&larr;';
            prevBtn.classList.add('carousel-btn', 'prev');
            
            const nextBtn = document.createElement('button');
            nextBtn.innerHTML = '&rarr;';
            nextBtn.classList.add('carousel-btn', 'next');

            container.appendChild(prevBtn);
            container.appendChild(nextBtn);

            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation(); 
                if (currentIndex > 0) currentIndex--;
                else currentIndex = maxIndex;
                updateTrack();
            });

            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (currentIndex < maxIndex) currentIndex++;
                else currentIndex = 0;
                updateTrack();
            });
        }
    }

    // --- Modal Logic ---

    function openModal(originalMediaItems, clickedIndex) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; 
        initCarousel(modalRoot, originalMediaItems, clickedIndex, true);
    }

    function closeModal() {
        modal.classList.add('hidden');
        document.body.style.overflow = ''; 
        modalRoot.innerHTML = ''; 
    }

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });
});