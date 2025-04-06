/**
 * Tizen application lifecycle management
 */
(function() {
    'use strict';
    
    /**
     * Handle the application initialization
     */
    function onApplicationInit() {
        console.log('Application initialized');
        
        // Register hardware keys
        registerKeys();
        
        // Initialize application
        if (window.App) {
            window.App.init();
        }
    }
    
    /**
     * Register hardware keys for Tizen TV
     */
    function registerKeys() {
        if (window.tizen && window.tizen.tvinputdevice) {
            try {
                const keys = [
                    'MediaPlayPause',
                    'MediaPlay',
                    'MediaPause',
                    'MediaStop',
                    'MediaRewind',
                    'MediaFastForward',
                    'MediaTrackPrevious',
                    'MediaTrackNext',
                    'ColorF0Red',
                    'ColorF1Green',
                    'ColorF2Yellow',
                    'ColorF3Blue'
                ];
                
                for (const key of keys) {
                    tizen.tvinputdevice.registerKey(key);
                }
                
                console.log('Tizen keys registered successfully');
            } catch (e) {
                console.error('Failed to register Tizen keys:', e);
            }
        }
    }
    
    /**
     * Handle application pause event
     */
    function onApplicationPause() {
        console.log('Application paused');
        
        // Pause media playback if active
        if (window.Player && window.Player.state.playing) {
            window.Player.pause();
        }
    }
    
    /**
     * Handle application resume event
     */
    function onApplicationResume() {
        console.log('Application resumed');
    }
    
    /**
     * Handle application exit event
     */
    function onApplicationExit() {
        console.log('Application exiting');
        
        // Stop media playback if active
        if (window.Player) {
            window.Player.stop();
        }
    }
    
    /**
     * Initialize the application when document is loaded
     */
    window.addEventListener('load', function() {
        // Add Tizen event listeners if available
        if (window.tizen) {
            document.addEventListener('tizenhwkey', function(e) {
                if (e.keyName === 'back') {
                    if (window.App) {
                        // Let the app handle the back key
                        window.App.handleBack();
                    } else {
                        // Default behavior: exit the application
                        tizen.application.getCurrentApplication().exit();
                    }
                }
            });
            
            // Register application lifecycle event handlers
            tizen.application.getCurrentApplication().addEventListener('pause', onApplicationPause);
            tizen.application.getCurrentApplication().addEventListener('resume', onApplicationResume);
            tizen.application.getCurrentApplication().addEventListener('exit', onApplicationExit);
        }
        
        // Initialize the application
        onApplicationInit();
    });
})();