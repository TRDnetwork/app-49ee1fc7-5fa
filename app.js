import { setupRealtime, teardownRealtime } from './realtime.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// DOM Elements
const loadingEl = document.getElementById('loading');
const appEl = document.getElementById('app');
const errorBanner = document.getElementById('errorBanner');
const authGate = document.getElementById('authGate');
const appUi = document.getElementById('appUi');
const authErrors = document.getElementById('authErrors');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const signUpBtn = document.getElementById('signUpBtn');
const signInBtn = document.getElementById('signInBtn');
const signOutBtn = document.getElementById('signOutBtn');
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const inputError = document.getElementById('inputError');
const tasksList = document.getElementById('tasksList');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const taskCount = document.getElementById('taskCount');
const filterButtons = document.querySelectorAll('.filter-btn');

// App State
let supabase = null;
let currentUser = null;
let tasks = [];
let currentFilter = 'all';

// Initialize the app
async function init() {
    try {
        // Check for Supabase credentials
        if (!window.__SUPABASE_URL__ || !window.__SUPABASE_ANON_KEY__) {
            showError('Supabase credentials not injected');
            return;
        }

        // Initialize Supabase client
        supabase = createClient(window.__SUPABASE_URL__, window.__SUPABASE_ANON_KEY__);

        // Check for existing session
        try {
            const { data: { session } } = await supabase.auth.getSession();
            currentUser = session?.user || null;
        } catch (error) {
            // SecurityError or other auth error - treat as no session
            console.warn('Auth session check failed:', error);
            currentUser = null;
        }

        // Set up auth state change listener
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN') {
                currentUser = session.user;
                await renderApp();
                await setupRealtime(supabase, handleRealtimeUpdate);
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                teardownRealtime();
                await renderApp();
            }
        });

        // Render initial state
        await renderApp();
        
        // If user is logged in, set up realtime
        if (currentUser) {
            await setupRealtime(supabase, handleRealtimeUpdate);
        }
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize app');
    } finally {
        // Always hide loading and show app
        loadingEl.style.display = 'none';
        appEl.classList.add('loaded');
    }
}

// Show error banner
function showError(message) {
    errorBanner.textContent = message;
    errorBanner.classList.add('show');
}

// Clear error banner
function clearError() {
    errorBanner.classList.remove('show');
}

// Render app based on auth state
async function renderApp() {
    clearError();
    
    if (!currentUser) {
        authGate.style.display = 'block';
        appUi.style.display = 'none';
        clearAuthForm();
    } else {
        authGate.style.display = 'none';
        appUi.style.display = 'block';
        await loadTasks();
        renderTasks();
        setupEventListeners();
    }
}

// Clear auth form
function clearAuthForm() {
    emailInput.value = '';
    passwordInput.value = '';
    authErrors.textContent = '';
    authErrors.classList.remove('show');
}

// Set up event listeners
function setupEventListeners() {
    // Auth buttons
    signUpBtn.addEventListener('click', handleSignUp);
    signInBtn.addEventListener('click', handleSignIn);
    signOutBtn.addEventListener('click', handleSignOut);
    
    // Task input
    addTaskBtn.addEventListener('click', handleAddTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAddTask();
        }
    });
    
    // Filter buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });
}

// Handle sign up
async function handleSignUp() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        showAuthError('Please enter both email and password');
        return;
    }
    
    try {
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });
        
        if (error) throw error;
        
        // Show success message
        showAuthError('Sign up successful! Check your email for confirmation.', false);
    } catch (error) {
        showAuthError(error.message);
    }
}

// Handle sign in
async function handleSignIn() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        showAuthError('Please enter both email and password');
        return;
    }
    
    try {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        
        if (error) throw error;
        
        // Clear auth errors on successful login
        authErrors.classList.remove('show');
    } catch (error) {
        showAuthError(error.message);
    }
}

// Handle sign out
async function handleSignOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    } catch (error) {
        console.error('Sign out error:', error);
        showError('Failed to sign out');
    }
}

// Show auth error
function showAuthError(message, isError = true) {
    authErrors.textContent = message;
    authErrors.classList.add('show');
    authErrors.style.color = isError ? '#ff00aa' : '#00f3ff';
}

// Handle add task
async function handleAddTask() {
    const title = taskInput.value.trim();
    
    if (!title) {
        inputError.textContent = 'Please enter a task title';
        return;
    }
    
    inputError.textContent = '';
    
    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        
        // Insert task
        const { error } = await supabase
            .from('app_bb61_tasks')
            .insert({
                title,
                user_id: user.id,
                is_completed: false
            });
        
        if (error) throw error;
        
        // Clear input
        taskInput.value = '';
        taskInput.focus();
    } catch (error) {
        console.error('Add task error:', error);
        inputError.textContent = error.message;
    }
}

// Load tasks from Supabase
async function loadTasks() {
    try {
        loadingState.classList.add('show');
        tasksList.style.display = 'none';
        emptyState.classList.remove('show');
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        
        const { data, error } = await supabase
            .from('app_bb61_tasks')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        tasks = data || [];
    } catch (error) {
        console.error('Load tasks error:', error);
        showError('Failed to load tasks');
        tasks = [];
    } finally {
        loadingState.classList.remove('show');
        tasksList.style.display = 'grid';
    }
}

// Render tasks based on current filter
function renderTasks() {
    // Filter tasks
    let filteredTasks = tasks;
    if (currentFilter === 'active') {
        filteredTasks = tasks.filter(task => !task.is_completed);
    } else if (currentFilter === 'done') {
        filteredTasks = tasks.filter(task => task.is_completed);
    }
    
    // Update task count
    const totalTasks = tasks.length;
    const activeTasks = tasks.filter(t => !t.is_completed).length;
    const doneTasks = tasks.filter(t => t.is_completed).length;
    
    let countText = `${totalTasks} tasks`;
    if (currentFilter === 'all') {
        countText = `${totalTasks} tasks (${activeTasks} active, ${doneTasks} done)`;
    } else if (currentFilter === 'active') {
        countText = `${activeTasks} active tasks`;
    } else if (currentFilter === 'done') {
        countText = `${doneTasks} completed tasks`;
    }
    taskCount.textContent = countText;
    
    // Clear task list
    tasksList.innerHTML = '';
    
    // Show empty state if no tasks
    if (filteredTasks.length === 0) {
        emptyState.classList.add('show');
        return;
    }
    
    emptyState.classList.remove('show');
    
    // Render each task
    filteredTasks.forEach(task => {
        const taskEl = document.createElement('div');
        taskEl.className = `task-card ${task.is_completed ? 'completed' : ''}`;
        taskEl.dataset.id = task.id;
        
        taskEl.innerHTML = `
            <div class="task-checkbox ${task.is_completed ? 'checked' : ''}" data-id="${task.id}"></div>
            <div class="task-content">
                <div class="task-title">${escapeHtml(task.title)}</div>
            </div>
            <div class="task-actions">
                <button class="btn-delete" data-id="${task.id}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        `;
        
        tasksList.appendChild(taskEl);
    });
    
    // Add event listeners to task elements
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', () => handleToggleTask(checkbox.dataset.id));
    });
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => handleDeleteTask(btn.dataset.id));
    });
}

// Handle toggle task completion
async function handleToggleTask(taskId) {
    try {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        
        const { error } = await supabase
            .from('app_bb61_tasks')
            .update({ 
                is_completed: !task.is_completed,
                updated_at: new Date().toISOString()
            })
            .eq('id', taskId);
        
        if (error) throw error;
        
        // Update local state
        task.is_completed = !task.is_completed;
        task.updated_at = new Date().toISOString();
        
        // Re-render
        renderTasks();
    } catch (error) {
        console.error('Toggle task error:', error);
        showError('Failed to update task');
    }
}

// Handle delete task
async function handleDeleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('app_bb61_tasks')
            .delete()
            .eq('id', taskId);
        
        if (error) throw error;
        
        // Update local state
        tasks = tasks.filter(t => t.id !== taskId);
        
        // Re-render
        renderTasks();
    } catch (error) {
        console.error('Delete task error:', error);
        showError('Failed to delete task');
    }
}

// Handle realtime updates
function handleRealtimeUpdate(payload) {
    console.log('Realtime update:', payload);
    
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch (eventType) {
        case 'INSERT':
            tasks.unshift(newRecord);
            break;
        case 'UPDATE':
            const index = tasks.findIndex(t => t.id === newRecord.id);
            if (index !== -1) {
                tasks[index] = newRecord;
            }
            break;
        case 'DELETE':
            tasks = tasks.filter(t => t.id !== oldRecord.id);
            break;
    }
    
    renderTasks();
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize the app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}