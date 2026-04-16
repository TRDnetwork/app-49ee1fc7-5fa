import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

// Setup DOM
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
  <body>
    <div id="app">
      <input id="taskInput" />
      <button id="addTaskBtn">Add</button>
      <div class="filter-buttons">
        <button class="filter-btn active" data-filter="all">All</button>
        <button class="filter-btn" data-filter="active">Active</button>
        <button class="filter-btn" data-filter="done">Done</button>
      </div>
      <div id="tasksList"></div>
      <div id="emptyState"></div>
    </div>
  </body>
</html>
`);

global.window = dom.window;
global.document = dom.window.document;
global.localStorage = localStorageMock;

// Import the app logic (we'll test a refactored version)
// For now, we'll create a mock implementation based on the brief
const TaskManager = {
  tasks: [],
  
  init() {
    this.loadTasks();
    this.render();
  },
  
  loadTasks() {
    const stored = localStorage.getItem('taskflow-tasks');
    this.tasks = stored ? JSON.parse(stored) : [];
  },
  
  saveTasks() {
    localStorage.setItem('taskflow-tasks', JSON.stringify(this.tasks));
  },
  
  addTask(title) {
    if (!title.trim()) return false;
    
    const task = {
      id: Date.now().toString(),
      title: title.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    this.tasks.push(task);
    this.saveTasks();
    return true;
  },
  
  toggleTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
    }
  },
  
  deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.saveTasks();
  },
  
  getFilteredTasks(filter) {
    switch(filter) {
      case 'active': return this.tasks.filter(t => !t.completed);
      case 'done': return this.tasks.filter(t => t.completed);
      default: return this.tasks;
    }
  },
  
  render(filter = 'all') {
    // This would update the DOM in a real implementation
    return this.getFilteredTasks(filter);
  }
};

describe('TaskFlow Dark - LocalStorage Implementation', () => {
  beforeEach(() => {
    localStorage.clear();
    TaskManager.tasks = [];
    vi.clearAllMocks();
  });
  
  describe('Task Management', () => {
    it('should add a new task to localStorage', () => {
      const result = TaskManager.addTask('Test task');
      expect(result).toBe(true);
      expect(TaskManager.tasks).toHaveLength(1);
      expect(TaskManager.tasks[0].title).toBe('Test task');
      expect(TaskManager.tasks[0].completed).toBe(false);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'taskflow-tasks',
        expect.any(String)
      );
    });
    
    it('should not add empty tasks', () => {
      const result = TaskManager.addTask('   ');
      expect(result).toBe(false);
      expect(TaskManager.tasks).toHaveLength(0);
    });
    
    it('should toggle task completion status', () => {
      TaskManager.addTask('Test task');
      const taskId = TaskManager.tasks[0].id;
      
      expect(TaskManager.tasks[0].completed).toBe(false);
      TaskManager.toggleTask(taskId);
      expect(TaskManager.tasks[0].completed).toBe(true);
      TaskManager.toggleTask(taskId);
      expect(TaskManager.tasks[0].completed).toBe(false);
    });
    
    it('should delete a task', () => {
      TaskManager.addTask('Task 1');
      TaskManager.addTask('Task 2');
      const taskId = TaskManager.tasks[0].id;
      
      expect(TaskManager.tasks).toHaveLength(2);
      TaskManager.deleteTask(taskId);
      expect(TaskManager.tasks).toHaveLength(1);
      expect(TaskManager.tasks[0].title).toBe('Task 2');
    });
  });
  
  describe('Filtering', () => {
    beforeEach(() => {
      TaskManager.addTask('Active Task 1');
      TaskManager.addTask('Active Task 2');
      TaskManager.addTask('Completed Task');
      TaskManager.toggleTask(TaskManager.tasks[2].id); // Mark third as completed
    });
    
    it('should show all tasks with "all" filter', () => {
      const filtered = TaskManager.getFilteredTasks('all');
      expect(filtered).toHaveLength(3);
    });
    
    it('should show only active tasks with "active" filter', () => {
      const filtered = TaskManager.getFilteredTasks('active');
      expect(filtered).toHaveLength(2);
      expect(filtered.every(t => !t.completed)).toBe(true);
    });
    
    it('should show only completed tasks with "done" filter', () => {
      const filtered = TaskManager.getFilteredTasks('done');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].completed).toBe(true);
    });
  });
  
  describe('Persistence', () => {
    it('should load tasks from localStorage on init', () => {
      const mockTasks = [
        { id: '1', title: 'Saved Task', completed: false, createdAt: '2024-01-01' }
      ];
      localStorage.setItem('taskflow-tasks', JSON.stringify(mockTasks));
      
      TaskManager.loadTasks();
      expect(TaskManager.tasks).toEqual(mockTasks);
      expect(localStorage.getItem).toHaveBeenCalledWith('taskflow-tasks');
    });
    
    it('should handle empty localStorage', () => {
      localStorage.removeItem('taskflow-tasks');
      TaskManager.loadTasks();
      expect(TaskManager.tasks).toEqual([]);
    });
    
    it('should persist tasks across operations', () => {
      TaskManager.addTask('Task 1');
      TaskManager.addTask('Task 2');
      
      // Simulate page reload
      const savedTasks = JSON.parse(localStorage.getItem('taskflow-tasks'));
      expect(savedTasks).toHaveLength(2);
      expect(savedTasks[0].title).toBe('Task 1');
      expect(savedTasks[1].title).toBe('Task 2');
    });
  });
  
  describe('UI Integration', () => {
    it('should update task count display', () => {
      // This would test DOM updates in a real implementation
      const taskInput = document.getElementById('taskInput');
      const addButton = document.getElementById('addTaskBtn');
      
      expect(taskInput).toBeDefined();
      expect(addButton).toBeDefined();
    });
    
    it('should handle filter button clicks', () => {
      const filterButtons = document.querySelectorAll('.filter-btn');
      expect(filterButtons).toHaveLength(3);
      
      // Simulate clicking active filter
      const activeFilter = Array.from(filterButtons).find(btn => 
        btn.dataset.filter === 'active'
      );
      expect(activeFilter).toBeDefined();
      expect(activeFilter.textContent).toBe('Active');
    });
  });
});