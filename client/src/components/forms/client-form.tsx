import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

const clientSchema = z.object({
  fullName: z.string().min(1, "Client name is required"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().min(1, "Phone number is required"),
  insuranceType: z.string().min(1, "Insurance type is required"),
  policyDetails: z.string().optional(),
  requiresFollowUp: z.boolean().default(false),
  followUpDate: z.date().optional().nullable(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  client?: any;
  onSubmit: (data: ClientFormData) => void;
  isSubmitting: boolean;
  isEditMode?: boolean;
}

export function ClientForm({ client, onSubmit, isSubmitting, isEditMode = false }: ClientFormProps) {
  const [requiresFollowUp, setRequiresFollowUp] = useState(client?.requiresFollowUp || false);
  
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      fullName: client?.fullName || "",
      email: client?.email || "",
      phone: client?.phone || "",
      insuranceType: client?.insuranceType || "",
      policyDetails: client?.policyDetails || "",
      requiresFollowUp: client?.requiresFollowUp || false,
      followUpDate: client?.followUpDate ? new Date(client.followUpDate) : null,
    },
  });

  const handleSubmit = (data: ClientFormData) => {
    // If follow-up is not required, make sure to remove the date
    if (!data.requiresFollowUp) {
      data.followUpDate = null;
    }
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter client's full name" {...field} />
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
                <Input type="email" placeholder="client@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number *</FormLabel>
              <FormControl>
                <Input placeholder="Enter phone number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="insuranceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Insurance Type *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select insurance type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Auto Insurance">Auto Insurance</SelectItem>
                  <SelectItem value="Home Insurance">Home Insurance</SelectItem>
                  <SelectItem value="Life Insurance">Life Insurance</SelectItem>
                  <SelectItem value="Health Insurance">Health Insurance</SelectItem>
                  <SelectItem value="Business Insurance">Business Insurance</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="policyDetails"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Policy Details</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter any policy details or notes" 
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="requiresFollowUp"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    setRequiresFollowUp(checked as boolean);
                  }}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Follow-up Required?</FormLabel>
                <p className="text-sm text-neutral-500">
                  Check if this client needs a follow-up.
                </p>
              </div>
            </FormItem>
          )}
        />
        
        {requiresFollowUp && (
          <FormField
            control={form.control}
            name="followUpDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Follow-up Date</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    value={field.value ? field.value.toISOString().split('T')[0] : ""}
                    onChange={(e) => {
                      field.onChange(e.target.value ? new Date(e.target.value) : null);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 
              (isEditMode ? "Updating..." : "Adding...") : 
              (isEditMode ? "Update Client" : "Add Client")
            }
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
