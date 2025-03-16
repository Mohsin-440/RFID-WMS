"use client";
import Inputs from "@/components/Inputs";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { FC, useCallback, useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import Authenticate from "@/components/Auth/Authentication";
import Authorization from "@/components/Auth/Authorization";
import { Button } from "@/components/ui/button";
import { useSocketStore } from "@/store/socket.store";
import { Loader2 } from "lucide-react";
import { useUserStore } from "@/store/user.store";

// Zod schema for form validation
const parcelSchema = z.object({
  parcelName: z.string().min(1, "Parcel Name is required"),
  parcelPrice: z.string().min(1, "Parcel Price is required"),
  parcelTrackingNumber: z.string().min(1, "Parcel Tracking Number is required"),
  parcelWeight: z.string().min(1, "Parcel Weight is required"),
  senderFirstName: z.string().min(1, "Sender First Name is required"),
  senderLastName: z.string().min(1, "Sender Last Name is required"),
  senderEmail: z.string().email("Invalid email address").min(1, "Sender Email is required"),
  senderPhoneNumber: z.string().min(1, "Sender Phone Number is required"),
  senderAddress: z.string().min(1, "Sender Address is required"),
  receiverFirstName: z.string().min(1, "Receiver First Name is required"),
  receiverLastName: z.string().min(1, "Receiver Last Name is required"),
  receiverEmail: z.string().email("Invalid email address").min(1, "Receiver Email is required"),
  receiverPhoneNumber: z.string().min(1, "Receiver Phone Number is required"),
  receiverAddress: z.string().min(1, "Receiver Address is required"),
  warehouseId: z.string().min(30, "Warehouse Id is required"),
  rfidTagId: z.string().min(10, "RFID Tag Id is required"),
});

type FormData = z.infer<typeof parcelSchema>;

type ErrorResponse = {
  message: string;
  response: {
    data: {
      message: string;
    };
  };
}

type Tag = {
  readCount: number;
  rssiValue: number;
  antennaId: number;
  frequency: number;
  timestamp: number;
  tagdatalength: number;
  epclength: number;
  pc: number;
  epcId: string;
  epcCrc: string;
}
type ReaderDetails = {
  readerServerId: string;
  address: string;
  role: string;
  connectionStatus?: "connected" | "not-connected";
}
const AddParcel: FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [connectingReader, setConnectingReader] = useState(false)
  const [readingTags, setReadingTags] = useState(false)
  const [connected, setConnected] = useState(false)
  const [tag, setTag] = useState<Tag>({
    rssiValue: -210
  } as Tag)
  const { socket, socketStatuses } = useSocketStore()
  const { userInfo } = useUserStore()
  const param = useParams<{ warehouseId: string }>()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormData>({
    resolver: async (data) => {
      try {
        data.warehouseId = param.warehouseId
        parcelSchema.parse(data);
        return { values: data, errors: {} };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return {
            values: {},
            errors: error.errors.reduce(
              (
                acc: Record<string, { message: string }>,
                e: { path: (string | number)[]; message: string }
              ) => {
                const field = e.path[0];
                if (typeof field === "string") {
                  acc[field] = { message: e.message };
                }
                return acc;
              },
              {}
            ),
          };
        }
        return { values: {}, errors: {} };
      }
    },
  });

  useEffect(() => {
    if (tag.epcId) {
      setValue("rfidTagId", tag.epcId); // This sets the value dynamically
    }
  }, [tag, setValue]);

  // useMutation hook for submitting the parcel data
  const { mutate: createParcel, isPending: loadingSubmit } = useMutation({
    mutationFn: (newParcel: FormData) => {
      return axios.post("http://localhost:4000/api/v1/parcel/add", newParcel,
        { withCredentials: true }
      );
    },
    onError: (error: ErrorResponse) => {
      const errorMessage = error.response.data.message || "An error occurred";

      if (errorMessage.includes("RFID"))
        toast({
          title: "Failed to Add",
          description: errorMessage,
          variant: "destructive",
        });
      else
        toast({
          title: "Failed to Add",
          description: "An error occurred: " + error.message,
        });
    },
    onSuccess: (data) => {
      reset();
      toast({
        title: "Added Successfully",
        description: data.data.message,
      });
      router.push(`/${param.warehouseId}/parcels`);
    },
  });

  // Handle form submission
  const onSubmit: SubmitHandler<FormData> = (data) => {
    createParcel(data);
  };

  const onClickConnectReader = () => {
    setConnectingReader(true)
    setConnected(false)
    socket?.emit("client-to-server:connect-reader")
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onReaderConnected = (props: ReaderDetails) => {
    setConnectingReader(false)
    setConnected(true)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onReaderDisconnected = (props: ReaderDetails) => {
    setConnected(false)
  }

  const onClickReadingTags = () => {
    setReadingTags(true)
    socket?.emit("client-to-server:start-reading-tags")
  }
  const onClickStopReadingTags = () => {
    socket?.emit("client-to-server:stop-reading-tags")
  }
  const onTagsReadingStopped = () => {
    setReadingTags(false)
  }
  const onTagsRead = useCallback((data: Tag[]) => {

    if (!data.length)
      return;
    let highestRssiValueTag: Tag = { rssiValue: -210 } as Tag
    for (const tagData of data) {

      if (tagData.rssiValue <= highestRssiValueTag.rssiValue) {
        highestRssiValueTag = structuredClone(tagData)
      }
    }

    if (!(highestRssiValueTag.rssiValue < -210))
      return

    if (highestRssiValueTag.epcId && highestRssiValueTag.epcId !== tag.epcId) {
      setTag(highestRssiValueTag)
    } else if (highestRssiValueTag.epcId === tag.epcId) {
      setTag({ ...tag, readCount: tag.readCount++ })
    }

  }, [tag])

  useEffect(() => {
    if (socket) {
      socket.on("server-to-client:reader-connected", onReaderConnected)
      socket.on("server-to-client:reader-disconnected", onReaderDisconnected)
      socket.on("server-to-client:tags-read", onTagsRead)
      socket.on("server-to-client:tags-reading-stopped", onTagsReadingStopped)

      return () => {
        socket.removeListener("server-to-client:reader-connected", onReaderConnected)
        socket.on("server-to-client:reader-disconnected", onReaderDisconnected)
        socket.removeListener("server-to-client:tags-read", onTagsRead)
        socket.on("server-to-client:tags-reading-stopped", onTagsReadingStopped)
      }
    }
  }, [onTagsRead, socket])
  const currentWarehouse = userInfo?.warehouseUsers.find((warehouseUser) => warehouseUser.warehouse.id === param.warehouseId)
  const writer = currentWarehouse?.warehouse.readers?.find((reader) => reader.role === "Writer")

  return (
    <Authenticate>

      <Authorization roles={["Admin", "CounterMan"]} navigate={true}>
        <section className=" min-h-screen p-5 ">
          <div className="flex justify-end">
            <div className="m-5">
              {
                tag?.rssiValue
              }
            </div>
            <div className="m-5">
              {
                tag?.epcId
              }
            </div>
            <div>
              {
                tag?.readCount
              }
            </div>
            {
              socketStatuses?.connected ?
                writer
                  ? connected === false ?
                    <Button className="px-3 my-2" onClick={onClickConnectReader}>
                      {
                        connectingReader ?
                          <Loader2 className="animate-spin" />
                          : "Connect Reader"
                      }
                    </Button>
                    : !readingTags

                      ? <Button className="px-3 my-2" onClick={onClickReadingTags}>
                        Start Scanning
                      </Button>

                      : <Button className="px-3 my-2" onClick={onClickStopReadingTags}>
                        Stop Scanning
                        <Loader2 className="animate-spin" />
                      </Button>

                  : <h1 className="text-red-600">No writer configured at counter in this warehouse</h1>
                : null
            }

          </div>
          <div className=" mx-auto bg-white p-8 rounded-lg shadow-sm ">
            <h1 className="text-2xl mb-6 font-bold text-center">
              Add Parcel Details
            </h1>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Parcel Info */}
                <div className="space-y-4">
                  <Inputs
                    {...register("parcelName")}
                    type="text"
                    placeholder="Parcel Product Name"
                    error={errors.parcelName?.message}
                  />
                  <Inputs
                    {...register("parcelWeight")}
                    type="number"
                    placeholder="Parcel Product weight"
                    error={errors.parcelWeight?.message}
                  />
                </div>
                <div className="space-y-4">
                  <Inputs
                    {...register("parcelPrice")}
                    type="text"
                    placeholder="Parcel Product Price"
                    error={errors.parcelPrice?.message}
                  />
                  <Inputs
                    {...register("parcelTrackingNumber")}
                    type="text"
                    placeholder="Parcel Tracking Number"
                    error={errors.parcelTrackingNumber?.message}
                  />
                </div>
              </div>

              {/* Sender Info */}
              <div className="space-y-6 mt-8">
                <h2 className="text-lg font-bold">Sender Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  <Inputs
                    {...register("senderFirstName")}
                    type="text"
                    placeholder="First Name"
                    error={errors.senderFirstName?.message}
                  />
                  <Inputs
                    {...register("senderLastName")}
                    type="text"
                    placeholder="Last Name"
                    error={errors.senderLastName?.message}
                  />
                  <Inputs
                    {...register("senderEmail")}
                    type="email"
                    placeholder="Email"
                    error={errors.senderEmail?.message}
                  />
                  <Inputs
                    {...register("senderPhoneNumber")}
                    type="text"
                    placeholder="Phone Number"
                    error={errors.senderPhoneNumber?.message}
                  />
                  <Inputs
                    {...register("senderAddress")}
                    type="text"
                    placeholder="Address"
                    error={errors.senderAddress?.message}
                  />
                </div>
              </div>

              {/* Receiver Info */}
              <div className="space-y-6 mt-8">
                <h2 className="text-lg  font-bold">Receiver Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  <Inputs
                    {...register("receiverFirstName")}
                    type="text"
                    placeholder="First Name"
                    error={errors.receiverFirstName?.message}
                  />
                  <Inputs
                    {...register("receiverLastName")}
                    type="text"
                    placeholder="Last Name"
                    error={errors.receiverLastName?.message}
                  />
                  <Inputs
                    {...register("receiverEmail")}
                    type="email"
                    placeholder="Email"
                    error={errors.receiverEmail?.message}
                  />
                  <Inputs
                    {...register("receiverPhoneNumber")}
                    type="text"
                    placeholder="Phone Number"
                    error={errors.receiverPhoneNumber?.message}
                  />
                  <Inputs
                    {...register("receiverAddress")}
                    type="text"
                    placeholder="Address"
                    error={errors.receiverAddress?.message}
                  />
                </div>
              </div>

              <div className="flex justify-center mt-8">
                <button
                  type="submit"
                  disabled={loadingSubmit}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 duration-300"
                >
                  {loadingSubmit ? "Submitting..." : "Add Parcel Details"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </Authorization>
    </Authenticate>
  );
};

export default AddParcel;
