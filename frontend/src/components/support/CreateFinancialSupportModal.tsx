"use client";

import { useState } from "react";
import { financialSupportApi, CreateFinancialSupportRequestDto } from "@/services/financial-support";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DollarSign, AlertCircle } from "lucide-react";

interface CreateFinancialSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateFinancialSupportModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateFinancialSupportModalProps) {
  const [formData, setFormData] = useState<CreateFinancialSupportRequestDto>({
    amountNeeded: 0,
    reason: "",
    additionalNotes: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amountNeeded || formData.amountNeeded <= 0) {
      newErrors.amountNeeded = "Amount must be greater than 0";
    }

    if (formData.amountNeeded > 50000) {
      newErrors.amountNeeded = "Amount cannot exceed 50,000 ETB";
    }

    if (!formData.reason || formData.reason.trim().length < 10) {
      newErrors.reason = "Please provide a detailed reason (minimum 10 characters)";
    }

    if (formData.reason.length > 500) {
      newErrors.reason = "Reason cannot exceed 500 characters";
    }

    if (formData.additionalNotes && formData.additionalNotes.length > 1000) {
      newErrors.additionalNotes = "Additional notes cannot exceed 1000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      await financialSupportApi.createRequest(formData);
      toast.success("Financial support request created successfully!");
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Request Financial Support
          </DialogTitle>
          <DialogDescription>
            Ask the ServeLink teacher community for voluntary financial assistance.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Important Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">How it works:</p>
              <ul className="text-blue-800 space-y-1 list-disc list-inside">
                <li>Other teachers can contribute from their ServeLink wallet</li>
                <li>You receive money once the goal is reached</li>
                <li>All contributions are voluntary</li>
                <li>Be honest and transparent about your need</li>
              </ul>
            </div>
          </div>

          {/* Amount Needed */}
          <div>
            <Label htmlFor="amountNeeded">
              Amount Needed <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="amountNeeded"
                type="number"
                min="1"
                max="50000"
                step="0.01"
                placeholder="Enter amount in ETB"
                value={formData.amountNeeded || ""}
                onChange={(e) =>
                  setFormData({ ...formData, amountNeeded: parseFloat(e.target.value) || 0 })
                }
                className={errors.amountNeeded ? "border-red-500" : ""}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                ETB
              </span>
            </div>
            {errors.amountNeeded && (
              <p className="text-red-500 text-sm mt-1">{errors.amountNeeded}</p>
            )}
          </div>

          {/* Reason */}
          <div>
            <Label htmlFor="reason">
              Reason for Support <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Explain why you need financial support (e.g., medical emergency, school fees, family situation)"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className={errors.reason ? "border-red-500" : ""}
              rows={4}
            />
            <div className="flex justify-between mt-1">
              {errors.reason ? (
                <p className="text-red-500 text-sm">{errors.reason}</p>
              ) : (
                <p className="text-gray-500 text-sm">
                  Be specific and honest to gain community trust
                </p>
              )}
              <p className="text-gray-500 text-sm">{formData.reason.length}/500</p>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
            <Textarea
              id="additionalNotes"
              placeholder="Any additional context or information"
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              className={errors.additionalNotes ? "border-red-500" : ""}
              rows={3}
            />
            {errors.additionalNotes && (
              <p className="text-red-500 text-sm mt-1">{errors.additionalNotes}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">
              {formData.additionalNotes?.length || 0}/1000
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
