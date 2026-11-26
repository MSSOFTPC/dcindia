// Drive Chambers India (DCI) - Multi-Role Portal Controller

(function () {
  const ROLE_LABELS = {
    admin: "Super Admin",
    dds: "DDS – Meerut District",
    dealership: "Dealership Partner",
    manager: "Dealership Manager",
    agent: "Sales Agent",
    customer: "Customer / Member"
  };

  let state = window.DCIStore.getState();
  const params = new URLSearchParams(window.location.search);
  let activeRole = params.get("role") || localStorage.getItem("dci_active_role") || "customer";
  if (!ROLE_LABELS[activeRole]) activeRole = "customer";

  const root = document.getElementById("portal-root");
  const badge = document.getElementById("portal-role-badge");
  const switcher = document.getElementById("role-switcher");

  function statusBadge(status) {
    const map = {
      Approved: "bg-emerald-100 text-emerald-800",
      Active: "bg-emerald-100 text-emerald-800",
      Success: "bg-emerald-100 text-emerald-800",
      "Pending Verification": "bg-amber-100 text-amber-800",
      "Under Review": "bg-amber-100 text-amber-800",
      "Correction Required": "bg-orange-100 text-orange-800",
      "In Progress": "bg-blue-100 text-blue-800",
      Resolved: "bg-emerald-100 text-emerald-800",
      Rejected: "bg-red-100 text-red-800",
      Suspended: "bg-red-100 text-red-800",
      Inactive: "bg-gray-200 text-gray-700"
    };
    const cls = map[status] || "bg-gray-100 text-gray-800";
    return `<span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${cls}">${status}</span>`;
  }

  function addAudit(actor, action, target, note) {
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    state.auditLogs.unshift({ ts: now, actor, action, target, note });
    window.DCIStore.saveState(state);
  }

  function kpiCard(label, value, sub = "") {
    return `
      <div class="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-wider text-[#667085]">${label}</p>
        <p class="text-2xl sm:text-3xl font-extrabold text-[#171717] mt-1">${value}</p>
        ${sub ? `<p class="text-xs text-[#294766] mt-1 font-medium">${sub}</p>` : ""}
      </div>
    `;
  }

  function openCertificateModal(m) {
    const dlg = document.getElementById("cert-dialog");
    if (!dlg) return;
    document.getElementById("cert-id").textContent = m.membershipId;
    document.getElementById("cert-name").textContent = m.customerName;
    document.getElementById("cert-vehicle").textContent = `${m.vehicleCategory} (${m.makeModel})`;
    document.getElementById("cert-reg").textContent = m.regNumber;
    document.getElementById("cert-plan").textContent = m.planName;
    document.getElementById("cert-validity").textContent = `${m.issueDate} to ${m.expiryDate}`;
    document.getElementById("cert-status").textContent = m.status.toUpperCase();
    dlg.showModal();
  }

  function exportCSV(filename, rows) {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(","), ...rows.map((r) => keys.map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }

  // ================= ROLE 1: SUPER ADMIN =================
  function renderAdmin() {
    const totalCollections = state.memberships.filter((m) => m.paymentStatus === "Success").reduce((s, m) => s + m.amountPaid, 0);
    const pendingDealers = state.dealerships.filter((d) => d.status === "Pending Verification").length;

    root.innerHTML = `
      <div class="space-y-8">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-[#294766]">Super Admin Control Center</h1>
            <p class="text-sm text-[#667085]">Full platform oversight: DDS network, dealership KYC verification, plans, ledger &amp; audit logs.</p>
          </div>
          <button id="btn-export-admin" type="button" class="px-4 py-2.5 rounded-xl bg-[#294766] text-white text-xs font-bold hover:bg-[#1D344C] cursor-pointer">
            Export Memberships CSV
          </button>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          ${kpiCard("Active DDS", state.ddsList.length, "Meerut & Ghaziabad")}
          ${kpiCard("Dealerships", state.dealerships.length, `${pendingDealers} pending verification`)}
          ${kpiCard("Active Memberships", state.memberships.length, "Server-verified")}
          ${kpiCard("Verified Collections", `₹${totalCollections.toLocaleString("en-IN")}`, "Incl. 18% GST")}
        </div>

        <!-- Dealership Verification Queue -->
        <section class="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
          <h2 class="text-lg font-extrabold text-[#171717]">Dealership Verification Queue</h2>
          <div tabindex="0" role="region" aria-label="Dealership verification queue" class="table-wrapper">
            <table class="dci-table">
              <thead>
                <tr>
                  <th>App ID / Dealership</th>
                  <th>OEM &amp; Category</th>
                  <th>District</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${state.dealerships.map((d) => `
                  <tr>
                    <th>${d.name}<br><span class="text-xs font-normal text-[#667085]">${d.appId} &bull; ${d.id}</span></th>
                    <td data-label="OEM">${d.oem} (${d.category})</td>
                    <td data-label="District">${d.district}, ${d.state}</td>
                    <td data-label="Status">${statusBadge(d.status)}</td>
                    <td data-label="Remarks" class="text-xs text-[#667085]">${d.reason}</td>
                    <td data-label="Action">
                      <button type="button" data-verify-id="${d.id}" class="btn-verify-dealer px-3 py-1.5 rounded-lg bg-[#C89B35] text-[#171717] text-xs font-bold hover:bg-[#DFB858] cursor-pointer">Review</button>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </section>

        <!-- Create DDS + Case Oversight -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section class="lg:col-span-5 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h2 class="text-lg font-extrabold text-[#171717]">Create DDS &amp; Assign District</h2>
            <form id="admin-create-dds" class="space-y-3">
              <input type="text" name="name" required placeholder="Full Name" class="dci-input">
              <div class="grid grid-cols-2 gap-3">
                <input type="tel" name="mobile" required pattern="[6-9][0-9]{9}" placeholder="10-digit Mobile" class="dci-input">
                <input type="text" name="district" required placeholder="Assigned District" class="dci-input">
              </div>
              <input type="email" name="email" required placeholder="Official Email" class="dci-input">
              <button type="submit" class="w-full py-2.5 rounded-xl bg-[#294766] text-white font-bold text-sm hover:bg-[#1D344C] cursor-pointer">Create DDS Account</button>
            </form>
          </section>

          <section class="lg:col-span-7 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h2 class="text-lg font-extrabold text-[#171717]">Case Management Oversight</h2>
            <div class="space-y-3">
              ${state.cases.map((c) => `
                <div class="p-4 rounded-xl bg-[#F3F5F7] border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p class="font-bold text-sm text-[#294766]">${c.caseId} &bull; ${c.module}</p>
                    <p class="text-xs text-[#667085]">${c.customerName} (${c.membershipId}) &mdash; ${c.summary}</p>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <select data-case-status="${c.caseId}" class="case-status-select rounded-lg border border-gray-300 bg-white text-xs font-semibold px-2.5 py-1.5">
                      ${["Submitted", "Under Review", "Documents Required", "Assigned", "In Progress", "Resolved"].map((s) => `<option value="${s}" ${c.status === s ? "selected" : ""}>${s}</option>`).join("")}
                    </select>
                  </div>
                </div>
              `).join("")}
            </div>
          </section>
        </div>

        <!-- Audit Logs -->
        <section class="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-3">
          <h2 class="text-lg font-extrabold text-[#171717]">Immutable Audit Trail</h2>
          <div class="space-y-2 max-h-60 overflow-auto">
            ${state.auditLogs.map((a) => `
              <div class="text-xs p-3 rounded-lg bg-[#F3F5F7] flex flex-wrap justify-between gap-2">
                <span><strong class="text-[#294766]">${a.actor}</strong> &rarr; ${a.action} (<code>${a.target}</code>): ${a.note}</span>
                <span class="text-[#667085]">${a.ts}</span>
              </div>
            `).join("")}
          </div>
        </section>
      </div>
    `;

    document.getElementById("btn-export-admin")?.addEventListener("click", () => {
      exportCSV("dci-memberships.csv", state.memberships);
    });

    document.querySelectorAll(".btn-verify-dealer").forEach((btn) => {
      btn.addEventListener("click", () => {
        const d = state.dealerships.find((x) => x.id === btn.dataset.verifyId);
        if (!d) return;
        document.getElementById("verify-dealer-id").value = d.id;
        document.getElementById("verify-dealer-summary").textContent = `${d.name} (${d.appId}) — ${d.oem}, ${d.district}`;
        document.getElementById("verify-action").value = d.status === "Pending Verification" ? "Approved" : d.status;
        document.getElementById("verify-reason").value = "";
        document.getElementById("verify-dialog").showModal();
      });
    });

    document.getElementById("admin-create-dds")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const id = `DDS-00${state.ddsList.length + 1}`;
      state.ddsList.push({
        id,
        name: fd.get("name"),
        mobile: fd.get("mobile"),
        email: fd.get("email"),
        district: fd.get("district"),
        state: "Uttar Pradesh",
        status: "Approved",
        joiningDate: new Date().toISOString().slice(0, 10)
      });
      addAudit("Super Admin", "Created DDS", id, `Assigned district ${fd.get("district")}`);
      render();
    });

    document.querySelectorAll(".case-status-select").forEach((sel) => {
      sel.addEventListener("change", () => {
        const c = state.cases.find((x) => x.caseId === sel.dataset.caseStatus);
        if (!c) return;
        c.status = sel.value;
        if (!c.timeline.includes(sel.value)) c.timeline.push(sel.value);
        addAudit("Super Admin", "Updated Case Status", c.caseId, `Moved to ${sel.value}`);
        render();
      });
    });
  }

  // ================= ROLE 2: DDS (MEERUT) =================
  function renderDDS() {
    const myDealerships = state.dealerships.filter((d) => d.ddsId === "DDS-001");
    const myMemberships = state.memberships.filter((m) => m.ddsId === "DDS-001");

    root.innerHTML = `
      <div class="space-y-8">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-[#294766]">DDS Dashboard &mdash; Meerut Territory</h1>
          <p class="text-sm text-[#667085]">Territory-isolated view: you can only register and view dealerships mapped to Meerut district.</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          ${kpiCard("Assigned District", "Meerut, UP", "DDS-001")}
          ${kpiCard("My Dealerships", myDealerships.length, `${myDealerships.filter((d) => d.status === "Approved").length} Approved`)}
          ${kpiCard("Territory Memberships", myMemberships.length, "Active policies")}
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section class="lg:col-span-5 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h2 class="text-lg font-extrabold text-[#171717]">Register New Dealership (Meerut)</h2>
            <form id="dds-reg-dealer" class="space-y-3">
              <input type="text" name="name" required placeholder="Dealership Legal / Trade Name" class="dci-input">
              <div class="grid grid-cols-2 gap-3">
                <input type="text" name="oem" required placeholder="Brand / OEM" class="dci-input">
                <select name="category" required class="dci-select">
                  <option value="Two Wheeler">Two Wheeler</option>
                  <option value="Four Wheeler">Four Wheeler</option>
                  <option value="Multi-Brand">Multi-Brand</option>
                </select>
              </div>
              <input type="text" name="gstin" placeholder="GSTIN (Optional)" class="dci-input">
              <div class="grid grid-cols-2 gap-3">
                <input type="text" name="contactPerson" required placeholder="Contact Person" class="dci-input">
                <input type="tel" name="mobile" required pattern="[6-9][0-9]{9}" placeholder="Mobile" class="dci-input">
              </div>
              <button type="submit" class="w-full py-2.5 rounded-xl bg-[#C89B35] text-[#171717] font-bold text-sm hover:bg-[#DFB858] cursor-pointer">
                Submit for Admin Verification
              </button>
            </form>
          </section>

          <section class="lg:col-span-7 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h2 class="text-lg font-extrabold text-[#171717]">Meerut Dealership Applications</h2>
            <div tabindex="0" role="region" aria-label="Meerut dealerships" class="table-wrapper">
              <table class="dci-table">
                <thead>
                  <tr>
                    <th>Dealership</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Admin Note</th>
                  </tr>
                </thead>
                <tbody>
                  ${myDealerships.map((d) => `
                    <tr>
                      <th>${d.name}<br><span class="text-xs font-normal text-[#667085]">${d.appId}</span></th>
                      <td data-label="Category">${d.oem} (${d.category})</td>
                      <td data-label="Status">${statusBadge(d.status)}</td>
                      <td data-label="Note" class="text-xs text-[#667085]">${d.reason}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    `;

    document.getElementById("dds-reg-dealer")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const id = `DLR-MRT-${103 + state.dealerships.length}`;
      const appId = `APP-2026-${920 + state.dealerships.length}`;
      state.dealerships.push({
        id,
        appId,
        name: fd.get("name"),
        oem: fd.get("oem"),
        category: fd.get("category"),
        gstin: fd.get("gstin") || "N/A",
        district: "Meerut",
        state: "Uttar Pradesh",
        contactPerson: fd.get("contactPerson"),
        mobile: fd.get("mobile"),
        ddsId: "DDS-001",
        status: "Pending Verification",
        reason: "Submitted by DDS-001; awaiting Super Admin review."
      });
      addAudit("DDS-001 (Meerut)", "Registered Dealership", appId, fd.get("name"));
      render();
    });
  }

  // ================= ROLE 3: DEALERSHIP =================
  function renderDealership() {
    const dealer = state.dealerships[0];
    const agents = state.agents.filter((a) => a.dealershipId === dealer.id);
    const sales = state.memberships.filter((m) => m.dealershipId === dealer.id);

    root.innerHTML = `
      <div class="space-y-8">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-[#294766]">${dealer.name}</h1>
            <p class="text-sm text-[#667085]">Dealership Code: <strong>${dealer.id}</strong> &bull; ${dealer.oem} (${dealer.district})</p>
          </div>
          ${statusBadge(dealer.status)}
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          ${kpiCard("Active Agents", agents.filter((a) => a.status === "Active").length, "Assigned by Manager")}
          ${kpiCard("Total Enrolments", sales.length, "Verified memberships")}
          ${kpiCard("Gross Collection", `₹${sales.reduce((s, m) => s + m.amountPaid, 0).toLocaleString("en-IN")}`, "Incl. GST")}
        </div>

        <section class="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
          <h2 class="text-lg font-extrabold text-[#171717]">Dealership Agent Roster &amp; Approved Materials</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${agents.map((a) => `
              <div class="p-4 rounded-xl bg-[#F3F5F7] border border-gray-200 flex justify-between items-center">
                <div>
                  <p class="font-bold text-sm">${a.name} (${a.empCode})</p>
                  <p class="text-xs text-[#667085]">Mobile: ${a.mobile}</p>
                </div>
                ${statusBadge(a.status)}
              </div>
            `).join("")}
          </div>
          <div class="p-4 rounded-xl bg-[#FAF3E0] border border-[#C89B35]/40 text-xs text-[#171717]">
            <strong>Compliance Reminder:</strong> Customer enrolment is strictly optional. Do not condition vehicle delivery on DCI membership purchase.
          </div>
        </section>
      </div>
    `;
  }

  // ================= ROLE 4: DEALERSHIP MANAGER =================
  function renderManager() {
    const dealerId = "DLR-MRT-101";
    const agents = state.agents.filter((a) => a.dealershipId === dealerId);
    const sales = state.memberships.filter((m) => m.dealershipId === dealerId);

    root.innerHTML = `
      <div class="space-y-8">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-[#294766]">Dealership Manager Dashboard</h1>
          <p class="text-sm text-[#667085]">Ganga Motors Pvt Ltd (${dealerId}) &mdash; Manage Sales Agents &amp; view dealership sales.</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section class="lg:col-span-5 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h2 class="text-lg font-extrabold text-[#171717]">Add / Invite Sales Agent</h2>
            <form id="mgr-add-agent" class="space-y-3">
              <input type="text" name="name" required placeholder="Agent Full Name" class="dci-input">
              <div class="grid grid-cols-2 gap-3">
                <input type="tel" name="mobile" required pattern="[6-9][0-9]{9}" placeholder="Mobile" class="dci-input">
                <input type="text" name="empCode" required placeholder="Employee Code" class="dci-input">
              </div>
              <button type="submit" class="w-full py-2.5 rounded-xl bg-[#294766] text-white font-bold text-sm hover:bg-[#1D344C] cursor-pointer">
                Invite &amp; Activate Agent
              </button>
            </form>
          </section>

          <section class="lg:col-span-7 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h2 class="text-lg font-extrabold text-[#171717]">Sales Agent Roster</h2>
            <div tabindex="0" role="region" aria-label="Sales agent roster" class="table-wrapper">
              <table class="dci-table">
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Emp Code</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${agents.map((a) => `
                    <tr>
                      <th>${a.name}<br><span class="text-xs font-normal text-[#667085]">${a.mobile}</span></th>
                      <td data-label="Code">${a.empCode}</td>
                      <td data-label="Status">${statusBadge(a.status)}</td>
                      <td data-label="Action">
                        <button type="button" data-toggle-agent="${a.id}" class="btn-toggle-agent px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-bold cursor-pointer">
                          ${a.status === "Active" ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section class="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-3">
          <h2 class="text-lg font-extrabold text-[#171717]">Dealership Customer Enrolments (${sales.length})</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${sales.map((m) => `
              <div class="p-4 rounded-xl bg-[#F3F5F7] border border-gray-200 text-sm">
                <p class="font-bold text-[#294766]">${m.customerName} &bull; ${m.membershipId}</p>
                <p class="text-xs text-[#667085]">${m.planName} &bull; ${m.maskedReg} &bull; ₹${m.amountPaid}</p>
              </div>
            `).join("")}
          </div>
        </section>
      </div>
    `;

    document.getElementById("mgr-add-agent")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const id = `AGT-${103 + state.agents.length}`;
      state.agents.push({
        id,
        dealershipId: dealerId,
        name: fd.get("name"),
        mobile: fd.get("mobile"),
        empCode: fd.get("empCode"),
        status: "Active",
        joiningDate: new Date().toISOString().slice(0, 10)
      });
      addAudit("Dealership Manager", "Added Sales Agent", id, fd.get("name"));
      render();
    });

    document.querySelectorAll(".btn-toggle-agent").forEach((btn) => {
      btn.addEventListener("click", () => {
        const a = state.agents.find((x) => x.id === btn.dataset.toggleAgent);
        if (!a) return;
        a.status = a.status === "Active" ? "Inactive" : "Active";
        addAudit("Dealership Manager", "Toggled Agent Status", a.id, `Set to ${a.status}`);
        render();
      });
    });
  }

  // ================= ROLE 5: SALES AGENT =================
  function renderAgent() {
    const agentId = "AGT-101";
    const mySales = state.memberships.filter((m) => m.agentId === agentId);

    root.innerHTML = `
      <div class="space-y-8">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-[#294766]">Sales Agent Dashboard &mdash; Rohit Malik (${agentId})</h1>
          <p class="text-sm text-[#667085]">Register customers, capture explicit consent (never pre-ticked), and activate memberships after payment verification.</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section class="lg:col-span-6 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h2 class="text-lg font-extrabold text-[#171717]">New Customer Enrolment &amp; Plan Sale</h2>
            <form id="agent-sell-form" class="space-y-3">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" name="customerName" required placeholder="Customer Full Name" class="dci-input">
                <input type="tel" name="mobile" required pattern="[6-9][0-9]{9}" placeholder="10-digit Mobile" class="dci-input">
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select name="planId" required class="dci-select">
                  <option value="PLAN-2W">Two Wheeler (₹1,000 + 18% GST = ₹1,180)</option>
                  <option value="PLAN-4W">Four Wheeler (₹3,500 + 18% GST = ₹4,130)</option>
                </select>
                <input type="text" name="regNumber" required placeholder="Vehicle Reg (e.g. UP-15-AB-1234)" class="dci-input">
              </div>
              <input type="text" name="makeModel" required placeholder="Vehicle Make &amp; Model (e.g. Hyundai Creta)" class="dci-input">

              <!-- Explicit non-pre-ticked consent -->
              <label class="flex items-start gap-2.5 p-3 rounded-xl bg-[#F3F5F7] border border-gray-200 text-xs text-[#171717] cursor-pointer">
                <input type="checkbox" name="consent" required class="mt-0.5 accent-[#C89B35]">
                <span>Customer has reviewed plan price, GST, inclusions, exclusions, refund policy, and voluntarily consents to purchase (no forced bundling).</span>
              </label>

              <button type="submit" class="w-full py-3 rounded-xl bg-[#C89B35] text-[#171717] font-bold text-sm hover:bg-[#DFB858] cursor-pointer">
                Verify Payment &amp; Activate Membership
              </button>
            </form>
          </section>

          <section class="lg:col-span-6 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h2 class="text-lg font-extrabold text-[#171717]">My Attributed Sales (${mySales.length})</h2>
            <p class="text-xs text-[#667085]">You only see customers attributed to your Agent ID (${agentId}).</p>
            <div class="space-y-3">
              ${mySales.map((m) => `
                <div class="p-4 rounded-xl bg-[#F3F5F7] border border-gray-200 flex justify-between items-center gap-3">
                  <div>
                    <p class="font-bold text-sm text-[#294766]">${m.customerName}</p>
                    <p class="text-xs text-[#667085]">${m.membershipId} &bull; ${m.planName} &bull; ₹${m.amountPaid}</p>
                  </div>
                  ${statusBadge(m.status)}
                </div>
              `).join("")}
            </div>
          </section>
        </div>
      </div>
    `;

    document.getElementById("agent-sell-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const is2W = fd.get("planId") === "PLAN-2W";
      const reg = String(fd.get("regNumber")).toUpperCase();
      const masked = reg.replace(/^([A-Z]{2}-\d{2}-)[A-Z]{1,3}(-\d{4})$/, "$1XX$2");
      const membershipId = `DCI-MRT-2026-${Math.floor(1000 + Math.random() * 9000)}X`;
      const today = new Date();
      const nextYear = new Date(today);
      nextYear.setFullYear(today.getFullYear() + 1);

      state.memberships.unshift({
        membershipId,
        customerName: fd.get("customerName"),
        mobile: fd.get("mobile"),
        email: "",
        vehicleCategory: is2W ? "Two Wheeler" : "Four Wheeler",
        regNumber: reg,
        maskedReg: masked,
        makeModel: fd.get("makeModel"),
        planId: fd.get("planId"),
        planName: is2W ? "Two Wheeler Shield" : "Four Wheeler Shield",
        amountPaid: is2W ? 1180 : 4130,
        paymentStatus: "Success",
        status: "Active",
        issueDate: today.toISOString().slice(0, 10),
        expiryDate: nextYear.toISOString().slice(0, 10),
        dealershipId: "DLR-MRT-101",
        agentId,
        ddsId: "DDS-001",
        consentRecorded: true
      });
      addAudit(`Sales Agent (${agentId})`, "Membership Activated", membershipId, `Gateway verified for ${fd.get("customerName")}`);
      render();
    });
  }

  // ================= ROLE 6: CUSTOMER / MEMBER =================
  function renderCustomer() {
    const member = state.memberships[0];
    const myCases = state.cases.filter((c) => c.membershipId === member.membershipId);

    root.innerHTML = `
      <div class="space-y-8">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-[#294766]">Welcome, ${member.customerName}</h1>
            <p class="text-sm text-[#667085]">Manage your vehicle membership, download your certificate, and track assistance cases.</p>
          </div>
          <button id="btn-view-cert" type="button" class="px-5 py-2.5 rounded-xl bg-[#C89B35] text-[#171717] font-bold text-sm hover:bg-[#DFB858] cursor-pointer">
            View / Download Certificate (PDF)
          </button>
        </div>

        <!-- Digital Membership Card + Quick Stats -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div class="lg:col-span-5 rounded-2xl bg-white text-[#171717] p-6 border-2 border-[#C89B35]/60 shadow-lg space-y-4 relative overflow-hidden">
            <div class="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#294766] via-[#C89B35] to-[#294766]"></div>
            <div class="flex justify-between items-center border-b border-gray-100 pb-3 pt-1">
              <span class="font-serif text-lg font-bold text-[#294766]">DCI MEMBER CARD</span>
              ${statusBadge(member.status)}
            </div>
            <div class="p-3 rounded-xl bg-[#F3F5F7] border border-gray-200">
              <p class="text-[11px] uppercase text-[#667085] font-semibold">Unique Membership ID</p>
              <p class="font-mono text-lg font-extrabold text-[#294766]">${member.membershipId}</p>
            </div>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p class="text-[11px] uppercase text-[#667085]">Vehicle</p>
                <p class="font-bold text-[#171717]">${member.makeModel}</p>
              </div>
              <div>
                <p class="text-[11px] uppercase text-[#667085]">Masked Reg.</p>
                <p class="font-bold text-[#171717]">${member.maskedReg}</p>
              </div>
              <div>
                <p class="text-[11px] uppercase text-[#667085]">Plan</p>
                <p class="font-bold text-[#171717]">${member.planName}</p>
              </div>
              <div>
                <p class="text-[11px] uppercase text-[#667085]">Valid Till</p>
                <p class="font-bold text-[#171717]">${member.expiryDate}</p>
              </div>
            </div>
          </div>

          <!-- Raise a Support Request -->
          <div class="lg:col-span-7 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h2 class="text-lg font-extrabold text-[#171717]">Raise a Support Case</h2>
            <form id="cust-case-form" class="space-y-3">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select name="module" required class="dci-select">
                  <option value="Traffic Challan Assistance">Traffic Challan Assistance</option>
                  <option value="Motor Insurance Claim Assistance">Motor Insurance Claim Assistance</option>
                  <option value="Professional Legal Assistance">Professional Legal Assistance</option>
                  <option value="Road Accident Guidance">Road Accident Guidance (Non-Emergency)</option>
                </select>
                <select name="urgency" required class="dci-select">
                  <option value="Normal">Normal Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>
              <textarea name="summary" rows="2" required placeholder="Describe your challan, insurance claim, or legal query..." class="dci-textarea"></textarea>
              <button type="submit" class="px-5 py-2.5 rounded-xl bg-[#294766] text-white font-bold text-sm hover:bg-[#1D344C] cursor-pointer">
                Submit Case Request
              </button>
            </form>
          </div>
        </div>

        <!-- Case Timeline Tracker -->
        <section class="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
          <h2 class="text-lg font-extrabold text-[#171717]">My Support Cases &amp; Timeline (${myCases.length})</h2>
          <div class="space-y-4">
            ${myCases.map((c) => `
              <div class="p-5 rounded-xl bg-[#F3F5F7] border border-gray-200 space-y-3">
                <div class="flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <p class="font-bold text-[#294766]">${c.caseId} &bull; ${c.module}</p>
                    <p class="text-xs text-[#667085]">${c.summary}</p>
                  </div>
                  ${statusBadge(c.status)}
                </div>
                <div class="flex flex-wrap items-center gap-2 text-xs">
                  ${["Submitted", "Under Review", "Documents Required", "Assigned", "In Progress", "Resolved"].map((step) => {
                    const done = c.timeline.includes(step);
                    return `<span class="px-2.5 py-1 rounded-md font-semibold ${done ? "bg-[#294766] text-white" : "bg-white text-[#667085] border border-gray-200"}">${step}</span>`;
                  }).join(" &rarr; ")}
                </div>
              </div>
            `).join("")}
          </div>
        </section>
      </div>
    `;

    document.getElementById("btn-view-cert")?.addEventListener("click", () => openCertificateModal(member));

    document.getElementById("cust-case-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const caseId = `CASE-2026-${460 + state.cases.length}`;
      state.cases.unshift({
        caseId,
        membershipId: member.membershipId,
        customerName: member.customerName,
        module: fd.get("module"),
        summary: fd.get("summary"),
        urgency: fd.get("urgency"),
        status: "Submitted",
        assignedTeam: "Triage Desk",
        createdAt: new Date().toISOString().slice(0, 10),
        timeline: ["Submitted"]
      });
      addAudit(member.customerName, "Raised Support Case", caseId, fd.get("module"));
      render();
    });
  }

  function render() {
    localStorage.setItem("dci_active_role", activeRole);
    badge.textContent = ROLE_LABELS[activeRole];
    switcher.value = activeRole;

    if (activeRole === "admin") renderAdmin();
    else if (activeRole === "dds") renderDDS();
    else if (activeRole === "dealership") renderDealership();
    else if (activeRole === "manager") renderManager();
    else if (activeRole === "agent") renderAgent();
    else renderCustomer();
  }

  // Global Portal Listeners
  switcher?.addEventListener("change", () => {
    activeRole = switcher.value;
    render();
  });

  document.getElementById("btn-reset-demo")?.addEventListener("click", () => {
    state = window.DCIStore.resetState();
    render();
  });

  document.getElementById("verify-close-btn")?.addEventListener("click", () => {
    document.getElementById("verify-dialog")?.close();
  });

  document.getElementById("verify-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("verify-dealer-id").value;
    const action = document.getElementById("verify-action").value;
    const reason = document.getElementById("verify-reason").value;
    const d = state.dealerships.find((x) => x.id === id);
    if (d) {
      d.status = action;
      d.reason = reason;
      addAudit("Super Admin", `Dealership ${action}`, d.id, reason);
    }
    document.getElementById("verify-dialog")?.close();
    render();
  });

  render();
})();
