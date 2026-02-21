"use client";

import { BriefcaseBusiness, Globe, Linkedin, Mail, MapPin, Phone, User } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import type { Resume } from "@/constants/dummy";

/**
 * Props for the PersonalInfoForm component.
 *
 * @property data - Personal information section data
 * @property onChangeAction - Callback when any personal info field changes
 * @property removeBackground - Whether to remove the profile image background
 * @property setRemoveBackgroundAction - Callback to toggle background removal
 */
export interface PersonalInfoFormProps {
  data: Resume["personalInfo"];
  onChangeAction: (data: Resume["personalInfo"]) => void;
  removeBackground: boolean;
  setRemoveBackgroundAction: (value: boolean) => void;
}

/**
 * Field configuration for personal info form inputs.
 */
const FIELDS: {
  key: keyof Resume["personalInfo"];
  label: string;
  icon: typeof User;
  type: string;
  required: boolean;
}[] = [
  { key: "fullName", label: "Full Name", icon: User, type: "text", required: true },
  { key: "email", label: "Email", icon: Mail, type: "email", required: true },
  { key: "phone", label: "Phone", icon: Phone, type: "tel", required: true },
  { key: "location", label: "Location", icon: MapPin, type: "text", required: true },
  { key: "profession", label: "Profession", icon: BriefcaseBusiness, type: "text", required: true },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin, type: "url", required: true },
  { key: "website", label: "Personal Website", icon: Globe, type: "url", required: false },
];

/**
 * Form for editing resume personal information section.
 * Includes profile image upload with background removal toggle and
 * input fields for name, email, phone, location, profession, LinkedIn, and website.
 *
 * @param props - Form configuration with data and change handlers
 * @returns Personal info form with image upload and text fields
 */
export default function PersonalInfoForm({
  data,
  onChangeAction,
  removeBackground,
  setRemoveBackgroundAction,
}: PersonalInfoFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageChange(field: keyof Resume["personalInfo"], value: string) {
    onChangeAction({
      ...data,
      [field]: value,
    });
  }

  function handleClickUpload() {
    fileInputRef.current?.click();
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const imageUrl = e.target.files?.[0] ? URL.createObjectURL(e.target.files[0]) : "";
    handleImageChange("image", imageUrl);
  }

  return (
    <div>
      <h3 className="font-semibold text-lg text-slate-800">Personal Information</h3>
      <p className="text-slate-600 text-sm">Get Started with the personal information</p>
      <div className="flex items-center gap-2">
        <label htmlFor="">
          {data.image ? (
            <button onClick={handleClickUpload} type="button">
              <Image
                src={data.image}
                alt="Profile image"
                className="mt-5 h-16 w-16 rounded-full object-cover ring ring-slate-300 hover:opacity-80"
                width={64}
                height={64}
              />
            </button>
          ) : (
            <button
              className="mt-5 inline-flex cursor-pointer items-center gap-2 text-slate-600 hover:text-slate-700"
              onClick={handleClickUpload}
              type="button"
            >
              <User className="size-10 rounded-full border p-2.5" />
              Upload Profile Image
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg, image/png"
            className="hidden"
            onChange={onInputChange}
          />
        </label>
        {data.image && (
          <div className="flex flex-col gap-1 pl-4 text-sm">
            <p>Remove Background</p>
            <label className="relative inline-flex cursor-pointer items-center gap-3 text-slate-800">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={removeBackground}
                onChange={() => setRemoveBackgroundAction(!removeBackground)}
              />
              <div className="peer h-5 w-9 rounded-full bg-slate-300 transition-colors duration-200 peer-checked:bg-primary-600"></div>
              <span className="dot absolute top-1 left-1 h-3 w-3 rounded-full bg-white transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
            </label>
          </div>
        )}
      </div>

      {FIELDS.map(({ icon: Icon, key, label, type, required }) => {
        return (
          <div key={key} className="mt-5 space-y-1">
            <label htmlFor={key} className="flex items-center gap-2 font-medium text-slate-600 text-sm">
              <Icon className="size-4" />
              {label}
              {required && <span className="text-red-500">*</span>}
            </label>
            <input
              id={key}
              type={type}
              value={data[key]}
              required={required}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleImageChange(key, e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-primary-500 focus:ring focus:ring-primary-500"
              placeholder={`Enter your ${label.toLowerCase()}`}
            />
          </div>
        );
      })}
    </div>
  );
}
