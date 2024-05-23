
import mongoose from "mongoose";

const threadSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Community",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  parentId: {
    type: String,
  },
  children: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread",
    },
  ],
});

// if the mongoose.models.Object(something) is saying its undefined, its because the file where we are calling it is not 'use server'
// we cannot create database requests right in the browser, it needs to be done on th server side
 
const Thread = mongoose.models.Thread || mongoose.model("Thread", threadSchema);

export default Thread;
