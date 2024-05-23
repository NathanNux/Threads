
import ThreadCard from "@/components/cards/ThreadCard";
import { fetchThreads } from "@/lib/actions/thread.actions";
import { currentUser } from "@clerk/nextjs/server";

export default async function Home() {
  // could add the user object here to get the user's data and display it

  const result = await fetchThreads(1, 20) // these are the values for page and size of threads to fetch

  const user = await currentUser()

  return (
    <main>
      <h1 className="head-text">Home</h1>
      <section
        className="mt-9 flex flex-col gap-10"
      >
        {result.threads.length === 0 ? (
          <p className="no-result">No threads found</p>
        ) : (
          <>
            {result.threads.map((thread) => (
              <ThreadCard 
                key={thread._id}
                id={thread._id}
                currentUserId={user?.id || ""}
                parentId={thread.parentId}
                content={thread.text}
                author={thread.author}
                community={thread.community}
                comments={thread.children}
                createdAt={thread.createdAt}
              />
            ))}
          </>
        )}
      </section>
    </main>
  );
}
