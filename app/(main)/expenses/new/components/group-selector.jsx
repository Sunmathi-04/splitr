"use client";

import { useState, useEffect } from "react";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { BarLoader } from "react-spinners";
import { Users } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function GroupSelector({ onChange }) {
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  // ✅ ALWAYS FETCH GROUPS
  const { data, isLoading } = useConvexQuery(
    api.groups.getGroupOrMembers,
    selectedGroupId ? { groupId: selectedGroupId } : {}
  );

  // ✅ when a group is selected, send full group up
  useEffect(() => {
    if (data?.selectedGroup) {
      onChange?.({
        _id: data.selectedGroup.id, // Convex ID
        name: data.selectedGroup.name,
        members: data.selectedGroup.members,
      });
    }
  }, [data?.selectedGroup, onChange]);

  if (isLoading) {
    return <BarLoader width="100%" color="#36d7b7" />;
  }

  if (!data?.groups || data.groups.length === 0) {
    return (
      <div className="text-sm text-amber-600 p-2 bg-amber-50 rounded-md">
        You need to create a group before adding a group expense.
      </div>
    );
  }

  return (
    <Select
      value={selectedGroupId ?? ""}
      onValueChange={setSelectedGroupId}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a group" />
      </SelectTrigger>

      <SelectContent>
        {data.groups.map((group) => (
          <SelectItem key={group.id} value={group.id}>
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-1 rounded-full">
                <Users className="h-3 w-3 text-primary" />
              </div>
              <span>{group.name}</span>
              <span className="text-xs text-muted-foreground">
                ({group.memberCount} members)
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
