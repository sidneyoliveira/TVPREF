import { useState, useCallback, useRef } from "react";

export function useDragAndDrop<T extends { id: string | number }>(
  items: T[],
  onReorder: (newItems: T[]) => void
) {
  const [draggedId, setDraggedId] = useState<string | number | null>(null);
  const dragItemRef = useRef<number | null>(null);
  const dragOverItemRef = useRef<number | null>(null);

  const handleDragStart = useCallback((index: number, id: string | number) => {
    dragItemRef.current = index;
    setDraggedId(id);
  }, []);

  const handleDragEnter = useCallback((index: number) => {
    dragOverItemRef.current = index;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragItemRef.current !== null && dragOverItemRef.current !== null) {
      const newItems = [...items];
      const dragItemContent = newItems[dragItemRef.current];
      newItems.splice(dragItemRef.current, 1);
      newItems.splice(dragOverItemRef.current, 0, dragItemContent);
      dragItemRef.current = null;
      dragOverItemRef.current = null;
      onReorder(newItems);
    }
    setDraggedId(null);
  }, [items, onReorder]);

  return {
    draggedId,
    handleDragStart,
    handleDragEnter,
    handleDragEnd,
  };
}
