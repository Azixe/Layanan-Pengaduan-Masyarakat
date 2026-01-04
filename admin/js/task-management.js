const STATUS_CODES = {
  "Belum dikerjakan": "belum",
  "Sedang dikerjakan": "sedang",
  Selesai: "selesai",
};

const STATUS_LABELS = {
  // label untuk tampilan UI (boleh lebih rapi)
  belum: "Belum Dikerjakan",
  sedang: "Sedang Dikerjakan",
  selesai: "Selesai Dikerjakan",
};

// nilai yang DIKIRIM ke backend (harus sama persis dengan yang ada di DB / controller)
const STATUS_API_VALUES = {
  belum: "Belum dikerjakan",
  sedang: "Sedang dikerjakan",
  selesai: "Selesai",
};

const STATUS_CLASSES = {
  belum: "status-pending",
  sedang: "status-progress",
  selesai: "status-done",
};

const PRIORITY_LABELS = {
  tinggi: "Prioritas Tinggi",
  sedang: "Prioritas Sedang",
  rendah: "Prioritas Rendah",
};

const PRIORITY_BADGES = {
  tinggi: "detail-priority priority-high",
  sedang: "detail-priority priority-medium",
  rendah: "detail-priority priority-low",
};

// tambah konstanta urutan prioritas
const PRIORITY_ORDER = {
  tinggi: 1,
  sedang: 2,
  rendah: 3,
};
let laporanCache = [];
let taskCache = [];
let currentSearchTerm = "";
let searchTimer;
let draggedCard = null;
let dragPlaceholder = null;
let dragSourceList = null;
let draggedTaskData = null;
let dragSourceNextSibling = null;

document.addEventListener("DOMContentLoaded", () => {
  bootstrapTaskManagement();
});

async function bootstrapTaskManagement() {
  await loadBoardData();
  initTaskSearch();
  initForms();
  refreshNotificationBadge();
}

async function loadBoardData(searchTerm = "") {
  try {
    currentSearchTerm = searchTerm;
    const params = new URLSearchParams({ limit: 200 });
    if (searchTerm) {
      params.append("search", searchTerm);
    }
    const response = await requestJSON(`/api/laporan/all?${params.toString()}`);
    laporanCache = Array.isArray(response.data) ? response.data : [];
    taskCache = laporanCache.map(transformLaporanToTask);
    renderTaskBoard(taskCache);
    renderStatsFromTasks(taskCache);
    renderReportOptions(laporanCache);
  } catch (error) {
    showNotification(error.message || "Gagal memuat laporan", "error");
  }
}

function initDragAndDrop() {
  const lists = document.querySelectorAll(".task-list[data-priority]");
  lists.forEach((list) => {
    if (list.dataset.dndInitialized === "true") return;
    list.addEventListener("dragover", handleListDragOver);
    list.addEventListener("dragleave", handleListDragLeave);
    list.addEventListener("drop", handleListDrop);
    list.dataset.dndInitialized = "true";
  });
}

function handleCardDragStart(event, task) {
  draggedCard = event.currentTarget;
  draggedTaskData = task;
  dragSourceList = draggedCard.parentElement;
  dragSourceNextSibling = draggedCard.nextElementSibling;
  dragPlaceholder = document.createElement("div");
  dragPlaceholder.className = "task-placeholder";
  dragPlaceholder.style.height = `${draggedCard.offsetHeight}px`;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", task._id);
  requestAnimationFrame(() => draggedCard.classList.add("dragging"));
}

function handleCardDragEnd() {
  resetDragState();
}

function handleListDragOver(event) {
  event.preventDefault();
  if (!draggedCard) {
    return;
  }
  const list = event.currentTarget;
  list.classList.add("drag-over");
  insertPlaceholder(list, event.clientY);
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
}

function handleListDragLeave(event) {
  const list = event.currentTarget;
  const related = event.relatedTarget;
  if (related && list.contains(related)) {
    return;
  }
  list.classList.remove("drag-over");
  removePlaceholder(list);
}

function handleListDrop(event) {
  event.preventDefault();
  const list = event.currentTarget;
  const card = draggedCard;
  const task = draggedTaskData;
  const sourceList = dragSourceList;
  const originalPriority = card ? card.dataset.priority : "";
  const targetPriority = list.dataset.priority;
  const nextSibling = dragSourceNextSibling;
  const placeholderElement = dragPlaceholder;
  const placeholderParent = placeholderElement?.parentElement;
  list.classList.remove("drag-over");
  if (!card || !task || !targetPriority) {
    removePlaceholder();
    resetDragState();
    return;
  }
  if (targetPriority === originalPriority && list === sourceList) {
    removePlaceholder();
    resetDragState();
    return;
  }
  if (placeholderElement && placeholderParent === list) {
    placeholderElement.replaceWith(card);
  } else {
    if (placeholderElement) {
      placeholderElement.remove();
    }
    list.appendChild(card);
  }
  removePlaceholder();
  card.dataset.priority = targetPriority;
  card.classList.add("drop-animate");
  setTimeout(() => card.classList.remove("drop-animate"), 300);
  if (task) {
    task.priority = targetPriority;
    refreshOpenViewModal(task);
    refreshOpenEditModal(task);
  }
  updateTaskCountsFromCache();
  performPriorityUpdate(task._id, targetPriority, {
    card,
    task,
    sourceList,
    nextSibling,
    originalPriority,
  });
}

function insertPlaceholder(list, mouseY) {
  if (!dragPlaceholder) {
    dragPlaceholder = document.createElement("div");
    dragPlaceholder.className = "task-placeholder";
  }
  dragPlaceholder.style.height = `${draggedCard.offsetHeight}px`;
  const afterElement = getDragAfterElement(list, mouseY);
  if (!afterElement) {
    list.appendChild(dragPlaceholder);
    return;
  }
  if (afterElement !== dragPlaceholder) {
    list.insertBefore(dragPlaceholder, afterElement);
  }
}

function getDragAfterElement(container, mouseY) {
  const cards = [...container.querySelectorAll(".task-card:not(.dragging)")];
  return cards.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = mouseY - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY, element: null }
  ).element;
}

async function performPriorityUpdate(taskId, targetPriority, meta) {
  try {
    await requestJSON(`/api/laporan/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prioritas: targetPriority }), // <-- disimpan ke DB
    });

    await refreshTaskDataFromServer(taskId);
    showNotification("Prioritas laporan berhasil diperbarui", "success");
  } catch (error) {
    if (meta.task) {
      meta.task.priority = meta.originalPriority;
    }
    if (meta.card) {
      meta.card.dataset.priority = meta.originalPriority;
      if (meta.sourceList) {
        if (
          meta.nextSibling &&
          meta.nextSibling.parentNode === meta.sourceList
        ) {
          meta.sourceList.insertBefore(meta.card, meta.nextSibling);
        } else {
          meta.sourceList.appendChild(meta.card);
        }
      }
    }
    updateTaskCountsFromCache();
    showNotification(
      error.message || "Gagal memperbarui prioritas laporan",
      "error"
    );
  } finally {
    resetDragState();
  }
}

function updateTaskCountsFromCache() {
  const grouped = { tinggi: [], sedang: [], rendah: [] };
  taskCache.forEach((task) => {
    const priority = task.priority || "sedang";
    if (!grouped[priority]) {
      grouped[priority] = [];
    }
    grouped[priority].push(task);
  });
  updateTaskCounts(grouped);
}

async function refreshTaskDataFromServer(taskId) {
  try {
    const response = await requestJSON(`/api/laporan/${taskId}`);
    const updatedTask = transformLaporanToTask(response.data);
    updateTaskInCaches(updatedTask, response.data);
    refreshOpenViewModal(updatedTask);
    refreshOpenEditModal(updatedTask);
  } catch (error) {
    console.warn("Gagal menyegarkan data laporan:", error.message);
  }
}

function updateTaskInCaches(updatedTask, rawReport) {
  const taskIndex = taskCache.findIndex((task) => task._id === updatedTask._id);
  if (taskIndex !== -1) {
    Object.assign(taskCache[taskIndex], updatedTask);
  } else {
    taskCache.push(updatedTask);
  }
  const reportIndex = laporanCache.findIndex(
    (item) => item._id === updatedTask._id
  );
  if (reportIndex !== -1) {
    laporanCache[reportIndex] = {
      ...laporanCache[reportIndex],
      prioritas: rawReport.prioritas,
    };
  }
}

function resetDragState() {
  removePlaceholder();
  const activeLists = document.querySelectorAll(".task-list.drag-over");
  activeLists.forEach((list) => list.classList.remove("drag-over"));
  if (draggedCard) {
    draggedCard.classList.remove("dragging");
  }
  draggedCard = null;
  dragPlaceholder = null;
  dragSourceList = null;
  draggedTaskData = null;
  dragSourceNextSibling = null;
}

function removePlaceholder(list) {
  if (
    dragPlaceholder &&
    dragPlaceholder.parentElement &&
    (!list || dragPlaceholder.parentElement === list)
  ) {
    dragPlaceholder.parentElement.removeChild(dragPlaceholder);
  }
}

function syncPriorityWithCache(task) {
  if (!task) {
    return task;
  }
  const cached = taskCache.find((item) => item._id === task._id);
  if (!cached) {
    return task;
  }
  const validPriorities = ["tinggi", "sedang", "rendah"];
  const cachedValid = validPriorities.includes(cached.priority);
  const detailValid = validPriorities.includes(task.priority);
  if (cachedValid && !detailValid) {
    task.priority = cached.priority;
  } else if (!cachedValid && detailValid) {
    cached.priority = task.priority;
  }
  return task;
}

function refreshOpenViewModal(task) {
  const viewModal = document.getElementById("viewModal");
  if (
    viewModal &&
    viewModal.classList.contains("active") &&
    viewModal.dataset.taskId === task._id
  ) {
    populateViewModal(task);
  }
}

function refreshOpenEditModal(task) {
  const editModal = document.getElementById("editModal");
  const currentId = document.getElementById("editTaskId")?.value;
  if (
    editModal &&
    editModal.classList.contains("active") &&
    currentId === task._id
  ) {
    populateEditForm(task);
  }
}

function transformLaporanToTask(laporan) {
  const statusCode = STATUS_CODES[laporan.status_laporan] || "belum";

  const validPriorities = ["tinggi", "sedang", "rendah"];
  // gunakan nilai dari DB jika valid, kalau tidak pakai analisis AI (derivePriority)
  let priority = validPriorities.includes(laporan.prioritas)
    ? laporan.prioritas
    : derivePriority(laporan);
  if (!validPriorities.includes(priority)) {
    priority = "sedang";
  }

  // ambil nama petugas (struktur field bisa disesuaikan dengan model di backend)
  const assigneeName =
    (laporan.petugas &&
      (laporan.petugas.nama ||
        laporan.petugas.fullName ||
        laporan.petugas.nama_petugas)) ||
    laporan.petugas_nama ||
    laporan.assigneeName ||
    "";

  // ambil deadline penugasan jika ada
  const assignmentDeadline =
    laporan.deadline_tugas || laporan.deadline || laporan.batas_waktu || null;

  return {
    _id: laporan._id,
    nomor: laporan.nomor_laporan,
    title: laporan.judul || "Tanpa Judul",
    description: laporan.deskripsi || "",
    status: statusCode,
    priority,
    reporter: laporan.nama_warga || "Anonim",
    kategori: laporan.kategori || laporan.kategori_ai || "Tidak diketahui",
    lokasi: laporan.lokasi || "Tidak diketahui",
    createdAt: laporan.createdAt,
    updatedAt: laporan.updatedAt,
    notes: laporan.komentar || "",
    attachments: laporan.gambar ? [laporan.gambar] : [],
    history: buildHistoryFromLaporan(laporan),
    // info penugasan (untuk ditampilkan di detail laporan)
    assignee: assigneeName || null,
    deadline: assignmentDeadline,
  };
}

function derivePriority(laporan) {
  const category = (
    laporan.kategori_ai ||
    laporan.kategori ||
    ""
  ).toLowerCase();
  const sentimen = (laporan.sentimen_ai || "").toLowerCase();

  if (laporan.status_laporan === "Selesai") {
    return "rendah";
  }
  if (["infrastruktur", "keamanan", "kesehatan"].includes(category)) {
    return "tinggi";
  }
  if (["lingkungan", "pelayanan", "sosial"].includes(category)) {
    return "sedang";
  }
  if (sentimen === "negatif") {
    return "tinggi";
  }
  return "sedang";
}

function buildHistoryFromLaporan(laporan) {
  const history = [];
  history.push({
    action: "Laporan Dibuat",
    description: `Dikirim oleh ${laporan.nama_warga || "Anonim"}`,
    createdAt: laporan.createdAt,
  });
  if (laporan.updatedAt && laporan.updatedAt !== laporan.createdAt) {
    history.push({
      action: "Status Terbaru",
      description: laporan.status_laporan,
      createdAt: laporan.updatedAt,
    });
  }
  return history;
}

function renderTaskBoard(tasks) {
  const columns = {
    tinggi: document.getElementById("priorityHigh"),
    sedang: document.getElementById("priorityMedium"),
    rendah: document.getElementById("priorityLow"),
  };

  Object.values(columns).forEach((column) => {
    if (column) {
      column.innerHTML = "";
    }
  });

  // kelompok per PRIORITAS (tinggi/sedang/rendah)
  const grouped = { tinggi: [], sedang: [], rendah: [] };
  tasks.forEach((task) => {
    const priority = task.priority || "sedang";
    if (!grouped[priority]) {
      grouped[priority] = [];
    }
    grouped[priority].push(task);
  });

  // dalam tiap kolom, urutkan misal berdasarkan tanggal (paling baru di atas)
  const sortByDateDesc = (a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt);

  if (columns.tinggi) {
    grouped.tinggi
      .sort(sortByDateDesc)
      .forEach((task) => columns.tinggi.appendChild(createTaskCard(task)));
  }
  if (columns.sedang) {
    grouped.sedang
      .sort(sortByDateDesc)
      .forEach((task) => columns.sedang.appendChild(createTaskCard(task)));
  }
  if (columns.rendah) {
    grouped.rendah
      .sort(sortByDateDesc)
      .forEach((task) => columns.rendah.appendChild(createTaskCard(task)));
  }

  updateTaskCounts(grouped); // sekarang grouped = per prioritas
  initDragAndDrop(); // drag & drop akan ubah prioritas
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function createTaskCard(task) {
  const card = createElement("div", "task-card");
  card.dataset.taskId = task._id;
  card.dataset.priority = task.priority;
  card.dataset.status = task.status;
  card.draggable = true;

  card.addEventListener("dragstart", (event) =>
    handleCardDragStart(event, task)
  );

  card.addEventListener("dragend", handleCardDragEnd);

  const header = createElement("div", "task-header");
  header.appendChild(
    createElement("span", "task-id", `#${task.nomor || task._id.slice(-5)}`)
  );
  header.appendChild(
    createElement(
      "div",
      `task-status ${STATUS_CLASSES[task.status] || "status-pending"}`,
      STATUS_LABELS[task.status] || STATUS_LABELS.belum
    )
  );

  const titleEl = createElement("h4", "task-title", task.title || "-");
  const descEl = createElement(
    "p",
    "task-description",
    truncateText(task.description, 140)
  );

  const meta = createElement("div", "task-meta");
  const reporter = createElement("div", "task-assignee");
  reporter.innerHTML = `<i class="fa-solid fa-user"></i><span>${task.reporter}</span>`;
  const dateWrapper = createElement("div", "task-date");
  dateWrapper.innerHTML = `<i class="fa-solid fa-calendar"></i><span>${formatReadableDate(
    task.createdAt
  )}</span>`;
  meta.append(reporter, dateWrapper);

  const actions = createElement("div", "task-actions");
  const viewBtn = createActionButton("view", "fa-solid fa-eye", () =>
    viewTask(task._id)
  );
  const editBtn = createActionButton("edit", "fa-solid fa-pen", () =>
    editTask(task._id)
  );
  actions.append(viewBtn, editBtn);

  card.append(header, titleEl, descEl, meta, actions);
  return card;
}

function createActionButton(action, iconClass, handler) {
  const button = createElement("button", "btn-icon");
  button.dataset.action = action;
  button.innerHTML = `<i class="${iconClass}"></i>`;
  button.addEventListener("click", handler);
  return button;
}

function updateTaskCounts(grouped) {
  const columnCounts = document.querySelectorAll(".task-column .task-count");
  if (columnCounts.length >= 3) {
    // urutan: Tinggi, Sedang, Rendah
    columnCounts[0].textContent = grouped.tinggi.length;
    columnCounts[1].textContent = grouped.sedang.length;
    columnCounts[2].textContent = grouped.rendah.length;
  }
}

function renderStatsFromTasks(tasks) {
  const totals = { belum: 0, sedang: 0, selesai: 0 };
  tasks.forEach((task) => {
    totals[task.status] = (totals[task.status] || 0) + 1;
  });
  const statValues = document.querySelectorAll(".stat-value");
  if (statValues.length >= 4) {
    statValues[0].textContent = tasks.length;
    statValues[1].textContent = totals.belum;
    statValues[2].textContent = totals.sedang;
    statValues[3].textContent = totals.selesai;
  }
}

function initTaskSearch() {
  const searchInput = document.getElementById("taskSearch");
  if (!searchInput) {
    return;
  }
  searchInput.addEventListener("input", (event) => {
    clearTimeout(searchTimer);
    const value = event.target.value.trim();
    searchTimer = setTimeout(() => {
      loadBoardData(value);
    }, 400);
  });
}

function renderReportOptions(laporan) {
  const reportSelect = document.getElementById("reportSelect");
  if (!reportSelect) {
    return;
  }
  reportSelect.innerHTML = '<option value="">Pilih laporan...</option>';
  laporan.forEach((item) => {
    const option = document.createElement("option");
    option.value = item._id;
    option.textContent = `${item.nomor_laporan} - ${item.judul}`;
    reportSelect.appendChild(option);
  });
}

function openAssignModal() {
  const modal = document.getElementById("assignModal");
  if (!modal) {
    // jika modal belum dibuat di HTML
    showNotification(
      "Modal penugasan belum dikonfigurasi di halaman ini",
      "error"
    );
    return;
  }

  const form = document.getElementById("assignTaskForm");
  if (form) {
    form.reset();
  }

  // sinkronkan level prioritas dengan laporan yang dipilih (jika ada)
  const reportSelect = document.getElementById("reportSelect");
  const prioritySelect = document.getElementById("assignPrioritySelect");
  if (reportSelect && prioritySelect && reportSelect.value) {
    const selectedTask = taskCache.find(
      (task) => task._id === reportSelect.value
    );
    if (selectedTask && selectedTask.priority) {
      prioritySelect.value = selectedTask.priority;
    }
  }

  modal.classList.add("active");
  // muat daftar petugas dari backend
  loadPetugasOptions();
}

function closeAssignModal() {
  const modal = document.getElementById("assignModal");
  if (modal) {
    modal.classList.remove("active");
  }
}

function closeViewModal() {
  const modal = document.getElementById("viewModal");
  if (modal) {
    modal.classList.remove("active");
    delete modal.dataset.taskId;
  }
}

function openEditModalFromView() {
  const viewModal = document.getElementById("viewModal");
  const taskId = viewModal?.dataset.taskId;
  closeViewModal();
  if (taskId) {
    editTask(taskId);
  }
}

function closeEditModal() {
  const modal = document.getElementById("editModal");
  modal?.classList.remove("active");
  document.getElementById("editTaskForm")?.reset();
}

window.addEventListener("click", (event) => {
  const viewModal = document.getElementById("viewModal");
  const editModal = document.getElementById("editModal");
  const assignModal = document.getElementById("assignModal");

  if (event.target === viewModal) {
    closeViewModal();
  }
  if (event.target === editModal) {
    closeEditModal();
  }
  if (event.target === assignModal) {
    closeAssignModal();
  }
});

function initForms() {
  const editForm = document.getElementById("editTaskForm");
  if (editForm) {
    editForm.addEventListener("submit", handleEditSubmit);
  }

  // form penugasan laporan
  const assignForm = document.getElementById("assignTaskForm");
  if (assignForm) {
    assignForm.addEventListener("submit", handleAssignSubmit);
  }

  const assignSelect = document.getElementById("assigneeSelect");
  if (assignSelect) {
    assignSelect.innerHTML =
      '<option value="">Penugasan belum tersedia</option>';
    assignSelect.disabled = true;
  }
  const editAssigneeSelect = document.getElementById("editAssigneeSelect");
  if (editAssigneeSelect) {
    editAssigneeSelect.innerHTML =
      '<option value="">Penugasan belum tersedia</option>';
    editAssigneeSelect.disabled = true;
  }
}

// modal detail & edit
async function viewTask(taskId) {
  try {
    const response = await requestJSON(`/api/laporan/${taskId}`);
    const detail = transformLaporanToTask(response.data);
    syncPriorityWithCache(detail);
    document.getElementById("viewModal")?.classList.add("active");
    document.getElementById("viewModal").dataset.taskId = taskId;
    populateViewModal(detail);
  } catch (error) {
    showNotification(error.message || "Gagal memuat detail laporan", "error");
  }
}

async function editTask(taskId) {
  try {
    const response = await requestJSON(`/api/laporan/${taskId}`);
    const detail = transformLaporanToTask(response.data);
    syncPriorityWithCache(detail);
    populateEditForm(detail);
    document.getElementById("editModal")?.classList.add("active");
  } catch (error) {
    showNotification(error.message || "Gagal memuat data laporan", "error");
  }
}

async function handleEditSubmit(event) {
  event.preventDefault();
  const taskId = document.getElementById("editTaskId").value;
  if (!taskId) return;

  const judul = document.getElementById("editTaskTitle").value.trim();
  const deskripsi = document.getElementById("editTaskDescription").value.trim();

  // VALIDASI PANJANG JUDUL
  if (judul.length < 20) {
    showNotification("Judul laporan minimal 20 karakter.", "error");
    return;
  }
  if (judul.length > 1000) {
    showNotification("Judul laporan maksimal 1000 karakter.", "error");
    return;
  }

  // VALIDASI PANJANG DESKRIPSI
  if (deskripsi.length < 20) {
    showNotification("Deskripsi laporan minimal 20 karakter.", "error");
    return;
  }
  if (deskripsi.length > 10000) {
    showNotification("Deskripsi laporan maksimal 10000 karakter.", "error");
    return;
  }

  const statusCode = document.getElementById("editStatusSelect").value;
  const statusText = STATUS_API_VALUES[statusCode] || "Belum dikerjakan";
  const komentar = document.getElementById("editTaskNotes").value;
  const prioritas = document.getElementById("editPrioritySelect").value;

  const submitBtn = event.target.querySelector('button[type="submit"]');
  const original = submitBtn.innerHTML;
  submitBtn.innerHTML =
    '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
  submitBtn.disabled = true;
  try {
    await requestJSON(`/api/laporan/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        judul,
        deskripsi,
        status_laporan: statusText,
        komentar,
        prioritas,
      }),
    });
    showNotification("Laporan berhasil diperbarui", "success");
    closeEditModal();
    await loadBoardData(currentSearchTerm);
  } catch (error) {
    showNotification(error.message || "Gagal memperbarui laporan", "error");
  } finally {
    submitBtn.innerHTML = original;
    submitBtn.disabled = false;
  }
}

function populateViewModal(task) {
  const viewModal = document.getElementById("viewModal");
  const contentContainer = document.getElementById("viewTaskContent");
  if (!viewModal || !contentContainer) {
    return;
  }
  viewModal.dataset.taskId = task._id;
  const priorityLabel =
    PRIORITY_LABELS[task.priority] || PRIORITY_LABELS.sedang;
  const priorityClass =
    PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.sedang;
  const statusLabel = STATUS_LABELS[task.status] || STATUS_LABELS.belum;
  const statusClass =
    task.status === "selesai"
      ? "badge badge-resolved"
      : task.status === "sedang"
      ? "badge badge-progress"
      : "badge badge-pending";

  const attachmentsHTML = buildAttachmentHTML(task);
  const timelineHTML = buildTimelineHTML(task.history);

  // info penugasan
  const assigneeText = task.assignee || "Belum ditugaskan";
  const deadlineText = task.deadline ? formatFullDate(task.deadline) : "-";

  const detailHTML = `
    <div class="detail-header">
      <div>
        <span class="detail-id">#${task.nomor || task._id.slice(-5)}</span>
        <span class="${priorityClass}">${priorityLabel}</span>
      </div>
      <span class="detail-status ${statusClass}">${statusLabel}</span>
    </div>
    <h3 class="detail-title">${task.title || "-"}</h3>
    <div class="detail-grid">
      <div class="detail-item">
        <label><i class="fa-solid fa-user"></i> Dilaporkan Oleh</label>
        <p>${task.reporter}</p>
      </div>
      <div class="detail-item">
        <label><i class="fa-solid fa-calendar"></i> Tanggal Dibuat</label>
        <p>${formatFullDate(task.createdAt)}</p>
      </div>
      <div class="detail-item">
        <label><i class="fa-solid fa-location-dot"></i> Lokasi</label>
        <p>${task.lokasi}</p>
      </div>
      <div class="detail-item">
        <label><i class="fa-solid fa-list"></i> Kategori</label>
        <p>${task.kategori}</p>
      </div>
      <div class="detail-item">
        <label><i class="fa-solid fa-user-check"></i> Ditugaskan Kepada</label>
        <p>${assigneeText}</p>
      </div>
      <div class="detail-item">
        <label><i class="fa-solid fa-hourglass-half"></i> Deadline Tugas</label>
        <p>${deadlineText}</p>
      </div>
    </div>
    <div class="detail-description">
      <label><i class="fa-solid fa-align-left"></i> Deskripsi</label>
      <p>${task.description || "-"}</p>
    </div>
    <div class="detail-notes">
      <label><i class="fa-solid fa-note-sticky"></i> Catatan Tambahan</label>
      <p>${task.notes || "-"}</p>
    </div>
    <div class="detail-attachments">
      <label><i class="fa-solid fa-paperclip"></i> Lampiran</label>
      <div class="attachment-list">${attachmentsHTML}</div>
    </div>
    <div class="detail-timeline">
      <label><i class="fa-solid fa-timeline"></i> Riwayat Aktivitas</label>
      <div class="timeline-list">${timelineHTML}</div>
    </div>
  `;
  contentContainer.innerHTML = detailHTML;
}

function populateEditForm(task) {
  document.getElementById("editTaskId").value = task._id;
  const titleInput = document.getElementById("editTaskTitle");
  if (titleInput) {
    titleInput.value = task.title || "";
    titleInput.readOnly = false;
  }
  const descInput = document.getElementById("editTaskDescription");
  if (descInput) {
    descInput.value = task.description || "";
    descInput.readOnly = false;
  }
  const dueDateInput = document.getElementById("editDueDate");
  if (dueDateInput) {
    dueDateInput.value = formatDateInput(task.createdAt);
    dueDateInput.readOnly = true;
  }
  const prioritySelect = document.getElementById("editPrioritySelect");
  if (prioritySelect) {
    prioritySelect.value = task.priority || "sedang";
    prioritySelect.disabled = false; // <-- sekarang bisa diedit admin
  }
  const assigneeSelect = document.getElementById("editAssigneeSelect");
  if (assigneeSelect) {
    assigneeSelect.value = "";
    assigneeSelect.disabled = true;
  }
  document.getElementById("editStatusSelect").value = task.status;
  document.getElementById("editTaskNotes").value = task.notes || "";
  document.getElementById("editSendNotification").checked = false;
}

async function handleDeleteTask() {
  const taskId = document.getElementById("editTaskId").value;
  if (!taskId) {
    return;
  }
  const taskToDelete = taskCache.find((task) => task._id === taskId);
  const confirmed = window.confirm(
    "Apakah Anda yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan."
  );
  if (!confirmed) {
    return;
  }
  try {
    await requestJSON(`/api/laporan/${taskId}`, { method: "DELETE" });
    showNotification("Laporan berhasil dihapus", "success");
    updateStatsAfterDeletion(taskToDelete);
    closeEditModal();
    await loadBoardData(currentSearchTerm);
    if (typeof loadStatistics === "function") {
      await loadStatistics();
    }
  } catch (error) {
    showNotification(error.message || "Gagal menghapus laporan", "error");
  }
}

function updateStatsAfterDeletion(task) {
  const statValues = document.querySelectorAll(".stats-grid .stat-value");
  if (!statValues.length) {
    return;
  }
  decrementStatValue(statValues[0]);
  if (!task) {
    return;
  }
  const indexMap = { belum: 1, sedang: 2, selesai: 3 };
  const targetIndex = indexMap[task.status];
  if (targetIndex !== undefined && statValues[targetIndex]) {
    decrementStatValue(statValues[targetIndex]);
  }
}

function decrementStatValue(element) {
  if (!element) {
    return;
  }
  const current = parseInt(element.textContent, 10) || 0;
  const next = Math.max(0, current - 1);
  element.textContent = next;
}

function buildAttachmentHTML(task) {
  if (!task.attachments || !task.attachments.length) {
    return '<p class="empty-state">Tidak ada lampiran</p>';
  }
  return task.attachments
    .map(
      (file, index) => `
        <a href="${file}" target="_blank" rel="noopener" class="attachment-item">
          <i class="fa-solid fa-file-image"></i>
          <span>Lampiran ${index + 1}</span>
        </a>
      `
    )
    .join("");
}

function buildTimelineHTML(history = []) {
  if (!history.length) {
    return '<p class="empty-state">Belum ada aktivitas</p>';
  }
  return history
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(
      (item) => `
        <div class="timeline-item">
          <div class="timeline-icon">
            <i class="fa-solid fa-circle"></i>
          </div>
          <div class="timeline-content">
            <strong>${item.action || "Aktivitas"}</strong>
            <p>${item.description || "Perubahan dilakukan"}</p>
            <span class="timeline-date">${formatDateTime(item.createdAt)}</span>
          </div>
        </div>
      `
    )
    .join("");
}

async function refreshNotificationBadge() {
  try {
    const response = await requestJSON(
      "/api/notifications/unread-count?recipientType=admin"
    );
    const badge = document.querySelector(".notification-badge");
    if (badge) {
      badge.textContent = response.data?.count || 0;
    }
  } catch (error) {
    const badge = document.querySelector(".notification-badge");
    if (badge) {
      badge.textContent = "0";
    }
  }
}

// helper text & tanggal yang dipakai di beberapa tempat di atas
function truncateText(text = "", limit) {
  if (!text) {
    return "-";
  }
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

function formatReadableDate(date) {
  if (!date) {
    return "-";
  }
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) {
    return "-";
  }
  return value.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatFullDate(date) {
  if (!date) {
    return "-";
  }
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) {
    return "-";
  }
  return value.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(date) {
  if (!date) {
    return "-";
  }
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) {
    return "-";
  }
  return value.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateInput(date) {
  if (!date) {
    return "";
  }
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) {
    return "";
  }
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${value.getFullYear()}-${month}-${day}`;
}

// === Penugasan Laporan ===

// memuat daftar petugas ke dalam select "assigneeSelect"
async function loadPetugasOptions() {
  const assigneeSelect = document.getElementById("assigneeSelect");
  if (!assigneeSelect) return;

  assigneeSelect.disabled = true;
  assigneeSelect.innerHTML =
    '<option value="">Memuat daftar petugas...</option>';

  try {
    // SESUAIKAN endpoint ini dengan route petugas di backend Anda
    const response = await requestJSON("/api/petugas");
    const petugasList = Array.isArray(response.data) ? response.data : [];

    assigneeSelect.innerHTML = '<option value="">Pilih petugas...</option>';
    petugasList.forEach((petugas) => {
      const option = document.createElement("option");
      option.value = petugas._id || petugas.id;
      option.textContent = petugas.nama || petugas.name;
      assigneeSelect.appendChild(option);
    });

    assigneeSelect.disabled = false;
  } catch (error) {
    assigneeSelect.innerHTML = '<option value="">Gagal memuat petugas</option>';
    showNotification(
      error.message || "Tidak dapat memuat daftar petugas",
      "error"
    );
  }
}

async function handleAssignSubmit(event) {
  event.preventDefault();
  const form = event.target;

  const laporanId = document.getElementById("reportSelect")?.value;
  const prioritas = document.getElementById("assignPrioritySelect")?.value;
  const petugasId = document.getElementById("assigneeSelect")?.value;
  const deadline = document.getElementById("assignDueDate")?.value || null;
  const catatan = document.getElementById("assignNotes")?.value || "";
  const sendNotification =
    document.getElementById("assignSendNotification")?.checked || false;

  if (!laporanId) {
    showNotification("Pilih laporan yang akan ditugaskan.", "error");
    return;
  }
  if (!prioritas) {
    showNotification("Pilih level prioritas tugas.", "error");
    return;
  }
  if (!petugasId) {
    showNotification("Pilih petugas yang akan ditugaskan.", "error");
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalHtml = submitBtn ? submitBtn.innerHTML : null;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin"></i> Menugaskan...';
  }

  try {
    // SESUAIKAN endpoint & payload ini dengan controller penugasan di backend Anda
    await requestJSON("/api/penugasan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        laporanId,
        prioritas,
        petugasId,
        deadline,
        catatan,
        sendNotification,
      }),
    });

    showNotification("Laporan berhasil ditugaskan ke petugas.", "success");
    closeAssignModal();
    await loadBoardData(currentSearchTerm);
  } catch (error) {
    showNotification(
      error.message || "Gagal menugaskan laporan ke petugas.",
      "error"
    );
  } finally {
    if (submitBtn && originalHtml !== null) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
    }
  }
}

// === Highlight kartu dari dropdown notifikasi ===

function highlightTaskCard(taskId) {
  const card = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
  if (!card) {
    return;
  }

  // scroll ke kartu di kolom prioritas yang sesuai
  card.scrollIntoView({ behavior: "smooth", block: "center" });

  // inject CSS animasi sekali saja
  if (!document.getElementById("task-highlight-styles")) {
    const style = document.createElement("style");
    style.id = "task-highlight-styles";
    style.textContent =
      ".task-highlight-pulse { box-shadow: 0 0 0 0 rgba(52,172,224,0.7); animation: taskPulse 1.5s ease-out 3; }" +
      "@keyframes taskPulse { 0% { box-shadow: 0 0 0 0 rgba(52,172,224,0.7); } 70% { box-shadow: 0 0 0 14px rgba(52,172,224,0); } 100% { box-shadow: 0 0 0 0 rgba(52,172,224,0); } }";
    document.head.appendChild(style);
  }

  card.classList.add("task-highlight-pulse");
  setTimeout(() => card.classList.remove("task-highlight-pulse"), 4500);
}

// optional: expose ke global supaya bisa dipanggil dari HTML/skrip lain
window.highlightTaskCard = highlightTaskCard;

function createElement(tag, className, textContent) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (typeof textContent === "string") {
    element.textContent = textContent;
  }
  return element;
}

async function requestJSON(url, options = {}) {
  const endpoint = resolveApiUrl(url);
  const headers = new Headers(options.headers || {});
  const token = localStorage.getItem("adminToken");
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const response = await fetch(endpoint, { ...options, headers });
  let data = {};
  try {
    data = await response.json();
  } catch (error) {
    data = {};
  }
  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Permintaan gagal diproses");
  }
  return data;
}

function resolveApiUrl(path) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  if (typeof API_BASE_URL !== "string" || !API_BASE_URL.length) {
    return path;
  }
  const base = API_BASE_URL.replace(/\/+$/, "");
  let normalized = path.startsWith("/") ? path : `/${path}`;
  if (base.endsWith("/api") && normalized.startsWith("/api")) {
    normalized = normalized.replace(/^\/api/, "");
    if (!normalized.startsWith("/")) {
      normalized = `/${normalized}`;
    }
  }
  return `${base}${normalized}`;
}

function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  let bgColor;
  let icon;
  if (type === "error") {
    bgColor = "#ff4757";
    icon = "exclamation-circle";
  } else if (type === "info") {
    bgColor = "#4dabf7";
    icon = "info-circle";
  } else {
    bgColor = "#51cf66";
    icon = "check-circle";
  }
  notification.style.cssText =
    "position:fixed;top:20px;right:20px;background:" +
    bgColor +
    ";color:#fff;padding:1rem 1.5rem;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:9999;display:flex;align-items:center;gap:0.75rem;animation:slideIn 0.3s ease;max-width:400px;";
  notification.innerHTML = `<i class="fa-solid fa-${icon}"></i><span>${message}</span>`;
  document.body.appendChild(notification);
  if (!document.getElementById("notification-styles")) {
    const style = document.createElement("style");
    style.id = "notification-styles";
    style.textContent =
      "@keyframes slideIn {from {transform:translateX(400px);opacity:0;} to {transform:translateX(0);opacity:1;}}" +
      "@keyframes slideOut {from {transform:translateX(0);opacity:1;} to {transform:translateX(400px);opacity:0;}}";
    document.head.appendChild(style);
  }
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}
