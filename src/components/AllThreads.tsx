import { db } from "@/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Thread, ThreadTag, User } from "@/types/types";

function AllThreadsPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("");

  useEffect(() => {
    async function fetchData() {
      const querySnapshot = await getDocs(collection(db, "threads"));
      const threadsData = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            // Ensure `tags` is always an array
            tags: doc.data().tags || [],
          } as Thread)
      );

      // Sort threads by creationDate in descending order
      threadsData.sort(
        (a, b) =>
          new Date(b.creationDate).getTime() -
          new Date(a.creationDate).getTime()
      );

      setThreads(threadsData);

      // Fetch user details for each thread creator
      const userPromises = threadsData.map((thread) =>
        getDoc(doc(db, "users", thread.creator))
      );
      const userDocs = await Promise.all(userPromises);
      const usersData = userDocs.reduce((acc, userDoc) => {
        if (userDoc.exists()) {
          acc[userDoc.id] = userDoc.data() as User;
        }
        return acc;
      }, {} as { [key: string]: User });
      setUsers(usersData);

      // Extract unique tags from threads
      const tags = threadsData.reduce((acc: string[], thread) => {
        thread.tags.forEach((tag) => {
          if (!acc.includes(tag.toString())) {
            acc.push(tag.toString());
          }
        });
        return acc;
      }, []);
      setAvailableTags(tags);
    }

    fetchData();
  }, []);

  const filteredThreads = selectedTag
    ? threads.filter(
        (thread) =>
          thread.tags.some((tag: ThreadTag) => tag.name === selectedTag) // Compare selectedTag with tag.name (a string)
      )
    : threads;

  return (
    <div>
      <h2 className="font-bold text-xl pb-3">All Threads</h2>

      {/* Tag Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Filter by Tag
        </label>
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
        >
          <option value="">All Tags</option>
          {availableTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      {/* Threads List */}
      {filteredThreads.length > 0 ? (
        <ul>
          {filteredThreads.map((thread) => (
            <li key={thread.id} className="">
              <Link href={`/threads/${thread.id}`} className="block">
                <div className="bg-white shadow-md rounded-lg p-6 mb-6 hover:opacity-65">
                  <div className="flex">
                    <h2 className="font-semibold flex-1 dark:text-black text-lg">
                      {thread.title}
                    </h2>
                    <span className="bg-gray-700 text-white px-2 py-1 text-sm rounded-md">
                      {thread.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Posted by {users[thread.creator]?.userName || "Unknown"} at{" "}
                    {new Intl.DateTimeFormat("sv-SE", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    }).format(new Date(thread.creationDate))}
                  </p>
                  {/* Render tags for each thread */}
                  <div className="mt-2">
                    {thread.tags.length > 0 ? (
                      thread.tags.map((tag) => (
                        <span
                          key={tag.toString()}
                          className="inline-block bg-blue-500 text-white text-xs px-2 py-1 rounded mr-2"
                        >
                          {String(tag)}
                        </span>
                      ))
                    ) : (
                      <span className="inline-block bg-gray-200 text-black text-xs px-2 py-1 rounded mr-2">
                        No Tags
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default AllThreadsPage;
