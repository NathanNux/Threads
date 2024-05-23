import PostThread from "@/components/forms/PostThread"
import { fetchUser } from "@/lib/actions/user.actions"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"



export default async function CreateThread() {
    const user = await currentUser()
    if (!user) {
        return redirect("/sign-in")
    }
    //clerk may automatically redirect the user to sign-in page without needing this ther and just returning null

    const userInfo = await fetchUser(user.id)

    if(!userInfo?.onboarded) {
        return redirect("/onboarding")
        //redirects to onboarding page if user has not onboarded, may just found it or type it to the url
    }
    
    return (
        <>
            <h1 className="head-text">Create Thread</h1>

            <PostThread 
                userId={userInfo._id}
        
            />
        </>
    )
}