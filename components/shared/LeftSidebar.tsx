'use client'
import { sidebarLinks } from "@/constants"
import { SignOutButton, SignedIn, useAuth, useUser } from "@clerk/nextjs"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

function LeftSidebar () {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  // this is used to the the current user id with the useAuth hook wihtout curerntUser()
  const { userId } = useAuth();

  return (
    <section className='custom-scrollbar leftsidebar'>
      <div className='flex w-full flex-1 flex-col gap-6 px-6'>
        {sidebarLinks.map((link) => {
          const isActive =
            (pathname.includes(link.route) && link.route.length > 1) ||
            pathname === link.route;
          // if the link is profile, we need to append the user id to the route to get the user profile
          if (link.route === "/profile") link.route = `${link.route}/${userId}`;
            return (
              <Link 
                key={link.label} 
                href={link.route} 
                className={`leftsidebar_link cursor-pointer ${isActive && 'bg-primary-500'}`}
              >
                <Image 
                  src={link.imgURL}
                  alt={link.label}
                  width={24}
                  height={24}
                />
                <p className="text-light-1 font-semibold text-[18px] xl:text-[20px] max-lg:hidden">{link.label}</p>
              </Link>
            )
          })}
        </div>   

        <div className='mt-10 px-6'>
        { isSignedIn ? (<SignedIn>
          <SignOutButton redirectUrl='/sign-in'>
            <div className='flex cursor-pointer gap-4 p-4'>
              <Image
                src='/assets/logout.svg'
                alt='logout'
                width={24}
                height={24}
              />

              <p className='text-light-2 max-lg:hidden'>Logout</p>
            </div>
          </SignOutButton>
        </SignedIn>
        ) : (
          <Link href='/sign-in' className="flex gap-2">
            <Image
              src='/assets/logout.svg'
              alt='logout'
              width={24}
              height={24}
            />
            <p className='text-base-semibold text-light-1'>Sign In</p>
          </Link>
        
        )}
      </div>
      </section>
  )
}

export default LeftSidebar

