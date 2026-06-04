export const ROLE_DEFINITIONS = {
  USER: {
    name: "user",
    permissions: ["post_ad", "message", "browse", "view_profile"],
    description: "Regular marketplace user",
  },
  PARTNER: {
    name: "partner",
    permissions: [
      "post_ad",
      "message",
      "browse",
      "view_profile",
      "analytics",
      "bulk_upload",
    ],
    description: "Partner with extended capabilities",
  },
  ADMIN: {
    name: "admin",
    permissions: ["*"],
    description: "Platform administrator",
  },
};

export const getDefaultRole = () => ROLE_DEFINITIONS.USER;
