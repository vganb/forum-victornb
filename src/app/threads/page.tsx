"use client";
import Header from "@/components/layout/Header";
import React from "react";
import AllThreads from "@/components/AllThreads";

const AllThreadsPage = () => {
  return (
    <main className="container mx-auto">
      <div className="mb-20">
        <Header />
      </div>
      <AllThreads />
      <div className="p-5">
        <div className="pt-10 mx-auto text-center">
          <a
            href="/create-thread"
            className="bg-black text-white py-3 px-5 rounded-md dark:text-black dark:bg-white hover:opacity-75"
          >
            Create Thread
          </a>
        </div>
      </div>
    </main>
  );
};

export default AllThreadsPage;
