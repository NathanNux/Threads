import * as z from "zod";
// this is for validation of thread's data, every time user updates the thread, the data will be validated
export const ThreadValidation = z.object({
    thread: z.string().min(3, { message: 'Minimum 3 characters'}).max(200),
    accountId: z.string(),
});

export const CommentValidation = z.object({
    thread: z.string().min(3, { message: 'Minimum 3 characters'}).max(200),
    // could add here the userId of the user who commented so it can be showed in the thread
});