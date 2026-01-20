document.addEventListener("DOMContentLoaded", function() {
    
    // Find all containers that should be carousels
    const carousels = document.querySelectorAll('.media-carousel');

    carousels.forEach((carousel, index) => {
        setupCarousel(carousel, index);
    });

    function setupCarousel(container, id) {
        // 1. Get all raw media items (img/video) inside the container
        const rawMedia = Array.from(container.children);
        
        // If empty or only 1 item, we might not need buttons, but let's standardize
        if (rawMedia.length === 0) return;

        // 2. Build the Track Structure
        const track = document.createElement('div');
        track.classList.add('carousel-track');

        // 3. Wrap each media item in a slide div and append to track
        rawMedia.forEach(media => {
            const slide = document.createElement('div');
            slide.classList.add('carousel-slide');
            
            // Ensure videos loop/mute/play if desired (standardize behavior)
            if (media.tagName === 'VIDEO') {
                media.setAttribute('playsinline', '');
                // We keep original attributes (autoplay/muted) from HTML
            }
            
            slide.appendChild(media);
            track.appendChild(slide);
        });

        // Clear container and append track
        container.innerHTML = '';
        container.appendChild(track);

        // 4. Create Navigation Buttons (Only if more than 1 slide)
        if (rawMedia.length > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.innerHTML = '&larr;'; // Left Arrow
            prevBtn.classList.add('carousel-btn', 'prev');
            
            const nextBtn = document.createElement('button');
            nextBtn.innerHTML = '&rarr;'; // Right Arrow
            nextBtn.classList.add('carousel-btn', 'next');

            container.appendChild(prevBtn);
            container.appendChild(nextBtn);

            // 5. Logic
            let currentIndex = 0;
            const maxIndex = rawMedia.length - 1;

            const updateCarousel = () => {
                const translateX = -(currentIndex * 100);
                track.style.transform = `translateX(${translateX}%)`;
            };

            prevBtn.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent jumpy behavior if inside anchor (unlikely)
                if (currentIndex > 0) {
                    currentIndex--;
                } else {
                    currentIndex = maxIndex; // Loop back to end
                }
                updateCarousel();
            });

            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (currentIndex < maxIndex) {
                    currentIndex++;
                } else {
                    currentIndex = 0; // Loop back to start
                }
                updateCarousel();
            });
        }
    }
});