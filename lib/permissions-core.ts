export const legacyModulePermissions: Record<string, string> = {
  "/dashboard": "Genel Bakış",
  "/firmalar": "Firmalar",
  "/personeller": "Personeller",
  "/taramalar": "Taramalar",
  "/teklifler": "Teklifler",
  "/istatistikler": "İstatistikler",
  "/sonuclar": "Sonuçlar",
  "/takvim": "Takvim",
  "/ekipmanlar": "Ekipmanlar",
  "/ayarlar": "settings",
};

const moduleKeys: Record<string, string> = {
  "/dashboard": "dashboard",
  "/firmalar": "companies",
  "/personeller": "personnel",
  "/taramalar": "screenings",
  "/teklifler": "offers",
  "/istatistikler": "statistics",
  "/sonuclar": "results",
  "/takvim": "calendar",
  "/ekipmanlar": "equipment",
};

const pathActions: Array<[string, string]> = [
  ["/taramalar/yeni", "screenings.create"],
  ["/teklifler/yeni", "offers.create"],
  ["/teklif-yanit", "offers.detail"],
  ["/firmalar/", "companies.detail"],
  ["/personeller/", "personnel.detail"],
  ["/taramalar/", "screenings.detail"],
  ["/teklifler/", "offers.detail"],
  ["/firmalar", "companies.list"],
  ["/personeller", "personnel.list"],
  ["/taramalar", "screenings.list"],
  ["/teklifler", "offers.list"],
  ["/istatistikler", "statistics.view"],
  ["/sonuclar", "results.list"],
  ["/takvim", "calendar.view"],
  ["/ekipmanlar", "equipment.list"],
  ["/dashboard", "dashboard.view"],
];

export function hasPermission(permissions: string[], permission: string) {
  return permissions.includes(permission);
}

export function canAccessAction(permissions: string[], permission: string) {
  const moduleKey = permission.split(".")[0];
  if (moduleKey === "results" && permissions.includes("İstatistikler")) return true;
  const legacy = Object.entries(moduleKeys).find(([, value]) => value === moduleKey)?.[0];
  return hasPermission(permissions, permission) || (legacy ? permissions.includes(legacyModulePermissions[legacy]) : false);
}

export function canAccessModule(permissions: string[], href: string) {
  const root = Object.keys(legacyModulePermissions).find((path) => href === path || href.startsWith(`${path}/`)) ?? href;
  const moduleKey = moduleKeys[root] ?? root.replace(/^\//, "");
  const legacy = legacyModulePermissions[root];
  if (moduleKey === "results" && permissions.includes("İstatistikler")) return true;
  if (legacy === "settings") return permissions.some((permission) => permission.startsWith("settings.")) || permissions.includes("Rol ve Kullanıcı Yönetimi");
  return permissions.includes(legacy) || permissions.some((permission) => permission.startsWith(`${moduleKey}.`));
}

export function canAccessPath(permissions: string[], pathname: string) {
  const match = pathActions.find(([path]) => pathname === path || (path.endsWith("/") ? pathname.startsWith(path) : pathname.startsWith(`${path}/`)));
  return match ? canAccessAction(permissions, match[1]) : canAccessModule(permissions, pathname);
}
