import { db } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";

// Function to edit a thread in the database
export const editThread = async (
  threadId: string | undefined,
  newTitle: string,
  newDescription: string
) => {
  if (!threadId) {
    throw new Error("Thread ID is undefined"); // Ensure threadId is valid
  }

  // Reference the Firestore document
  const threadDocRef = doc(db, "threads", threadId);

  // Perform the update
  await updateDoc(threadDocRef, {
    title: newTitle,
    description: newDescription,
  });
};
