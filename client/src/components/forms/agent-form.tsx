import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DialogFooter } from "@/components/ui/dialog";

const agentSchema = z.object({
  workId: z.string().min(1, "Work ID is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  type: z.enum(["Individual", "TeamLeader"]),
  isActive: z.boolean().default(true),
});

type AgentFormData = z.infer<typeof agentSchema>;

interface AgentFormProps {
  agent?: any;
  onSubmit: (data: AgentFormData) => void;
  isSubmitting: boolean;
  isEditMode?: boolean;
}

export function AgentForm({ agent, onSubmit, isSubmitting, isEditMode = false }: AgentFormProps) {
  // If in edit mode, we can use a partial schema for validating only the fields we want to update
  const editSchema = agentSchema.partial().omit({ password: true });
  
  const form = useForm<AgentFormData>({
    resolver: zodResolver(isEditMode ? editSchema : agentSchema),
    defaultValues: {
      workId: agent?.workId || "",
      email: agent?.email || "",
      password: "",
      fullName: agent?.fullName || "",
      type: agent?.type || "Individual",
      isActive: agent?.isActive ?? true,
    },
  });

  const handleSubmit = (data: AgentFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="workId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Work ID</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., AGT123" 
                  {...field}
                  disabled={isEditMode} // Can't change workId in edit mode
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="john.doe@example.com" 
                  {...field}
                  disabled={isEditMode} // Can't change email in edit mode
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {!isEditMode && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agent Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={isEditMode} // Can't change type in edit mode
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Individual">Individual Agent</SelectItem>
                  <SelectItem value="TeamLeader">Team Leader</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Team Leaders can manage other agents and aggregate reports.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 
              (isEditMode ? "Updating..." : "Creating...") : 
              (isEditMode ? "Update Agent" : "Create Agent")
            }
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
