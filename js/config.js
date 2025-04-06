/**
 * Configuration file for Xtream IPTV Player
 */
const Config = {
    // Default API settings (will be overridden by user input)
    api: {
        baseUrl: '',
        username: '',
        password: '',
        isConfigured: false
    },
    
    // Player settings
    player: {
        bufferingTimeout: 10000, // ms
        retryAttempts: 3,
        autoplay: true
    },
    
    // UI settings
    ui: {
        defaultSection: 'live',
        transitionSpeed: 300, // ms
        thumbnailQuality: 'medium', // low, medium, high
        itemsPerPage: 20
    },
    
    // Debug mode
    debug: false,
    
    // Initialize configuration
    init: function() {
        // Load saved configuration from localStorage if available
        const savedConfig = localStorage.getItem('xtreamConfig');
        if (savedConfig) {
            try {
                const parsedConfig = JSON.parse(savedConfig);
                this.api = { ...this.api, ...parsedConfig.api };
                this.player = { ...this.player, ...parsedConfig.player };
                this.ui = { ...this.ui, ...parsedConfig.ui };
                this.debug = parsedConfig.debug || false;
            } catch (e) {
                console.error('Failed to parse saved configuration:', e);
            }
        }
        
        return this;
    },
    
    // Save current configuration to localStorage
    save: function() {
        try {
            localStorage.setItem('xtreamConfig', JSON.stringify({
                api: this.api,
                player: this.player,
                ui: this.ui,
                debug: this.debug
            }));
        } catch (e) {
            console.error('Failed to save configuration:', e);
        }
    },
    
    // Reset configuration to defaults
    reset: function() {
        localStorage.removeItem('xtreamConfig');
        this.init();
    },
    
    // Log messages when in debug mode
    log: function(...args) {
        if (this.debug) {
            console.log('[Xtream IPTV]', ...args);
        }
    }
};

// Initialize configuration on load
Config.init();