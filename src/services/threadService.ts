import { db } from "@/firebase";
import { getDoc, doc, updateDoc } from "firebase/firestore";

export const toggleAnswer = async (commentId: string) => {
  const commentRef = doc(db, "comments", commentId);
  const commentSnap = await getDoc(commentRef);
  if (commentSnap.exists()) {
    const commentData = commentSnap.data();
    await updateDoc(commentRef, {
      isAnswer: !commentData.isAnswer,
    });
    return !commentData.isAnswer;
  }
  throw new Error("Comment not found");
};

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
