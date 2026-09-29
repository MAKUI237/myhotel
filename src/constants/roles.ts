import type { BoxIconName } from '@/components/box-icon';

export type StaffRole = 'receptionist' | 'manager' | 'housekeeping' | 'owner';
export type UserRole = StaffRole | 'client';

export const ROLE_LABEL: Record<UserRole, string> = {
  receptionist: 'Réception',
  manager: 'Gérance',
  housekeeping: 'Entretien',
  owner: 'Propriétaire',
  client: 'Compte',
};

export type WorkspaceLink = {
  href: string;
  label: string;
  icon: BoxIconName;
  roles: StaffRole[];
};

export const WORKSPACE_LINKS: WorkspaceLink[] = [
  { href: '/home', label: 'Tableau de bord', icon: 'home', roles: ['receptionist', 'manager', 'housekeeping', 'owner'] },
  { href: '/reservations', label: 'Réservations', icon: 'calendar', roles: ['receptionist', 'manager', 'owner'] },
  { href: '/pos', label: 'Ventes', icon: 'wallet', roles: ['receptionist', 'manager', 'owner'] },
  { href: '/badges', label: 'Badges clients', icon: 'id-card', roles: ['receptionist', 'owner'] },
  { href: '/visits', label: 'Visites', icon: 'group', roles: ['receptionist', 'owner'] },
  { href: '/suggestions', label: 'Suggestions', icon: 'bulb', roles: ['receptionist', 'manager', 'owner'] },
  { href: '/rooms', label: 'Chambres', icon: 'bed', roles: ['receptionist', 'manager', 'owner'] },
  { href: '/housekeeping', label: 'Entretien', icon: 'droplet', roles: ['receptionist', 'housekeeping', 'manager', 'owner'] },
  { href: '/cash', label: 'Caisse', icon: 'money', roles: ['manager', 'owner'] },
  { href: '/schedule', label: 'Planning', icon: 'time', roles: ['manager', 'owner'] },
  { href: '/stock', label: 'Articles', icon: 'cabinet', roles: ['manager', 'owner'] },
  { href: '/kpis', label: 'Statistiques', icon: 'bar-chart-alt-2', roles: ['manager', 'owner'] },
  { href: '/reports', label: 'Rapports', icon: 'receipt', roles: ['manager', 'owner'] },
  { href: '/staff', label: 'Personnel', icon: 'id-card', roles: ['owner'] },
  { href: '/payroll', label: 'Paie', icon: 'briefcase', roles: ['owner'] },
];

export function isStaffRole(role?: string | null): role is StaffRole {
  return role === 'receptionist' || role === 'manager' || role === 'housekeeping' || role === 'owner';
}

export function linksFor(role?: string | null) {
  if (!isStaffRole(role)) return [];
  return WORKSPACE_LINKS.filter((item) => item.roles.includes(role));
}
