"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ComponentProps, ReactElement } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: (props: ComponentProps<"svg">) => ReactElement;
};

const navItems: NavItem[] = [
  {
    href: "/sgkb-plus",
    label: "SGKB+",
    icon: (props) => (
      <svg
        {...props}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.043 3.2a1 1 0 00.95.69h3.362c.969 0 1.371 1.24.588 1.81l-2.72 1.977a1 1 0 00-.364 1.118l1.039 3.2c.3.922-.755 1.688-1.54 1.118l-2.72-1.978a1 1 0 00-1.176 0l-2.72 1.978c-.785.57-1.84-.196-1.54-1.118l1.04-3.2a1 1 0 00-.365-1.118L5.106 8.627c-.783-.57-.38-1.81.588-1.81h3.362a1 1 0 00.95-.69l1.043-3.2z"
        />
      </svg>
    ),
  },
  {
    href: "/transactions",
    label: "Transactions",
    icon: (props) => (
      <svg
        {...props}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    ),
  },
  {
    href: "/",
    label: "Home",
    icon: (props) => (
      <svg
        {...props}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: (props) => (
      <svg
        {...props}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: (props) => (
      <svg
        {...props}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
];

const iconClasses = "w-6 h-6 mb-1 transition-colors";

const isActivePath = (currentPath: string, href: string) => {
  if (href === "/") {
    return currentPath === "/";
  }

  return currentPath.startsWith(href);
};

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="border-t border-gray-200 bg-white fixed bottom-0 left-0 right-0 max-w-screen-md mx-auto">
      <div className="flex justify-around py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActivePath(pathname, href);
          const linkClasses = active
            ? "flex flex-col items-center text-emerald-600"
            : "flex flex-col items-center text-gray-600 hover:text-gray-900";

          return (
            <Link
              key={href}
              href={href}
              className={`${linkClasses} relative`}
              aria-current={active ? "page" : undefined}
            >
              {active ? (
                <span
                  aria-hidden="true"
                  className="absolute -top-2 h-1 w-10 rounded-full bg-emerald-500"
                />
              ) : null}
              <Icon className={iconClasses} />
              <span className="text-xs">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
