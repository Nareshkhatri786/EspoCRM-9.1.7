// Task Manager PWA - Main Application Module
class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.loadTasks();
        this.setupEventListeners();
        this.updateUI();
        this.setupPWA();
        this.checkOnlineStatus();
    }

    // Load tasks from localStorage
    loadTasks() {
        const savedTasks = localStorage.getItem('pwa-tasks');
        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks);
        }
    }

    // Save tasks to localStorage
    saveTasks() {
        localStorage.setItem('pwa-tasks', JSON.stringify(this.tasks));
    }

    // Setup event listeners
    setupEventListeners() {
        // Add task
        document.getElementById('add-task-btn').addEventListener('click', () => this.addTask());
        document.getElementById('task-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });

        // Clear all tasks
        document.getElementById('clear-all-btn').addEventListener('click', () => this.clearAllTasks());

        // Export tasks
        document.getElementById('export-btn').addEventListener('click', () => this.exportTasks());

        // Online/offline events
        window.addEventListener('online', () => this.updateOnlineStatus(true));
        window.addEventListener('offline', () => this.updateOnlineStatus(false));
    }

    // Add new task
    addTask() {
        const input = document.getElementById('task-input');
        const text = input.value.trim();

        if (!text) {
            this.showNotification('Please enter a task!', 'warning');
            return;
        }

        const task = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.updateUI();
        input.value = '';
        
        this.showNotification('Task added successfully!', 'success');
    }

    // Toggle task completion
    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveTasks();
            this.updateUI();
            
            const message = task.completed ? 'Task completed!' : 'Task marked as pending';
            this.showNotification(message, 'success');
        }
    }

    // Delete task
    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.updateUI();
            this.showNotification('Task deleted successfully!', 'success');
        }
    }

    // Set filter
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.updateTasksList();
    }

    // Clear all tasks
    clearAllTasks() {
        if (confirm('Are you sure you want to delete all tasks? This action cannot be undone.')) {
            this.tasks = [];
            this.saveTasks();
            this.updateUI();
            this.showNotification('All tasks cleared!', 'success');
        }
    }

    // Export tasks as JSON
    exportTasks() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `tasks-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('Tasks exported successfully!', 'success');
    }

    // Update entire UI
    updateUI() {
        this.updateStats();
        this.updateTasksList();
    }

    // Update task statistics
    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;

        document.getElementById('total-tasks').textContent = total;
        document.getElementById('completed-tasks').textContent = completed;
        document.getElementById('pending-tasks').textContent = pending;
    }

    // Update tasks list display
    updateTasksList() {
        const tasksContainer = document.getElementById('tasks-list');
        const emptyState = document.getElementById('empty-state');
        
        let filteredTasks = this.tasks;
        
        // Apply filter
        switch (this.currentFilter) {
            case 'completed':
                filteredTasks = this.tasks.filter(t => t.completed);
                break;
            case 'pending':
                filteredTasks = this.tasks.filter(t => !t.completed);
                break;
            default:
                filteredTasks = this.tasks;
        }

        // Show/hide empty state
        if (filteredTasks.length === 0) {
            tasksContainer.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        tasksContainer.classList.remove('hidden');
        emptyState.classList.add('hidden');

        // Render tasks
        tasksContainer.innerHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');

        // Add event listeners to task elements
        filteredTasks.forEach(task => {
            const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
            
            // Checkbox toggle
            const checkbox = taskElement.querySelector('.task-checkbox');
            checkbox.addEventListener('change', () => this.toggleTask(task.id));
            
            // Delete button
            const deleteBtn = taskElement.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => this.deleteTask(task.id));
        });
    }

    // Create HTML for a single task
    createTaskHTML(task) {
        const createdDate = new Date(task.createdAt).toLocaleDateString();
        const createdTime = new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        return `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text ${task.completed ? 'completed' : ''}">${this.escapeHtml(task.text)}</span>
                <div class="task-meta">
                    <div class="task-time">${createdDate} ${createdTime}</div>
                    <div class="task-actions">
                        <button class="task-btn delete-btn" aria-label="Delete task">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    }

    // Escape HTML to prevent XSS
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

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');
        
        notificationText.textContent = message;
        notification.className = `notification show ${type}`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Check and update online status
    checkOnlineStatus() {
        this.updateOnlineStatus(navigator.onLine);
    }

    // Update online/offline status
    updateOnlineStatus(isOnline) {
        const statusElement = document.getElementById('online-status');
        
        if (isOnline) {
            statusElement.textContent = 'Online';
            statusElement.className = 'status-online';
            this.showNotification('You are back online!', 'success');
        } else {
            statusElement.textContent = 'Offline';
            statusElement.className = 'status-offline';
            this.showNotification('You are offline. Changes will be saved locally.', 'warning');
        }
    }

    // Setup PWA functionality
    setupPWA() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./service-worker.js')
                    .then(registration => {
                        console.log('SW registered: ', registration);
                    })
                    .catch(registrationError => {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }

        // Handle install prompt
        let deferredPrompt;
        const installPrompt = document.getElementById('install-prompt');
        const installBtn = document.getElementById('install-btn');
        const dismissBtn = document.getElementById('dismiss-btn');

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install prompt after 3 seconds if not already installed
            setTimeout(() => {
                if (!window.matchMedia('(display-mode: standalone)').matches) {
                    installPrompt.classList.remove('hidden');
                }
            }, 3000);
        });

        installBtn.addEventListener('click', () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the install prompt');
                    }
                    deferredPrompt = null;
                    installPrompt.classList.add('hidden');
                });
            }
        });

        dismissBtn.addEventListener('click', () => {
            installPrompt.classList.add('hidden');
        });

        // Hide install prompt if already installed
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            installPrompt.classList.add('hidden');
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskManager;
}