import { db } from "@/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Thread, ThreadTag, User } from "@/types/types";
import { Card, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "./ui/label";
import {
  Select,
  SelectValue,
  SelectLabel,
  SelectGroup,
  SelectItem,
  SelectContent,
  SelectTrigger,
} from "./ui/select";

function AllThreadsPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("all");

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

  const filteredThreads =
    selectedTag === "all"
      ? threads // Show all threads if "all" is selected
      : threads.filter((thread) =>
          thread.tags.some((tag: ThreadTag) => tag.toString() === selectedTag)
        );

  return (
    <div>
      <h2 className="font-bold text-xl pb-3">All Threads</h2>
      <Separator className="mb-10" />

      {/* Tag Filter */}
      <div className="mb-4">
        <Select onValueChange={(value) => setSelectedTag(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {/* Option to display all threads */}
              <SelectItem value="all">All Tags</SelectItem>
              {availableTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Threads List */}
      {filteredThreads.length > 0 ? (
        <ul>
          {filteredThreads.map((thread) => (
            <li key={thread.id} className="">
              <Link href={`/threads/${thread.id}`} className="block">
                <Card className="bg-white shadow-md rounded-lg p-6 mb-6 hover:opacity-65">
                  <div className="flex">
                    <CardTitle className="font-semibold flex-1 dark:text-black text-lg">
                      {thread.title}
                    </CardTitle>
                    <Badge className="bg-gray-700 text-white px-2 py-1 text-sm rounded-md">
                      {thread.category}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm text-gray-500">
                    Posted by {users[thread.creator]?.userName || "Unknown"} at{" "}
                    {new Intl.DateTimeFormat("sv-SE", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    }).format(new Date(thread.creationDate))}
                  </CardDescription>
                  {/* Render tags for each thread */}
                  <CardTitle className="mt-2">
                    {thread.tags.length > 0 ? (
                      thread.tags.map((tag) => (
                        <Badge
                          key={tag.toString()}
                          className="inline-block bg-blue-500 text-white text-xs px-2 py-1 rounded mr-2"
                        >
                          {String(tag)}
                        </Badge>
                      ))
                    ) : (
                      <Badge className="inline-block bg-gray-200 text-black text-xs px-2 py-1 rounded mr-2">
                        No Tags
                      </Badge>
                    )}
                  </CardTitle>
                </Card>
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
