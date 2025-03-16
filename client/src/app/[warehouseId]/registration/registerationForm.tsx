"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChangeEvent, use, useState } from "react";
import { useForm } from "react-hook-form";
import Inputs from "../../../components/Inputs"; // Custom input component
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useToast } from "@/hooks/use-toast";
import { RegisterValidator, registerValidatorsss } from "@wsm/shared/validators/registerValidator";
import { GetWarehousesResponse } from "@wsm/shared/types/getWarehousesRes"
import { Role } from "@wsm/shared/types/enums";

const roles = ["CounterMan", "Manager", "Worker"] as Role[]


const Registration = ({ getWarehousesPromise }: { getWarehousesPromise: Promise<GetWarehousesResponse> }) => {
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const gotWarehouse = use(getWarehousesPromise)
    const { toast } = useToast();

    const { register, handleSubmit, setError, formState: { errors }, reset } = useForm<RegisterValidator & { profilePicture: File | null }>({
        resolver: zodResolver(registerValidatorsss),
    });

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProfilePicture(e.target.files[0]);
        }
    };
    const mutation = useMutation({
        mutationFn: async (data: RegisterValidator & { profilePicture: File | null; }) => {
            const formData = new FormData();
            formData.append("firstName", data.firstName);
            formData.append("lastName", data.lastName);
            formData.append("email", data.email);
            formData.append("password", data.password);
            formData.append("role", data.role);
            formData.append("warehouseId", data.warehouseId);
            if (data.profilePicture)
                formData.append("profilePicture", data.profilePicture); // Use profileImage for consistency

            const response = await axios.post(
                "http://localhost:4000/api/v1/user/register",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            return response.data;
        },
        onSuccess: () => {
            toast({
                title: "Registration successful",
                description: "Employee has been registered successfully.",
            });
            reset();
        },
        onError: (err) => {
            if (err instanceof AxiosError) {
                for (const [key, value] of Object.entries(err.response?.data)) {
                    console.log(key, value);
                    setError(key as keyof RegisterValidator, { type: "server", message: value as string });
                }
            }
            toast({
                title: "Registration failed",
                description: "Failed to register employee. Please try again.",
            });
        },
    });

    const onSubmit = (data: RegisterValidator) => {
        mutation.mutate({
            ...data,
            profilePicture: profilePicture,
        });
    };

    return (
        <div className="flex flex-col gap-4 p-10 w-full lg:w-1/2">
            <div>
                <h3 className="text-2xl font-semibold">User Registration</h3>
                <p className="text-sm mt-2 text-gray-600">
                    Create an account to get started.
                </p>
            </div>

            {/* Form with input fields */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Inputs
                    type="text"
                    placeholder="First Name"
                    {...register("firstName")}
                    error={errors.firstName?.message}
                />
                <Inputs
                    type="text"
                    placeholder="Last Name"
                    {...register("lastName")}
                    error={errors.lastName?.message}
                />
                <Inputs
                    type="email"
                    placeholder="Email"
                    {...register("email")}
                    error={errors.email?.message}
                />
                <Inputs
                    type="password"
                    placeholder="Password"
                    {...register("password")}
                    error={errors.password?.message}
                />


                <div>
                    <label className="text-gray-600 text-sm">Select Warehouse</label>
                    <select
                        {...register("warehouseId")}
                        className="mt-2 block w-full text-sm border border-gray-300 rounded-md p-2 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="" disabled>
                            select a warehouse
                        </option>
                        {
                            gotWarehouse?.data?.map((warehouse) => (
                                <option value={warehouse.id} key={`${warehouse.id}-role`}>{warehouse.warehouseName}</option>
                            ))
                        }

                    </select>
                    {errors.role && (
                        <p className="text-red-600 text-sm mt-1">
                            {errors.role.message}
                        </p>
                    )}
                </div>
                <div>
                    <label className="text-gray-600 text-sm">Select Role</label>
                    <select
                        {...register("role")}
                        className="mt-2 block w-full text-sm border border-gray-300 rounded-md p-2 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="" disabled>
                            Choose your role
                        </option>
                        {
                            roles.map((role) => (
                                <option value={role} key={`${role}-role`}>{role}</option>
                            ))
                        }

                    </select>
                    {errors.role && (
                        <p className="text-red-600 text-sm mt-1">
                            {errors.role.message}
                        </p>
                    )}
                </div>

                {/* Profile image upload */}
                <div>
                    <label className="text-gray-600 text-sm">Profile Picture</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-800"
                    />
                </div>

                {/* Signup button */}
                <button
                    type="submit"
                    className="bg-blue-600 w-full mt-4 px-4 py-2 rounded-md text-white font-semibold hover:bg-blue-800 duration-300"
                    disabled={mutation.isPending}
                >
                    {mutation.isPending ? "Registering..." : "Register User"}
                </button>

                {mutation.isError && (
                    <div className="mt-2 text-red-600">
                        Error: {mutation.error?.message}
                    </div>
                )}
            </form>
        </div>
    );
};

export default Registration;



// 