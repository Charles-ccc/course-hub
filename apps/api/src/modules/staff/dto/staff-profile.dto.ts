export interface StaffProfileDto {
  name: string;
  phone: string;
  staffId: string;
  contractType: "EMPLOYEE" | "AGENT";
  groupName?: string;
  status: "ACTIVE" | "DISABLED";
}
