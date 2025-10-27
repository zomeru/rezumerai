// biome-ignore-all lint: Current file is under heavy development
// @ts-asdasdnocheck

import { User } from "lucide-react";
import Image from "next/image";
import type { ResumeData } from "@/constants/dummy";

type PersonalInfoFormProps = {
  data: ResumeData["personal_info"];
  onChange: (data: ResumeData["personal_info"]) => void;
  removeBackground: boolean;
  setRemoveBackground: (value: boolean | ((prev: boolean) => boolean)) => void;
};

export default function PersonalInfoForm({
  data,
  onChange,
  removeBackground,
  setRemoveBackground,
}: PersonalInfoFormProps) {
  const handleImageChange = (field: keyof ResumeData["personal_info"], value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  return (
    <div>
      <h3 className="font-semibold text-gray-900 text-lg">Personal Information</h3>
      <p className="text-gray-600 text-sm">Get Started with the personal information</p>
      <div className="flex items-center gap-2">
        <label htmlFor="">
          {data?.image ? (
            <Image
              src={data.image}
              alt="Profile image"
              className="mt-5 h-16 w-16 rounded-full object-cover ring ring-slate-300 hover:opacity-80"
              width={64}
              height={64}
            />
          ) : (
            <div className="inline-flex items-center gap-2 mt-5 text-slate-600 hover:text-slate-700 cursor-pointer">
              <User className="size-10 rounded-full border p-2.5" />
              Upload Profile Image
            </div>
          )}
          <input
            type="file"
            accept="image/jpeg, image/png"
            className="hidden"
            onChange={(e) =>
              handleImageChange("image", e.target.files?.[0] ? URL.createObjectURL(e.target.files[0]) : "")
            }
          />
        </label>
        {data?.image && (
          <div className="flex flex-col gap-1 pl-4 text-sm">
            <p>Remove Background</p>
            <label className="relative inline-flex items-center cursor-pointer text-gray-900 gap-3">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={removeBackground}
                onChange={() => setRemoveBackground((prev) => !prev)}
              />
              <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-primary-600 transition-colors duration-200"></div>
              <span className="dot absolute left-1 top-1 w-3 h-3 bh-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
