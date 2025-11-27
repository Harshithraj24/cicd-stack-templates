class StackReference {
    constructor() {
        this.stacks = [];
        this.filteredStacks = [];
        this.init();
    }

    async init() {
        await this.loadStacks();
        this.setupEventListeners();
        this.setupTheme();
        this.renderStacks();
    }

    async loadStacks() {
        try {
            const response = await fetch('stacks.json');
            const data = await response.json();
            this.stacks = data.stacks;
            this.filteredStacks = [...this.stacks];
        } catch (error) {
            console.error('Failed to load stacks:', error);
            this.showError('Failed to load stack data');
        }
    }

    setupEventListeners() {
        const searchInput = document.getElementById('search-input');
        const typeFilter = document.getElementById('type-filter');
        const toolFilter = document.getElementById('tool-filter');
        const themeToggle = document.getElementById('theme-toggle');

        searchInput.addEventListener('input', this.debounce(() => this.filterStacks(), 300));
        typeFilter.addEventListener('change', () => this.filterStacks());
        toolFilter.addEventListener('change', () => this.filterStacks());
        themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.classList.add('dark');
        }
    }

    toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    filterStacks() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const typeFilter = document.getElementById('type-filter').value;
        const toolFilter = document.getElementById('tool-filter').value;

        this.filteredStacks = this.stacks.filter(stack => {
            const matchesSearch = !searchTerm || 
                stack.name.toLowerCase().includes(searchTerm) ||
                stack.description.toLowerCase().includes(searchTerm);
            
            const matchesType = !typeFilter || stack.type === typeFilter;
            const matchesTool = !toolFilter || stack.buildTool === toolFilter;

            return matchesSearch && matchesType && matchesTool;
        });

        this.renderStacks();
    }

    renderStacks() {
        const container = document.getElementById('stacks-container');
        const noResults = document.getElementById('no-results');

        if (this.filteredStacks.length === 0) {
            container.innerHTML = '';
            noResults.classList.remove('hidden');
            return;
        }

        noResults.classList.add('hidden');
        container.innerHTML = this.filteredStacks.map(stack => this.createStackCard(stack)).join('');
        
        // Setup copy buttons after rendering
        this.setupCopyButtons();
    }

    createStackCard(stack) {
        const typeColors = {
            backend: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            frontend: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            ml: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
        };

        return `
            <div class="stack-card bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center space-x-3">
                            <i class="${stack.icon} text-2xl text-primary"></i>
                            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">${stack.name}</h3>
                        </div>
                        <span class="px-2 py-1 text-xs font-medium rounded-full ${typeColors[stack.type] || typeColors.backend}">
                            ${stack.type.toUpperCase()}
                        </span>
                    </div>
                    
                    <p class="text-gray-600 dark:text-gray-400 mb-6">${stack.description}</p>
                    
                    <div class="space-y-6">
                        ${this.createSection('Build Commands', stack.buildCommands, 'fas fa-hammer')}
                        ${this.createSection('Test Commands', stack.testCommands, 'fas fa-vial')}
                        ${this.createSection('Dockerfile', stack.dockerfile, 'fab fa-docker', true)}
                        ${this.createSection('Jenkinsfile', stack.jenkinsfile, 'fas fa-cog', true)}
                        ${this.createSection('ArgoCD Manifest', stack.argocdManifest, 'fas fa-ship', true)}
                        ${this.createSection('Common Gotchas', stack.gotchas, 'fas fa-exclamation-triangle')}
                    </div>
                </div>
            </div>
        `;
    }

    createSection(title, content, icon, isCode = false) {
        if (!content || (Array.isArray(content) && content.length === 0)) {
            return '';
        }

        const sectionId = `${title.toLowerCase().replace(/\\s+/g, '-')}-${Math.random().toString(36).substr(2, 9)}`;
        
        if (isCode) {
            return `
                <div class="section">
                    <h4 class="flex items-center text-sm font-medium text-gray-900 dark:text-white mb-3">
                        <i class="${icon} mr-2"></i>
                        ${title}
                    </h4>
                    <div class="code-container relative">
                        <button class="copy-button bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs transition-opacity" 
                                data-copy-target="#${sectionId}">
                            <i class="fas fa-copy mr-1"></i>Copy
                        </button>
                        <pre id="${sectionId}" class="code-block text-sm">${this.escapeHtml(content)}</pre>
                    </div>
                </div>
            `;
        } else if (Array.isArray(content)) {
            const listItems = content.map(item => `
                <li class="flex items-start space-x-2">
                    <code class="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded text-sm font-mono">
                        ${this.escapeHtml(item)}
                    </code>
                    <button class="copy-btn-inline text-gray-400 hover:text-primary transition-colors ml-2" 
                            data-copy-text="${this.escapeHtml(item)}" title="Copy command">
                        <i class="fas fa-copy text-xs"></i>
                    </button>
                </li>
            `).join('');

            return `
                <div class="section">
                    <h4 class="flex items-center text-sm font-medium text-gray-900 dark:text-white mb-3">
                        <i class="${icon} mr-2"></i>
                        ${title}
                    </h4>
                    <ul class="space-y-2">${listItems}</ul>
                </div>
            `;
        }

        return '';
    }

    setupCopyButtons() {
        // Setup copy buttons for code blocks
        document.querySelectorAll('.copy-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = button.getAttribute('data-copy-target');
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    this.copyToClipboard(targetElement.textContent, button);
                }
            });
        });

        // Setup copy buttons for inline commands
        document.querySelectorAll('.copy-btn-inline').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const text = button.getAttribute('data-copy-text');
                this.copyToClipboard(text, button);
            });
        });
    }

    async copyToClipboard(text, button) {
        try {
            await navigator.clipboard.writeText(text);
            this.showCopyFeedback(button);
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                this.showCopyFeedback(button);
            } catch (fallbackErr) {
                console.error('Failed to copy text: ', fallbackErr);
                this.showError('Failed to copy to clipboard');
            }
            
            document.body.removeChild(textArea);
        }
    }

    showCopyFeedback(button) {
        const originalContent = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check mr-1"></i>Copied!';
        button.classList.add('bg-green-600');
        
        setTimeout(() => {
            button.innerHTML = originalContent;
            button.classList.remove('bg-green-600');
        }, 2000);
    }

    showError(message) {
        const container = document.getElementById('stacks-container');
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-exclamation-triangle text-red-400 text-4xl mb-4"></i>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Error</h3>
                <p class="text-gray-500 dark:text-gray-400">${message}</p>
            </div>
        `;
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StackReference();
});

// Add some additional animations and interactions
document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll behavior for any anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add loading animation
    const style = document.createElement('style');
    style.textContent = `
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(59, 130, 246, 0.3);
            border-radius: 50%;
            border-top-color: #3b82f6;
            animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .fade-in {
            animation: fadeIn 0.5s ease-in-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-input').focus();
    }
    
    // Escape to clear search
    if (e.key === 'Escape') {
        const searchInput = document.getElementById('search-input');
        if (searchInput === document.activeElement) {
            searchInput.blur();
        }
        searchInput.value = '';
        document.getElementById('type-filter').value = '';
        document.getElementById('tool-filter').value = '';
        // Trigger filter update
        searchInput.dispatchEvent(new Event('input'));
    }
});