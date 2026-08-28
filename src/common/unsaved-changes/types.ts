export type PendingNavigation =
  | { type: 'href'; href: string }
  | { type: 'back' };
