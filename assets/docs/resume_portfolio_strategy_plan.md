# Resume & Portfolio Strategy Plan

## Purpose of This Document
This document serves as a clear, grounded plan for presenting my experience, skills, and professional narrative. It consolidates decisions, positioning, and strategy and acts as the reference for maintaining the portfolio site.

The goal is to:
- Present myself as a capable Unreal Engine developer without exaggeration.
- Emphasize real systems experience rather than unfinished products.
- Replace the weakness of no shipped titles with depth, clarity, and technical reasoning.
- Create assets that support paid junior roles, contract work, and indie collaboration.

---

## Professional Positioning

### Core Identity
- **Unreal Engine Developer (Gameplay & Systems)**
- Focus on system architecture, iteration, and long-term project work.
- Junior-level professional capability without formal studio employment.

### Key Principles
- Accuracy over hype.
- Depth over breadth.
- Systems thinking over surface features.
- Reflection and iteration as strengths.

---

## Resume Strategy

### Direction
- Keep resume concise and factual.
- Emphasize skills, tools, and systems experience.
- Include a clear project entry for *Asimbly*.

### Framing *Asimbly*
- **Role:** Gameplay & Systems Developer
- **Context:** Collaborative two-person project (UE5).
- **Key Contributions:** Gameplay state machines, UI architecture (MVVM), AI behavior trees, and Interaction interfaces.

*The resume acts as a hook; the portfolio provides the proof.*

---

## Portfolio Strategy & Technical Architecture

### Tech Stack
- **Core:** Semantic HTML5, CSS3 (Variables & Flexbox/Grid).
- **Scripting:** Vanilla JavaScript (No frameworks).
  - *Custom Feature:* `carousel.js` handles mixed-media slideshows and a Lightbox/Modal view for detailed inspection.
- **Hosting:** GitHub Pages (Served from Repository Root).
- **Version Control:** Git.

### Portfolio Goals
- Demonstrate technical competence through systems breakdowns.
- Show ownership, decision-making, and problem-solving.
- Make unfinished work valuable through explanation and reflection.

---

## Media Strategy (Performance & UX)

To ensure the site remains fast and accessible while showcasing high-fidelity gameplay, strict media guidelines are enforced.

### File Formats
- **Video (Preferred):** `.webm`
  - *Reasoning:* Superior compression-to-quality ratio for web. Drastically smaller file sizes than MP4.
  - *Usage:* All gameplay clips, replacing the use of heavy GIFs.
- **Video (Fallback):** `.mp4` (H.264)
  - Use only if WebM export is unavailable or causes artifacting. Must be heavily compressed (Handbrake/FFmpeg).
- **Images:** `.jpeg`
  - *Reasoning:* Best balance for screenshots.

### Presentation Logic
- **Autoplay Loops:** Videos act as "High-Res GIFs" (Autoplay, Loop, Muted, PlaysInline).
- **Carousel System:** Media is grouped into a custom carousel allowing users to slide through multiple angles/videos of a specific feature.
- **Lightbox/Modal:** Users can click any media to expand it into a full-screen modal for detailed viewing.

---

## Site Structure

### 1. Home Page (`index.html`)
Designed as a **Single-Page Scroll** layout for immediate impact.

*   **Hero Section:**
    *   Title: "Unreal Engine Gameplay Systems Developer"
    *   "Quick Stack" badges (UE5, C++, Blueprints).
    *   **Primary CTA:** A prominent, high-contrast button linking directly to the featured case study.
*   **Skills Grid:**
    *   Categorized list (Core Tech, Systems Design, Workflow) visible "above the fold" or immediately upon scroll.
*   **Featured Project Card:**
    *   Large media preview (Video loop).
    *   Bullet points summarizing technical contributions.
    *   "Loud" Button: "View Technical Breakdown".
*   **Footer/Contact:** Simple email link and copyright.

### 2. Project Case Study (`projects/asimbly.html`)
A deep-dive technical document.

*   **Sticky Table of Contents:** Allows quick navigation between systems.
*   **System Breakdowns:**
    1.  **Character Systems:** State machines, sliding/mantling logic.
    2.  **UI Architecture:** MVVM pattern, GameInstance Subsystems.
    3.  **Material Design:** HLSL shaders and grid worlds.
    4.  **AI Behavior:** Behavior Trees and EQS.
    5.  **Interaction Logic:** Interfaces (`BPI_Interact`) to decouple dependencies.
    *(Sound Systems: To be added)*

---

## Navigation Plan

The navigation bar is consistent across pages but functions differently depending on context.

**Links:**
- **Lawrence Quick** (Logo) -> Resets to Top of Home.
- **Work** -> Anchors to `#work` on Home.
- **Skills** -> Anchors to `#skills` on Home.
- **Contact** -> Anchors to `#contact` footer.

*Note: On the Case Study page, the nav simplifies to "Back to Home" to prevent navigation loops.*

---

## Guiding Mindset

This strategy reflects:
- **Professional Honesty:** No fluff.
- **Systems Thinking:** We discuss *architecture*, not just visuals.
- **User Experience:** We respect the recruiter's time by making the site fast, the code clean, and the "Best Work" button the easiest thing to click.