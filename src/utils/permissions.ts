import { Thread } from "@/types/types";

export const canEditThread = (
  thread: Thread,
  currentUserUID: string
): boolean => {
  return thread.creator === currentUserUID;
};
