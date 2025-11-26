import { NavLink } from "@/components/NavLink";
import { BookOpen, Target, Video, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export const Navigation = () => {
  const navItems = [
    { to: "/student/dashboard", icon: Home, label: "Dashboard" },
    { to: "/learn", icon: BookOpen, label: "Learn" },
    { to: "/practice", icon: Target, label: "Practice" },
    { to: "/video-library", icon: Video, label: "Videos" },
  ];

  return (
    <nav className="flex gap-1 bg-card/50 p-1 rounded-lg">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
          activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
        >
          <item.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
