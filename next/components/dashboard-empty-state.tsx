import type { ComponentType } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

type DashboardEmptyStateProps = {
  icon: ComponentType;
  title: string;
  description: string;
};

export function DashboardEmptyState({ icon: Icon, title, description }: DashboardEmptyStateProps) {
  return (
    <Card className="min-h-[440px] justify-center border-dashed bg-card shadow-none">
      <CardContent>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon />
            </EmptyMedia>
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </CardContent>
    </Card>
  );
}
