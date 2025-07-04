import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarMenuBadge,
} from '@/components/ui/sidebar';
import { Settings, User, Calendar, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AppSidebarProps {
  activeTab: 'dimicall';
  onTabChange: (tab: 'dimicall') => void;
  onSettingsClick: () => void;
  userName?: string;
  userEmail?: string;
  hasSpecialAccess?: boolean;
  onLogout?: () => void;
}

export function AppSidebar({
  activeTab,
  onTabChange,
  onSettingsClick,
  userName = "Paul",
  userEmail = "paul@example.com",
  hasSpecialAccess = true,
  onLogout,
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" className="top-8 h-[calc(100svh-2rem)]">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg">DimiCall</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1">
        <SidebarMenu>
          {/* DimiCall Tab */}
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={activeTab === 'dimicall'}
              onClick={() => onTabChange('dimicall')}
              className="w-full justify-start gap-3"
            >
              <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-sm" />
              <span>DimiCall</span>
              {activeTab === 'dimicall' && (
                <SidebarMenuBadge>
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                </SidebarMenuBadge>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>



          {/* Settings */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onSettingsClick}
              className="w-full justify-start gap-3"
            >
              <Settings className="w-4 h-4" />
              <span>Réglages</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 mt-auto pb-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto p-3 hover:bg-accent"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  {hasSpecialAccess && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <Crown className="w-2 h-2 text-white" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-medium truncate">{userName}</div>
                  <div className="text-xs text-muted-foreground truncate">{userEmail}</div>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Préférences
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {onLogout && (
              <DropdownMenuItem onClick={onLogout}>
                Déconnexion
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
} 