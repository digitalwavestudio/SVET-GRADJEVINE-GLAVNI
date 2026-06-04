import { Logger } from "../utils/logger.ts";

export enum AppScope {
  ADS_READ = "ads:read",
  ADS_CREATE = "ads:create",
  ADS_EDIT = "ads:edit",
  ADS_DELETE = "ads:delete",
  ADS_MODERATE = "ads:moderate",
  
  USER_READ = "user:read",
  USER_EDIT = "user:edit",
  USER_SUSPEND = "user:suspend",
  USER_MODERATE = "user:moderate",
  USER_DELETE = "user:delete",
  
  FINANCE_READ = "finance:read",
  FINANCE_WITHDRAW = "finance:withdraw",
  FINANCE_ADJUST = "finance:adjust",
  
  COMPANY_MANAGE = "company:manage",
  SYSTEM_ADMIN = "system:admin",
  MASTER_ALL = "*",
}

export class AuthorizationService {
  private static logger = new Logger({ service: "AuthorizationService" });

  /**
   * Checks if a user has a specific scope.
   * Admin role always returns true.
   */
  static hasScope(user: { role?: string; isAdmin?: boolean; permissions?: string[] } | null | undefined, requiredScope: AppScope | string): boolean {
    if (!user) return false;
    
    // Admins or Master users have full access
    if (user.role === "admin" || user.isAdmin === true) return true;
    
    const permissions = user.permissions || [];
    
    if (permissions.includes(AppScope.MASTER_ALL)) return true;
    
    return permissions.includes(requiredScope);
  }

  /**
   * Returns default permissions for a specific role
   */
  static getDefaultPermissions(role: string): string[] {
    switch (role) {
      case "admin":
        return [AppScope.MASTER_ALL];
      case "employer":
        return [AppScope.ADS_READ, AppScope.ADS_CREATE, AppScope.ADS_EDIT];
      case "candidate":
        return [AppScope.ADS_READ, AppScope.USER_EDIT];
      case "majstor":
        return [AppScope.ADS_READ, AppScope.ADS_CREATE, AppScope.USER_EDIT];
      default:
        return [AppScope.ADS_READ];
    }
  }
}
