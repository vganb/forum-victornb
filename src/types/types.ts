import { Timestamp } from "firebase/firestore";

export type Comment = {
  id: string;
  threadId: string;
  content: string;
  creator: string;
  createdAt: Timestamp;
  isAnswer: boolean;
};

export type ThreadCategory = "THREAD" | "QNA";

export type ThreadTag = {
  id: number;
  name: string;
};

export type Thread = {
  id: string;
  title: string;
  category: ThreadCategory;
  creationDate: string;
  description: string;
  creator: string; // UID of the creator
  tags: ThreadTag[];
};

export type User = {
  id: string;
  firstName: string;
  userName: string;
  password: string;
  userUID: string;
  isModerator: boolean;
};

export type QNAThread = Thread & {
  category: "QNA";
  isAnswered: boolean;
  commentAnswerId?: number;
};
