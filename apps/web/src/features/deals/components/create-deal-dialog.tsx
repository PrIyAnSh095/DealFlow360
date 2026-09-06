import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { dealsApi } from "../api";
import { customersApi, Customer } from "@/features/customers/api";
import { useRouter } from "next/navigation";

interface CreateDealDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateDealDialog({ isOpen, onClose }: CreateDealDialogProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [dealValue, setDealValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setIsLoadingCustomers(true);
      setError("");
      customersApi.getCustomers()
        .then(setCustomers)
        .catch((err) => {
          console.error("Failed to load customers:", err);
          setError("Unable to load customers. Please sign in again or try again.");
        })
        .finally(() => setIsLoadingCustomers(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setError("Please select a customer.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    try {
      const valueNumber = parseFloat(dealValue);
      const newDeal = await dealsApi.createDeal({
        customer_id: selectedCustomerId,
        value: isNaN(valueNumber) ? 0 : valueNumber
      });
      onClose();
      // Redirect to the quote builder for this new deal
      router.push(`/deals/${newDeal.id}`);
    } catch (err) {
      setError("Failed to create deal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface border border-border rounded-lg shadow-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Create New Deal</h2>
          <button onClick={onClose} className="text-foreground-muted hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && <div className="mb-4 text-[13px] text-danger bg-danger/10 p-3 rounded">{error}</div>}
          
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-foreground-muted mb-1">Customer</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-muted border border-border rounded-md px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary"
                required
              >
                <option value="">
                  {isLoadingCustomers ? "Loading customers..." : "Select a customer..."}
                </option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.company})</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-[13px] font-medium text-foreground-muted mb-1">Initial Value (₹)</label>
              <input
                type="number"
                placeholder="0.00"
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
                className="w-full bg-muted border border-border rounded-md px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-medium rounded-md border border-border hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || isLoadingCustomers || customers.length === 0}
              className="px-4 py-2 text-[13px] font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Deal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
