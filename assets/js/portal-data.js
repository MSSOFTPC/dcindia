// Drive Chambers India (DCI) - Portal Seed Data & LocalStorage State Store

(function () {
  const STORAGE_KEY = "dci_portal_state_v1";

  const DEFAULT_STATE = {
    ddsList: [
      {
        id: "DDS-001",
        name: "Rajeshwar Sharma",
        mobile: "9837011223",
        email: "rajeshwar.dds@drivechambers.in",
        district: "Meerut",
        state: "Uttar Pradesh",
        status: "Approved",
        joiningDate: "2026-10-15"
      },
      {
        id: "DDS-002",
        name: "Ankit Verma",
        mobile: "9897122334",
        email: "ankit.dds@drivechambers.in",
        district: "Ghaziabad",
        state: "Uttar Pradesh",
        status: "Approved",
        joiningDate: "2026-11-01"
      }
    ],
    dealerships: [
      {
        id: "DLR-MRT-101",
        appId: "APP-2026-901",
        name: "Ganga Motors Pvt Ltd",
        oem: "Maruti Suzuki",
        category: "Four Wheeler",
        gstin: "09AABCG1234F1Z5",
        district: "Meerut",
        state: "Uttar Pradesh",
        contactPerson: "Sandeep Agarwal",
        mobile: "9837099881",
        ddsId: "DDS-001",
        status: "Approved",
        reason: "All KYC & OEM authorization documents verified."
      },
      {
        id: "DLR-MRT-102",
        appId: "APP-2026-908",
        name: "Krantidhara Two Wheelers",
        oem: "Honda 2Wheelers",
        category: "Two Wheeler",
        gstin: "09AABCK5678M1Z2",
        district: "Meerut",
        state: "Uttar Pradesh",
        contactPerson: "Prashant Tyagi",
        mobile: "9837044556",
        ddsId: "DDS-001",
        status: "Pending Verification",
        reason: "Awaiting Super Admin document check."
      },
      {
        id: "DLR-GZB-201",
        appId: "APP-2026-912",
        name: "Hindon Auto Hub",
        oem: "Multi-Brand",
        category: "Multi-Brand",
        gstin: "09AABCH9012L1Z8",
        district: "Ghaziabad",
        state: "Uttar Pradesh",
        contactPerson: "Vikas Chaudhary",
        mobile: "9897088776",
        ddsId: "DDS-002",
        status: "Correction Required",
        reason: "Upload clearer copy of authorised signatory PAN."
      }
    ],
    agents: [
      {
        id: "AGT-101",
        dealershipId: "DLR-MRT-101",
        name: "Rohit Malik",
        mobile: "9758011223",
        empCode: "GM-SA-01",
        status: "Active",
        joiningDate: "2026-10-20"
      },
      {
        id: "AGT-102",
        dealershipId: "DLR-MRT-101",
        name: "Neha Chauhan",
        mobile: "9758033445",
        empCode: "GM-SA-02",
        status: "Active",
        joiningDate: "2026-10-25"
      }
    ],
    plans: [
      { id: "PLAN-2W", name: "Two Wheeler Shield", category: "Two Wheeler", basePrice: 1000, gstPercent: 18, validityMonths: 12, version: "v1.0" },
      { id: "PLAN-4W", name: "Four Wheeler Shield", category: "Four Wheeler", basePrice: 3500, gstPercent: 18, validityMonths: 12, version: "v1.0" }
    ],
    memberships: [
      {
        membershipId: "DCI-MRT-2026-8492A",
        customerName: "Arjun Singhania",
        mobile: "9810112233",
        email: "arjun.s@example.in",
        vehicleCategory: "Four Wheeler",
        regNumber: "UP-15-DQ-4821",
        maskedReg: "UP-15-XX-4821",
        makeModel: "Maruti Suzuki Grand Vitara",
        planId: "PLAN-4W",
        planName: "Four Wheeler Shield",
        amountPaid: 4130,
        paymentStatus: "Success",
        status: "Active",
        issueDate: "2026-11-05",
        expiryDate: "2027-11-04",
        dealershipId: "DLR-MRT-101",
        agentId: "AGT-101",
        ddsId: "DDS-001",
        consentRecorded: true
      },
      {
        membershipId: "DCI-MRT-2026-3107B",
        customerName: "Priya Tomar",
        mobile: "9810998877",
        email: "priya.t@example.in",
        vehicleCategory: "Two Wheeler",
        regNumber: "UP-15-CL-1904",
        maskedReg: "UP-15-XX-1904",
        makeModel: "Honda Activa 6G",
        planId: "PLAN-2W",
        planName: "Two Wheeler Shield",
        amountPaid: 1180,
        paymentStatus: "Success",
        status: "Active",
        issueDate: "2026-11-12",
        expiryDate: "2027-11-11",
        dealershipId: "DLR-MRT-101",
        agentId: "AGT-102",
        ddsId: "DDS-001",
        consentRecorded: true
      }
    ],
    cases: [
      {
        caseId: "CASE-2026-441",
        membershipId: "DCI-MRT-2026-8492A",
        customerName: "Arjun Singhania",
        module: "Traffic Challan Assistance",
        summary: "Wrongly issued red-light camera e-challan at Begum Bridge, Meerut.",
        urgency: "Normal",
        status: "In Progress",
        assignedTeam: "Challan Legal Desk",
        createdAt: "2026-11-18",
        timeline: ["Submitted", "Under Review", "Assigned", "In Progress"]
      },
      {
        caseId: "CASE-2026-459",
        membershipId: "DCI-MRT-2026-3107B",
        customerName: "Priya Tomar",
        module: "Motor Insurance Claim Assistance",
        summary: "Partial deduction query on bumper repair claim #CLM-99210.",
        urgency: "High",
        status: "Under Review",
        assignedTeam: "Insurance Grievance Team",
        createdAt: "2026-11-22",
        timeline: ["Submitted", "Under Review"]
      }
    ],
    auditLogs: [
      { ts: "2026-11-25 10:15", actor: "Super Admin", action: "Verified Dealership", target: "DLR-MRT-101", note: "Approved Ganga Motors Pvt Ltd" },
      { ts: "2026-11-25 11:30", actor: "Sales Agent (AGT-101)", action: "Membership Activated", target: "DCI-MRT-2026-8492A", note: "Gateway webhook verified ₹4,130" }
    ]
  };

  function getState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_STATE);
      return JSON.parse(raw);
    } catch (_) {
      return structuredClone(DEFAULT_STATE);
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function resetState() {
    const fresh = structuredClone(DEFAULT_STATE);
    saveState(fresh);
    return fresh;
  }

  window.DCIStore = { getState, saveState, resetState };
})();
