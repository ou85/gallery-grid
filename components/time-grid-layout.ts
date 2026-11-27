export type TimeCard = "time" | "date";
export type TimeGridCell = TimeCard | number;

export function createTimeGridCells(photoCount: number, random = Math.random): TimeGridCell[] {
  const cells: TimeGridCell[] = Array.from({ length: photoCount }, (_, index) => index);
  cells.splice(Math.floor(random() * (cells.length + 1)), 0, "time");
  cells.splice(Math.floor(random() * (cells.length + 1)), 0, "date");
  return cells;
}

export function moveTimeCard(cells: TimeGridCell[], card: TimeCard, draw: number): TimeGridCell[] {
  const photoPositions = cells.flatMap((cell, index) => typeof cell === "number" ? [index] : []);
  const cardPosition = cells.indexOf(card);
  if (!photoPositions.length || cardPosition < 0) return cells;

  const photoPosition = photoPositions[Math.floor(draw * photoPositions.length)];
  const next = [...cells];
  [next[cardPosition], next[photoPosition]] = [next[photoPosition], next[cardPosition]];
  return next;
}
