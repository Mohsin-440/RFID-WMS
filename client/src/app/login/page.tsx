"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Inputs from "../../components/Inputs"; // custom input component
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { setLocalStorage } from "@/lib/local-storage";
import { useUserStore } from "@/store/user.store";
import { Login as LoginType } from "@wsm/shared/types/login"
// Define Validation Schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email("Invalid email format"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

interface myError extends Error {
  response: {
    data: {
      message: string;
    };
  };
}

const Login: React.FC = () => {
  const { setUserInfo } = useUserStore()
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const { toast } = useToast();

  const { mutate, isPending } = useMutation({
    mutationFn: (newUser: LoginFormInputs) => {
      return axios.post<LoginType["res"]>(
        "http://localhost:4000/api/v1/user/login",
        newUser,
        {
          withCredentials: true,
        }
      );
    },
    onError: (error: myError) => {
      toast({
        title: "Action Failed",
        description: error.response.data.message,
        variant: "destructive",
      }); 
    },
    onSuccess: (data) => {
      toast({
        title: "Login Successfully",
        description: data.data.message,
      });

      try {
        setLocalStorage("user-info", data.data.user);
        setUserInfo(data.data.user);
        router.push(`/${data.data.user.warehouseUsers[0].warehouse.id}/dashboard`);
      } catch (error) {
        console.log({ error })
      }
    },
  });

  const onSubmit = (data: LoginFormInputs) => {
    mutate(data);
  };

  return (
    <section className="flex flex-col md:flex-row justify-center items-center px-4 md:px-60 py-10 md:h-[calc(100vh-75px)]">
      {/* Left side image */}
      <div className="flex w-full md:w-1/2 justify-center items-center mb-8 md:mb-0">
        <Image
          src={"/login.png"}
          alt="Login"
          width={500}
          height={500}
          className="max-w-full max-h-full object-cover"
        />
      </div>

      {/* Right side form */}
      <div className="flex flex-col gap-4 p-6 w-full max-w-[450px]">
        {/* Heading and subtext */}
        <div>
          <h3 className="text-2xl font-semibold text-center md:text-left">
            Login
          </h3>
          <p className="text-sm mt-4 text-gray-600 text-center md:text-left">
            Welcome back to our{" "}
            <span className="text-blue-700 uppercase">RFidWare</span> platform.
          </p>
          <p className="text-sm text-gray-600 text-center md:text-left">
            Please enter your details.
          </p>
        </div>

        {/* Form with input fields */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col ">
          <Inputs
            type="email"
            placeholder="Email"
            {...register("email")}
            error={errors.email?.message} // email error
          />
          <Inputs
            type="password"
            placeholder="Password"
            {...register("password")}
            error={errors.password?.message} // password error
          />

          {/* Remember me checkbox */}
          <div className="flex items-center mt-4">
            <input type="checkbox" className="cursor-pointer" />
            <p className="text-sm ml-2">Remember me</p>
          </div>

          {/* Login button */}
          <button
            type="submit"
            className="bg-blue-600 w-full mt-6 px-4 py-2 rounded-md text-white font-semibold hover:bg-blue-800 duration-300"
          >
            {isPending ? "Logging..." : "Login"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default Login;
