import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  MessageSquare, 
  Settings, 
  HelpCircle,
  User,
  ChevronRight,
  Bell,
  UserCircle
} from "lucide-react";

interface SidebarProps {
  navItems: {
    href: string;
    label: string;
    icon: string;
    badge?: number;
  }[];
  role: string;
  workId?: string;
  backgroundColor?: string;
  accentColor?: string;
}

export function Sidebar({ 
  navItems, 
  role, 
  workId,
  backgroundColor = "bg-white",
  accentColor = "text-primary"
}: SidebarProps) {
  const [location] = useLocation();
  
  // Map icon strings to components
  const getIcon = (iconName: string) => {
    const iconProps = { 
      className: "h-5 w-5", 
      size: 20 
    };
    
    switch (iconName) {
      case "dashboard":
      case "view-dashboard":
        return <LayoutDashboard {...iconProps} />;
      case "account-tie":
      case "user-tie":
        return <UserCircle {...iconProps} />;
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
      case "message-text":
        return <MessageSquare {...iconProps} />;
      case "help-circle-outline":
        return <HelpCircle {...iconProps} />;
      case "cog":
      case "settings":
        return <Settings {...iconProps} />;
      case "account":
        return <User {...iconProps} />;
      case "account-cash":
        return <FileText {...iconProps} />;
      default:
        return <ChevronRight {...iconProps} />;
    }
  };

  return (
    <aside className={`w-64 border-r border-neutral-200 h-full ${backgroundColor}`}>
      <div className="p-4">
        <div className={`px-4 py-2 mb-2 bg-${accentColor.replace('text-', '')} rounded-lg text-white`}>
          <div className="font-medium">{role}</div>
          <div className="text-sm opacity-80">{workId}</div>
        </div>
      </div>
      <nav className="px-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <a
                  className={cn(
                    "flex items-center px-4 py-2 rounded-md",
                    location === item.href
                      ? `bg-neutral-100 text-neutral-900`
                      : "text-neutral-700 hover:bg-neutral-100"
                  )}
                >
                  <span className={cn("mr-3", location === item.href ? accentColor : "")}>
                    {getIcon(item.icon)}
                  </span>
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="ml-auto bg-error text-white text-xs rounded-full px-2 py-0.5">
                      {item.badge}
                    </span>
                  )}
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
