import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  User,
  ChevronRight
} from "lucide-react";

interface MobileNavProps {
  navItems: {
    href: string;
    label: string;
    icon: string;
    badge?: number;
  }[];
}

export function MobileNav({ navItems }: MobileNavProps) {
  const [location] = useLocation();
  
  const getIcon = (iconName: string) => {
    const iconProps = { 
      className: "h-5 w-5 mb-1", 
      size: 20 
    };
    
    switch (iconName) {
      case "dashboard":
      case "view-dashboard":
        return <LayoutDashboard {...iconProps} />;
      case "account-multiple":
      case "users":
        return <Users {...iconProps} />;
      case "account-group":
      case "user-group":
        return <Users {...iconProps} />;
      case "calendar-check":
      case "calendar-clock":
        return <Calendar {...iconProps} />;
      case "file-chart":
        return <FileText {...iconProps} />;
      case "account":
        return <User {...iconProps} />;
      case "account-cash":
        return <FileText {...iconProps} />;
      default:
        return <ChevronRight {...iconProps} />;
    }
  };

  return (
    <nav className="bg-white border-t border-neutral-200 fixed bottom-0 left-0 right-0 z-50">
      <div className="grid grid-cols-4">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <a
              className={cn(
                "flex flex-col items-center justify-center p-2",
                location === item.href
                  ? "text-accent"
                  : "text-neutral-500"
              )}
            >
              {getIcon(item.icon)}
              <span className="text-xs mt-1">{item.label}</span>
            </a>
          </Link>
        ))}
      </div>
    </nav>
  );
}
