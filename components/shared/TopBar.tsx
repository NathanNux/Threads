'use client'
import { OrganizationSwitcher, SignOutButton, SignedIn, useUser } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import Image from "next/image"
import Link from "next/link"


function TopBar () {
    const { isSignedIn } = useUser()

    return (
        <nav className="topbar">
            <Link
                className="flex items-center gap-4"
                href='/'
            >
                <Image 
                    src='/assets/logo.svg'
                    alt="logo"
                    width={28}
                    height={28}
                />
                <p className="text-heading3-bold text-light-1 max-xs:hidden">
                    Threads
                </p>
            </Link>

            <div className="items-center flex gap-1">
                <div className="block md:hidden">
                    <SignedIn
                        //this will automatically check if the user is singed in or not
                    >
                        <SignOutButton>
                            <div className="flex cursor-pointer">
                                <Image 
                                    src='/assets/logout.svg'
                                    alt="logout"
                                    width={24}
                                    height={24}
                                />
                            </div>
                        </SignOutButton>
                    </SignedIn>
                </div>

                { isSignedIn   ? 
                    (<OrganizationSwitcher 
                        //look into the docs for more info
                        appearance={{
                            elements: {
                                organizationSwitcherTrigger: 'py-2 px-4'
                            },
                            baseTheme: dark
                        }}
                    />) : (
                        <Link href="/sign-in" className="flex bg-indigo-400 py-2 px-5 rounded-xl hover:bg-white transition-all ease-in-out">

                            <p className="text-base-semibold">
                                Sign In
                            </p>
                        </Link>
                    )
                }    
            </div>
        </nav>
    )
}

export default TopBar