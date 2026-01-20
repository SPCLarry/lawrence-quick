# Technical Design: Media Optimization & Loading Strategy

## 1. Problem Statement
The current portfolio relies heavily on video media (`.mp4`/`.webm`) to showcase technical gameplay systems. The current implementation relies on standard browser behavior (`autoplay`), resulting in:
1.  **"The Black Void":** Videos show a black frame or empty box while initializing.
2.  **Bandwidth Contention:** All videos try to download simultaneously, causing 10-15s delays where nothing plays.
3.  **Poor UX:** Users scrolling quickly see broken content, diminishing the professional impact of the portfolio.

## 2. Solution Overview
We will implement a **Hybrid Optimization Strategy** splitting the workload between "Design Time" (Automation) and "Run Time" (Client-side Logic).

### Core Pillars
1.  **Instant Visuals:** Every video will have a lightweight JPEG "Poster" image displayed immediately.
2.  **Automated Asset Generation:** A Python script will auto-generate these posters, removing manual labor.
3.  **Priority Queue Loading:** A custom JavaScript controller will manage bandwidth, prioritizing content the user is watching *now*, while aggressively pre-loading content they are *about* to see.

---

## 3. "Design Time" Automation (The Python Script)

We will create a utility script (`tools/generate_posters.py`) to handle asset generation. This ensures consistency and simplifies the workflow when adding new project media.

### Script Logic
1.  **Scan:** Recursively scan `assets/videos/` for video files (`.mp4`, `.webm`).
2.  **Check:** Look for a corresponding poster in `assets/videos/posters/`.
3.  **Generate:** If the poster is missing, call **FFmpeg** to:
    *   Extract the frame at `00:00:00.000`.
    *   Resize/Compress slightly to ensure file size is negligible (<50KB).
    *   Save as `[OriginalName]_poster.jpg`.
4.  **Output Path:** `assets/videos/posters/[OriginalName]_poster.jpg`

### Directory Structure Changes
```text
assets/
└── videos/
    ├── posters/                 <-- NEW: Auto-generated
    │   ├── Asimbly_Cover_01_poster.jpg
    │   └── ...
    ├── Asimbly_Cover_01.mp4
    └── ...
```

---

## 4. "Run Time" Frontend Logic (The Queue Manager)

We will replace standard browser loading with a **Priority Queue System** (`assets/js/media-loader.js`).

### Visual State Machine
The video container will have three distinct states:
1.  **State A (Poster):** Instant load. Shows the `_poster.jpg` with a stylized CSS "Loading Spinner" overlay.
2.  **State B (Buffering):** The JS Queue triggers the download. Spinner remains visible.
3.  **State C (Playback):** The `canplay` event fires. The poster/spinner fades out, revealing the playing video.

### Priority Logic
The Queue Manager assigns a "Score" to every video on the page and loads them one by one (or 2 parallel) based on that score.

| Priority | Condition | Description |
| :--- | :--- | :--- |
| **P1 (Highest)** | **In Viewport** | The user is looking at this container right now. |
| **P2 (High)** | **Near Viewport** | Just below the fold. Anticipating scroll. |
| **P3 (Medium)** | **Carousel (Active)** | The visible slide of a carousel that is on-screen. |
| **P4 (Low)** | **Carousel (Hidden)** | Slides 2, 3, etc. of a carousel. |
| **P5 (Lowest)** | **Far Off-screen** | Content near the footer (when user is at header). |

### Behavior
1.  **Aggressive Pre-loading:** Unlike "Lazy Loading" (which stops when you stop scrolling), this system **never sleeps**. If the user is watching the top video, the system quietly downloads the P2 and P3 videos in the background.
2.  **Carousel Intelligence:** If a carousel has 4 videos, it loads Slide 1 (P3). Once Slide 1 is playing, it demotes it and promotes Slide 2 (P4) to the queue, ensuring the "Next" button is always ready.

---

## 5. Implementation Roadmap

### Phase 1: Tooling Setup
- [ ] Install FFmpeg locally.
- [ ] Write `tools/generate_posters.py`.
- [ ] Run script to populate `assets/videos/posters/`.

### Phase 2: HTML/CSS Updates
- [ ] Update `styles.css` to include the "Loading Spinner" and `video-wrapper` styles.
- [ ] Update `asimbly.html` HTML structure (add `poster` paths to video tags).

### Phase 3: JavaScript Development
- [ ] Create `assets/js/media-loader.js`.
- [ ] Implement `IntersectionObserver` to detect viewport visibility.
- [ ] Implement `VideoQueue` class to manage download order.
- [ ] Integrate with existing `carousel.js` to handle hidden slides.

---

## 6. Success Metrics
- **0s Black Screen:** User never sees a black frame.
- **<200ms Perception:** The poster makes the site feel "loaded" instantly.
- **Continuous Play:** When the user scrolls to the next section, the video is already buffered and playing.