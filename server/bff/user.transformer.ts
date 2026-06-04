import { User } from "@svet-gradjevine/shared";

export interface MobileUserResponse {
  uid: string;
  name: string;
  role: string;
  photo?: string;
  profession?: string;
  isVerified: boolean;
}

export class UserTransformer {
  static toMobile(user: User): MobileUserResponse {
    return {
      uid: user.uid || user.id || "",
      name:
        user.displayName ||
        (user.firstName
          ? `${user.firstName} ${user.lastName || ""}`.trim()
          : "Korisnik"),
      role: user.role,
      photo: user.photoURL,
      profession: user.profession,
      isVerified: !!user.isVerified,
    };
  }
}
