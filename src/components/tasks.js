import { tasks, addTask as addTaskToState, toggleTask as toggleTaskState, deleteTask as deleteTaskState } from '../state/taskState.js';

const createTaskElement = (task) => {
    const li = document.createElement('li');
    li.className = `flex items-center justify-between p-3 rounded-lg card-3d ${
        task.completed ? 'opacity-75' : ''
    }`;
    
    li.innerHTML = `
        <div class="flex items-center gap-3">
            <input type="checkbox" class="everforest-checkbox"
                   ${task.completed ? 'checked' : ''}>
            <span class="${task.completed ? 'line-through opacity-50' : ''}">${task.text}</span>
        </div>
        <button class="delete-task btn btn-danger text-sm">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    // Event listeners
    const checkbox = li.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => toggleTask(task.id));
    
    const deleteBtn = li.querySelector('.delete-task');
    deleteBtn.addEventListener('click', () => deleteTask(task.id));
    
    return li;
};

export const renderTasks = () => {
    const taskList = document.getElementById('taskList');
    const taskCount = document.getElementById('taskCount');
    
    taskList.innerHTML = '';
    const filteredTasks = tasks.items.filter(task => 
        tasks.showCompleted ? true : !task.completed
    );
    
    filteredTasks.forEach(task => {
        taskList.appendChild(createTaskElement(task));
    });
    
    const remainingTasks = tasks.items.filter(task => !task.completed).length;
    taskCount.textContent = `${remainingTasks} tarefa${remainingTasks === 1 ? '' : 's'} restante${remainingTasks === 1 ? '' : 's'}`;
};

export const addTask = (text) => {
    addTaskToState(text);
    renderTasks();
};

export const toggleTask = (id) => {
    toggleTaskState(id);
    renderTasks();
};

export const deleteTask = (id) => {
    deleteTaskState(id);
    renderTasks();
};

export const toggleCompletedTasks = () => {
    tasks.showCompleted = !tasks.showCompleted;
    const toggleBtn = document.getElementById('toggleCompleted');
    toggleBtn.textContent = tasks.showCompleted ? 'Ocultar Concluídas' : 'Mostrar Concluídas';
    renderTasks();
}; 