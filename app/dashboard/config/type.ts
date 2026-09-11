// config/type.ts
import { LucideIcon } from "lucide-react";

export type UserRole =
  | "ceo"
  | "cto"
  | "head_doctor"
  | "head_nurse"
  | "head_hospitals"
  | "head_clinics"
  | "head_operations"
  | "finance";

export interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  id: string;
  roles: UserRole[];
  children?: NavigationItem[];
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatar?: string;
}
