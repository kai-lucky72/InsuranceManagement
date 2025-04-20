import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { User, LogOut, Bell, Menu } from "lucide-react";
import { ReactNode, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  title: string;
  backgroundColor?: string;
  leftIcon?: ReactNode;
  onLeftIconClick?: () => void;
  showProfileIcon?: boolean;
  showNotification?: boolean;
}

export function Header({ 
  title, 
  backgroundColor = "bg-primary", 
  leftIcon,
  onLeftIconClick,
  showProfileIcon = false,
  showNotification = false
}: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [notificationCount] = useState(2); // This would come from a real notification system

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className={`${backgroundColor} text-white shadow-md`}>
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          {leftIcon ? (
            <button 
              className="mr-4 text-white focus:outline-none"
              onClick={onLeftIconClick}
            >
              {leftIcon}
            </button>
          ) : (
            <button className="mr-4 text-white focus:outline-none sm:hidden">
              <Menu className="h-6 w-6" />
            </button>
          )}
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
        <div className="flex items-center">
          {showNotification && (
            <div className="relative mr-4">
              <button className="focus:outline-none">
                <Bell className="h-5 w-5" />
                <Badge 
                  className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center" 
                  variant="destructive"
                >
                  {notificationCount}
                </Badge>
              </button>
            </div>
          )}
          
          {showProfileIcon && (
            <div className="bg-opacity-20 bg-black rounded-full w-8 h-8 flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
          )}
          
          {!showProfileIcon && (
            <div className="flex items-center">
              <span className="mr-2 hidden md:inline-block">{user?.email}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center cursor-pointer">
                    <User className="h-4 w-4" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-2 text-white hover:text-neutral-200"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
