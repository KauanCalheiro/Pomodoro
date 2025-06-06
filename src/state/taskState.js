// Estado das tarefas
export const tasks = {
    items: [],
    showCompleted: false
};

export const loadTasks = () => {
    const savedTasks = localStorage.getItem('pomodoroTasks');
    if (savedTasks) {
        tasks.items = JSON.parse(savedTasks);
    }
    return tasks;
};

export const saveTasks = () => {
    localStorage.setItem('pomodoroTasks', JSON.stringify(tasks.items));
};

export const addTask = (text) => {
    const task = {
        id: Date.now(),
        text,
        completed: false
    };
    tasks.items.push(task);
    saveTasks();
    return task;
};

export const toggleTask = (id) => {
    const task = tasks.items.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
    }
    return task;
};

export const deleteTask = (id) => {
    tasks.items = tasks.items.filter(t => t.id !== id);
    saveTasks();
    return tasks.items;
}; 