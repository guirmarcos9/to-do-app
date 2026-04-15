const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const prioritySelect = document.getElementById("prioritySelect");
const taskDate = document.getElementById("taskDate");
const taskTime = document.getElementById("taskTime");
const taskList = document.getElementById("taskList");
const feedbackMessage = document.getElementById("feedbackMessage");
const filterButtons = document.querySelectorAll(".filter-btn");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");
const totalTasksElement = document.getElementById("totalTasks");
const pendingTasksElement = document.getElementById("pendingTasks");
const completedTasksElement = document.getElementById("completedTasks");
const emptyState = document.getElementById("emptyState");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageIndicator = document.getElementById("pageIndicator");
const paginationInfo = document.getElementById("paginationInfo");

let tasks = [];
let currentFilter = "todas";
let currentPage = 1;
const tasksPerPage = 5;

function loadTasks() {
  const savedTasks = localStorage.getItem("taskflow_tasks");

  if (savedTasks) {
    tasks = JSON.parse(savedTasks);
  }
}

function saveTasks() {
  localStorage.setItem("taskflow_tasks", JSON.stringify(tasks));
}

function showFeedback(message, isError = true) {
  feedbackMessage.textContent = message;
  feedbackMessage.style.color = isError ? "#dc2626" : "#16a34a";
}

function clearFeedback() {
  feedbackMessage.textContent = "";
}

function getPriorityLabel(priority) {
  if (priority === "alta") return "Alta";
  if (priority === "media") return "Média";
  return "Baixa";
}

function getPriorityClass(priority) {
  if (priority === "alta") return "badge-high";
  if (priority === "media") return "badge-medium";
  return "badge-low";
}

function formatDateForDisplay(dateValue, timeValue) {
  const [year, month, day] = dateValue.split("-");
  return `${day}/${month}/${year} às ${timeValue}`;
}

function createTaskObject(title, priority, dueDate, dueTime) {
  return {
    id: Date.now().toString(),
    title: title,
    priority: priority,
    completed: false,
    dueDate: dueDate,
    dueTime: dueTime,
    createdAt: new Date().toLocaleString("pt-BR")
  };
}

function addTask(title, priority, dueDate, dueTime) {
  const newTask = createTaskObject(title, priority, dueDate, dueTime);
  tasks.unshift(newTask);
  saveTasks();

  const totalPages = getTotalPages();
  currentPage = totalPages;

  renderTasks();
}

function toggleTask(taskId) {
  tasks = tasks.map((task) => {
    if (task.id === taskId) {
      return { ...task, completed: !task.completed };
    }
    return task;
  });

  saveTasks();
  renderTasks();
}

function deleteTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);

  const totalPages = getTotalPages();
  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  saveTasks();
  renderTasks();
}

function clearCompletedTasks() {
  tasks = tasks.filter((task) => !task.completed);

  const totalPages = getTotalPages();
  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  saveTasks();
  renderTasks();
}

function filterTasks() {
  if (currentFilter === "pendentes") {
    return tasks.filter((task) => !task.completed);
  }

  if (currentFilter === "concluidas") {
    return tasks.filter((task) => task.completed);
  }

  return tasks;
}

function getTotalPages() {
  const filteredTasks = filterTasks();
  return Math.max(1, Math.ceil(filteredTasks.length / tasksPerPage));
}

function paginateTasks(filteredTasks) {
  const startIndex = (currentPage - 1) * tasksPerPage;
  const endIndex = startIndex + tasksPerPage;
  return filteredTasks.slice(startIndex, endIndex);
}

function updateSummary() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const pending = total - completed;

  totalTasksElement.textContent = total;
  pendingTasksElement.textContent = pending;
  completedTasksElement.textContent = completed;
}

function updatePagination(filteredTasks) {
  const totalTasks = filteredTasks.length;
  const totalPages = Math.max(1, Math.ceil(totalTasks / tasksPerPage));

  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  const startItem = totalTasks === 0 ? 0 : (currentPage - 1) * tasksPerPage + 1;
  const endItem = Math.min(currentPage * tasksPerPage, totalTasks);

  paginationInfo.textContent = `Mostrando ${startItem}-${endItem} de ${totalTasks} tarefas`;
  pageIndicator.textContent = `Página ${currentPage} de ${totalPages}`;

  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages || totalTasks === 0;
}

function renderTasks() {
  taskList.innerHTML = "";

  const filteredTasks = filterTasks();
  const paginatedTasks = paginateTasks(filteredTasks);

  if (filteredTasks.length === 0) {
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");
  }

  paginatedTasks.forEach((task) => {
    const listItem = document.createElement("li");
    listItem.className = `task-item ${task.completed ? "completed" : ""}`;

    listItem.innerHTML = `
      <div class="task-left">
        <input
          type="checkbox"
          class="task-check"
          ${task.completed ? "checked" : ""}
          aria-label="Marcar tarefa como concluída"
        />

        <div class="task-content">
          <p class="task-title">${task.title}</p>

          <div class="task-meta">
            <span class="badge ${getPriorityClass(task.priority)}">
              Prioridade: ${getPriorityLabel(task.priority)}
            </span>
            <span class="task-deadline">
              Prazo: ${formatDateForDisplay(task.dueDate, task.dueTime)}
            </span>
            <span class="task-date">
              Criada em: ${task.createdAt}
            </span>
          </div>
        </div>
      </div>

      <div class="task-actions">
        <button class="icon-btn delete-btn" aria-label="Remover tarefa">
          Remover
        </button>
      </div>
    `;

    const checkbox = listItem.querySelector(".task-check");
    const deleteButton = listItem.querySelector(".delete-btn");

    checkbox.addEventListener("change", () => toggleTask(task.id));
    deleteButton.addEventListener("click", () => deleteTask(task.id));

    taskList.appendChild(listItem);
  });

  updateSummary();
  updatePagination(filteredTasks);
}

taskForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const title = taskInput.value.trim();
  const priority = prioritySelect.value;
  const dueDate = taskDate.value;
  const dueTime = taskTime.value;

  if (title === "") {
    showFeedback("Digite uma tarefa antes de adicionar.");
    return;
  }

  if (dueDate === "" || dueTime === "") {
    showFeedback("Preencha a data e a hora da tarefa.");
    return;
  }

  const duplicateTask = tasks.some(
    (task) =>
      task.title.toLowerCase() === title.toLowerCase() &&
      task.dueDate === dueDate &&
      task.dueTime === dueTime
  );

  if (duplicateTask) {
    showFeedback("Já existe uma tarefa com esse nome, data e hora.");
    return;
  }

  addTask(title, priority, dueDate, dueTime);
  taskForm.reset();
  prioritySelect.value = "alta";
  clearFeedback();
  showFeedback("Tarefa adicionada com sucesso.", false);
  taskInput.focus();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", function () {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    this.classList.add("active");
    currentFilter = this.dataset.filter;
    currentPage = 1;
    renderTasks();
  });
});

clearCompletedBtn.addEventListener("click", function () {
  const hasCompletedTasks = tasks.some((task) => task.completed);

  if (!hasCompletedTasks) {
    showFeedback("Não há tarefas concluídas para remover.");
    return;
  }

  clearCompletedTasks();
  showFeedback("Tarefas concluídas removidas com sucesso.", false);
});

prevPageBtn.addEventListener("click", function () {
  if (currentPage > 1) {
    currentPage--;
    renderTasks();
  }
});

nextPageBtn.addEventListener("click", function () {
  const totalPages = getTotalPages();

  if (currentPage < totalPages) {
    currentPage++;
    renderTasks();
  }
});

loadTasks();
renderTasks();