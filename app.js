(() => {
  "use strict";

  const STORAGE_KEY = "employeeManager.employees.v1";

  /** @type {{id:string,name:string,email:string,department:string,role:string,salary:number}[]} */
  let employees = loadEmployees();
  let editingId = null;
  let sortKey = "name";
  let sortDir = "asc";
  let searchTerm = "";

  // ---------- Persistence ----------

  function loadEmployees() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn("Failed to read employees from storage:", e);
    }
    const seed = seedData();
    saveEmployees(seed);
    return seed;
  }

  function saveEmployees(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn("Failed to save employees:", e);
    }
  }

  function seedData() {
    return [
      { id: uid(), name: "Ada Lovelace", email: "ada@company.io", department: "Engineering", role: "Principal Engineer", salary: 180000 },
      { id: uid(), name: "Grace Hopper", email: "grace@company.io", department: "Engineering", role: "VP of Engineering", salary: 220000 },
      { id: uid(), name: "Alan Turing", email: "alan@company.io", department: "Research", role: "Research Lead", salary: 175000 },
      { id: uid(), name: "Katherine Johnson", email: "katherine@company.io", department: "Data", role: "Senior Data Scientist", salary: 165000 },
      { id: uid(), name: "Linus Torvalds", email: "linus@company.io", department: "Engineering", role: "Kernel Maintainer", salary: 200000 },
      { id: uid(), name: "Margaret Hamilton", email: "margaret@company.io", department: "Engineering", role: "Director of Software", salary: 210000 },
      { id: uid(), name: "Tim Berners-Lee", email: "tim@company.io", department: "Product", role: "Founding Engineer", salary: 195000 },
      { id: uid(), name: "Hedy Lamarr", email: "hedy@company.io", department: "Engineering", role: "Wireless Systems Lead", salary: 170000 },
    ].map(e => ({ ...e, department: ensureKnownDept(e.department) }));
  }

  function ensureKnownDept(dept) {
    const known = ["Engineering", "Product", "Design", "Marketing", "Sales", "People", "Finance", "Operations"];
    return known.includes(dept) ? dept : "Engineering";
  }

  function uid() {
    return "e_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  // ---------- Rendering ----------

  const els = {
    rows: document.getElementById("employeeRows"),
    empty: document.getElementById("emptyState"),
    search: document.getElementById("search"),
    addBtn: document.getElementById("addBtn"),
    emptyAddBtn: document.getElementById("emptyAddBtn"),
    modal: document.getElementById("modal"),
    modalTitle: document.getElementById("modalTitle"),
    form: document.getElementById("employeeForm"),
    empId: document.getElementById("empId"),
    name: document.getElementById("name"),
    email: document.getElementById("email"),
    department: document.getElementById("department"),
    role: document.getElementById("role"),
    salary: document.getElementById("salary"),
    stats: document.getElementById("stats"),
    toast: document.getElementById("toast"),
    headers: document.querySelectorAll("th.sortable"),
  };

  function render() {
    const filtered = getFilteredAndSorted();
    els.rows.innerHTML = "";
    if (filtered.length === 0) {
      els.empty.hidden = false;
    } else {
      els.empty.hidden = true;
      const frag = document.createDocumentFragment();
      for (const emp of filtered) frag.appendChild(buildRow(emp));
      els.rows.appendChild(frag);
    }
    renderStats();
    renderSortIndicators();
  }

  function buildRow(emp) {
    const tr = document.createElement("tr");
    tr.dataset.id = emp.id;
    tr.innerHTML = `
      <td class="cell-name">${escapeHtml(emp.name)}<span class="sub">${escapeHtml(emp.id)}</span></td>
      <td><a href="mailto:${escapeHtml(emp.email)}">${escapeHtml(emp.email)}</a></td>
      <td><span class="dept-pill">${escapeHtml(emp.department)}</span></td>
      <td>${escapeHtml(emp.role)}</td>
      <td class="cell-salary">${formatSalary(emp.salary)}</td>
      <td class="actions-col">
        <div class="row-actions">
          <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${emp.id}">Edit</button>
          <button class="btn btn-danger btn-sm" data-action="delete" data-id="${emp.id}">Delete</button>
        </div>
      </td>
    `;
    return tr;
  }

  function getFilteredAndSorted() {
    const term = searchTerm.trim().toLowerCase();
    const filtered = term
      ? employees.filter(e =>
          e.name.toLowerCase().includes(term) ||
          e.email.toLowerCase().includes(term) ||
          e.department.toLowerCase().includes(term) ||
          e.role.toLowerCase().includes(term)
        )
      : employees.slice();

    filtered.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      let cmp;
      if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv;
      } else {
        cmp = String(av).localeCompare(String(bv), undefined, { sensitivity: "base" });
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return filtered;
  }

  function renderStats() {
    const total = employees.length;
    const depts = new Set(employees.map(e => e.department));
    els.stats.innerHTML = `<strong>${total}</strong> employee${total === 1 ? "" : "s"} · <strong>${depts.size}</strong> department${depts.size === 1 ? "" : "s"}`;
  }

  function renderSortIndicators() {
    els.headers.forEach(th => {
      th.querySelector(".sort-arrow")?.remove();
      if (th.dataset.sort === sortKey) {
        const arrow = document.createElement("span");
        arrow.className = "sort-arrow";
        arrow.textContent = sortDir === "asc" ? "▲" : "▼";
        th.appendChild(arrow);
      }
    });
  }

  function formatSalary(n) {
    if (n == null || n === "" || isNaN(n)) return "—";
    return "$" + Number(n).toLocaleString("en-US");
  }

  const ESC_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ESC_MAP[c]);
  }

  // ---------- Modal / Form ----------

  function openModal(emp) {
    editingId = emp ? emp.id : null;
    els.modalTitle.textContent = emp ? "Edit Employee" : "Add Employee";
    els.empId.value = emp ? emp.id : "";
    els.name.value = emp ? emp.name : "";
    els.email.value = emp ? emp.email : "";
    els.department.value = emp ? emp.department : "";
    els.role.value = emp ? emp.role : "";
    els.salary.value = emp && emp.salary != null ? emp.salary : "";
    clearErrors();
    els.modal.hidden = false;
    els.modal.setAttribute("aria-hidden", "false");
    setTimeout(() => els.name.focus(), 50);
  }

  function closeModal() {
    els.modal.hidden = true;
    els.modal.setAttribute("aria-hidden", "true");
    editingId = null;
    els.form.reset();
    clearErrors();
  }

  function clearErrors() {
    els.form.querySelectorAll(".error").forEach(el => el.textContent = "");
    els.form.querySelectorAll("input, select").forEach(el => el.classList.remove("invalid"));
  }

  function validate() {
    clearErrors();
    let ok = true;
    const name = els.name.value.trim();
    const email = els.email.value.trim();
    const dept = els.department.value.trim();
    const role = els.role.value.trim();
    const salaryRaw = els.salary.value.trim();

    if (!name) { showError("name", "Name is required."); ok = false; }
    if (!email) { showError("email", "Email is required."); ok = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError("email", "Enter a valid email address."); ok = false; }
    else if (employees.some(e => e.email.toLowerCase() === email.toLowerCase() && e.id !== editingId)) {
      showError("email", "An employee with this email already exists."); ok = false;
    }
    if (!dept) { showError("department", "Please select a department."); ok = false; }
    if (!role) { showError("role", "Role is required."); ok = false; }
    let salary = null;
    if (salaryRaw !== "") {
      const num = Number(salaryRaw);
      if (!Number.isFinite(num) || num < 0) {
        showError("salary", "Salary must be a non-negative number."); ok = false;
      } else {
        salary = num;
      }
    }
    return ok ? { name, email, department: dept, role, salary } : null;
  }

  function showError(field, message) {
    const input = document.getElementById(field);
    const error = document.querySelector(`[data-error-for="${field}"]`);
    if (input) input.classList.add("invalid");
    if (error) error.textContent = message;
  }

  // ---------- Actions ----------

  function handleFormSubmit(e) {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    if (editingId) {
      const idx = employees.findIndex(x => x.id === editingId);
      if (idx >= 0) {
        employees[idx] = { ...employees[idx], ...data };
        saveEmployees(employees);
        render();
        showToast("Employee updated.");
      }
    } else {
      const newEmp = { id: uid(), ...data };
      employees.unshift(newEmp);
      saveEmployees(employees);
      render();
      showToast("Employee added.");
    }
    closeModal();
  }

  function handleRowClick(e) {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    const emp = employees.find(x => x.id === id);
    if (!emp) return;
    if (btn.dataset.action === "edit") {
      openModal(emp);
    } else if (btn.dataset.action === "delete") {
      if (confirm(`Delete ${emp.name}? This cannot be undone.`)) {
        employees = employees.filter(x => x.id !== id);
        saveEmployees(employees);
        render();
        showToast("Employee deleted.");
      }
    }
  }

  function handleSort(e) {
    const th = e.target.closest("th.sortable");
    if (!th) return;
    const key = th.dataset.sort;
    if (sortKey === key) {
      sortDir = sortDir === "asc" ? "desc" : "asc";
    } else {
      sortKey = key;
      sortDir = "asc";
    }
    render();
  }

  // ---------- Toast ----------

  let toastTimer = null;
  function showToast(message) {
    els.toast.textContent = message;
    els.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { els.toast.hidden = true; }, 2200);
  }

  // ---------- Wiring ----------

  function init() {
    render();
    els.addBtn.addEventListener("click", () => openModal(null));
    els.emptyAddBtn.addEventListener("click", () => openModal(null));
    els.search.addEventListener("input", e => { searchTerm = e.target.value; render(); });
    els.rows.addEventListener("click", handleRowClick);
    els.form.addEventListener("submit", handleFormSubmit);
    els.headers.forEach(th => th.addEventListener("click", handleSort));

    // Close modal interactions
    els.modal.addEventListener("click", e => {
      if (e.target.matches("[data-close]")) closeModal();
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && !els.modal.hidden) closeModal();
      // Cmd/Ctrl+K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        els.search.focus();
        els.search.select();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
