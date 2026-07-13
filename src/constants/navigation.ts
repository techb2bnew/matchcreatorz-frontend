export type NavItem = {
  label: string;
  href: string;
  icon: string;   // Font Awesome class e.g. "fa-home"
  badge?: string;
};

export const adminNav: NavItem[] = [
  { label: 'Dashboard',      href: '/admin/dashboard',     icon: 'fa-th-large'       },
  { label: 'Sellers',        href: '/admin/sellers',       icon: 'fa-briefcase'      },
  { label: 'Buyers',         href: '/admin/buyers',        icon: 'fa-users'          },
  { label: 'Bookings',       href: '/admin/bookings',      icon: 'fa-calendar-check-o'},
  { label: 'Services',       href: '/admin/services',      icon: 'fa-cubes'          },
  { label: 'Categories',     href: '/admin/categories',    icon: 'fa-tags'           },
  { label: 'Connects',       href: '/admin/connects',      icon: 'fa-link'           },
  { label: 'Wallet',         href: '/admin/wallet',        icon: 'fa-credit-card'    },
  { label: 'Reviews',        href: '/admin/reviews',       icon: 'fa-star'           },
  { label: 'Support',        href: '/admin/support',       icon: 'fa-life-ring'      },
  { label: 'Notifications',  href: '/admin/notifications', icon: 'fa-bell'           },
  { label: 'Banners',        href: '/admin/banners',       icon: 'fa-picture-o'      },
  { label: 'Pages',          href: '/admin/pages',         icon: 'fa-file-text-o'    },
  { label: 'Settings',       href: '/admin/settings',      icon: 'fa-cog'            },
];

export const sellerNav: NavItem[] = [
  { label: 'Dashboard',     href: '/seller/dashboard',     icon: 'fa-th-large'       },
  { label: 'My Services',   href: '/seller/services',      icon: 'fa-cubes'          },
  { label: 'Browse Jobs',   href: '/seller/jobs',          icon: 'fa-briefcase'      },
  { label: 'My Bids',       href: '/seller/bids',          icon: 'fa-gavel'          },
  { label: 'Bookings',      href: '/seller/bookings',      icon: 'fa-calendar-check-o'},
  { label: 'Reviews',       href: '/seller/reviews',       icon: 'fa-star'           },
  { label: 'Offers',        href: '/seller/offers',        icon: 'fa-tags'           },
  { label: 'Connects',      href: '/seller/connects',      icon: 'fa-link'           },
  { label: 'Wallet',        href: '/seller/wallet',        icon: 'fa-credit-card'    },
  { label: 'Chat',          href: '/seller/chat',          icon: 'fa-comments'       },
  { label: 'Notifications', href: '/seller/notifications', icon: 'fa-bell'           },
  { label: 'My Account',    href: '/seller/account',       icon: 'fa-user-circle-o'  },
  { label: 'Settings',      href: '/seller/settings',      icon: 'fa-cog'            },
];

export const buyerNav: NavItem[] = [
  { label: 'Dashboard',     href: '/buyer/home',           icon: 'fa-th-large'       },
  { label: 'Search',        href: '/buyer/search',         icon: 'fa-search'         },
  { label: 'My Jobs',       href: '/buyer/jobs',           icon: 'fa-briefcase'      },
  { label: 'Bookings',      href: '/buyer/bookings',       icon: 'fa-calendar-check-o'},
  { label: 'Offers',        href: '/buyer/offers',         icon: 'fa-tags'           },
  { label: 'Favourites',    href: '/buyer/favourites',     icon: 'fa-heart'          },
  { label: 'Wallet',        href: '/buyer/wallet',         icon: 'fa-credit-card'    },
  { label: 'Chat',          href: '/buyer/chat',           icon: 'fa-comments'       },
  { label: 'Notifications', href: '/buyer/notifications',  icon: 'fa-bell'           },
  { label: 'My Account',    href: '/buyer/account',        icon: 'fa-user-circle-o'  },
  { label: 'Settings',      href: '/buyer/settings',       icon: 'fa-cog'            },
];
