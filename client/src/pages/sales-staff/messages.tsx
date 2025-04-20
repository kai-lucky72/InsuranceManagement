import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  MessageSquare, 
  Send, 
  User, 
  Search, 
  Check, 
  CheckCheck,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function SalesStaffMessages() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (user?.role !== "SalesStaff") {
      setLocation("/auth");
    }
  }, [user, setLocation]);

  // Fetch agents and team leaders data
  const { data: agents, isLoading: isLoadingAgents } = useQuery<any[]>({
    queryKey: ["/api/sales-staff/agents"],
    enabled: !!user
  });

  // Fetch team leaders data
  const { data: teamLeaders, isLoading: isLoadingTeamLeaders } = useQuery<any[]>({
    queryKey: ["/api/sales-staff/team-leaders"],
    enabled: !!user
  });

  // Fetch managers data
  const { data: managers, isLoading: isLoadingManagers } = useQuery<any[]>({
    queryKey: ["/api/sales-staff/managers"],
    enabled: !!user
  });

  // Combine all contacts
  const allContacts = [
    ...(agents || []).map(agent => ({ ...agent, type: "Agent" })),
    ...(teamLeaders || []).map(tl => ({ ...tl, type: "Team Leader" })),
    ...(managers || []).map(manager => ({ ...manager, type: "Manager" }))
  ];

  // Filter contacts based on search
  const filteredContacts = allContacts.filter(contact => 
    contact.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.workId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch messages for the selected contact
  const { data: messages, isLoading: isLoadingMessages } = useQuery<any[]>({
    queryKey: ["/api/sales-staff/messages", selectedContact?.id],
    enabled: !!user && !!selectedContact,
    refetchInterval: 5000 // Poll for new messages every 5 seconds
  });

  // Mutation for sending a message
  const sendMessageMutation = useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: number, content: string }) => {
      const res = await apiRequest("POST", "/api/sales-staff/messages", { 
        receiverId,
        content 
      });
      return await res.json();
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/sales-staff/messages", selectedContact?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation for marking a message as read
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await apiRequest("PATCH", `/api/sales-staff/messages/${messageId}/read`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-staff/messages", selectedContact?.id] });
    }
  });

  // Mark unread messages as read when selecting a contact or receiving new messages
  useEffect(() => {
    if (selectedContact && messages) {
      const unreadMessages = messages.filter(msg => 
        !msg.isRead && msg.senderId === selectedContact.id);
      
      unreadMessages.forEach(msg => {
        markAsReadMutation.mutate(msg.id);
      });
    }
  }, [selectedContact, messages]);

  // Auto scroll to the bottom of the messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim() || !selectedContact) return;
    
    sendMessageMutation.mutate({
      receiverId: selectedContact.id,
      content: message.trim()
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get unread message count for a contact
  const getUnreadCount = (contactId: number) => {
    if (!messages) return 0;
    return messages.filter(msg => !msg.isRead && msg.senderId === contactId).length;
  };

  const navItems = [
    { href: "/sales-staff/dashboard", label: "Dashboard", icon: "view-dashboard" },
    { href: "/sales-staff/agents", label: "Agents", icon: "account-group" },
    { href: "/sales-staff/team-leaders", label: "Team Leaders", icon: "account-multiple" },
    { href: "/sales-staff/attendance", label: "Attendance", icon: "calendar-clock" },
    { href: "/sales-staff/clients", label: "Clients", icon: "account-cash" },
    { href: "/sales-staff/reports", label: "Reports", icon: "file-chart" },
    { href: "/sales-staff/messages", label: "Messages", icon: "message-text" },
  ];

  const isLoading = isLoadingAgents || isLoadingTeamLeaders || isLoadingManagers;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Header title="Sales Staff Portal" backgroundColor="bg-secondary" />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar navItems={navItems} role="SalesStaff" workId={user?.workId} />
        
        <main className="flex-1 overflow-hidden">
          <div className="h-full grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
            {/* Contacts List */}
            <div className="md:col-span-1 border-r border-neutral-200 bg-white overflow-y-auto">
              <div className="p-4 border-b border-neutral-200">
                <h2 className="text-lg font-bold text-neutral-800 mb-2">Messages</h2>
                <div className="relative">
                  <Input
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                </div>
              </div>
              
              <div className="divide-y divide-neutral-100">
                {isLoading ? (
                  <div className="p-4 text-center text-neutral-500">Loading contacts...</div>
                ) : filteredContacts.length > 0 ? (
                  filteredContacts.map((contact) => (
                    <div 
                      key={`${contact.id}-${contact.type}`}
                      className={cn(
                        "p-4 hover:bg-neutral-50 cursor-pointer transition-colors",
                        selectedContact?.id === contact.id && "bg-neutral-100 hover:bg-neutral-100"
                      )}
                      onClick={() => setSelectedContact(contact)}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary text-white rounded-full flex items-center justify-center">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex justify-between items-center">
                            <div className="text-sm font-medium text-neutral-900">{contact.fullName}</div>
                            {getUnreadCount(contact.id) > 0 && (
                              <div className="ml-2 px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                                {getUnreadCount(contact.id)}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-neutral-500">{contact.type}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-neutral-500">No contacts found</div>
                )}
              </div>
            </div>
            
            {/* Messages Area */}
            <div className="md:col-span-2 lg:col-span-3 flex flex-col bg-neutral-50 h-full">
              {selectedContact ? (
                <>
                  {/* Contact Header */}
                  <div className="p-4 bg-white border-b border-neutral-200 flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-primary text-white rounded-full flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-neutral-900">{selectedContact.fullName}</div>
                      <div className="text-xs text-neutral-500">{selectedContact.type} • {selectedContact.email}</div>
                    </div>
                  </div>
                  
                  {/* Messages Container */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {isLoadingMessages ? (
                      <div className="text-center text-neutral-500">Loading messages...</div>
                    ) : messages && messages.length > 0 ? (
                      messages.map((msg) => {
                        const isSelf = msg.senderId === user?.id;
                        return (
                          <div 
                            key={msg.id} 
                            className={cn(
                              "flex",
                              isSelf ? "justify-end" : "justify-start"
                            )}
                          >
                            <div className={cn(
                              "max-w-[70%] px-4 py-2 rounded-lg",
                              isSelf 
                                ? "bg-primary text-white rounded-br-none" 
                                : "bg-white text-neutral-800 rounded-bl-none shadow-sm"
                            )}>
                              <div className="text-sm">{msg.content}</div>
                              <div className="mt-1 flex items-center justify-end">
                                <div className={cn(
                                  "text-xs",
                                  isSelf ? "text-primary-foreground/80" : "text-neutral-500"
                                )}>
                                  {format(new Date(msg.createdAt), 'p')}
                                </div>
                                {isSelf && (
                                  <div className="ml-1">
                                    {msg.isRead ? (
                                      <CheckCheck className="h-3 w-3 text-primary-foreground/80" />
                                    ) : (
                                      <Check className="h-3 w-3 text-primary-foreground/80" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-neutral-500">
                        <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
                        <p>No messages yet</p>
                        <p className="text-sm">Start a conversation with {selectedContact.fullName}</p>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Message Input */}
                  <div className="p-4 bg-white border-t border-neutral-200">
                    <div className="flex">
                      <Input
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="flex-1 mr-2"
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!message.trim() || sendMessageMutation.isPending}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-neutral-500">
                  <MessageSquare className="h-24 w-24 mb-4 opacity-20" />
                  <p className="text-lg">Select a contact to start messaging</p>
                  <p className="text-sm mt-2">You can communicate with agents, team leaders, and managers</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}