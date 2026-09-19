import {
  AlertTriangle,
  Boxes,
  Building2,
  Cpu,
  Database,
  FileText,
  Fingerprint,
  Home,
  LayoutDashboard,
  Layers,
  Map,
  Settings,
  ShieldCheck,
  Waypoints,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/map", label: "3D Map", icon: Map },
  { to: "/app/parcels", label: "Parcels", icon: Layers },
  { to: "/app/buildings", label: "Buildings", icon: Building2 },
  { to: "/app/properties", label: "Properties", icon: Boxes },
  { to: "/app/ulpin", label: "ULPIN Generator", icon: Fingerprint },
  { to: "/app/utilities", label: "Utilities", icon: Waypoints },
  { to: "/app/ai", label: "AI Analysis", icon: Cpu },
  { to: "/app/validation", label: "Validation", icon: ShieldCheck },
  { to: "/app/conflicts", label: "Conflicts", icon: AlertTriangle },
  { to: "/app/reports", label: "Reports", icon: FileText },
  { to: "/app/data-sources", label: "Data Sources", icon: Database },
  { to: "/app/settings", label: "Settings", icon: Settings },
];
