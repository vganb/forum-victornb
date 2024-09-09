import { Thread } from "@/types/types";

export const canEditThread = (
  thread: Thread,
  currentUserUID: string,
  isModerator: boolean
): boolean => {
  return thread.creator === currentUserUID || isModerator;
};
