// Sound Generation (Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playHoverSound() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    // Create an oscillator for a short, soft "bloop" or "pop"
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    
    // Smooth frequency slide for a water-droplet/popping sound
    oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.05);

    // Amplitude envelope
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.01); // Quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1); // Quick decay

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
}

document.addEventListener('DOMContentLoaded', () => {
    // Unlock AudioContext on first user interaction
    document.body.addEventListener('click', () => {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }, { once: true });

    // Attach hover sound to active channels and buttons
    const interactiveElements = document.querySelectorAll('.channel:not(.empty), .footer-btn');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            playHoverSound();
        });
    });

    // Real-time Clock Initialization
    const clockEl = document.getElementById('clock');
    
    function updateClock() {
        const now = new Date();
        let hours = now.getHours();
        let minutes = now.getMinutes();
        
        // 12-hour format
        let ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 becomes 12
        minutes = minutes < 10 ? '0' + minutes : minutes;
        
        clockEl.textContent = `${hours}:${minutes} ${ampm}`;
    }
    
    setInterval(updateClock, 1000);
    updateClock(); // Initialize immediately
});
