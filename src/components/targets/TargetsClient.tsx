"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TargetRecord, calculateTargetProgress, formatCurrency } from "@/lib/calculations/analytics";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Target as TargetIcon, Plus, Pencil, Trash2,
  Loader2, CheckCircle2, Calendar, X
} from "lucide-react";
import { DatePickerPopover } from "@/components/ui/DatePickerPopover";

interface TargetWithProgress extends TargetRecord {
  achieved: number;
}

interface TargetsClientProps {
  targets: TargetWithProgress[];
}

const TARGET_TYPES = ["WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"] as const;

function TargetCard({
  target,
  onEdit,
  onDelete,
}: {
  target: TargetWithProgress;
  onEdit: (t: TargetWithProgress) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const progress = calculateTargetProgress(target.targetAmount, target.achieved);
  const progressClamped = Math.min(progress.progressPercent, 100);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(target.id);
    setDeleting(false);
    setConfirmDelete(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500">
              {target.targetType}
            </span>
          </div>
          <h3 className="font-semibold text-foreground">{target.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(target.startDate, "dd MMM")} — {format(target.endDate, "dd MMM yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(target)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Circular progress */}
      <div className="flex items-center gap-6">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" strokeWidth="7" className="text-muted" />
            <circle
              cx="40" cy="40" r="32" fill="none" strokeWidth="7" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 32}`}
              strokeDashoffset={`${2 * Math.PI * 32 * (1 - progressClamped / 100)}`}
              className={cn("transition-all duration-700", progress.isExceeded ? "stroke-emerald-500" : "stroke-purple-500")}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn("text-sm font-bold", progress.isExceeded ? "text-emerald-500" : "text-purple-500")}>
              {Math.round(progress.progressPercent)}%
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Target</span>
            <span className="font-medium">{formatCurrency(progress.targetAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Achieved</span>
            <span className={cn("font-medium", progress.achieved >= 0 ? "text-emerald-500" : "text-red-500")}>
              {formatCurrency(progress.achieved)}
            </span>
          </div>
          {progress.isExceeded ? (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Exceeded by</span>
              <span className="font-medium text-emerald-500">+{formatCurrency(progress.excess)}</span>
            </div>
          ) : (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pending</span>
              <span className="font-medium text-amber-500">{formatCurrency(progress.pending)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-1.5">
        <div
          className={cn(
            "h-1.5 rounded-full transition-all duration-700",
            progress.isExceeded
              ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
              : "bg-gradient-to-r from-purple-600 to-purple-400"
          )}
          style={{ width: `${progressClamped}%` }}
        />
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm">
          <p className="text-foreground mb-2 font-medium">Delete this target?</p>
          <p className="text-muted-foreground text-xs mb-3">This action cannot be undone.</p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-xs flex items-center justify-center"
            >
              {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Delete"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 py-1.5 bg-muted rounded-lg transition-colors text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface TargetFormData {
  name: string;
  targetType: typeof TARGET_TYPES[number];
  startDate: string;
  endDate: string;
  targetAmount: string;
}

export function TargetsClient({ targets: initialTargets }: TargetsClientProps) {
  const router = useRouter();
  const [targets, setTargets] = useState(initialTargets);
  const [showForm, setShowForm] = useState(false);
  const [editingTarget, setEditingTarget] = useState<TargetWithProgress | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<TargetFormData>({
    name: "",
    targetType: "MONTHLY",
    startDate: "",
    endDate: "",
    targetAmount: "",
  });

  const openCreate = () => {
    setEditingTarget(null);
    setForm({ name: "", targetType: "MONTHLY", startDate: "", endDate: "", targetAmount: "" });
    setShowForm(true);
  };

  const openEdit = (target: TargetWithProgress) => {
    setEditingTarget(target);
    setForm({
      name: target.name,
      targetType: target.targetType,
      startDate: format(target.startDate, "yyyy-MM-dd"),
      endDate: format(target.endDate, "yyyy-MM-dd"),
      targetAmount: target.targetAmount.toString(),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/targets/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed to delete target."); return; }
    setTargets((prev) => prev.filter((t) => t.id !== id));
    toast.success("Target deleted.");
    router.refresh();
  };

  const handleSave = async () => {
    if (!form.name || !form.startDate || !form.endDate || !form.targetAmount) {
      toast.error("All fields are required.");
      return;
    }
    const amount = parseFloat(form.targetAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Target amount must be greater than zero.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        targetType: form.targetType,
        startDate: form.startDate,
        endDate: form.endDate,
        targetAmount: amount,
      };

      if (editingTarget) {
        const res = await fetch(`/api/targets/${editingTarget.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) { toast.error("Failed to update target."); return; }
        toast.success("Target updated!");
      } else {
        const res = await fetch("/api/targets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) { toast.error("Failed to create target."); return; }
        toast.success("Target created!");
      }

      setShowForm(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Targets</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Set and track your trading targets
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Target
        </button>
      </div>

      {/* Form Dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in overflow-visible">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-foreground text-lg">
                {editingTarget ? "Edit Target" : "New Target"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">Target Name <span className="text-red-500">*</span></label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  placeholder="e.g. September Target"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">Target Type <span className="text-red-500">*</span></label>
                <select
                  value={form.targetType}
                  onChange={(e) => setForm({ ...form, targetType: e.target.value as typeof TARGET_TYPES[number] })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                >
                  {TARGET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">Start Date <span className="text-red-500">*</span></label>
                  <DatePickerPopover
                    value={form.startDate}
                    onChange={(val) => setForm({ ...form, startDate: val })}
                    placeholder="Start date"
                    maxDate={new Date(new Date().setFullYear(new Date().getFullYear() + 5))}
                    popoverClassName="z-[60]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">End Date <span className="text-red-500">*</span></label>
                  <DatePickerPopover
                    value={form.endDate}
                    onChange={(val) => setForm({ ...form, endDate: val })}
                    placeholder="End date"
                    minDate={form.startDate ? new Date(form.startDate + "T00:00:00") : undefined}
                    maxDate={new Date(new Date().setFullYear(new Date().getFullYear() + 5))}
                    popoverClassName="z-[60]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">Target Amount (₹) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={form.targetAmount}
                  onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                  min="0.01"
                  step="100"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  placeholder="25000"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editingTarget ? "Update Target" : "Save Target"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Targets Grid */}
      {targets.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
            <TargetIcon className="w-8 h-8 text-purple-500" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">No targets yet</h2>
          <p className="text-muted-foreground text-sm mb-5">
            Create a target to start tracking your trading goals.
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Target
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {targets.map((target) => (
            <TargetCard
              key={target.id}
              target={target}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
