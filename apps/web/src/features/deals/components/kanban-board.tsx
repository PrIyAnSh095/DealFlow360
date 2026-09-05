"use client";

import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Deal, DealStatus } from "../types";
import { DealCard } from "./deal-card";
import { useUpdateDealStatus } from "../hooks";

const COLUMNS: { id: DealStatus; title: string }[] = [
  { id: "draft", title: "Draft" },
  { id: "review", title: "Review" },
  { id: "approval", title: "Approval" },
  { id: "negotiation", title: "Negotiation" },
  { id: "confirmed", title: "Confirmed" },
  { id: "fulfillment", title: "Fulfillment" },
  { id: "completed", title: "Completed" },
];

interface KanbanBoardProps {
  initialDeals: Deal[];
}

export function KanbanBoard({ initialDeals }: KanbanBoardProps) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [isMounted, setIsMounted] = useState(false);
  const { mutate: updateStatus } = useUpdateDealStatus();

  // Sync state if initialDeals change (from react-query)
  useEffect(() => {
    setDeals(initialDeals);
  }, [initialDeals]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as DealStatus;
    
    // Optimistic UI update
    setDeals((prev) => 
      prev.map((deal) => 
        deal.id === draggableId ? { ...deal, status: newStatus } : deal
      )
    );

    // Fire mutation
    updateStatus({ id: draggableId, status: newStatus });
  };

  if (!isMounted) return <div className="h-96 flex items-center justify-center text-foreground-muted text-[13px]">Loading board...</div>;

  return (
    <div className="flex h-full min-h-[calc(100vh-12rem)] overflow-x-auto pb-4 gap-4">
      <DragDropContext onDragEnd={onDragEnd}>
        {COLUMNS.map((column) => {
          const columnDeals = deals.filter((d) => d.status === column.id);
          
          return (
            <div key={column.id} className="flex flex-col w-[280px] shrink-0 bg-muted/40 rounded-lg border border-border/50">
              <div className="p-3 border-b border-border/50 flex justify-between items-center bg-surface/50 rounded-t-lg">
                <h3 className="text-[13px] font-semibold text-foreground uppercase tracking-wider">{column.title}</h3>
                <span className="text-[11px] font-medium bg-muted text-foreground-muted px-2 py-0.5 rounded-full">
                  {columnDeals.length}
                </span>
              </div>
              
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-2 space-y-2 overflow-y-auto transition-colors ${
                      snapshot.isDraggingOver ? "bg-primary/5" : ""
                    }`}
                  >
                    {columnDeals.map((deal, index) => (
                      <Draggable key={deal.id} draggableId={deal.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                            }}
                          >
                            <DealCard deal={deal} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </DragDropContext>
    </div>
  );
}
