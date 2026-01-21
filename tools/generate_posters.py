import os
import subprocess
import sys

# CONFIGURATION
# Adjust path to point to your assets/videos folder relative to this script
VIDEO_DIR = os.path.join(os.path.dirname(__file__), '../assets/videos')
POSTER_DIR = os.path.join(VIDEO_DIR, 'posters')

# Supported video extensions
VIDEO_EXTS = ('.mp4', '.webm', '.mov')

def ensure_ffmpeg():
    """Check if ffmpeg is installed and accessible."""
    try:
        subprocess.run(['ffmpeg', '-version'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except FileNotFoundError:
        return False

def generate_posters():
    if not ensure_ffmpeg():
        print("Error: FFmpeg is not installed or not in PATH.")
        return

    # Create posters directory if it doesn't exist
    if not os.path.exists(POSTER_DIR):
        os.makedirs(POSTER_DIR)
        print(f"Created directory: {POSTER_DIR}")

    print(f"Scanning {VIDEO_DIR}...")

    count = 0
    for root, dirs, files in os.walk(VIDEO_DIR):
        # Skip the posters directory itself
        if 'posters' in root:
            continue

        for file in files:
            if file.lower().endswith(VIDEO_EXTS):
                video_path = os.path.join(root, file)
                
                # Construct poster filename: VideoName_poster.jpg
                base_name = os.path.splitext(file)[0]
                poster_name = f"{base_name}_poster.jpg"
                poster_path = os.path.join(POSTER_DIR, poster_name)

                # Generate if missing
                if not os.path.exists(poster_path):
                    print(f"Generating poster for: {file}")
                    
                    # FFmpeg command: extract frame 0, resize to width 600 (maintain aspect), quality 5
                    cmd = [
                        'ffmpeg',
                        '-i', video_path,       # Input
                        '-ss', '00:00:00.000',  # First frame
                        '-vframes', '1',        # Only 1 frame
                        '-vf', 'scale=600:-1',  # Resize width to 600px, keep aspect ratio
                        '-q:v', '5',            # Quality (1-31, lower is better)
                        '-y',                   # Overwrite output
                        poster_path
                    ]
                    
                    try:
                        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
                        count += 1
                    except subprocess.CalledProcessError:
                        print(f"Failed to generate poster for {file}")
    
    print(f"Done. Generated {count} new posters.")

if __name__ == "__main__":
    generate_posters()