"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { db } from "@/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  Timestamp,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Header from "@/components/layout/Header";
import { Thread, User, Comment } from "@/types/types";
import { canEditThread } from "@/utils/permissions";
import { editThread } from "@/services/threadService";
import { useRouter } from "next/navigation";
import { FaCheck } from "react-icons/fa";
import { lockThread } from "@/services/threadService";
import { Button } from "@/components/ui/button";

const ThreadDetailPage: React.FC = () => {
  const pathname = usePathname();
  const [thread, setThread] = useState<Thread | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const [creatorName, setCreatorName] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [usernames, setUsernames] = useState<{ [key: string]: string }>({});
  const [currentUserUID, setCurrentUserUID] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [error, setError] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedTitle, setUpdatedTitle] = useState<string>(thread?.title || "");
  const [updatedDescription, setUpdatedDescription] = useState<string>(
    thread?.description || ""
  );

  const [isLocked, setIsLocked] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const router = useRouter();
  const [isModerator, setIsModerator] = useState<boolean>(false);
  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        setCurrentUserUID(user.uid);

        // Fetch the current user's username
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setCurrentUserName(userData.userName);
          setIsModerator(userData.isModerator);
        }
      } else {
        setIsLoggedIn(false);
      }
    });

    const threadId = pathname?.split("/").pop();
    if (threadId) {
      const fetchThread = async () => {
        const threadId = pathname?.split("/").pop();
        if (threadId) {
          try {
            const threadDoc = await getDoc(doc(db, "threads", threadId));
            if (threadDoc.exists()) {
              // Include the document ID in the thread data
              const threadData = {
                id: threadDoc.id, // Assign the document ID to the thread object
                ...threadDoc.data(),
              } as Thread;
              setThread(threadData);

              // Fetch the creator's username
              const userDoc = await getDoc(
                doc(db, "users", threadData.creator)
              );
              if (userDoc.exists()) {
                const userData = userDoc.data() as User;
                setCreatorName(userData.userName);
              } else {
                console.log("No such user!");
              }
            } else {
              console.log("No such thread!");
            }
          } catch (error) {
            console.error("Error fetching thread:", error);
          }
        }
      };

      const fetchComments = async () => {
        try {
          const commentsQuery = query(
            collection(db, "comments"),
            where("threadId", "==", threadId)
          );
          const commentsSnapshot = await getDocs(commentsQuery);
          const commentsData = commentsSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: (data.createdAt as Timestamp) || Timestamp.now(),
            };
          }) as Comment[];
          setComments(commentsData);

          // Fetch usernames for each comment creator
          const usernamesMap: { [key: string]: string } = {};
          await Promise.all(
            commentsData.map(async (comment) => {
              if (!usernamesMap[comment.creator]) {
                const userDoc = await getDoc(doc(db, "users", comment.creator));
                if (userDoc.exists()) {
                  const userData = userDoc.data() as User;
                  usernamesMap[comment.creator] = userData.userName;
                }
              }
            })
          );
          setUsernames(usernamesMap);
        } catch (error) {
          console.error("Error fetching comments:", error);
        }
      };

      fetchThread();
      fetchComments();
    }
  }, [pathname]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const threadId = pathname?.split("/").pop();
    if (threadId && newComment.trim() && currentUserUID) {
      try {
        const newCommentData = {
          content: newComment,
          createdAt: serverTimestamp(),
          creator: currentUserUID,
          threadId: threadId,
          isAnswer: false,
        };
        const docRef = await addDoc(collection(db, "comments"), newCommentData);
        const addedComment = {
          ...newCommentData,
          id: docRef.id,
          createdAt: Timestamp.now(), // Use current timestamp for immediate display
        } as Comment;
        setComments([...comments, addedComment]);
        setNewComment("");

        // Fetch the username for the new comment creator
        if (!usernames[currentUserUID]) {
          const userDoc = await getDoc(doc(db, "users", currentUserUID));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUsernames((prevUsernames) => ({
              ...prevUsernames,
              [currentUserUID]: userData.userName,
            }));
          }
        }
      } catch (error) {
        console.error("Error adding comment:", error);
      }
    }
  };

  const handleEditClick = async () => {
    setIsEditing(true);
    setUpdatedTitle(thread?.title || "");
    setUpdatedDescription(thread?.description || "");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (
      thread &&
      currentUserUID &&
      canEditThread(thread, currentUserUID, isModerator)
    ) {
      try {
        if (!thread.id) {
          throw new Error("Thread ID is undefined");
        }

        // Call the service function to update the thread
        await editThread(thread.id, updatedTitle, updatedDescription);

        // Update the local state with the new thread data
        setThread({
          ...thread,
          title: updatedTitle,
          description: updatedDescription,
        });

        // Exit editing mode
        setIsEditing(false);
      } catch (error) {
        console.error("Error updating thread:", error);
      }
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    try {
      await deleteDoc(doc(db, "threads", threadId));
      router.push("/");
    } catch (error) {
      console.error("Error deleting thread:", error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const comment = comments.find((comment) => comment.id === commentId);

    if (comment && currentUserUID !== comment.creator && !isModerator) {
      setCommentToDelete(commentId);
      setShowMessage(true);
    } else {
      try {
        await deleteDoc(doc(db, "comments", commentId));
        setComments(comments.filter((comment) => comment.id !== commentId));
        setShowMessage(false);
      } catch (error) {
        console.log("Error deleting comment:", error);
      }
    }
  };

  const handleMarkAsAnswer = async (commentId: string) => {
    if (!thread || !currentUserUID) {
      return;
    }
    if (thread.creator !== currentUserUID) {
      setError("Only the thread creator can mark a comment as an answer.");
      return;
    }
    try {
      const commentRef = doc(db, "comments", commentId);
      const commentSnap = await getDoc(commentRef);
      if (commentSnap.exists()) {
        const commentData = commentSnap.data();
        // Toggle the isAnswer field
        await updateDoc(commentRef, {
          isAnswer: !commentData.isAnswer,
        });

        setComments((prevComments) =>
          prevComments.map((comment) =>
            comment.id === commentId
              ? { ...comment, isAnswer: !commentData.isAnswer }
              : comment
          )
        );
      }
    } catch (error) {
      console.log("Error marking comment as answer:", error);
    }
  };

  const handleLockThread = async (threadId: string) => {
    try {
      const newLockStatus = !thread?.isLocked;
      await lockThread(threadId, newLockStatus);
      console.log("Thread lock status successfully updated!");

      // Update the thread state
      setThread((prevThread) => ({
        ...prevThread!,
        isLocked: newLockStatus,
      }));
    } catch (error) {
      console.error("Error updating thread lock status: ", error);
    }
  };

  const sortedComments = comments.sort(
    (a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()
  );
  const newLockStatus = !thread?.isLocked;
  console.log("New lock status:", newLockStatus);
  console.log("Current thread isLocked:", thread?.isLocked);

  return (
    <div>
      <Header />
      <div className="container mx-auto p-4">
        {thread ? (
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            {isEditing ? (
              <div>
                <input
                  type="text"
                  value={updatedTitle}
                  onChange={(e) => setUpdatedTitle(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-black bg-white"
                />
                <textarea
                  value={updatedDescription}
                  onChange={(e) => setUpdatedDescription(e.target.value)}
                  className="w-full p-2 mt-4 border border-gray-300 rounded text-black bg-white"
                  rows={4}
                />
                <div className="flex justify-end mt-4">
                  <button
                    onClick={handleSaveEdit}
                    className="bg-green-500 text-white p-2 px-4 rounded mr-2 hover:opacity-65"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="bg-red-500 text-white p-2 px-4 rounded hover:opacity-65"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-bold mb-4 dark:text-black">
                  {thread.title}
                </h1>
                <p
                  className="text-gray-700 mb-4"
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {thread.description}
                </p>
                <p className="text-sm text-gray-500">
                  Created by: {creatorName}
                </p>
                <p className="text-sm text-gray-500">
                  Creation Date:{" "}
                  {new Date(thread.creationDate).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  Category: {thread.category}
                </p>
                {currentUserUID &&
                  canEditThread(thread, currentUserUID, isModerator) && (
                    <button
                      onClick={handleEditClick}
                      className="bg-blue-500 text-white p-2 px-4 rounded hover:opacity-65"
                    >
                      Edit Thread
                    </button>
                  )}
                {isModerator && (
                  <button
                    onClick={() => handleDeleteThread(thread.id)}
                    className="bg-red-500 text-white p-2 px-4 rounded hover:opacity-65"
                  >
                    Delete Thread
                  </button>
                )}
                {isModerator && (
                  <Button onClick={() => handleLockThread(thread.id)}>
                    {thread?.isLocked ? "Unlock Thread" : "Lock Thread"}
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <p>Loading thread...</p>
        )}
        <div>
          <h2 className="text-xl font-bold mb-4">Comments</h2>
          {thread?.isLocked ? (
            <p className="text-lg text-red-500">
              This thread is locked. You cannot add a comment.
            </p>
          ) : (
            isLoggedIn && (
              <form onSubmit={handleCommentSubmit} className="my-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-black bg-white"
                  placeholder="Add a comment..."
                  required
                />
                <button
                  type="submit"
                  className="mt-2 bg-blue-500 text-white p-2 px-4 rounded hover:opacity-65"
                >
                  Submit
                </button>
              </form>
            )
          )}
          {sortedComments.length > 0 ? (
            sortedComments.map((comment) => (
              <div
                key={comment.id}
                className="bg-white shadow-md rounded-lg p-5 px-6 mb-6"
              >
                <p
                  className="text-gray-800 pb-2"
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {comment.content}
                </p>
                <p className="text-sm text-gray-500 font-semibold pb-2">
                  {usernames[comment.creator] || "Unknown"}
                </p>
                <p className="text-gray-500 text-xs">
                  {comment.createdAt.toDate().toLocaleString()}
                </p>
                {currentUserUID && (
                  <div>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="bg-red-500 text-white p-2 px-4 rounded hover:opacity-65"
                    >
                      Delete Comment
                    </button>
                    {showMessage && comment.id === commentToDelete && (
                      <p className="text-red-500 text-xs">
                        You can only delete your own comments.
                      </p>
                    )}
                    {thread?.creator === currentUserUID &&
                      !comment.isAnswer && (
                        <button
                          onClick={() => handleMarkAsAnswer(comment.id)}
                          className="bg-green-500 text-white p-2 px-4 rounded ml-2 hover:opacity-65"
                        >
                          Mark as Answer
                        </button>
                      )}
                    {comment.isAnswer && (
                      <div className="flex text-green-500">
                        <FaCheck
                          style={{ color: "lightgreen", fontSize: "35px" }}
                        />{" "}
                        <p>Answered</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : !thread?.isLocked ? (
            <p>No comments yet.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ThreadDetailPage;
