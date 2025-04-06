/**
 * API handler for Xtream IPTV
 * Manages all communication with the Xtream API
 */
const XtreamAPI = {
    // Authentication token and session data
    authData: null,
    
    // API endpoints
    endpoints: {
        authenticate: '/player_api.php',
        getLiveStreams: '/player_api.php?action=get_live_streams',
        getLiveCategories: '/player_api.php?action=get_live_categories',
        getVodStreams: '/player_api.php?action=get_vod_streams',
        getVodCategories: '/player_api.php?action=get_vod_categories',
        getSeriesCategories: '/player_api.php?action=get_series_categories',
        getSeries: '/player_api.php?action=get_series',
        getSeriesInfo: '/player_api.php?action=get_series_info',
        getShortEPG: '/player_api.php?action=get_short_epg',
        getSimpleDataTable: '/player_api.php?action=get_simple_data_table'
    },
    
    /**
     * Initialize the API with credentials
     * @param {Object} credentials - {baseUrl, username, password}
     * @returns {Promise} - Resolves with auth data or rejects with error
     */
    initialize: function(credentials) {
        return new Promise((resolve, reject) => {
            if (!credentials.baseUrl || !credentials.username || !credentials.password) {
                reject(new Error('Missing required credentials'));
                return;
            }
            
            // Store credentials in config
            Config.api.baseUrl = credentials.baseUrl;
            Config.api.username = credentials.username;
            Config.api.password = credentials.password;
            
            // Authenticate with the API
            this.authenticate()
                .then(authData => {
                    Config.api.isConfigured = true;
                    Config.save();
                    resolve(authData);
                })
                .catch(error => {
                    reject(error);
                });
        });
    },
    
    /**
     * Authenticate with the Xtream API
     * @returns {Promise} - Resolves with auth data or rejects with error
     */
    authenticate: function() {
        return new Promise((resolve, reject) => {
            const { baseUrl, username, password } = Config.api;
            const authUrl = `${baseUrl}${this.endpoints.authenticate}?username=${username}&password=${password}`;
            
            fetch(authUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.user_info && data.server_info) {
                        this.authData = data;
                        Config.log('Authentication successful', data);
                        resolve(data);
                    } else {
                        throw new Error('Invalid authentication response');
                    }
                })
                .catch(error => {
                    Config.log('Authentication error:', error);
                    reject(error);
                });
        });
    },
    
    /**
     * Get live TV categories
     * @returns {Promise} - Resolves with categories or rejects with error
     */
    getLiveCategories: function() {
        return this.makeApiRequest(this.endpoints.getLiveCategories);
    },
    
    /**
     * Get live streams by category
     * @param {string} categoryId - Category ID (optional)
     * @returns {Promise} - Resolves with streams or rejects with error
     */
    getLiveStreams: function(categoryId) {
        let endpoint = this.endpoints.getLiveStreams;
        if (categoryId) {
            endpoint += `&category_id=${categoryId}`;
        }
        return this.makeApiRequest(endpoint);
    },
    
    /**
     * Get VOD (movie) categories
     * @returns {Promise} - Resolves with categories or rejects with error
     */
    getVodCategories: function() {
        return this.makeApiRequest(this.endpoints.getVodCategories);
    },
    
    /**
     * Get VOD streams by category
     * @param {string} categoryId - Category ID (optional)
     * @returns {Promise} - Resolves with streams or rejects with error
     */
    getVodStreams: function(categoryId) {
        let endpoint = this.endpoints.getVodStreams;
        if (categoryId) {
            endpoint += `&category_id=${categoryId}`;
        }
        return this.makeApiRequest(endpoint);
    },
    
    /**
     * Get series categories
     * @returns {Promise} - Resolves with categories or rejects with error
     */
    getSeriesCategories: function() {
        return this.makeApiRequest(this.endpoints.getSeriesCategories);
    },
    
    /**
     * Get series by category
     * @param {string} categoryId - Category ID (optional)
     * @returns {Promise} - Resolves with series or rejects with error
     */
    getSeries: function(categoryId) {
        let endpoint = this.endpoints.getSeries;
        if (categoryId) {
            endpoint += `&category_id=${categoryId}`;
        }
        return this.makeApiRequest(endpoint);
    },
    
    /**
     * Get detailed information about a series
     * @param {string} seriesId - Series ID
     * @returns {Promise} - Resolves with series info or rejects with error
     */
    getSeriesInfo: function(seriesId) {
        if (!seriesId) {
            return Promise.reject(new Error('Series ID is required'));
        }
        return this.makeApiRequest(`${this.endpoints.getSeriesInfo}&series_id=${seriesId}`);
    },
    
    /**
     * Get EPG (Electronic Program Guide) for a channel
     * @param {string} streamId - Stream ID
     * @param {number} limit - Number of EPG items to retrieve (optional)
     * @returns {Promise} - Resolves with EPG data or rejects with error
     */
    getShortEPG: function(streamId, limit = 5) {
        if (!streamId) {
            return Promise.reject(new Error('Stream ID is required'));
        }
        return this.makeApiRequest(`${this.endpoints.getShortEPG}&stream_id=${streamId}&limit=${limit}`);
    },
    
    /**
     * Make a request to the Xtream API
     * @param {string} endpoint - API endpoint
     * @returns {Promise} - Resolves with response data or rejects with error
     */
    makeApiRequest: function(endpoint) {
        return new Promise((resolve, reject) => {
            if (!this.authData && Config.api.isConfigured) {
                // Try to re-authenticate if we have credentials but no auth data
                this.authenticate()
                    .then(() => this.makeApiRequest(endpoint))
                    .then(resolve)
                    .catch(reject);
                return;
            }
            
            if (!Config.api.isConfigured) {
                reject(new Error('API not configured. Please set up your Xtream account.'));
                return;
            }
            
            const { baseUrl, username, password } = Config.api;
            const url = `${baseUrl}${endpoint}`;
            
            Config.log('API Request:', url);
            
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    Config.log('API Response:', endpoint, data);
                    resolve(data);
                })
                .catch(error => {
                    Config.log('API Error:', endpoint, error);
                    reject(error);
                });
        });
    },
    
    /**
     * Get stream URL for playback
     * @param {string} streamId - Stream ID
     * @param {string} streamType - Stream type (live, movie, series)
     * @param {Object} options - Additional options for series (season, episode)
     * @returns {string} - Playback URL
     */
    getStreamUrl: function(streamId, streamType, options = {}) {
        const { baseUrl, username, password } = Config.api;
        
        switch (streamType) {
            case 'live':
                return `${baseUrl}/live/${username}/${password}/${streamId}.ts`;
            case 'movie':
                return `${baseUrl}/movie/${username}/${password}/${streamId}.mp4`;
            case 'series':
                if (!options.season || !options.episode) {
                    throw new Error('Season and episode are required for series streams');
                }
                return `${baseUrl}/series/${username}/${password}/${streamId}/${options.season}/${options.episode}.mp4`;
            default:
                throw new Error(`Unknown stream type: ${streamType}`);
        }
    },
    
    /**
     * Check if the API is properly configured
     * @returns {boolean} - True if configured, false otherwise
     */
    isConfigured: function() {
        return Config.api.isConfigured;
    },
    
    /**
     * Show the configuration dialog
     * @param {Function} callback - Called after configuration is complete
     */
    showConfigDialog: function(callback) {
        // Create modal dialog for configuration
        const modal = document.createElement('div');
        modal.className = 'config-modal';
        modal.innerHTML = `
            <div class="config-dialog">
                <h2>Xtream IPTV Configuration</h2>
                <form id="config-form">
                    <div class="form-group">
                        <label for="server-url">Server URL</label>
                        <input type="text" id="server-url" placeholder="http://example.com:port" value="${Config.api.baseUrl || ''}">
                    </div>
                    <div class="form-group">
                        <label for="username">Username</label>
                        <input type="text" id="username" placeholder="Username" value="${Config.api.username || ''}">
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" placeholder="Password" value="${Config.api.password || ''}">
                    </div>
                    <div class="form-actions">
                        <button type="submit" id="save-config">Save</button>
                        <button type="button" id="cancel-config">Cancel</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        document.getElementById('config-form').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const serverUrl = document.getElementById('server-url').value.trim();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            
            if (!serverUrl || !username || !password) {
                alert('All fields are required');
                return;
            }
            
            // Initialize API with new credentials
            this.initialize({
                baseUrl: serverUrl,
                username: username,
                password: password
            })
            .then(() => {
                document.body.removeChild(modal);
                if (typeof callback === 'function') {
                    callback(true);
                }
            })
            .catch(error => {
                alert(`Configuration failed: ${error.message}`);
            });
        });
        
        document.getElementById('cancel-config').addEventListener('click', () => {
            document.body.removeChild(modal);
            if (typeof callback === 'function') {
                callback(false);
            }
        });
    }
};