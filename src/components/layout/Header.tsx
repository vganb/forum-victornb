import Link from "next/link";
import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { getFirestore, collection, getDocs } from "firebase/firestore";
// import { auth, db } from "@/firebase"; // Ensure you have these exports in your firebase.js
import { Button } from "../ui/button";
import Image from "next/image";

function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        try {
          const db = getFirestore();
          const querySnapshot = await getDocs(collection(db, "threads"));
          querySnapshot.forEach((doc) => {
            // console.log(`${doc.id} => ${doc.data()}`);
          });
        } catch (err) {
          console.error("Error accessing Firestore: ", err);
          setError("Failed to access Firestore");
        }
      } else {
        setIsLoggedIn(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      router.push("/");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <header className="bg-white dark:bg-black flex px-8 bg-opacity-85 rounded-lg">
      <span className="flex-none text-xl font-bold py-3 pr-10">
        <Link href="/">Forum</Link>
      </span>
      <ul className="flex flex-1 gap-4 py-3">
        <li>
          <Button variant="ghost">
            <Link href="/">Home</Link>
          </Button>
        </li>
        <li>
          <Button variant="ghost">
            <Link href="/threads">Threads</Link>
          </Button>
        </li>
        {isLoggedIn ? (
          <>
            <li className="flex-1 text-right">
              <Button variant="ghost" onClick={handleLogout}>
                Logout
              </Button>
            </li>
            {error && <li className="text-red-500">{error}</li>}
          </>
        ) : (
          <>
            <li className="flex-1 text-right">
              <Button variant="ghost">
                <Link href="/login">Log in</Link>
              </Button>
            </li>
            <li className="text-right">
              <Button variant="ghost">
                <Link href="/register">Register</Link>
              </Button>
            </li>
          </>
        )}
      </ul>
    </header>
  );
}

export default Header;
