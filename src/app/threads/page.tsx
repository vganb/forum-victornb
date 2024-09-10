"use client";
import Header from "@/components/layout/Header";
import React from "react";
import AllThreads from "@/components/AllThreads";

const AllThreadsPage = () => {
  return (
    <main className="container mx-auto">
      <Header />
      <div className="p-10">
        <div className="pt-2 mx-auto text-right">
          <a
            href="/create-thread"
            className="bg-black text-white py-3 px-5 rounded-md dark:text-black dark:bg-white hover:opacity-75"
          >
            Create Thread
          </a>
        </div>
        <AllThreads />
      </div>
    </main>
  );
};

export default AllThreadsPage;
