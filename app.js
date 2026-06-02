// 任务数据存储
let tasks = [];
let archives = [];

// 从 localStorage 加载数据
function loadFromLocalStorage() {
    const savedTasks = localStorage.getItem('todoListData');
    const savedArchives = localStorage.getItem('todoListArchives');
    if (savedTasks) {
        try {
            tasks = JSON.parse(savedTasks);
        } catch (e) {
            tasks = [];
        }
    }
    if (savedArchives) {
        try {
            archives = JSON.parse(savedArchives);
        } catch (e) {
            archives = [];
        }
    }
    renderTasks();
}

// 保存到 localStorage
function saveToLocalStorage() {
    localStorage.setItem('todoListData', JSON.stringify(tasks));
    localStorage.setItem('todoListArchives', JSON.stringify(archives));
}

// 生成唯一 ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 格式化日期时间
function formatDateTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
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
        const isCompleted = progress === 100;
        return `
            <div class="task-card ${isCompleted ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-header">
                    <div class="task-title">${escapeHtml(task.name)}</div>
                    <div class="task-actions">
                        <button class="btn btn-archive" onclick="archiveTask('${task.id}')">📁 归档</button>
                        <button class="btn btn-small" onclick="showAddSubtaskModal('${task.id}')">➕ 添加子任务</button>
                        <button class="btn-icon" onclick="deleteTask('${task.id}')">🗑️</button>
                    </div>
                </div>
                <div class="task-meta">
                    <span>🕐 创建: ${formatDateTime(task.createdAt)}</span>
                    ${task.completedAt ? `<span>✅ 完成: ${formatDateTime(task.completedAt)}</span>` : ''}
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
                            ${subtask.completedAt ? `<span class="subtask-time">✓ ${formatDateTime(subtask.completedAt)}</span>` : ''}
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
    const now = new Date().toISOString();
    subtaskInputs.forEach(input => {
        const text = input.value.trim();
        if (text) {
            subtasks.push({
                id: generateId(),
                text: text,
                completed: false,
                createdAt: now
            });
        }
    });

    const task = {
        id: generateId(),
        name: name,
        subtasks: subtasks,
        createdAt: now,
        completedAt: null
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
            if (subtask.completed) {
                subtask.completedAt = new Date().toISOString();
            } else {
                subtask.completedAt = null;
            }

            // 检查任务是否全部完成
            const allCompleted = task.subtasks.every(st => st.completed);
            if (allCompleted && task.subtasks.length > 0) {
                task.completedAt = new Date().toISOString();
            } else {
                task.completedAt = null;
            }

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

// 显示添加子任务模态框
function showAddSubtaskModal(taskId) {
    const text = prompt('请输入子任务内容：');
    if (text && text.trim()) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.subtasks.push({
                id: generateId(),
                text: text.trim(),
                completed: false,
                createdAt: new Date().toISOString(),
                completedAt: null
            });
            saveToLocalStorage();
            renderTasks();
        }
    }
}

// 归档任务
function archiveTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const progress = calculateTaskProgress(task);
    const isCompleted = progress === 100;
    const statusText = isCompleted ? '已完成' : `进度 ${progress}%`;

    if (!confirm(`确定要将任务 "${task.name}" (${statusText}) 归档吗？归档后将从当前列表移除。`)) {
        return;
    }

    const archiveItem = {
        id: generateId(),
        taskId: task.id,
        name: task.name,
        createdAt: task.createdAt,
        completedAt: task.completedAt,
        archivedAt: new Date().toISOString(),
        progress: progress,
        subtasks: task.subtasks.map(st => ({
            text: st.text,
            completed: st.completed,
            createdAt: st.createdAt,
            completedAt: st.completedAt
        }))
    };

    archives.unshift(archiveItem);
    tasks = tasks.filter(t => t.id !== taskId);
    saveToLocalStorage();
    renderTasks();
    alert('任务已归档！');
}

// 显示归档模态框
function showArchiveModal() {
    document.getElementById('archiveModal').classList.add('active');
    renderArchives();
}

// 关闭归档模态框
function closeArchiveModal() {
    document.getElementById('archiveModal').classList.remove('active');
}

// 渲染归档列表
function renderArchives() {
    const archiveList = document.getElementById('archiveList');

    if (archives.length === 0) {
        archiveList.innerHTML = `
            <div class="archive-empty">
                <div class="archive-empty-icon">📁</div>
                <p>暂无归档任务</p>
            </div>
        `;
        return;
    }

    archiveList.innerHTML = `
        <div class="archive-list">
            ${archives.map(archive => `
                <div class="archive-item">
                    <div class="archive-header">
                        <div class="archive-title">${escapeHtml(archive.name)}</div>
                        <div class="archive-actions">
                            <button class="btn btn-small btn-danger" onclick="deleteArchive('${archive.id}')">🗑️ 删除</button>
                        </div>
                    </div>
                    <div class="archive-meta">
                        <span>🕐 创建: ${formatDateTime(archive.createdAt)}</span>
                        ${archive.completedAt ? `<span>✅ 完成: ${formatDateTime(archive.completedAt)}</span>` : `<span>📊 归档时进度: ${archive.progress ?? 0}%</span>`}
                        <span>📁 归档: ${formatDateTime(archive.archivedAt)}</span>
                    </div>
                    <div class="archive-subtasks">
                        ${archive.subtasks.map(st => `
                            <div class="archive-subtask">
                                <span class="archive-subtask-text ${st.completed ? 'completed' : ''}">
                                    ${st.completed ? '✅' : '⬜'} ${escapeHtml(st.text)}
                                </span>
                                ${st.completedAt ? `<span class="archive-subtask-time">✓ ${formatDateTime(st.completedAt)}</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// 删除归档
function deleteArchive(archiveId) {
    if (confirm('确定要删除这条归档记录吗？')) {
        archives = archives.filter(a => a.id !== archiveId);
        saveToLocalStorage();
        renderArchives();
    }
}

// 导出归档到文件
function exportArchiveToFile() {
    if (archives.length === 0) {
        alert('当前没有归档记录可导出！');
        return;
    }

    const data = {
        version: '2.0',
        exportType: 'archive',
        exportDate: new Date().toISOString(),
        archives: archives
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo-archive-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
        version: '2.0',
        exportDate: new Date().toISOString(),
        tasks: tasks,
        archives: archives
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
            let loaded = false;

            if (data.tasks && Array.isArray(data.tasks)) {
                if (tasks.length > 0) {
                    if (!confirm('当前已有任务，加载文件将覆盖现有任务，是否继续？')) {
                        return;
                    }
                }
                tasks = data.tasks;
                loaded = true;
            }

            if (data.archives && Array.isArray(data.archives)) {
                archives = data.archives;
                loaded = true;
            }

            if (loaded) {
                saveToLocalStorage();
                renderTasks();
                alert('数据加载成功！');
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

// ========== 工作总结功能 ==========

// 显示工作总结模态框
function showSummaryModal() {
    document.getElementById('summaryModal').classList.add('active');
    renderSummary();
}

// 关闭工作总结模态框
function closeSummaryModal() {
    document.getElementById('summaryModal').classList.remove('active');
}

// 获取日期字符串 (YYYY-MM-DD)
function getDateString(isoString) {
    if (!isoString) return null;
    return isoString.split('T')[0];
}

// 获取周信息
function getWeekInfo(isoString) {
    if (!isoString) return null;
    const date = new Date(isoString);
    const year = date.getFullYear();
    const firstDay = new Date(year, 0, 1);
    const dayOfYear = Math.floor((date - firstDay) / 86400000);
    const weekNum = Math.ceil((dayOfYear + firstDay.getDay() + 1) / 7);
    return { year, weekNum, label: `${year}年第${weekNum}周` };
}

// 收集所有任务数据（包括当前任务和归档）
function getAllTasks() {
    const all = [];
    tasks.forEach(t => all.push({ ...t, source: 'current' }));
    archives.forEach(a => all.push({ ...a, source: 'archive' }));
    return all;
}

// 渲染工作总结
function renderSummary() {
    const allTasks = getAllTasks();
    const container = document.getElementById('summaryContent');

    if (allTasks.length === 0) {
        container.innerHTML = `
            <div class="archive-empty">
                <div class="archive-empty-icon">📊</div>
                <p>暂无数据，请先添加或加载任务</p>
            </div>
        `;
        return;
    }

    // 统计数据
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.completedAt).length;
    const totalSubtasks = allTasks.reduce((sum, t) => sum + (t.subtasks?.length || 0), 0);
    const completedSubtasks = allTasks.reduce((sum, t) => sum + (t.subtasks?.filter(st => st.completed).length || 0), 0);
    const completionRate = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

    // 按日期分组统计
    const dailyStats = {};
    const weeklyStats = {};

    allTasks.forEach(task => {
        const createDate = getDateString(task.createdAt);
        if (createDate) {
            if (!dailyStats[createDate]) {
                dailyStats[createDate] = { date: createDate, created: 0, completed: 0, tasks: [] };
            }
            dailyStats[createDate].created++;
            dailyStats[createDate].tasks.push(task);
        }

        if (task.completedAt) {
            const completeDate = getDateString(task.completedAt);
            if (completeDate) {
                if (!dailyStats[completeDate]) {
                    dailyStats[completeDate] = { date: completeDate, created: 0, completed: 0, tasks: [] };
                }
                dailyStats[completeDate].completed++;
                if (!dailyStats[completeDate].tasks.find(t => t.id === task.id)) {
                    dailyStats[completeDate].tasks.push(task);
                }
            }
        }

        const weekInfo = getWeekInfo(task.createdAt);
        if (weekInfo) {
            const weekKey = `${weekInfo.year}-W${weekInfo.weekNum}`;
            if (!weeklyStats[weekKey]) {
                weeklyStats[weekKey] = { label: weekInfo.label, tasks: [], completed: 0, total: 0 };
            }
            weeklyStats[weekKey].tasks.push(task);
            weeklyStats[weekKey].total++;
            if (task.completedAt) weeklyStats[weekKey].completed++;
        }
    });

    const sortedDates = Object.keys(dailyStats).sort().reverse();
    const sortedWeeks = Object.keys(weeklyStats).sort().reverse();

    // 生成 HTML
    let html = '';

    // 1. 总体统计卡片
    html += `
        <div class="summary-section">
            <h3>📈 总体概况</h3>
            <div class="summary-cards">
                <div class="summary-card">
                    <div class="summary-card-value">${totalTasks}</div>
                    <div class="summary-card-label">总任务数</div>
                </div>
                <div class="summary-card green">
                    <div class="summary-card-value">${completedTasks}</div>
                    <div class="summary-card-label">已完成任务</div>
                </div>
                <div class="summary-card blue">
                    <div class="summary-card-value">${totalSubtasks}</div>
                    <div class="summary-card-label">总子任务数</div>
                </div>
                <div class="summary-card orange">
                    <div class="summary-card-value">${completedSubtasks}</div>
                    <div class="summary-card-label">已完成子任务</div>
                </div>
                <div class="summary-card yellow">
                    <div class="summary-card-value">${completionRate}%</div>
                    <div class="summary-card-label">整体完成率</div>
                </div>
            </div>
        </div>
    `;

    // 2. 每日完成趋势图 - 近30天
    const last30Dates = sortedDates.slice(0, 30).reverse();
    if (last30Dates.length > 0) {
        const maxCompleted = Math.max(...last30Dates.map(d => dailyStats[d].completed), 1);
        html += `
            <div class="summary-section">
                <h3>📅 近30天每日完成趋势</h3>
                <div class="chart-container">
                    <div class="bar-chart">
                        ${last30Dates.map(date => {
                            const stat = dailyStats[date];
                            const height = stat.completed > 0 ? (stat.completed / maxCompleted * 100) : 0;
                            const isZero = stat.completed === 0;
                            return `
                                <div class="bar-chart-item">
                                    <div class="bar-chart-value">${stat.completed}</div>
                                    <div class="bar-chart-bar ${isZero ? 'zero' : ''}" style="height: ${Math.max(height, 4)}%"></div>
                                    <div class="bar-chart-label">${date.slice(5)}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // 3. 每日详细记录 - 显示全部，不省略
    if (sortedDates.length > 0) {
        html += `
            <div class="summary-section">
                <h3>📝 每日工作记录 (${sortedDates.length} 天)</h3>
                <div class="timeline">
                    ${sortedDates.map(date => {
                        const stat = dailyStats[date];
                        const dayTasks = stat.tasks.filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i);
                        const completedCount = dayTasks.filter(t => t.completedAt && getDateString(t.completedAt) === date).length;
                        const createdCount = dayTasks.filter(t => getDateString(t.createdAt) === date).length;
                        return `
                            <div class="timeline-item">
                                <div class="timeline-date">
                                    <span>${date}</span>
                                    <span class="timeline-date-badge">创建 ${createdCount} | 完成 ${completedCount}</span>
                                </div>
                                <div class="timeline-tasks">
                                    ${dayTasks.map(task => {
                                        const taskProgress = task.subtasks?.length > 0
                                            ? Math.round((task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100)
                                            : 0;
                                        return `
                                            <div class="timeline-task">
                                                <span class="timeline-task-name">${task.name}</span>
                                                <span class="timeline-task-meta">
                                                    <span class="timeline-task-progress"><span class="timeline-task-progress-fill" style="width:${taskProgress}%"></span></span>
                                                    ${task.completedAt ? '✅ 已完成' : `⏳ ${taskProgress}%`}
                                                </span>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // 4. 每周总结 - 显示全部，不省略
    if (sortedWeeks.length > 0) {
        html += `
            <div class="summary-section">
                <h3>📆 每周工作总结 (${sortedWeeks.length} 周)</h3>
                <div class="weekly-grid">
                    ${sortedWeeks.map(weekKey => {
                        const week = weeklyStats[weekKey];
                        const weekTasks = week.tasks.filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i);
                        const rate = week.total > 0 ? Math.round((week.completed / week.total) * 100) : 0;
                        return `
                            <div class="weekly-card">
                                <div class="weekly-header">
                                    <span>${week.label}</span>
                                    <span class="weekly-header-badge">完成率 ${rate}%</span>
                                </div>
                                <div class="weekly-stats">
                                    <div class="weekly-stat">
                                        <div class="weekly-stat-value">${week.total}</div>
                                        <div class="weekly-stat-label">总任务</div>
                                    </div>
                                    <div class="weekly-stat">
                                        <div class="weekly-stat-value">${week.completed}</div>
                                        <div class="weekly-stat-label">已完成</div>
                                    </div>
                                    <div class="weekly-stat">
                                        <div class="weekly-stat-value">${rate}%</div>
                                        <div class="weekly-stat-label">完成率</div>
                                    </div>
                                    <div class="weekly-stat">
                                        <div class="weekly-stat-value">${weekTasks.reduce((s, t) => s + (t.subtasks?.length || 0), 0)}</div>
                                        <div class="weekly-stat-label">子任务</div>
                                    </div>
                                </div>
                                <div class="weekly-tasks">
                                    ${weekTasks.map(task => {
                                        const taskProgress = task.subtasks?.length > 0
                                            ? Math.round((task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100)
                                            : 0;
                                        return `
                                            <div class="weekly-task ${task.completedAt ? 'completed' : 'pending'}">
                                                <span>${task.name}</span>
                                                <span>
                                                    <span class="weekly-task-progress"><span class="weekly-task-progress-fill" style="width:${taskProgress}%"></span></span>
                                                    ${task.completedAt ? '✅' : '⏳'}
                                                </span>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

// 导出工作总结到 JSON 文件
function exportSummaryToFile() {
    const allTasks = getAllTasks();
    if (allTasks.length === 0) {
        alert('当前没有数据可导出！');
        return;
    }

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.completedAt).length;
    const totalSubtasks = allTasks.reduce((sum, t) => sum + (t.subtasks?.length || 0), 0);
    const completedSubtasks = allTasks.reduce((sum, t) => sum + (t.subtasks?.filter(st => st.completed).length || 0), 0);

    const report = {
        version: '2.0',
        exportType: 'summary',
        exportDate: new Date().toISOString(),
        overview: {
            totalTasks,
            completedTasks,
            totalSubtasks,
            completedSubtasks,
            completionRate: totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0
        },
        tasks: allTasks.map(t => ({
            name: t.name,
            createdAt: t.createdAt,
            completedAt: t.completedAt,
            progress: t.subtasks?.length > 0 ? Math.round((t.subtasks.filter(st => st.completed).length / t.subtasks.length) * 100) : 0,
            subtasks: t.subtasks?.map(st => ({
                text: st.text,
                completed: st.completed,
                completedAt: st.completedAt
            })) || []
        }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo-summary-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 导出工作总结到 PDF
function exportSummaryToPDF() {
    const allTasks = getAllTasks();
    if (allTasks.length === 0) {
        alert('当前没有数据可导出！');
        return;
    }

    // 打开新窗口用于打印/PDF
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('请允许弹出窗口以导出 PDF！');
        return;
    }

    // 收集数据
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.completedAt).length;
    const totalSubtasks = allTasks.reduce((sum, t) => sum + (t.subtasks?.length || 0), 0);
    const completedSubtasks = allTasks.reduce((sum, t) => sum + (t.subtasks?.filter(st => st.completed).length || 0), 0);
    const completionRate = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

    // 按日期分组
    const dailyStats = {};
    const weeklyStats = {};

    allTasks.forEach(task => {
        const createDate = getDateString(task.createdAt);
        if (createDate) {
            if (!dailyStats[createDate]) {
                dailyStats[createDate] = { date: createDate, created: 0, completed: 0, tasks: [] };
            }
            dailyStats[createDate].created++;
            dailyStats[createDate].tasks.push(task);
        }

        if (task.completedAt) {
            const completeDate = getDateString(task.completedAt);
            if (completeDate) {
                if (!dailyStats[completeDate]) {
                    dailyStats[completeDate] = { date: completeDate, created: 0, completed: 0, tasks: [] };
                }
                dailyStats[completeDate].completed++;
                if (!dailyStats[completeDate].tasks.find(t => t.id === task.id)) {
                    dailyStats[completeDate].tasks.push(task);
                }
            }
        }

        const weekInfo = getWeekInfo(task.createdAt);
        if (weekInfo) {
            const weekKey = `${weekInfo.year}-W${weekInfo.weekNum}`;
            if (!weeklyStats[weekKey]) {
                weeklyStats[weekKey] = { label: weekInfo.label, tasks: [], completed: 0, total: 0 };
            }
            weeklyStats[weekKey].tasks.push(task);
            weeklyStats[weekKey].total++;
            if (task.completedAt) weeklyStats[weekKey].completed++;
        }
    });

    const sortedDates = Object.keys(dailyStats).sort().reverse();
    const sortedWeeks = Object.keys(weeklyStats).sort().reverse();

    // 构建打印 HTML
    let printHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>工作总结报告 - ${new Date().toLocaleDateString('zh-CN')}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: white;
            padding: 40px;
            color: #333;
            line-height: 1.6;
        }
        .report-header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #667eea;
        }
        .report-header h1 {
            font-size: 28px;
            color: #333;
            margin-bottom: 8px;
        }
        .report-header .report-date {
            font-size: 14px;
            color: #888;
        }
        .summary-section {
            margin-bottom: 35px;
            page-break-inside: avoid;
        }
        .summary-section h3 {
            font-size: 18px;
            color: #333;
            margin-bottom: 18px;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
        }
        .summary-cards {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 15px;
            margin-bottom: 25px;
        }
        .summary-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px 10px;
            border-radius: 12px;
            text-align: center;
        }
        .summary-card.green { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
        .summary-card.orange { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
        .summary-card.blue { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
        .summary-card.yellow { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
        .summary-card-value { font-size: 32px; font-weight: 700; margin-bottom: 5px; }
        .summary-card-label { font-size: 13px; opacity: 0.95; }
        .chart-container {
            background: #f5f7fa;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .bar-chart {
            display: flex;
            align-items: flex-end;
            justify-content: space-around;
            gap: 8px;
            height: 200px;
            padding: 0 5px 30px 5px;
        }
        .bar-chart-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            min-width: 30px;
            position: relative;
        }
        .bar-chart-value {
            font-size: 11px;
            font-weight: 700;
            color: #333;
            background: white;
            padding: 1px 6px;
            border-radius: 8px;
        }
        .bar-chart-bar {
            width: 100%;
            background: linear-gradient(to top, #667eea, #764ba2);
            border-radius: 6px 6px 0 0;
            min-height: 3px;
        }
        .bar-chart-bar.zero {
            background: linear-gradient(to top, #ccc, #ddd);
        }
        .bar-chart-label {
            font-size: 10px;
            color: #666;
            text-align: center;
            white-space: nowrap;
            position: absolute;
            bottom: -22px;
        }
        .timeline {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .timeline-item {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 10px;
            padding: 15px;
            page-break-inside: avoid;
        }
        .timeline-date {
            font-size: 15px;
            font-weight: 700;
            color: #333;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            justify-content: space-between;
        }
        .timeline-date-badge {
            font-size: 12px;
            color: #667eea;
            font-weight: 600;
        }
        .timeline-tasks {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .timeline-task {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: white;
            border-radius: 8px;
            font-size: 13px;
        }
        .timeline-task-name { font-weight: 600; color: #333; flex: 1; }
        .timeline-task-meta { color: #888; font-size: 11px; }
        .weekly-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }
        .weekly-card {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 10px;
            padding: 18px;
            page-break-inside: avoid;
        }
        .weekly-header {
            font-size: 15px;
            font-weight: 700;
            color: #333;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            justify-content: space-between;
        }
        .weekly-header-badge {
            font-size: 12px;
            color: #667eea;
        }
        .weekly-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 12px;
        }
        .weekly-stat {
            text-align: center;
            padding: 10px;
            background: white;
            border-radius: 8px;
        }
        .weekly-stat-value { font-size: 22px; font-weight: 700; color: #667eea; }
        .weekly-stat-label { font-size: 11px; color: #888; margin-top: 4px; }
        .weekly-tasks {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .weekly-task {
            font-size: 13px;
            padding: 8px 12px;
            background: white;
            border-radius: 6px;
            display: flex;
            justify-content: space-between;
        }
        .weekly-task.completed { border-left: 3px solid #6bcb77; }
        .weekly-task.pending { border-left: 3px solid #ffd93d; }
        @media print {
            body { padding: 20px; }
            .summary-section { page-break-inside: avoid; }
            .timeline-item, .weekly-card { page-break-inside: avoid; }
        }
        @media (max-width: 700px) {
            .summary-cards { grid-template-columns: repeat(2, 1fr); }
            .weekly-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="report-header">
        <h1>📊 工作总结报告</h1>
        <div class="report-date">生成日期：${new Date().toLocaleString('zh-CN')}</div>
    </div>

    <div class="summary-section">
        <h3>📈 总体概况</h3>
        <div class="summary-cards">
            <div class="summary-card">
                <div class="summary-card-value">${totalTasks}</div>
                <div class="summary-card-label">总任务数</div>
            </div>
            <div class="summary-card green">
                <div class="summary-card-value">${completedTasks}</div>
                <div class="summary-card-label">已完成任务</div>
            </div>
            <div class="summary-card blue">
                <div class="summary-card-value">${totalSubtasks}</div>
                <div class="summary-card-label">总子任务数</div>
            </div>
            <div class="summary-card orange">
                <div class="summary-card-value">${completedSubtasks}</div>
                <div class="summary-card-label">已完成子任务</div>
            </div>
            <div class="summary-card yellow">
                <div class="summary-card-value">${completionRate}%</div>
                <div class="summary-card-label">整体完成率</div>
            </div>
        </div>
    </div>
`;

    // 每日趋势图
    const last30Dates = sortedDates.slice(0, 30).reverse();
    if (last30Dates.length > 0) {
        const maxCompleted = Math.max(...last30Dates.map(d => dailyStats[d].completed), 1);
        printHtml += `
    <div class="summary-section">
        <h3>📅 近30天每日完成趋势</h3>
        <div class="chart-container">
            <div class="bar-chart">
                ${last30Dates.map(date => {
                    const stat = dailyStats[date];
                    const height = stat.completed > 0 ? (stat.completed / maxCompleted * 100) : 0;
                    const isZero = stat.completed === 0;
                    return `
                <div class="bar-chart-item">
                    <div class="bar-chart-value">${stat.completed}</div>
                    <div class="bar-chart-bar ${isZero ? 'zero' : ''}" style="height: ${Math.max(height, 4)}%"></div>
                    <div class="bar-chart-label">${date.slice(5)}</div>
                </div>`;
                }).join('')}
            </div>
        </div>
    </div>
`;
    }

    // 每日详细记录
    if (sortedDates.length > 0) {
        printHtml += `
    <div class="summary-section">
        <h3>📝 每日工作记录 (${sortedDates.length} 天)</h3>
        <div class="timeline">
            ${sortedDates.map(date => {
                const stat = dailyStats[date];
                const dayTasks = stat.tasks.filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i);
                const completedCount = dayTasks.filter(t => t.completedAt && getDateString(t.completedAt) === date).length;
                const createdCount = dayTasks.filter(t => getDateString(t.createdAt) === date).length;
                return `
            <div class="timeline-item">
                <div class="timeline-date">
                    <span>${date}</span>
                    <span class="timeline-date-badge">创建 ${createdCount} | 完成 ${completedCount}</span>
                </div>
                <div class="timeline-tasks">
                    ${dayTasks.map(task => {
                        const taskProgress = task.subtasks?.length > 0
                            ? Math.round((task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100)
                            : 0;
                        return `
                    <div class="timeline-task">
                        <span class="timeline-task-name">${escapeHtml(task.name)}</span>
                        <span class="timeline-task-meta">${task.completedAt ? '✅ 已完成' : `⏳ ${taskProgress}%`}</span>
                    </div>`;
                    }).join('')}
                </div>
            </div>`;
            }).join('')}
        </div>
    </div>
`;
    }

    // 每周总结
    if (sortedWeeks.length > 0) {
        printHtml += `
    <div class="summary-section">
        <h3>📆 每周工作总结 (${sortedWeeks.length} 周)</h3>
        <div class="weekly-grid">
            ${sortedWeeks.map(weekKey => {
                const week = weeklyStats[weekKey];
                const weekTasks = week.tasks.filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i);
                const rate = week.total > 0 ? Math.round((week.completed / week.total) * 100) : 0;
                return `
            <div class="weekly-card">
                <div class="weekly-header">
                    <span>${week.label}</span>
                    <span class="weekly-header-badge">完成率 ${rate}%</span>
                </div>
                <div class="weekly-stats">
                    <div class="weekly-stat">
                        <div class="weekly-stat-value">${week.total}</div>
                        <div class="weekly-stat-label">总任务</div>
                    </div>
                    <div class="weekly-stat">
                        <div class="weekly-stat-value">${week.completed}</div>
                        <div class="weekly-stat-label">已完成</div>
                    </div>
                    <div class="weekly-stat">
                        <div class="weekly-stat-value">${rate}%</div>
                        <div class="weekly-stat-label">完成率</div>
                    </div>
                    <div class="weekly-stat">
                        <div class="weekly-stat-value">${weekTasks.reduce((s, t) => s + (t.subtasks?.length || 0), 0)}</div>
                        <div class="weekly-stat-label">子任务</div>
                    </div>
                </div>
                <div class="weekly-tasks">
                    ${weekTasks.map(task => `
                    <div class="weekly-task ${task.completedAt ? 'completed' : 'pending'}">
                        <span>${escapeHtml(task.name)}</span>
                        <span>${task.completedAt ? '✅' : '⏳'}</span>
                    </div>`).join('')}
                </div>
            </div>`;
            }).join('')}
        </div>
    </div>
`;
    }

    printHtml += `
</body>
</html>`;

    printWindow.document.write(printHtml);
    printWindow.document.close();

    // 自动触发打印对话框
    setTimeout(() => {
        printWindow.print();
    }, 500);
}

// 键盘事件处理
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeAddTaskModal();
        closeArchiveModal();
        closeSummaryModal();
    }
});

// 点击模态框外部关闭
document.getElementById('addTaskModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeAddTaskModal();
    }
});

document.getElementById('archiveModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeArchiveModal();
    }
});

document.getElementById('summaryModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeSummaryModal();
    }
});

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
});
