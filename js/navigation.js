/**
 * Navigation module for TV remote control
 * Handles spatial navigation and focus management
 */
const Navigation = {
    // Current focused element
    currentFocus: null,
    
    // Navigation sections and their focusable elements
    sections: {
        mainNav: null,
        liveContent: null,
        moviesContent: null,
        seriesContent: null,
        player: null
    },
    
    // Initialize navigation
    init: function() {
        // Get navigation sections
        this.sections.mainNav = document.getElementById('main-nav');
        this.sections.liveContent = document.getElementById('live-section');
        this.sections.moviesContent = document.getElementById('movies-section');
        this.sections.seriesContent = document.getElementById('series-section');
        this.sections.player = document.getElementById('player-container');
        
        // Set initial focus to the first nav item
        const firstNavItem = document.querySelector('.nav-item');
        if (firstNavItem) {
            this.setFocus(firstNavItem);
        }
        
        // Add key event listeners
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        return this;
    },
    
    /**
     * Handle key down events
     * @param {KeyboardEvent} event - Key event
     */
    handleKeyDown: function(event) {
        // Skip if player is active (player handles its own keys)
        if (this.sections.player.classList.contains('active')) {
            return;
        }
        
        switch (event.keyCode) {
            case 37: // Left arrow
                this.moveFocus('left');
                event.preventDefault();
                break;
            case 38: // Up arrow
                this.moveFocus('up');
                event.preventDefault();
                break;
            case 39: // Right arrow
                this.moveFocus('right');
                event.preventDefault();
                break;
            case 40: // Down arrow
                this.moveFocus('down');
                event.preventDefault();
                break;
            case 13: // Enter
                this.handleEnter();
                event.preventDefault();
                break;
            case 10009: // Return/Back key (Samsung remote)
            case 27: // Escape
                this.handleBack();
                event.preventDefault();
                break;
        }
    },
    
    /**
     * Move focus in the specified direction
     * @param {string} direction - Direction to move (up, down, left, right)
     */
    moveFocus: function(direction) {
        if (!this.currentFocus) {
            // If no focus, set focus to first nav item
            const firstNavItem = document.querySelector('.nav-item');
            if (firstNavItem) {
                this.setFocus(firstNavItem);
            }
            return;
        }
        
        // Get all focusable elements in the current section
        const activeSection = document.querySelector('.content-section.active');
        const focusableElements = this.getFocusableElements(activeSection);
        
        // If we're in the main navigation
        if (this.currentFocus.closest('#main-nav')) {
            if (direction === 'down') {
                // Move down to the active section content
                const firstContentItem = focusableElements[0];
                if (firstContentItem) {
                    this.setFocus(firstContentItem);
                }
                return;
            } else if (direction === 'left' || direction === 'right') {
                // Move left/right within the nav items
                const navItems = Array.from(document.querySelectorAll('.nav-item'));
                const currentIndex = navItems.indexOf(this.currentFocus);
                const newIndex = direction === 'left' 
                    ? Math.max(0, currentIndex - 1) 
                    : Math.min(navItems.length - 1, currentIndex + 1);
                
                if (navItems[newIndex]) {
                    this.setFocus(navItems[newIndex]);
                }
                return;
            }
        }
        
        // If we're in a content section
        if (this.currentFocus.closest('.content-section')) {
            if (direction === 'up' && this.isInFirstRow(this.currentFocus, activeSection)) {
                // Move up to the main navigation
                const activeNavItem = document.querySelector('.nav-item.active');
                if (activeNavItem) {
                    this.setFocus(activeNavItem);
                }
                return;
            }
            
            // Find the next element in the specified direction
            const nextElement = this.findNextElement(this.currentFocus, direction, activeSection);
            if (nextElement) {
                this.setFocus(nextElement);
            }
        }
    },
    
    /**
     * Handle Enter key press
     */
    handleEnter: function() {
        if (!this.currentFocus) return;
        
        // If nav item is focused, switch to that section
        if (this.currentFocus.classList.contains('nav-item')) {
            const section = this.currentFocus.getAttribute('data-section');
            this.switchSection(section);
            return;
        }
        
        // If category item is focused
        if (this.currentFocus.classList.contains('category-item')) {
            const categoryId = this.currentFocus.getAttribute('data-id');
            const section = this.currentFocus.closest('.content-section').id.replace('-section', '');
            App.loadContent(section, categoryId);
            return;
        }
        
        // If content item is focused
        if (this.currentFocus.classList.contains('content-item')) {
            const itemId = this.currentFocus.getAttribute('data-id');
            const itemType = this.currentFocus.getAttribute('data-type');
            
            if (itemType === 'live') {
                Player.playStream(itemId, 'live');
            } else if (itemType === 'movie') {
                Player.playStream(itemId, 'movie');
            } else if (itemType === 'series') {
                // For series, show episode selection
                App.showSeriesDetails(itemId);
            }
        }
    },
    
    /**
     * Handle Back key press
     */
    handleBack: function() {
        // If in series details, go back to series list
        if (document.querySelector('.series-details.active')) {
            App.hideSeriesDetails();
            return;
        }
        
        // If a category is selected, clear category filter
        const activeCategory = document.querySelector('.category-item.active');
        if (activeCategory) {
            const section = activeCategory.closest('.content-section').id.replace('-section', '');
            App.loadContent(section);
            return;
        }
        
        // Otherwise, show exit confirmation
        App.showExitConfirmation();
    },
    
    /**
     * Switch to a different section
     * @param {string} section - Section to switch to (live, movies, series)
     */
    switchSection: function(section) {
        // Update active nav item
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.getAttribute('data-section') === section) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Update active content section
        const contentSections = document.querySelectorAll('.content-section');
        contentSections.forEach(item => {
            if (item.id === `${section}-section`) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Load content for the section if not already loaded
        App.loadContent(section);
    },
    
    /**
     * Set focus to an element
     * @param {HTMLElement} element - Element to focus
     */
    setFocus: function(element) {
        if (!element) return;
        
        // Remove focus from current element
        if (this.currentFocus) {
            this.currentFocus.blur();
        }
        
        // Set focus to new element
        this.currentFocus = element;
        element.focus();
        
        // Ensure the element is visible
        this.scrollIntoView(element);
    },
    
    /**
     * Scroll element into view if needed
     * @param {HTMLElement} element - Element to scroll into view
     */
    scrollIntoView: function(element) {
        if (!element) return;
        
        const container = element.closest('.content-section');
        if (!container) return;
        
        const elementRect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        if (elementRect.bottom > containerRect.bottom) {
            container.scrollTop += (elementRect.bottom - containerRect.bottom + 20);
        } else if (elementRect.top < containerRect.top) {
            container.scrollTop -= (containerRect.top - elementRect.top + 20);
        }
    },
    
    /**
     * Get all focusable elements in a container
     * @param {HTMLElement} container - Container element
     * @returns {Array} - Array of focusable elements
     */
    getFocusableElements: function(container) {
        if (!container) return [];
        
        // Get all potentially focusable elements
        return Array.from(container.querySelectorAll(
            '.nav-item, .category-item, .content-item, button, [tabindex="0"]'
        ));
    },
    
    /**
     * Check if element is in the first row of its container
     * @param {HTMLElement} element - Element to check
     * @param {HTMLElement} container - Container element
     * @returns {boolean} - True if element is in first row
     */
    isInFirstRow: function(element, container) {
        if (!element || !container) return false;
        
        // For category items
        if (element.classList.contains('category-item')) {
            return true; // Categories are always in the first row
        }
        
        // For content items
        if (element.classList.contains('content-item')) {
            const contentList = element.closest('.channels-list, .movies-list, .series-list');
            if (!contentList) return false;
            
            const items = Array.from(contentList.querySelectorAll('.content-item'));
            const firstRowItems = this.getFirstRowItems(items);
            
            return firstRowItems.includes(element);
        }
        
        return false;
    },
    
    /**
     * Get items in the first row of a grid
     * @param {Array} items - Array of items
     * @returns {Array} - Array of items in the first row
     */
    getFirstRowItems: function(items) {
        if (!items.length) return [];
        
        // Get the top position of the first item
        const firstItemTop = items[0].getBoundingClientRect().top;
        const threshold = 10; // Pixel threshold for same row
        
        // Return all items that are in the same row as the first item
        return items.filter(item => {
            const rect = item.getBoundingClientRect();
            return Math.abs(rect.top - firstItemTop) < threshold;
        });
    },
    
    /**
     * Find the next element in the specified direction
     * @param {HTMLElement} currentElement - Current focused element
     * @param {string} direction - Direction to move (up, down, left, right)
     * @param {HTMLElement} container - Container element
     * @returns {HTMLElement} - Next element to focus
     */
    findNextElement: function(currentElement, direction, container) {
        if (!currentElement || !container) return null;
        
        const focusableElements = this.getFocusableElements(container);
        if (!focusableElements.length) return null;
        
        const currentRect = currentElement.getBoundingClientRect();
        let bestCandidate = null;
        let bestDistance = Infinity;
        
        // For each focusable element, calculate distance in the specified direction
        focusableElements.forEach(element => {
            if (element === currentElement) return;
            
            const elementRect = element.getBoundingClientRect();
            let distance = Infinity;
            
            switch (direction) {
                case 'left':
                    if (elementRect.right <= currentRect.left) {
                        const horizontalDistance = currentRect.left - elementRect.right;
                        const verticalOffset = Math.abs(
                            (currentRect.top + currentRect.height / 2) - 
                            (elementRect.top + elementRect.height / 2)
                        );
                        distance = horizontalDistance + (verticalOffset * 3);
                    }
                    break;
                case 'right':
                    if (elementRect.left >= currentRect.right) {
                        const horizontalDistance = elementRect.left - currentRect.right;
                        const verticalOffset = Math.abs(
                            (currentRect.top + currentRect.height / 2) - 
                            (elementRect.top + elementRect.height / 2)
                        );
                        distance = horizontalDistance + (verticalOffset * 3);
                    }
                    break;
                case 'up':
                    if (elementRect.bottom <= currentRect.top) {
                        const verticalDistance = currentRect.top - elementRect.bottom;
                        const horizontalOffset = Math.abs(
                            (currentRect.left + currentRect.width / 2) - 
                            (elementRect.left + elementRect.width / 2)
                        );
                        distance = verticalDistance + (horizontalOffset * 3);
                    }
                    break;
                case 'down':
                    if (elementRect.top >= currentRect.bottom) {
                        const verticalDistance = elementRect.top - currentRect.bottom;
                        const horizontalOffset = Math.abs(
                            (currentRect.left + currentRect.width / 2) - 
                            (elementRect.left + elementRect.width / 2)
                        );
                        distance = verticalDistance + (horizontalOffset * 3);
                    }
                    break;
            }
            
            // Update best candidate if this element is closer
            if (distance < bestDistance) {
                bestDistance = distance;
                bestCandidate = element;
            }
        });
        
        return bestCandidate;
    }
};