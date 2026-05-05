// Todo List Module
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const btnAddTodo = document.getElementById('btn-add-todo');

// Add todo button
btnAddTodo?.addEventListener('click', () => {
  addTodo();
});

// Enter key to add todo
todoInput?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addTodo();
  }
});

async function addTodo() {
  const taskText = todoInput?.value.trim();
  if (!taskText) return;

  try {
    const response = await fetch('/todo/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskText })
    });

    if (response.ok) {
      todoInput.value = '';
      loadTodos();
      todoInput.focus();
    } else {
      showNotification('Error adding todo', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification('Error adding todo', 'error');
  }
}

async function loadTodos() {
  try {
    const response = await fetch('/todo/api');
    if (!response.ok) throw new Error('Failed to load todos');
    
    const todos = await response.json();
    renderTodos(todos);
  } catch (error) {
    console.error('Error loading todos:', error);
    todoList.innerHTML = '<p style="text-align: center; color: #999; font-size: 12px;">Error loading todos</p>';
  }
}

function renderTodos(todos) {
  todoList.innerHTML = '';

  if (todos.length === 0) {
    todoList.innerHTML = '<p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">No tasks yet</p>';
    return;
  }

  todos.forEach(todo => {
    const item = document.createElement('div');
    item.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    item.id = `todo-${todo.id}`;
    
    item.innerHTML = `
      <input 
        type="checkbox" 
        class="todo-checkbox" 
        ${todo.completed ? 'checked' : ''}
        data-id="${todo.id}"
      >
      <span class="todo-text">${escapeHtml(todo.task_text)}</span>
      <div class="todo-actions">
        <button class="todo-btn todo-edit" data-id="${todo.id}" title="Edit">✎</button>
        <button class="todo-btn todo-delete" data-id="${todo.id}" title="Delete">🗑</button>
      </div>
    `;

    // Checkbox toggle
    const checkbox = item.querySelector('.todo-checkbox');
    checkbox.addEventListener('change', () => {
      toggleTodo(todo.id);
    });

    // Double click to edit
    const textSpan = item.querySelector('.todo-text');
    textSpan.addEventListener('dblclick', () => {
      editTodo(todo);
    });

    // Edit button
    const editBtn = item.querySelector('.todo-edit');
    editBtn.addEventListener('click', () => {
      editTodo(todo);
    });

    // Delete button
    const deleteBtn = item.querySelector('.todo-delete');
    deleteBtn.addEventListener('click', () => {
      deleteTodo(todo.id);
    });

    todoList.appendChild(item);
  });
}

async function toggleTodo(todoId) {
  try {
    const response = await fetch(`/todo/api/${todoId}/toggle`, {
      method: 'PATCH'
    });

    if (response.ok) {
      loadTodos();
    } else {
      showNotification('Error updating todo', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification('Error updating todo', 'error');
  }
}

async function editTodo(todo) {
  const creator = todo.created_by_name || todo.created_by_username || 'Unknown';
  const newText = prompt(`Edit task (set by ${creator}):`, todo.task_text);
  if (newText === null) return;

  if (newText.trim() === '') {
    showNotification('Task cannot be empty', 'error');
    return;
  }

  try {
    const response = await fetch(`/todo/api/${todo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskText: newText })
    });

    if (response.ok) {
      showNotification('Task updated');
      loadTodos();
    } else {
      showNotification('Error updating todo', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification('Error updating todo', 'error');
  }
}

async function deleteTodo(todoId) {
  if (!confirm('Delete this task?')) return;

  try {
    const response = await fetch(`/todo/api/${todoId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showNotification('Task deleted');
      loadTodos();
    } else {
      showNotification('Error deleting todo', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification('Error deleting todo', 'error');
  }
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
