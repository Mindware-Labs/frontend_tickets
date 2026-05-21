"use client";

import { Loader2, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User } from "../types";
import { UserCard } from "./UserCard";

interface UsersGridProps {
  loading: boolean;
  users: User[];
  totalFiltered: number;
  search: string;
  onCreate: () => void;
  onOpen: (user: User) => void;
  onEdit: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onDelete: (user: User) => void;
}

export function UsersGrid({
  loading,
  users,
  totalFiltered,
  search,
  onCreate,
  onOpen,
  onEdit,
  onToggleStatus,
  onDelete,
}: UsersGridProps) {
  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-[#008f68]" />
        <p className="text-sm font-medium">Loading team members...</p>
      </div>
    );
  }

  if (totalFiltered === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-950">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#008f68]/15 bg-[#f0faf5] text-[#008f68]">
          <Users className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <h3 className="mt-4 text-[17px] font-bold text-slate-900 dark:text-slate-50">
          No users found
        </h3>
        <p className="mt-1 max-w-sm text-[13px] text-slate-500 dark:text-slate-400">
          {search
            ? "Try a different search term or clear filters."
            : "Add your first team member to get started."}
        </p>
        {!search ? (
          <Button
            type="button"
            onClick={onCreate}
            className="mt-5 h-9 rounded-full bg-[#008f68] px-5 text-[13px] font-semibold text-white hover:bg-[#007a5a]"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add first user
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          onOpen={onOpen}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
