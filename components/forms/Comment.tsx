'use client'
import { addCommentToThread } from "@/lib/actions/thread.actions";
import { CommentValidation } from "@/lib/validations/thread";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import Image from "next/image";
import { Button } from "../ui/button";

interface Props {
    threadId: string;
    currentUserImg: string;
    currentUserId: string;
}

export default function Commnet ({ threadId, currentUserImg, currentUserId }: Props) {

    const pathname = usePathname();

    const form = useForm<z.infer<typeof CommentValidation>>({
        resolver: zodResolver(CommentValidation),
        defaultValues: {
            thread: ''
        },
    });

    const onSubmit = async (values: z.infer<typeof CommentValidation>) => {
        await addCommentToThread(
            threadId,
            values.thread,
            JSON.parse(currentUserId),
            pathname
        )

        form.reset();
    }

    return (
        <Form
            {...form}
        >
            <form className="comment-form"
                onSubmit={form.handleSubmit(onSubmit)}
            >  
            <FormField 
                control={form.control}
                name="thread"
                render={({ field }) => (
                    <FormItem className="flex w-full items-center gap-3">
                        <FormLabel>
                            <Image 
                                src={currentUserImg}
                                alt="user"
                                width={48}
                                height={48}
                                className="rounded-full object-cover"
                            />
                        </FormLabel>
                        <FormControl className="border-none bg-transparent">
                            <Input 
                                type='text'
                                {...field}
                                placeholder='Add a comment'
                                className="no-focus text-light-1 outline-none"
                            />
                        </FormControl>
                    </FormItem>
                )}
            /> 

            <Button type='submit' className="comment-form_btn mt-2">
                Reply
            </Button>
            </form>
        </Form>
    )
}