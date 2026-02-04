"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Users,
  Mail,
  Building2,
  Package,
  Settings,
  ShoppingCart,
  Activity,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useActivityLogs } from "@/hooks/use-activity-log";
import {
  type ActivityLog,
  type ActivityResourceType,
  getActionDescription,
} from "@/lib/firestore/activity-log";

interface ActivityFeedProps {
  limit?: number;
  resourceType?: ActivityResourceType;
  resourceId?: string;
  showFilters?: boolean;
}

const IconMap = {
  user: Users,
  invitation: Mail,
  location: Building2,
  product: Package,
  settings: Settings,
  sale: ShoppingCart,
};

function getIcon(resourceType: ActivityResourceType) {
  return IconMap[resourceType] || Activity;
}

function ActivityItem({ activity }: { activity: ActivityLog }) {
  const Icon = getIcon(activity.resourceType);

  const getUserInitials = (name: string, email: string) => {
    if (name && name !== "Unknown User") {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex items-start gap-3 py-3">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs">
          {getUserInitials(activity.actorName, activity.actorEmail)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-1">
        <p className="text-sm">
          <span className="font-medium">{activity.actorName}</span>{" "}
          <span className="text-muted-foreground">
            {getActionDescription(activity.action)}
          </span>{" "}
          <span className="font-medium">{activity.resourceName}</span>
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Icon className="mr-1 h-3 w-3" />
            {activity.resourceType}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ActivityFeed({
  limit = 10,
  resourceType,
  resourceId,
}: ActivityFeedProps) {
  const { data: activities = [], isLoading } = useActivityLogs({
    limit,
    resourceType,
    resourceId,
  });

  if (isLoading) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Loading activity...
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No activity recorded yet
      </div>
    );
  }

  return (
    <div className="divide-y">
      {activities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
