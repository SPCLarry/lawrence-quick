document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Initialize Page Carousels
    const pageCarousels = document.querySelectorAll('.media-carousel:not(.modal-style)');
    
    pageCarousels.forEach((container) => {
        // Collect raw media items (img/video) before we modify DOM
        const rawMediaItems = Array.from(container.children);
        
        // Initialize the standard carousel
        initCarousel(container, rawMediaItems);
        
        // Add CLICK listener to open Modal
        // We attach this to the *container* but delegate logic to finding current index
        // Or simpler: The initCarousel creates slides. We attach click to slides.
    });

    // --- Modal Elements ---
    const modal = document.getElementById('media-modal');
    const modalCloseBtn = document.querySelector('.modal-close');
    const modalRoot = document.getElementById('modal-carousel-root');

    // --- Helper: Core Carousel Logic ---
    // container: The wrapper div
    // mediaSource: Array of DOM Nodes (img/video) to put inside
    // startIndex: Which slide to show first
    // isModal: Boolean to modify behavior (e.g. click to open modal vs do nothing)
    function initCarousel(container, mediaSource, startIndex = 0, isModal = false) {
        
        container.innerHTML = ''; // Clear existing (safe reset)

        if (mediaSource.length === 0) return;

        // 1. Build Track
        const track = document.createElement('div');
        track.classList.add('carousel-track');

        mediaSource.forEach((mediaItem, index) => {
            const slide = document.createElement('div');
            slide.classList.add('carousel-slide');

            // Clone the media item so we don't steal it from original location
            // If it's the modal, we are cloning from the page. 
            // If it's the page, we are just using the elements found in DOM.
            const mediaClone = mediaItem.cloneNode(true);

            // Ensure video attributes are standard
            if (mediaClone.tagName === 'VIDEO') {
                mediaClone.setAttribute('playsinline', '');
                // If in modal, maybe we want controls? or just autoplay
                // let's stick to autoplay loop for consistency
            }

            slide.appendChild(mediaClone);
            track.appendChild(slide);

            // CLICK EVENT: If this is a Page Carousel, clicking opens Modal
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
        };
        
        // Run once to set initial position
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

            // Stop click propagation so clicking arrow doesn't open modal
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
        // 1. Show Modal
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Disable scroll on body

        // 2. Initialize Carousel inside Modal
        // We pass true for 'isModal' to prevent recursion (clicking modal slide shouldn't open new modal)
        initCarousel(modalRoot, originalMediaItems, clickedIndex, true);
    }

    function closeModal() {
        modal.classList.add('hidden');
        document.body.style.overflow = ''; // Re-enable scroll
        modalRoot.innerHTML = ''; // Destroy content (stops videos)
    }

    modalCloseBtn.addEventListener('click', closeModal);

    // Close on clicking outside content (optional, acts as click-off)
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close on Escape Key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });
});