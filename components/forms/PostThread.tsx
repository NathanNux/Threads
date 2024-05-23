"use client";

import * as z from "zod";

import { useForm } from "react-hook-form";
import { usePathname, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThreadValidation } from "@/lib/validations/thread";
import { CreateThread } from "@/lib/actions/thread.actions";




interface Props {
    user: {
      id: string;
      objectId: string;
      username: string;
      name: string;
      bio: string;
      image: string;
    };
    btnTitle: string;
}

export default function PostThread ({ userId }: { userId: string}  ) {

  const router = useRouter();
  const pathname = usePathname();


  // this hook will create a form with the validation schema
  // its default values will be the user's data or replaced for those data the user will update

  const form = useForm<z.infer<typeof ThreadValidation>>({
    resolver: zodResolver(ThreadValidation),
    defaultValues: {
      thread: '',
      accountId: userId,
    },
  });

  //where is the values coming from?
  // the values are the data that the user will input in the form --> react hook form onSubmit
  const onSubmit = async (values: z.infer<typeof ThreadValidation>) => {
    await CreateThread({ 
        text: values.thread, 
        author: userId, 
        communityId: null, 
        path: pathname 
    });

    router.push('/')
  }


    return (
        <Form {...form}>
            <form
                className=' mt-10 flex flex-col justify-start gap-10'
                onSubmit={form.handleSubmit(onSubmit)}
                // we are passing the form data to the onSubmit function that will check it and send it to the database
            >
                <FormField
                    control={form.control}
                    name='thread'
                    render={({ field }) => (
                        <FormItem className='flex w-full flex-col gap-3'>
                        <FormLabel className='text-base-semibold text-light-2'>
                            Your Thread
                        </FormLabel>
                        <FormControl>
                            <Textarea 
                                className="no-focus border boder-dark-4 bg-dark-3 text-light-1"
                                placeholder='Write your thread here...'
                                rows={15}
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type='submit' className='bg-primary-500 max-w-[150px]'>
                    Post Thread
                </Button>
            </form>
        </Form>
    )
}