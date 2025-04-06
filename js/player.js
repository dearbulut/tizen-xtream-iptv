/**
 * Player module for Tizen TV
 * Uses Tizen's AVPlay API for video playback
 */
const Player = {
    // AVPlay instance
    avplay: null,
    
    // Current playback state
    state: {
        playing: false,
        currentTime: 0,
        duration: 0,
        streamType: null,
        streamId: null,
        streamUrl: null,
        bufferingProgress: 0,
        fullscreen: false
    },
    
    // Player DOM elements
    elements: {
        container: null,
        playerEl: null,
        controls: null,
        playPauseBtn: null,
        stopBtn: null,
        progressBar: null
    },
    
    // Initialize the player
    init: function() {
        // Get DOM elements
        this.elements.container = document.getElementById('player-container');
        this.elements.playerEl = document.getElementById('video-player');
        this.elements.controls = document.getElementById('player-controls');
        this.elements.playPauseBtn = document.getElementById('play-pause');
        this.elements.stopBtn = document.getElementById('stop');
        this.elements.progressBar = document.getElementById('progress-bar');
        
        // Initialize AVPlay if available
        if (window.tizen && window.webapis && window.webapis.avplay) {
            try {
                this.avplay = window.webapis.avplay;
                
                // Set default AVPlay options
                this.avplay.setListener({
                    onbufferingstart: this.onBufferingStart.bind(this),
                    onbufferingprogress: this.onBufferingProgress.bind(this),
                    onbufferingcomplete: this.onBufferingComplete.bind(this),
                    oncurrentplaytime: this.onCurrentPlayTime.bind(this),
                    onplaybackcompleted: this.onPlaybackCompleted.bind(this),
                    onevent: this.onEvent.bind(this),
                    onerror: this.onError.bind(this)
                });
                
                Config.log('AVPlay initialized successfully');
            } catch (e) {
                Config.log('Failed to initialize AVPlay:', e);
                this.showError('Failed to initialize player: ' + e.message);
            }
        } else {
            Config.log('AVPlay API not available');
            this.showError('This application requires a Samsung Tizen TV with AVPlay support.');
        }
        
        // Add event listeners for player controls
        this.elements.playPauseBtn.addEventListener('click', this.togglePlayPause.bind(this));
        this.elements.stopBtn.addEventListener('click', this.stop.bind(this));
        
        // Add key event listeners for remote control
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        return this;
    },
    
    /**
     * Play a stream
     * @param {string} streamId - ID of the stream to play
     * @param {string} streamType - Type of stream (live, movie, series)
     * @param {Object} options - Additional options for series (season, episode)
     */
    playStream: function(streamId, streamType, options = {}) {
        try {
            // Get stream URL from API
            const streamUrl = XtreamAPI.getStreamUrl(streamId, streamType, options);
            
            // Update state
            this.state.streamId = streamId;
            this.state.streamType = streamType;
            this.state.streamUrl = streamUrl;
            
            // Show player container
            this.elements.container.classList.add('active');
            
            // Initialize and prepare AVPlay
            this.preparePlayer(streamUrl);
            
            Config.log('Playing stream:', streamId, streamType, streamUrl);
        } catch (e) {
            Config.log('Failed to play stream:', e);
            this.showError('Failed to play stream: ' + e.message);
        }
    },
    
    /**
     * Prepare the player for playback
     * @param {string} url - URL of the stream to play
     */
    preparePlayer: function(url) {
        if (!this.avplay) {
            this.showError('Player not initialized');
            return;
        }
        
        try {
            // Reset player state
            this.resetPlayer();
            
            // Show loading indicator
            this.showLoading(true);
            
            // Open media source
            this.avplay.open(url);
            
            // Set display area to player element
            const playerRect = this.elements.playerEl.getBoundingClientRect();
            this.avplay.setDisplayRect(
                playerRect.left,
                playerRect.top,
                playerRect.width,
                playerRect.height
            );
            
            // Prepare and start playback
            this.avplay.prepare();
            
            // Set streaming mode based on content type
            if (this.state.streamType === 'live') {
                this.avplay.setStreamingProperty("ADAPTIVE_INFO", "LIVE");
            } else {
                this.avplay.setStreamingProperty("ADAPTIVE_INFO", "VOD");
            }
            
            // Start playback if autoplay is enabled
            if (Config.player.autoplay) {
                this.play();
            }
        } catch (e) {
            Config.log('Error preparing player:', e);
            this.showError('Error preparing player: ' + e.message);
            this.resetPlayer();
        }
    },
    
    /**
     * Start playback
     */
    play: function() {
        if (!this.avplay) return;
        
        try {
            this.avplay.play();
            this.state.playing = true;
            this.elements.playPauseBtn.textContent = 'Pause';
        } catch (e) {
            Config.log('Error playing media:', e);
            this.showError('Error playing media: ' + e.message);
        }
    },
    
    /**
     * Pause playback
     */
    pause: function() {
        if (!this.avplay) return;
        
        try {
            this.avplay.pause();
            this.state.playing = false;
            this.elements.playPauseBtn.textContent = 'Play';
        } catch (e) {
            Config.log('Error pausing media:', e);
        }
    },
    
    /**
     * Toggle between play and pause
     */
    togglePlayPause: function() {
        if (this.state.playing) {
            this.pause();
        } else {
            this.play();
        }
    },
    
    /**
     * Stop playback and close player
     */
    stop: function() {
        if (!this.avplay) return;
        
        try {
            this.avplay.stop();
            this.closePlayer();
        } catch (e) {
            Config.log('Error stopping media:', e);
        }
    },
    
    /**
     * Close the player and reset state
     */
    closePlayer: function() {
        try {
            if (this.avplay) {
                this.avplay.close();
            }
        } catch (e) {
            Config.log('Error closing player:', e);
        }
        
        // Hide player container
        this.elements.container.classList.remove('active');
        
        // Reset state
        this.resetPlayer();
        
        // Hide loading indicator
        this.showLoading(false);
    },
    
    /**
     * Reset player state
     */
    resetPlayer: function() {
        this.state.playing = false;
        this.state.currentTime = 0;
        this.state.duration = 0;
        this.state.bufferingProgress = 0;
        
        // Update UI
        this.elements.playPauseBtn.textContent = 'Play';
        this.updateProgressBar(0);
    },
    
    /**
     * Update progress bar
     * @param {number} progress - Progress value (0-100)
     */
    updateProgressBar: function(progress) {
        if (this.elements.progressBar) {
            this.elements.progressBar.style.setProperty('--progress', `${progress}%`);
        }
    },
    
    /**
     * Show or hide loading indicator
     * @param {boolean} show - Whether to show or hide
     */
    showLoading: function(show) {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (show) {
            loadingOverlay.classList.add('active');
        } else {
            loadingOverlay.classList.remove('active');
        }
    },
    
    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError: function(message) {
        const errorEl = document.getElementById('error-message');
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        
        // Hide error after 5 seconds
        setTimeout(() => {
            errorEl.style.display = 'none';
        }, 5000);
    },
    
    /**
     * Handle key down events for remote control
     * @param {KeyboardEvent} event - Key event
     */
    handleKeyDown: function(event) {
        // Only handle keys when player is active
        if (!this.elements.container.classList.contains('active')) {
            return;
        }
        
        switch (event.keyCode) {
            case 13: // Enter
                this.togglePlayPause();
                break;
            case 415: // Play
                this.play();
                break;
            case 19: // Pause
                this.pause();
                break;
            case 413: // Stop
                this.stop();
                break;
            case 10009: // Return/Back
            case 27: // Escape
                this.stop();
                break;
            case 37: // Left arrow - rewind
                this.seekRelative(-10);
                break;
            case 39: // Right arrow - forward
                this.seekRelative(10);
                break;
            case 38: // Up arrow - volume up
                this.adjustVolume(1);
                break;
            case 40: // Down arrow - volume down
                this.adjustVolume(-1);
                break;
        }
    },
    
    /**
     * Seek to a relative position (current time + seconds)
     * @param {number} seconds - Seconds to seek (positive or negative)
     */
    seekRelative: function(seconds) {
        if (!this.avplay || this.state.streamType === 'live') return;
        
        try {
            const newTime = this.state.currentTime + (seconds * 1000);
            this.avplay.seekTo(newTime);
        } catch (e) {
            Config.log('Error seeking:', e);
        }
    },
    
    /**
     * Adjust volume
     * @param {number} delta - Volume change (-1 to 1)
     */
    adjustVolume: function(delta) {
        if (!this.avplay) return;
        
        try {
            // Get current volume (0-100)
            const currentVolume = this.avplay.getVolume();
            // Calculate new volume
            const newVolume = Math.max(0, Math.min(100, currentVolume + (delta * 5)));
            // Set new volume
            this.avplay.setVolume(newVolume);
        } catch (e) {
            Config.log('Error adjusting volume:', e);
        }
    },
    
    // AVPlay event handlers
    onBufferingStart: function() {
        Config.log('Buffering started');
        this.showLoading(true);
    },
    
    onBufferingProgress: function(percent) {
        Config.log('Buffering progress:', percent);
        this.state.bufferingProgress = percent;
    },
    
    onBufferingComplete: function() {
        Config.log('Buffering complete');
        this.showLoading(false);
    },
    
    onCurrentPlayTime: function(time) {
        this.state.currentTime = time;
        
        // Update progress bar for VOD content
        if (this.state.duration > 0 && this.state.streamType !== 'live') {
            const progress = (time / this.state.duration) * 100;
            this.updateProgressBar(progress);
        }
    },
    
    onPlaybackCompleted: function() {
        Config.log('Playback completed');
        this.closePlayer();
    },
    
    onEvent: function(eventType, eventData) {
        Config.log('Player event:', eventType, eventData);
        
        // Handle duration change event
        if (eventType === "DURATION_CHANGE") {
            this.state.duration = eventData;
        }
    },
    
    onError: function(error) {
        Config.log('Player error:', error);
        this.showError('Playback error: ' + error);
        this.closePlayer();
    }
};