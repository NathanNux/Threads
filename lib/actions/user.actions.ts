'use server'
import { revalidatePath } from 'next/cache';
import { connectToDB } from '../mongoose'
import User from '../models/user.model';
import Community from '../models/community.mode';
import Thread from '../models/thread.model';
import { FilterQuery, SortOrder } from 'mongoose';
import { AnyMxRecord } from 'dns';


interface Params {
    userId: string,
    bio: string,
    name: string,
    path: string,
    username: string,
    image: string
}

export async function fetchUser(userId: string) {
    try {
      connectToDB();
  
      return await User.findOne({ id: userId }).populate({
        path: "communities",
        model: Community,
        // this will populate the communities field with the data from the Community model if a user is in the community
      });
    } catch (error: any) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
  }
  

export async function updateUser({
    userId,
    bio,
    name,
    path,
    username,
    image
}: Params): Promise<void> {
    // promise void is a promise that returns nothing so it will do the action but not return a value that it did it
    // you don't need to return a value because you are updating the user's data

    // this function will update the user's data
    try {
        connectToDB();

        await User.findOneAndUpdate(
            { id: userId },
            // if the user does not exist, it will create a new one
            // if the user exists, it will update the user with the new data by his id
            //otherwise it will create a new user and give him and id and the data
            {
                bio, 
                name, 
                username: username.toLowerCase(), 
                image,
                onboarded: true 
            },
            { upsert: true }
            // this option will create or update a document
        );

        if(path === '/profile/edit') {
            revalidatePath(path);
            // this function will revalidate the path or getting the data and fire the data to the database
        }
    } catch (error: any) {
        throw new Error(`Failed to update user: ${error.message}`);
    }  
}

// TODO: populate the communities
export async function fetchUserThreads (userId: string) {
    try {
        connectToDB();
    
        // Find all threads authored by the user with the given userId
        const threads = await User.findOne({ id: userId }).populate({
          path: "threads",
          model: Thread,
          populate: [
            {
              path: "community",
              model: Community,
              select: "name id image _id", // Select the "name" and "_id" fields from the "Community" model
            },
            {
              path: "children",
              model: Thread,
              populate: {
                path: "author",
                model: User,
                select: "name image id", // Select the "name" and "_id" fields from the "User" model
              },
            },
          ],
        });
        return threads;
      } catch (error) {
        console.error("Error fetching user threads:", error);
        throw error;
      }
}


// Almost similar to Thead (search + pagination) and Community (search + pagination)
export async function fetchUsers({
  userId,
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = "desc",
}: {
  userId: string;
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortOrder;
}) {
  try {
    connectToDB();

    // Calculate the number of users to skip based on the page number and page size.
    const skipAmount = (pageNumber - 1) * pageSize;

    // Create a case-insensitive regular expression for the provided search string.
    const regex = new RegExp(searchString, "i");

    // Create an initial query object to filter users.
    const query: FilterQuery<typeof User> = {
      id: { $ne: userId }, // Exclude the current user from the results.
    };

    // If the search string is not empty, add the $or operator to match either username or name fields.
    if (searchString.trim() !== "") {
      query.$or = [
        { username: { $regex: regex } },
        { name: { $regex: regex } },
      ];
    }

    // Define the sort options for the fetched users based on createdAt field and provided sort order.
    const sortOptions = { createdAt: sortBy };

    const usersQuery = User.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize);

    // Count the total number of users that match the search criteria (without pagination).
    const totalUsersCount = await User.countDocuments(query);

    const users = await usersQuery.exec();

    // Check if there are more users beyond the current page.
    const isNext = totalUsersCount > skipAmount + users.length;

    return { users, isNext };
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}



export async function getActivity(userId: string) {
    try {
      connectToDB();

      // Find the user with the given userId and populate the "activity" field.
        const userThreads = await Thread.find({author: userId})

        //we want to get all the child threads ids to the user threads (replies) from the children fields

        const childThreadsIds = userThreads.reduce((acc, userThread) => {
          return acc.concat(userThread.children); // <-- Use 'concat', not 'contact'
        }, []);

        // it will go through all children and get them, it will accumulate it and keep track of all the children threads ids and it will get the new user threads and get all the children threads ids and it will keep track of all the children threads ids
        const replies = await Thread.find({ 
          _id: { $in: childThreadsIds },
          author: { $ne: userId }
        }).populate({
          path: "author",
          model: User,
          select: "name image _id",
        });

        return replies
    } catch (error: any) {
        throw new Error(`Failed to fetch user activity: ${error.message}`);
    }
}