import { FilterQuery, SortOrder } from "mongoose";
import Community from "../models/community.mode";
import Thread from "../models/thread.model";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";

export async function createCommunity(
  id: string,
  name: string,
  username: string,
  image: string,
  bio: string,
  createdById: string // Change the parameter name to reflect it's an id
) {
    try {
      connectToDB();
      
      // Find the user with the provided unique id
      const user = await User.findOne({ id: createdById });

      if(!user) {
        throw new Error("User not found");
      };

      const newCommunity = new Community({
        id,
        name,
        username,
        image,
        bio,
        createdBy: user._id, // Use the mongoose Id of the user
      });
  
      const createdCommunity = await newCommunity.save();

      //uppdate User model
      user.communities.push(createdCommunity._id);
      await user.save();
      
      return createdCommunity;
    } catch (error) {
      // Handle any errors
      console.error("Error creating community:", error);
      throw error;
    }
}

export async function fetchCommunities({
  searchString = '',
  pageNumber = 1,
  pageSize = 20,
  sortBy = 'desc'
}: {
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortOrder;
}) {
    try {
      connectToDB();

      // Calculate the number of communities to skip based on the page number and page size.
      const skipAmount = (pageNumber - 1) * pageSize;

      // Create a case-insensitive regular expression for the provided search string.
      const regex = new RegExp(searchString, "i");

      // Create an initial query object to filter communities.
      const query: FilterQuery<typeof Community> = {};

      // If the search string is not empty, add the $or operator to match either username or name fields.
      if(searchString.trim() !== '') {
        query.$or = [
          { username: { $regex: regex } },
          { name: { $regex: regex } }
        ];
      }

      // Define the sort options for the fetched communities based on createdAt field and provided sort order.
      const sortOptions = { createdAt: sortBy };

      // Create a query to fetch the communities based on the search and sort criteria.
      const communitiesQuery = Community.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize)
      .populate('members')

      // Count if there are more communities beyond the current page.
      const totalCommunitiesCount = await Community.countDocuments(query);
    
      const communities = await communitiesQuery.exec();

      // Check it there are more communities beyond the current page.
      const isNext = totalCommunitiesCount > skipAmount + communities.length;
  
      return {communities, isNext};
    } catch (error) {
      // Handle any errors
      console.error("Error fetching communities:", error);
      throw error;
    }
}

export async function fetchCommunityDetails (id: string) {
  try {
    connectToDB();

    const communityDetails = await Community.findOne({ id }).populate([
      'createdBy',
      {
        path: 'members',
        model: User,
        select: 'name username image _id id'
      },
    ]);

    return communityDetails;
  } catch (error) {
    // Handle any errors
    console.error("Error fetching community details:", error);
    throw error;
  }
}

export async function fetchCommunityThreads(id: string) {
    try {
      connectToDB();
  
      const communityThreads = await Community.findById(id).populate({
        path: "threads",
        model: Thread,
        populate: [
          {
            path: "author",
            model: User,
            select: "name image id", // Select the "name" and "_id" fields from the "User" model
          },
          {
            path: "children",
            model: Thread,
            populate: {
              path: "author",
              model: User,
              select: "image _id", // Select the "name" and "_id" fields from the "User" model
            },
          },
        ],
      });
  
      return communityThreads;
    } catch (error) {
      // Handle any errors
      console.error("Error fetching community posts:", error);
      throw error;
    }
}

export async function addMemberToCommunity(
  communityId: string,
  memberId: string
) {
    try {
      connectToDB();
  
      //Find the community by its unique id
      const community = await Community.findOne({ id: communityId });

      if(!community) {
        throw new Error("Community not found");
      }

      //Find the user by its unique id
      const user = await User.findOne({ id: memberId });

      if(!user) {
        throw new Error("User not found");
      }

      //Check if the user is already a member of the community
      if (community.members.includes(user._id)) {
        throw new Error("User is already a member of the community");
      }

      // Add the user's _id to the members array in the community model
      community.members.push(user._id);
      await community.save();

      return community;
    } catch (error) {
      // Handle any errors
      console.error("Error adding member to community:", error);
      throw error;
    }
}

export async function removeUserFromCommunity(
  userId: string,
  communityId: string
) {
    try {
        connectToDB();

        const userObjectId = await User.findOne({ id: userId }, {_id: 1});
        const communityObectId = await Community.findOne({ id: communityId }, {_id: 1});
        
        if (!userObjectId || !communityObectId) {
            throw new Error("User or community not found");
        }

        //Remove the user's _id from the members array in the community model
        await Community.updateOne(
          {_id: communityObectId._id },
          { $pull: { members: userObjectId._id } }
        );

        // remove the user's _id from the communities array in the user model
        await User.updateOne(
          { _id: userObjectId._id },
          { $pull: { communities: communityObectId._id } }
        )

        return { success: true}
    } catch (error) {
      // Handle any errors
      console.error("Error removing user from community:", error);
      throw error;
    }
}

export async function updateCommunityInfo(
  communityId: string,
  name: string,
  username: string,
  image: string
) {
    try {
      connectToDB();

      // Find teh community by its _id and update the information
      const updatedCommunity = await Community.findByIdAndUpdate(
        {id: communityId},
        {name, username, image},
      );

      if (!updatedCommunity) {
        throw new Error("Community not found");
      }

      return updatedCommunity;
    } catch (error) {
      // Handle any errors
      console.error("Error updating community info:", error);
      throw error;
    }
}

export async function deleteCommunity(communityId: string) {
    try {
      connectToDB();

      //Find the community by its unique id and remove it
      const deletedCommunity = await Community.findOneAndDelete({
        id: communityId});

      if (!deletedCommunity) {
        throw new Error("Community not found");
      }

      // Delete all theads associated with the community
      await Thread.deleteMany({ community: communityId });

      // Find all users who are members of the community and remove the community from their list
      const communityUsers = await User.find({ communities: communityId });

      //Remove the community from the users' communities array
      const updateUserPromises = communityUsers.map((user) => {
        user.communities.pull(communityId);
        return user.save();
      });

      await Promise.all(updateUserPromises);

      return deletedCommunity;
    } catch (error) {
      console.error("Error deleting community:", error);
      throw error;
    }
}