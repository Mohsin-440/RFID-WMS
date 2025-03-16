import Authenticate from '@/components/Auth/Authentication'
import Image from 'next/image'
import React, { Suspense } from 'react'
import Registration from './registerationForm'
import axios from 'axios'
import { cookies } from 'next/headers'
import { GetWarehousesResponse } from "@wsm/shared/types/getWarehousesRes"
import Authorization from '@/components/Auth/Authorization'

async function Page() {

  const nextCookies = await cookies()

  const authToken = nextCookies.get("authToken");

  if (!authToken)
    return null;

  const res = axios.get<GetWarehousesResponse>('http://localhost:4000/api/v1/warehouse', {
    withCredentials: true,
    headers: {
      Cookie: `authToken=${authToken?.value};`
    }
  })



  return (
    <Authenticate>
      <Authorization navigate={true} roles={["Admin"]}>

        <section className="flex items-center justify-center h-screen md:my-10 m-3">
          <div className="flex w-full max-w-5xl bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Left side image */}
            <div className="w-1/2 relative hidden lg:block">
              <Image
                src={"/signUp.png"}
                alt="Signup"
                layout="fill"
                objectFit="cover"
                className="h-full w-full"
              />
            </div>

            {/* Right side form */}
            <Suspense fallback={<div>Loading...</div>}>

              <Registration getWarehousesPromise={res
                .then(async ({ data }) => data)
                .catch((err) => err)}
              />
            </Suspense>
          </div>
        </section>
      </Authorization>
    </Authenticate>
  )
}

export default Page