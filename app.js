// 任务数据存储
let tasks = [];

// 从 localStorage 加载数据
function loadFromLocalStorage() {
    const saved = localStorage.getItem('todoListData');
    if (saved) {
        try {
            tasks = JSON.parse(saved);
        } catch (e) {
            tasks = [];
        }
    }
    renderTasks();
}

// 保存到 localStorage
function saveToLocalStorage() {
    localStorage.setItem('todoListData', JSON.stringify(tasks));
}

// 生成唯一 ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 计算任务进度
function calculateTaskProgress(task) {
    if (task.subtasks.length === 0) return 0;
    const completed = task.subtasks.filter(st => st.completed).length;
    return Math.round((completed / task.subtasks.length) * 100);
}

// 计算总进度
function calculateOverallProgress() {
    if (tasks.length === 0) return 0;
    let totalSubtasks = 0;
    let completedSubtasks = 0;
    tasks.forEach(task => {
        totalSubtasks += task.subtasks.length;
        completedSubtasks += task.subtasks.filter(st => st.completed).length;
    });
    if (totalSubtasks === 0) return 0;
    return Math.round((completedSubtasks / totalSubtasks) * 100);
}

// 更新总进度条
function updateOverallProgress() {
    const progress = calculateOverallProgress();
    const fill = document.getElementById('overallProgressFill');
    const text = document.getElementById('overallProgressText');
    fill.style.width = progress + '%';
    text.textContent = progress + '%';
}

// 渲染任务列表
function renderTasks() {
    const taskList = document.getElementById('taskList');
    const emptyState = document.getElementById('emptyState');

    if (tasks.length === 0) {
        taskList.innerHTML = '';
        emptyState.style.display = 'block';
        updateOverallProgress();
        return;
    }

    emptyState.style.display = 'none';
    taskList.innerHTML = tasks.map(task => {
        const progress = calculateTaskProgress(task);
        return `
            <div class="task-card" data-task-id="${task.id}">
                <div class="task-header">
                    <div class="task-title">${escapeHtml(task.name)}</div>
                    <div class="task-actions">
                        <button class="btn btn-small" onclick="showAddSubtaskModal('${task.id}')">➕ 添加子任务</button>
                        <button class="btn-icon" onclick="deleteTask('${task.id}')">🗑️</button>
                    </div>
                </div>
                <div class="task-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <span class="task-progress-text">${progress}%</span>
                </div>
                <div class="subtask-list">
                    ${task.subtasks.map(subtask => `
                        <div class="subtask-item ${subtask.completed ? 'completed' : ''}" data-subtask-id="${subtask.id}">
                            <input type="checkbox" class="subtask-checkbox" 
                                ${subtask.completed ? 'checked' : ''} 
                                onchange="toggleSubtask('${task.id}', '${subtask.id}')">
                            <span class="subtask-text">${escapeHtml(subtask.text)}</span>
                            <button class="subtask-delete" onclick="deleteSubtask('${task.id}', '${subtask.id}')">删除</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');

    updateOverallProgress();
}

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 显示添加任务模态框
function showAddTaskModal() {
    document.getElementById('addTaskModal').classList.add('active');
    document.getElementById('taskNameInput').value = '';
    document.getElementById('subtaskInputs').innerHTML = `
        <div class="subtask-input-row">
            <input type="text" class="subtask-input" placeholder="输入子任务...">
            <button class="btn-icon" onclick="removeSubtaskInput(this)">❌</button>
        </div>
    `;
    document.getElementById('taskNameInput').focus();
}

// 关闭添加任务模态框
function closeAddTaskModal() {
    document.getElementById('addTaskModal').classList.remove('active');
}

// 添加子任务输入框
function addSubtaskInput() {
    const container = document.getElementById('subtaskInputs');
    const row = document.createElement('div');
    row.className = 'subtask-input-row';
    row.innerHTML = `
        <input type="text" class="subtask-input" placeholder="输入子任务...">
        <button class="btn-icon" onclick="removeSubtaskInput(this)">❌</button>
    `;
    container.appendChild(row);
    row.querySelector('input').focus();
}

// 移除子任务输入框
function removeSubtaskInput(btn) {
    const rows = document.querySelectorAll('.subtask-input-row');
    if (rows.length > 1) {
        btn.closest('.subtask-input-row').remove();
    } else {
        btn.closest('.subtask-input-row').querySelector('input').value = '';
    }
}

// 确认添加任务
function confirmAddTask() {
    const name = document.getElementById('taskNameInput').value.trim();
    if (!name) {
        alert('请输入任务名称！');
        return;
    }

    const subtaskInputs = document.querySelectorAll('.subtask-input');
    const subtasks = [];
    subtaskInputs.forEach(input => {
        const text = input.value.trim();
        if (text) {
            subtasks.push({
                id: generateId(),
                text: text,
                completed: false
            });
        }
    });

    const task = {
        id: generateId(),
        name: name,
        subtasks: subtasks,
        createdAt: new Date().toISOString()
    };

    tasks.push(task);
    saveToLocalStorage();
    renderTasks();
    closeAddTaskModal();
}

// 删除任务
function deleteTask(taskId) {
    if (confirm('确定要删除这个任务吗？')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveToLocalStorage();
        renderTasks();
    }
}

// 切换子任务完成状态
function toggleSubtask(taskId, subtaskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        const subtask = task.subtasks.find(st => st.id === subtaskId);
        if (subtask) {
            subtask.completed = !subtask.completed;
            saveToLocalStorage();
            renderTasks();
        }
    }
}

// 删除子任务
function deleteSubtask(taskId, subtaskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.subtasks = task.subtasks.filter(st => st.id !== subtaskId);
        saveToLocalStorage();
        renderTasks();
    }
}

// 显示添加子任务模态框（复用添加任务模态框）
function showAddSubtaskModal(taskId) {
    const text = prompt('请输入子任务内容：');
    if (text && text.trim()) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.subtasks.push({
                id: generateId(),
                text: text.trim(),
                completed: false
            });
            saveToLocalStorage();
            renderTasks();
        }
    }
}

// 清空所有任务
function clearAllTasks() {
    if (tasks.length === 0) {
        alert('当前没有任务！');
        return;
    }
    if (confirm('确定要清空所有任务吗？此操作不可恢复！')) {
        tasks = [];
        saveToLocalStorage();
        renderTasks();
    }
}

// 保存到文件
function saveToFile() {
    if (tasks.length === 0) {
        alert('当前没有任务可保存！');
        return;
    }

    const data = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        tasks: tasks
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo-list-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 从文件加载
function loadFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.tasks && Array.isArray(data.tasks)) {
                if (tasks.length > 0) {
                    if (!confirm('当前已有任务，加载文件将覆盖现有任务，是否继续？')) {
                        return;
                    }
                }
                tasks = data.tasks;
                saveToLocalStorage();
                renderTasks();
                alert('任务加载成功！');
            } else {
                alert('文件格式不正确！');
            }
        } catch (err) {
            alert('文件解析失败，请检查文件格式！');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// 键盘事件处理
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeAddTaskModal();
    }
});

// 点击模态框外部关闭
document.getElementById('addTaskModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeAddTaskModal();
    }
});

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
});
