// app/dashboard/components/PanelRenderer.tsx
"use client";

import { useDashboard } from "./DashboardContext";
import { motion } from "framer-motion";

// ─── Admin panel imports (create these as needed) ───────────────
// import DashboardPanel from "./panels/DashboardPanel";           // Reusable or admin-specific
// import AnalyticsPanel from "./panels/AnalyticsPanel";           // Reuse or create admin version
// import CentersPanel from "./panels/admin/CentersPanel";        // New: manage all centers
// import UsersPanel from "./panels/admin/UsersPanel";            // New: manage all users
// import DozaNetworkPanel from "./panels/DozaNetworkPanel";      // Possibly reusable
// import SubscriptionsPanel from "./panels/admin/SubscriptionsPanel";
// import AuditLogsPanel from "./panels/AuditLogsPanell";         // Reuse
// import ApprovalsPanel from "./panels/admin/ApprovalsPanel";
// import SettingsPanel from "./panels/SettingsPanel";            // Reuse
import ReferralCodesPanel from "./panels/ReferralCodesPanel";
import DozaMedicsPanel from "./panels/DozaMedicsPanel";
import DozaCentersPanel from "./panels/DozaCenters";
import VerificationPanel from "./panels/VerificationPanel";
import AuditLogsPanel from "./panels/AuditLogPanel";
import DozaUsersPanel from "./panels/DozaUserPanel";
import AnalyticsPanel from "./panels/AnalyticsPanel";
import SubscriptionPanel from "./panels/SubscriptionPanel";
// import SystemHealthPanel from "./panels/admin/SystemHealthPanel";
// import APIManagementPanel from "./panels/admin/APIManagementPanel";
// import LogsPanel from "./panels/admin/LogsPanel";
// import SecurityPanel from "./panels/admin/SecurityPanel";
// import MedicalAnalyticsPanel from "./panels/admin/MedicalAnalyticsPanel";
// import PatientsPanel from "./panels/PatientsPanel";            // Reuse or admin version
// import MedicalRecordsPanel from "./panels/MedicalRecords";     // Reuse
// import PrescriptionsPanel from "./panels/PrescriptionsPanel";  // Reuse
// import ClinicalDecisionSupportPanel from "./panels/admin/ClinicalDecisionSupportPanel";
// import RequisitionsPanel from "./panels/hospital_panels/HospitalRequisitionPanel"; // Reuse
// import NursingAnalyticsPanel from "./panels/admin/NursingAnalyticsPanel";
// import VitalsMonitoringPanel from "./panels/admin/VitalsMonitoringPanel";
// import TaskManagementPanel from "./panels/admin/TaskManagementPanel";
// import HospitalAnalyticsPanel from "./panels/admin/HospitalAnalyticsPanel";
// import HospitalsPanel from "./panels/admin/HospitalsPanel";
// import BedOccupancyPanel from "./panels/admin/BedOccupancyPanel";
// import StaffPanel from "./panels/StaffPanel";                 // Reuse or admin version
// import ClinicAnalyticsPanel from "./panels/admin/ClinicAnalyticsPanel";
// import ClinicsPanel from "./panels/admin/ClinicsPanel";
// import AppointmentsPanel from "./panels/AppointmentsPanel";   // Reuse
// import OperationsAnalyticsPanel from "./panels/admin/OperationsAnalyticsPanel";
// import ResourceAllocationPanel from "./panels/admin/ResourceAllocationPanel";
// import StaffSchedulingPanel from "./panels/admin/StaffSchedulingPanel";
// import InventoryPanel from "./panels/InventoryPanel";         // Reuse
// import BillingPanel from "./panels/BillingPanel";             // Reuse
// import FinancialReportsPanel from "./panels/admin/FinancialReportsPanel";

// ─── Fallback for missing panels ───────────────────────────────
const NotFoundPanel = () => (
  <div className="flex items-center justify-center h-full p-12">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-slate-700">Panel Not Found</h2>
      <p className="text-slate-500 mt-2">The requested panel does not exist.</p>
    </div>
  </div>
);

export default function PanelRenderer() {
  const { activePanel, user } = useDashboard();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading panel...</p>
        </div>
      </div>
    );
  }

  const renderPanel = () => {
    switch (activePanel) {
      // ─── CEO & common panels ──────────────────────────────────
      //   case "dashboard":
      //     return <DashboardPanel />;
      case "analytics":
        return <AnalyticsPanel />;
      //   case "centers":
      //     return <CentersPanel />;
      //   case "users":
      //     return <UsersPanel />;
      //   case "dozaNetwork":
      //     return <DozaNetworkPanel />;
      case "subscriptions":
        return <SubscriptionPanel />;
      case "referrals":
        return <ReferralCodesPanel />;
      case "dozaMedics":
        return <DozaMedicsPanel />;
      case "dozaCenters":
        return <DozaCentersPanel />;
      case "verification":
        return <VerificationPanel />;
      case "auditlogs":
        return <AuditLogsPanel />;
      case "users":
        return <DozaUsersPanel />;
      //   case "approvals":
      //     return <ApprovalsPanel />;
      //   case "settings":
      //     return <SettingsPanel />;

      // ─── CTO / Super Admin ────────────────────────────────────
      //   case "health":
      //     return <SystemHealthPanel />;
      //   case "api":
      //     return <APIManagementPanel />;
      //   case "logs":
      //     return <LogsPanel />;
      //   case "security":
      //     return <SecurityPanel />;

      //   // ─── Head Doctor ──────────────────────────────────────────
      //   case "medical-analytics":
      //     return <MedicalAnalyticsPanel />;
      //   case "patients":
      //     return <PatientsPanel />;
      //   case "medical-records":
      //     return <MedicalRecordsPanel />;
      //   case "prescriptions":
      //     return <PrescriptionsPanel />;
      //   case "cds":
      //     return <ClinicalDecisionSupportPanel />;
      //   case "requisitions":
      //     return <RequisitionsPanel />;

      //   // ─── Head Nurse ───────────────────────────────────────────
      //   case "nursing-analytics":
      //     return <NursingAnalyticsPanel />;
      //   case "vitals":
      //     return <VitalsMonitoringPanel />;
      //   case "tasks":
      //     return <TaskManagementPanel />;

      //   // ─── Head of Hospitals ────────────────────────────────────
      //   case "hospital-analytics":
      //     return <HospitalAnalyticsPanel />;
      //   case "hospitals":
      //     return <HospitalsPanel />;
      //   case "bed-occupancy":
      //     return <BedOccupancyPanel />;
      //   case "staff":
      //     return <StaffPanel />;   // May need an admin version

      //   // ─── Head of Clinics ──────────────────────────────────────
      //   case "clinic-analytics":
      //     return <ClinicAnalyticsPanel />;
      //   case "clinics":
      //     return <ClinicsPanel />;
      //   case "appointments":
      //     return <AppointmentsPanel />;

      //   // ─── Head of Operations ───────────────────────────────────
      //   case "ops-analytics":
      //     return <OperationsAnalyticsPanel />;
      //   case "resources":
      //     return <ResourceAllocationPanel />;
      //   case "scheduling":
      //     return <StaffSchedulingPanel />;
      //   case "inventory":
      //     return <InventoryPanel />;

      //   // ─── Finance ──────────────────────────────────────────────
      //   case "billing":
      //     return <BillingPanel />;
      //   case "financial-reports":
      //     return <FinancialReportsPanel />;

      default:
        return <NotFoundPanel />;
    }
  };

  return (
    <motion.div
      key={activePanel}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      {renderPanel()}
    </motion.div>
  );
}
