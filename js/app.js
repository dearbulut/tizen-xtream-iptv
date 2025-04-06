/**
 * Main application module
 * Initializes and manages the application
 */
const App = {
    // Application state
    state: {
        initialized: false,
        currentSection: null,
        currentCategory: null,
        contentCache: {
            liveCategories: null,
            liveStreams: {},
            vodCategories: null,
            vodStreams: {},
            seriesCategories: null,
            series: {},
            seriesDetails: {}
        }
    },
    
    /**
     * Initialize the application
     */
    init: function() {
        // Check if Tizen API is available
        if (window.tizen) {
            // Register keys for Tizen TV
            try {
                const keys = [
                    'MediaPlayPause',
                    'MediaPlay',
                    'MediaPause',
                    'MediaStop',
                    'MediaRewind',
                    'MediaFastForward',
                    'MediaTrackPrevious',
                    'MediaTrackNext'
                ];
                
                for (const key of keys) {
                    tizen.tvinputdevice.registerKey(key);
                }
                
                Config.log('Tizen keys registered successfully');
            } catch (e) {
                Config.log('Failed to register Tizen keys:', e);
            }
        }
        
        // Initialize modules
        Player.init();
        Navigation.init();
        
        // Add event listeners
        this.addEventListeners();
        
        // Check if API is configured
        if (XtreamAPI.isConfigured()) {
            // Load default section
            this.loadSection(Config.ui.defaultSection);
        } else {
            // Show configuration dialog
            XtreamAPI.showConfigDialog((success) => {
                if (success) {
                    this.loadSection(Config.ui.defaultSection);
                }
            });
        }
        
        this.state.initialized = true;
        Config.log('Application initialized');
        
        return this;
    },
    
    /**
     * Add event listeners
     */
    addEventListeners: function() {
        // Add click event listeners to navigation items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const section = item.getAttribute('data-section');
                this.loadSection(section);
            });
        });
        
        // Add visibility change event listener
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Pause playback when app goes to background
                if (Player.state.playing) {
                    Player.pause();
                }
            }
        });
    },
    
    /**
     * Load a section (live, movies, series)
     * @param {string} section - Section to load
     */
    loadSection: function(section) {
        // Update navigation
        Navigation.switchSection(section);
        
        // Update state
        this.state.currentSection = section;
        this.state.currentCategory = null;
        
        // Load content for the section
        this.loadContent(section);
    },
    
    /**
     * Load content for a section
     * @param {string} section - Section to load content for
     * @param {string} categoryId - Category ID (optional)
     */
    loadContent: function(section, categoryId = null) {
        this.state.currentCategory = categoryId;
        this.showLoading(true);
        
        switch (section) {
            case 'live':
                this.loadLiveContent(categoryId);
                break;
            case 'movies':
                this.loadMoviesContent(categoryId);
                break;
            case 'series':
                this.loadSeriesContent(categoryId);
                break;
            default:
                this.showError(`Unknown section: ${section}`);
                this.showLoading(false);
        }
    },
    
    /**
     * Load live TV content
     * @param {string} categoryId - Category ID (optional)
     */
    loadLiveContent: function(categoryId) {
        // Load categories if not cached
        const loadCategories = () => {
            if (this.state.contentCache.liveCategories) {
                this.renderCategories('live', this.state.contentCache.liveCategories, categoryId);
                return Promise.resolve();
            } else {
                return XtreamAPI.getLiveCategories()
                    .then(categories => {
                        this.state.contentCache.liveCategories = categories;
                        this.renderCategories('live', categories, categoryId);
                    });
            }
        };
        
        // Load streams
        const loadStreams = () => {
            // If we have cached streams for this category, use them
            if (categoryId && this.state.contentCache.liveStreams[categoryId]) {
                this.renderLiveStreams(this.state.contentCache.liveStreams[categoryId]);
                this.showLoading(false);
                return;
            }
            
            // Otherwise, fetch from API
            XtreamAPI.getLiveStreams(categoryId)
                .then(streams => {
                    // Cache the streams
                    if (categoryId) {
                        this.state.contentCache.liveStreams[categoryId] = streams;
                    } else {
                        // For "all" category, we don't cache to save memory
                    }
                    
                    this.renderLiveStreams(streams);
                })
                .catch(error => {
                    this.showError(`Failed to load live streams: ${error.message}`);
                })
                .finally(() => {
                    this.showLoading(false);
                });
        };
        
        // Load categories first, then streams
        loadCategories()
            .then(loadStreams)
            .catch(error => {
                this.showError(`Failed to load live categories: ${error.message}`);
                this.showLoading(false);
            });
    },
    
    /**
     * Load movies content
     * @param {string} categoryId - Category ID (optional)
     */
    loadMoviesContent: function(categoryId) {
        // Load categories if not cached
        const loadCategories = () => {
            if (this.state.contentCache.vodCategories) {
                this.renderCategories('movies', this.state.contentCache.vodCategories, categoryId);
                return Promise.resolve();
            } else {
                return XtreamAPI.getVodCategories()
                    .then(categories => {
                        this.state.contentCache.vodCategories = categories;
                        this.renderCategories('movies', categories, categoryId);
                    });
            }
        };
        
        // Load streams
        const loadStreams = () => {
            // If we have cached streams for this category, use them
            if (categoryId && this.state.contentCache.vodStreams[categoryId]) {
                this.renderMovies(this.state.contentCache.vodStreams[categoryId]);
                this.showLoading(false);
                return;
            }
            
            // Otherwise, fetch from API
            XtreamAPI.getVodStreams(categoryId)
                .then(streams => {
                    // Cache the streams
                    if (categoryId) {
                        this.state.contentCache.vodStreams[categoryId] = streams;
                    }
                    
                    this.renderMovies(streams);
                })
                .catch(error => {
                    this.showError(`Failed to load movies: ${error.message}`);
                })
                .finally(() => {
                    this.showLoading(false);
                });
        };
        
        // Load categories first, then streams
        loadCategories()
            .then(loadStreams)
            .catch(error => {
                this.showError(`Failed to load movie categories: ${error.message}`);
                this.showLoading(false);
            });
    },
    
    /**
     * Load series content
     * @param {string} categoryId - Category ID (optional)
     */
    loadSeriesContent: function(categoryId) {
        // Load categories if not cached
        const loadCategories = () => {
            if (this.state.contentCache.seriesCategories) {
                this.renderCategories('series', this.state.contentCache.seriesCategories, categoryId);
                return Promise.resolve();
            } else {
                return XtreamAPI.getSeriesCategories()
                    .then(categories => {
                        this.state.contentCache.seriesCategories = categories;
                        this.renderCategories('series', categories, categoryId);
                    });
            }
        };
        
        // Load series
        const loadSeries = () => {
            // If we have cached series for this category, use them
            if (categoryId && this.state.contentCache.series[categoryId]) {
                this.renderSeries(this.state.contentCache.series[categoryId]);
                this.showLoading(false);
                return;
            }
            
            // Otherwise, fetch from API
            XtreamAPI.getSeries(categoryId)
                .then(series => {
                    // Cache the series
                    if (categoryId) {
                        this.state.contentCache.series[categoryId] = series;
                    }
                    
                    this.renderSeries(series);
                })
                .catch(error => {
                    this.showError(`Failed to load series: ${error.message}`);
                })
                .finally(() => {
                    this.showLoading(false);
                });
        };
        
        // Load categories first, then series
        loadCategories()
            .then(loadSeries)
            .catch(error => {
                this.showError(`Failed to load series categories: ${error.message}`);
                this.showLoading(false);
            });
    },
    
    /**
     * Show series details
     * @param {string} seriesId - Series ID
     */
    showSeriesDetails: function(seriesId) {
        this.showLoading(true);
        
        // Check if we have cached details
        if (this.state.contentCache.seriesDetails[seriesId]) {
            this.renderSeriesDetails(this.state.contentCache.seriesDetails[seriesId]);
            this.showLoading(false);
            return;
        }
        
        // Fetch series details from API
        XtreamAPI.getSeriesInfo(seriesId)
            .then(details => {
                // Cache the details
                this.state.contentCache.seriesDetails[seriesId] = details;
                this.renderSeriesDetails(details);
            })
            .catch(error => {
                this.showError(`Failed to load series details: ${error.message}`);
            })
            .finally(() => {
                this.showLoading(false);
            });
    },
    
    /**
     * Hide series details
     */
    hideSeriesDetails: function() {
        const detailsEl = document.querySelector('.series-details');
        if (detailsEl) {
            detailsEl.classList.remove('active');
            detailsEl.remove();
        }
    },
    
    /**
     * Render categories
     * @param {string} section - Section (live, movies, series)
     * @param {Array} categories - Categories to render
     * @param {string} activeCategoryId - Active category ID (optional)
     */
    renderCategories: function(section, categories, activeCategoryId = null) {
        const container = document.querySelector(`#${section}-section .categories-list`);
        if (!container) return;
        
        // Clear container
        container.innerHTML = '';
        
        // Add "All" category
        const allCategory = document.createElement('div');
        allCategory.className = 'category-item' + (activeCategoryId ? '' : ' active');
        allCategory.setAttribute('tabindex', '0');
        allCategory.textContent = 'All';
        allCategory.addEventListener('click', () => {
            this.loadContent(section);
        });
        container.appendChild(allCategory);
        
        // Add categories
        categories.forEach(category => {
            const categoryEl = document.createElement('div');
            categoryEl.className = 'category-item' + (category.category_id === activeCategoryId ? ' active' : '');
            categoryEl.setAttribute('data-id', category.category_id);
            categoryEl.setAttribute('tabindex', '0');
            categoryEl.textContent = category.category_name;
            
            categoryEl.addEventListener('click', () => {
                this.loadContent(section, category.category_id);
            });
            
            container.appendChild(categoryEl);
        });
    },
    
    /**
     * Render live streams
     * @param {Array} streams - Streams to render
     */
    renderLiveStreams: function(streams) {
        const container = document.querySelector('#live-section .channels-list');
        if (!container) return;
        
        // Clear container
        container.innerHTML = '';
        
        // Add streams
        streams.forEach(stream => {
            const streamEl = document.createElement('div');
            streamEl.className = 'content-item';
            streamEl.setAttribute('data-id', stream.stream_id);
            streamEl.setAttribute('data-type', 'live');
            streamEl.setAttribute('tabindex', '0');
            
            // Create thumbnail
            const img = document.createElement('img');
            img.src = stream.stream_icon || 'images/default-channel.png';
            img.alt = stream.name;
            img.onerror = function() {
                this.src = 'images/default-channel.png';
            };
            
            // Create title
            const title = document.createElement('div');
            title.className = 'title';
            title.textContent = stream.name;
            
            // Add elements to stream
            streamEl.appendChild(img);
            streamEl.appendChild(title);
            
            // Add click event
            streamEl.addEventListener('click', () => {
                Player.playStream(stream.stream_id, 'live');
            });
            
            container.appendChild(streamEl);
        });
        
        // If no streams, show message
        if (streams.length === 0) {
            container.innerHTML = '<div class="no-content">No channels found</div>';
        }
    },
    
    /**
     * Render movies
     * @param {Array} movies - Movies to render
     */
    renderMovies: function(movies) {
        const container = document.querySelector('#movies-section .movies-list');
        if (!container) return;
        
        // Clear container
        container.innerHTML = '';
        
        // Add movies
        movies.forEach(movie => {
            const movieEl = document.createElement('div');
            movieEl.className = 'content-item';
            movieEl.setAttribute('data-id', movie.stream_id);
            movieEl.setAttribute('data-type', 'movie');
            movieEl.setAttribute('tabindex', '0');
            
            // Create thumbnail
            const img = document.createElement('img');
            img.src = movie.stream_icon || 'images/default-movie.png';
            img.alt = movie.name;
            img.onerror = function() {
                this.src = 'images/default-movie.png';
            };
            
            // Create title
            const title = document.createElement('div');
            title.className = 'title';
            title.textContent = movie.name;
            
            // Add elements to movie
            movieEl.appendChild(img);
            movieEl.appendChild(title);
            
            // Add click event
            movieEl.addEventListener('click', () => {
                Player.playStream(movie.stream_id, 'movie');
            });
            
            container.appendChild(movieEl);
        });
        
        // If no movies, show message
        if (movies.length === 0) {
            container.innerHTML = '<div class="no-content">No movies found</div>';
        }
    },
    
    /**
     * Render series
     * @param {Array} seriesList - Series to render
     */
    renderSeries: function(seriesList) {
        const container = document.querySelector('#series-section .series-list');
        if (!container) return;
        
        // Clear container
        container.innerHTML = '';
        
        // Add series
        seriesList.forEach(series => {
            const seriesEl = document.createElement('div');
            seriesEl.className = 'content-item';
            seriesEl.setAttribute('data-id', series.series_id);
            seriesEl.setAttribute('data-type', 'series');
            seriesEl.setAttribute('tabindex', '0');
            
            // Create thumbnail
            const img = document.createElement('img');
            img.src = series.cover || 'images/default-series.png';
            img.alt = series.name;
            img.onerror = function() {
                this.src = 'images/default-series.png';
            };
            
            // Create title
            const title = document.createElement('div');
            title.className = 'title';
            title.textContent = series.name;
            
            // Add elements to series
            seriesEl.appendChild(img);
            seriesEl.appendChild(title);
            
            // Add click event
            seriesEl.addEventListener('click', () => {
                this.showSeriesDetails(series.series_id);
            });
            
            container.appendChild(seriesEl);
        });
        
        // If no series, show message
        if (seriesList.length === 0) {
            container.innerHTML = '<div class="no-content">No series found</div>';
        }
    },
    
    /**
     * Render series details
     * @param {Object} details - Series details
     */
    renderSeriesDetails: function(details) {
        // Remove existing details if any
        this.hideSeriesDetails();
        
        // Create details container
        const detailsEl = document.createElement('div');
        detailsEl.className = 'series-details active';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'details-header';
        
        const backBtn = document.createElement('button');
        backBtn.className = 'back-button';
        backBtn.textContent = 'Back';
        backBtn.setAttribute('tabindex', '0');
        backBtn.addEventListener('click', () => {
            this.hideSeriesDetails();
        });
        
        const title = document.createElement('h2');
        title.textContent = details.info.name;
        
        header.appendChild(backBtn);
        header.appendChild(title);
        
        // Create info section
        const infoSection = document.createElement('div');
        infoSection.className = 'details-info';
        
        const poster = document.createElement('img');
        poster.src = details.info.cover || 'images/default-series.png';
        poster.alt = details.info.name;
        poster.onerror = function() {
            this.src = 'images/default-series.png';
        };
        
        const info = document.createElement('div');
        info.className = 'info-text';
        
        const plot = document.createElement('p');
        plot.className = 'plot';
        plot.textContent = details.info.plot || 'No description available';
        
        const meta = document.createElement('div');
        meta.className = 'meta-info';
        meta.innerHTML = `
            <div>Genre: ${details.info.genre || 'N/A'}</div>
            <div>Rating: ${details.info.rating || 'N/A'}</div>
            <div>Release Date: ${details.info.releaseDate || 'N/A'}</div>
        `;
        
        info.appendChild(plot);
        info.appendChild(meta);
        
        infoSection.appendChild(poster);
        infoSection.appendChild(info);
        
        // Create episodes section
        const episodesSection = document.createElement('div');
        episodesSection.className = 'episodes-section';
        
        // Group episodes by season
        const seasons = {};
        if (details.episodes) {
            Object.keys(details.episodes).forEach(seasonNum => {
                seasons[seasonNum] = details.episodes[seasonNum];
            });
        }
        
        // Create season tabs
        const seasonTabs = document.createElement('div');
        seasonTabs.className = 'season-tabs';
        
        Object.keys(seasons).sort((a, b) => parseInt(a) - parseInt(b)).forEach((seasonNum, index) => {
            const tab = document.createElement('div');
            tab.className = 'season-tab' + (index === 0 ? ' active' : '');
            tab.setAttribute('data-season', seasonNum);
            tab.setAttribute('tabindex', '0');
            tab.textContent = `Season ${seasonNum}`;
            
            tab.addEventListener('click', () => {
                // Update active tab
                document.querySelectorAll('.season-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Show episodes for this season
                document.querySelectorAll('.season-episodes').forEach(s => s.classList.remove('active'));
                document.querySelector(`.season-episodes[data-season="${seasonNum}"]`).classList.add('active');
            });
            
            seasonTabs.appendChild(tab);
        });
        
        // Create episodes list for each season
        const episodesList = document.createElement('div');
        episodesList.className = 'episodes-list';
        
        Object.keys(seasons).sort((a, b) => parseInt(a) - parseInt(b)).forEach((seasonNum, index) => {
            const seasonEpisodes = document.createElement('div');
            seasonEpisodes.className = 'season-episodes' + (index === 0 ? ' active' : '');
            seasonEpisodes.setAttribute('data-season', seasonNum);
            
            // Add episodes
            seasons[seasonNum].forEach(episode => {
                const episodeEl = document.createElement('div');
                episodeEl.className = 'episode-item';
                episodeEl.setAttribute('tabindex', '0');
                
                const episodeTitle = document.createElement('div');
                episodeTitle.className = 'episode-title';
                episodeTitle.textContent = `${episode.episode_num}. ${episode.title || 'Episode ' + episode.episode_num}`;
                
                const episodeInfo = document.createElement('div');
                episodeInfo.className = 'episode-info';
                episodeInfo.textContent = episode.info || '';
                
                episodeEl.appendChild(episodeTitle);
                episodeEl.appendChild(episodeInfo);
                
                // Add click event
                episodeEl.addEventListener('click', () => {
                    Player.playStream(details.info.series_id, 'series', {
                        season: seasonNum,
                        episode: episode.id
                    });
                });
                
                seasonEpisodes.appendChild(episodeEl);
            });
            
            episodesList.appendChild(seasonEpisodes);
        });
        
        episodesSection.appendChild(seasonTabs);
        episodesSection.appendChild(episodesList);
        
        // Add all sections to details
        detailsEl.appendChild(header);
        detailsEl.appendChild(infoSection);
        detailsEl.appendChild(episodesSection);
        
        // Add to document
        document.getElementById('content-container').appendChild(detailsEl);
        
        // Set focus to back button
        backBtn.focus();
    },
    
    /**
     * Show loading indicator
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
        
        Config.log('Error:', message);
    },
    
    /**
     * Show exit confirmation dialog
     */
    showExitConfirmation: function() {
        // Create modal dialog
        const modal = document.createElement('div');
        modal.className = 'exit-modal';
        modal.innerHTML = `
            <div class="exit-dialog">
                <h2>Exit Application?</h2>
                <p>Are you sure you want to exit?</p>
                <div class="exit-actions">
                    <button id="exit-yes" tabindex="0">Yes</button>
                    <button id="exit-no" tabindex="0">No</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Focus "No" button by default
        document.getElementById('exit-no').focus();
        
        // Add event listeners
        document.getElementById('exit-yes').addEventListener('click', () => {
            // Exit the application
            if (window.tizen) {
                tizen.application.getCurrentApplication().exit();
            } else {
                window.close();
            }
        });
        
        document.getElementById('exit-no').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Handle key events
        const handleKeyDown = (event) => {
            switch (event.keyCode) {
                case 13: // Enter
                    if (document.activeElement.id === 'exit-yes') {
                        if (window.tizen) {
                            tizen.application.getCurrentApplication().exit();
                        } else {
                            window.close();
                        }
                    } else {
                        document.body.removeChild(modal);
                        document.removeEventListener('keydown', handleKeyDown);
                    }
                    break;
                case 27: // Escape
                case 10009: // Return/Back key
                    document.body.removeChild(modal);
                    document.removeEventListener('keydown', handleKeyDown);
                    break;
                case 37: // Left arrow
                case 39: // Right arrow
                    // Toggle focus between buttons
                    if (document.activeElement.id === 'exit-yes') {
                        document.getElementById('exit-no').focus();
                    } else {
                        document.getElementById('exit-yes').focus();
                    }
                    break;
            }
            
            event.preventDefault();
            event.stopPropagation();
        };
        
        document.addEventListener('keydown', handleKeyDown);
    }
};

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});