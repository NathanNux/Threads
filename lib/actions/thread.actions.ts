'use server'
import { revalidatePath } from "next/cache";
import Thread from "../models/thread.model";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";
import Community from "../models/community.mode";

interface Params {
    text: string;
    author: string;
    communityId: string | null;
    path: string;
}

export async function CreateThread({
    text,
    author,
    communityId,
    path
}: Params) {
    try {
        connectToDB();

        const communityIdObject = await Community.findOne(
            {id: communityId},
            {_id: 1}
        )

        const CreatedThread = await Thread.create({
            text,
            author,
            community: communityIdObject,
            // Assign communityId if provided, or leave it null for personal account
        })

        //update the user thread array and history
        await User.findByIdAndUpdate(author, {
            $push: {threads: CreatedThread._id}
        })

        if(communityIdObject) {
            await Community.findByIdAndUpdate(communityIdObject, {
                $push: {threads: CreatedThread._id}
            })
        }

        revalidatePath(path);
    } catch (error) {
        throw new Error(`Failed to create thread: ${error}`);
    }
}

//this function works only if there are no comments, if there are comments, we need to populate the children field
// thats the function below, otherwise it throws exec is not a function, there can also be execPopulate()

// export async function fetchThreads(pageNumber: 1, pageSize: 20) {
//     connectToDB();

//     const skipAmount = (pageNumber - 1) * pageSize;

//     let threadsQuery = Thread.find({
//         parentId: { $in: [null, undefined] }
//     }).sort({createdAt: 'desc'})
//     .skip(skipAmount).limit(pageSize)
//     .populate({
//         path: "author",
//         model: User,
//       })
//       .populate({
//         path: "community",
//         model: Community,
//       });

//     const threads = await threadsQuery.exec();

//     // Log the threads
//     console.log(threads);

//     // Populate children field only if there are any children
//     for (let thread of threads) {
//         if (thread.children && thread.children.length > 0) {
//             await thread.populate({
//                 path: "children",
//                 populate: {
//                     path: "author",
//                     model: User,
//                     select: "_id name parentId image",
//                 },
//             }).execPopulate();
//         }
//     }

//     const totalThreads = await Thread.countDocuments({
//         parentId: { $in: [null, undefined] }
//     })

//     const isNext = totalThreads > skipAmount + threads.length;

//     return { threads, isNext };
// }


//copilot has regenerated the code above that has workaround about the comments/children, the mongoDb cant work with something called and the value in it not being there
// so we need to populate the children field only if there are any children --> therefore the new workaround.

export async function fetchThreads(pageNumber: 1, pageSize: 20) {
    connectToDB();

    //we need to calculate the number of threads to skip based on the page number and page size
    const skipAmount = (pageNumber - 1) * pageSize;

    // Fetch threads with pagination with no parents (top-level threads, not replies/commnets)
    const threadsQuery = Thread.find({
        parentId: { $in: [null, undefined] }
        //the first populate is for the author of the thread and the other for its commnets and the other for the commnts of the comments
    }).sort({createdAt: 'desc'})
    .skip(skipAmount).limit(pageSize)
    .populate({
        path: "author",
        model: User,
      })
      .populate({
        path: "community",
        model: Community,
      })
      .populate({
        path: "children", // Populate the children field
        populate: {
          path: "author", // Populate the author field within children
          model: User,
          select: "_id name parentId image", // Select only _id and username fields of the author
        },
      });

    const totalThreads = await Thread.countDocuments({
        parentId: { $in: [null, undefined] }
        // we are only counting the top-level threads, not comments
    })

    const threads = await threadsQuery.exec();
    // exec() is used to execute the query and return a promise
    // promise is resolved with the result of the query

    const isNext = totalThreads > skipAmount + threads.length;

    // bit more complicated but we are checking if there are more threads to fetch 
    // and we are doing also the pagination here so we dont need to in the component

    return { threads, isNext };

    // do not do try and catch here, let the component handle the error
}


export async function fetchThreadById(id: string ) {
    connectToDB();
    // TODO: comunity
    // we have more complicated level, we are getting and populating the thread, then the threads of the thread as commnets, and then threads of the threads as commnets of the commnets
    try {
        const thread = await Thread.findById(id)
        .populate({
            path: "author",
            model: User,
            select: '_id id name image'
        })
        .populate({
            path: 'children',
            populate: [
                {
                    path: 'author',
                    model: User,
                    select: '_id id parentId name image'
                },
                {
                    path: 'children',
                    model: Thread,
                    populate: {
                        path: 'author',
                        model: User,
                        select: '_id id parentId name image'
                    }
                }
            ]
        }).exec();

        return thread;
    } catch (error: any) {
        throw new Error(`Failed to fetch thread: ${error.message}`);
    }
}

export async function addCommentToThread(
    threadId: string,
    commentText: string,
    userId: string,
    path: string
) {
    connectToDB();

    try {
        //find the original thread by its id
        const originalThread = await Thread.findById(threadId);

        if(!originalThread) {
            throw new Error('Thread not found');
        }

        //create a new thread for the comment
        const commentThread = new Thread({
            text: commentText,
            author: userId,
            parentId: threadId, // set the parent id to the original thread id
        });

        // save the comment thread to the database

        const savedCommentThread = await commentThread.save();

        // Add the comment thread's ID to the original thread's children array

        originalThread.children.push(savedCommentThread._id);

        //save the updated original thread to the databse
        await originalThread.save();

        revalidatePath(path);
    } catch (error) {
       console.log('Error adding comment to thread: ', error);
       throw new Error('Failed to add comment to thread'); 
    }
}

async function fetchAllChildThreads(threadId: string): Promise<any[]> {
    const childThreads = await Thread.find({ parentId: threadId });
  
    const descendantThreads = [];
    for (const childThread of childThreads) {
      const descendants = await fetchAllChildThreads(childThread._id);
      descendantThreads.push(childThread, ...descendants);
    }
  
    return descendantThreads;
}

export async function deleteThread(id: string, path:string): Promise<void> {
    try {
        connectToDB();

        // Find the thread to be deleted (the main thread)
        const mainThread = await Thread.findById(id).populate('author community');

        if(!mainThread) {
            throw new Error('Thread not found');
        }

        // Fetch all child threads and their descendants recursively
        const descendantThreads = await fetchAllChildThreads(id)

        // Get all descendant thread IDs including the main thread ID and child thread IDs
        const descendantThreadIds = [ id, ...descendantThreads.map((thread) => thread._id)];

        // Extract the authorIds and communityIds to update User and Community models respectively
        const uniqueAuthorIds = new Set(
            [
            ...descendantThreads.map((thread) => thread.author?._id?.toString()), // Use optional chaining to handle possible undefined values
            mainThread.author?._id?.toString(),
            ].filter((id) => id !== undefined)
        );

        const uniqueCommunityIds = new Set(
            [
            ...descendantThreads.map((thread) => thread.community?._id?.toString()), // Use optional chaining to handle possible undefined values
            mainThread.community?._id?.toString(),
            ].filter((id) => id !== undefined)
        );

        // Recursively delete child threads and their descendants
        await Thread.deleteMany({ _id: { $in: descendantThreadIds } });

        // Update User model
        await User.updateMany(
            { _id: { $in: Array.from(uniqueAuthorIds) } },
            { $pull: { threads: { $in: descendantThreadIds } } }
        );
        
        // Update Community model
        await Community.updateMany(
            { _id: { $in: Array.from(uniqueCommunityIds) } },
            { $pull: { threads: { $in: descendantThreadIds } } }
        );

        revalidatePath(path);
        
    } catch (error) {
        throw new Error(`Failed to delete thread: ${error}`);
    }
        

  



}