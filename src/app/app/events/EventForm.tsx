"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { ErrorToast } from "@/components/ui/ErrorToast";

type Workgroup = { id: string; name: string; abbreviation: string };
type Member    = { id: string; name: string; email: string };

export type EventInitialValues = {
  title:               string;
  date:                string; // YYYY-MM-DD
  category:            string;
  theme:               string | null;
  descriptionAgenda:   string | null;
  venue:               string | null;
  startTime:           string | null;
  imageBannerUrl:      string | null;
  workgroupAssignedId: string | null;
  contactPersonId:     string | null;
  featuredOnLanding:   boolean;
  postEventReportUrl:  string | null;
};

type Props = {
  workgroups:       Workgroup[];
  members:          Member[];
  defaultCategory?: string;
  /** When provided the form operates in edit mode (PATCH instead of POST). */
  eventId?:         string;
  initialValues?:   EventInitialValues;
  /** Where to redirect after a successful save. */
  redirectTo?:      string;
};

export function EventForm({
  workgroups,
  members,
  defaultCategory = "CP_EVENT",
  eventId,
  initialValues,
  redirectTo,
}: Props) {
  const router = useRouter();
  const isEdit = !!eventId;
  const iv     = initialValues;

  const [error,           setError]           = useState<string | null>(null);
  const [submitting,      setSubmitting]       = useState(false);
  const [featuredChecked, setFeaturedChecked]  = useState(iv?.featuredOnLanding ?? false);
  const [imageFile,       setImageFile]        = useState<File | null>(null);
  // imagePreview: object URL (new file) or existing URL from DB, or null
  const [imagePreview,    setImagePreview]     = useState<string | null>(iv?.imageBannerUrl ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleRemoveImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const title    = (formData.get("title") as string)?.trim();
    const date     = (formData.get("date") as string)?.trim();

    if (!title || !date) {
      setError("Title and date are required.");
      setSubmitting(false);
      return;
    }

    // Banner image is mandatory when featured on landing page
    if (featuredChecked && !imagePreview) {
      setError("A banner image is required for events featured on the landing page.");
      setSubmitting(false);
      return;
    }

    // Upload new image if one was selected
    let imageBannerUrl: string | null = imageFile ? null : imagePreview;
    if (imageFile) {
      const upload = new FormData();
      upload.append("file", imageFile);
      try {
        const uploadRes = await fetch("/api/events/upload-banner", {
          method: "POST",
          body:   upload,
        });
        const uploadData = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) {
          setError(uploadData.error ?? "Failed to upload banner image.");
          setSubmitting(false);
          return;
        }
        imageBannerUrl = uploadData.url;
      } catch {
        setError("Failed to upload banner image. Please try again.");
        setSubmitting(false);
        return;
      }
    }

    const payload = {
      title,
      date,
      category:            (formData.get("category") as string)           || defaultCategory,
      theme:               (formData.get("theme") as string)?.trim()             || null,
      descriptionAgenda:   (formData.get("descriptionAgenda") as string)?.trim() || null,
      venue:               (formData.get("venue") as string)?.trim()              || null,
      startTime:           (formData.get("startTime") as string)?.trim()          || null,
      imageBannerUrl,
      workgroupAssignedId: (formData.get("workgroupAssignedId") as string)?.trim() || null,
      contactPersonId:     (formData.get("contactPersonId") as string)?.trim()    || null,
      featuredOnLanding:   featuredChecked,
      postEventReportUrl:  (formData.get("postEventReportUrl") as string)?.trim() || null,
    };

    const url    = isEdit ? `/api/events/${eventId}` : "/api/events";
    const method = isEdit ? "PATCH" : "POST";

    try {
      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }
      const dest = redirectTo ?? (isEdit ? `/app/events/${eventId}` : "/app/events/cp-events");
      router.push(dest);
      router.refresh();
    } catch {
      setError("Something went wrong.");
      setSubmitting(false);
    }
  }

  const cat = iv?.category ?? defaultCategory;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ErrorToast message={error} onClose={() => setError("")} />

      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-700">
          Title <span className="text-red-600">*</span>
        </label>
        <input
          id="title" name="title" type="text" required className="input"
          placeholder="e.g. Lenten Recollection"
          defaultValue={iv?.title ?? ""}
        />
      </div>

      <div>
        <label htmlFor="date" className="mb-1 block text-sm font-medium text-slate-700">
          Date <span className="text-red-600">*</span>
        </label>
        <input id="date" name="date" type="date" required className="input" defaultValue={iv?.date ?? ""} />
      </div>

      <div>
        <label htmlFor="category" className="mb-1 block text-sm font-medium text-slate-700">
          Category <span className="text-red-600">*</span>
        </label>
        <select id="category" name="category" defaultValue={cat} className="input">
          <option value="CP_EVENT">CP Event</option>
          <option value="MGM">MGM Meeting</option>
          <option value="KACHAI">Kachai</option>
        </select>
      </div>

      <div>
        <label htmlFor="startTime" className="mb-1 block text-sm font-medium text-slate-700">
          Start time (optional)
        </label>
        <input id="startTime" name="startTime" type="time" className="input" defaultValue={iv?.startTime ?? ""} />
      </div>

      <div>
        <label htmlFor="venue" className="mb-1 block text-sm font-medium text-slate-700">Venue</label>
        <input id="venue" name="venue" type="text" className="input"
          placeholder="e.g. St. Kizito Room" defaultValue={iv?.venue ?? ""} />
      </div>

      <div>
        <label htmlFor="theme" className="mb-1 block text-sm font-medium text-slate-700">Theme</label>
        <input id="theme" name="theme" type="text" className="input"
          placeholder="Optional theme" defaultValue={iv?.theme ?? ""} />
      </div>

      <div>
        <label htmlFor="descriptionAgenda" className="mb-1 block text-sm font-medium text-slate-700">
          Description / Agenda
        </label>
        <textarea
          id="descriptionAgenda" name="descriptionAgenda" rows={4}
          className="input input-textarea" placeholder="Brief description or agenda"
          defaultValue={iv?.descriptionAgenda ?? ""}
        />
      </div>

      <div>
        <label htmlFor="workgroupAssignedId" className="mb-1 block text-sm font-medium text-slate-700">
          Workgroup
        </label>
        <select id="workgroupAssignedId" name="workgroupAssignedId" className="input"
          defaultValue={iv?.workgroupAssignedId ?? ""}>
          <option value="">— None —</option>
          {workgroups.map((wg) => (
            <option key={wg.id} value={wg.id}>{wg.name} ({wg.abbreviation})</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="contactPersonId" className="mb-1 block text-sm font-medium text-slate-700">
          Contact person
        </label>
        <select id="contactPersonId" name="contactPersonId" className="input"
          defaultValue={iv?.contactPersonId ?? ""}>
          <option value="">— None —</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Featured on landing page */}
      <div className="flex items-center gap-2">
        <input
          id="featuredOnLanding"
          name="featuredOnLanding"
          type="checkbox"
          checked={featuredChecked}
          onChange={(e) => setFeaturedChecked(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
        />
        <label htmlFor="featuredOnLanding" className="text-sm font-medium text-slate-700">
          Feature on landing page
        </label>
      </div>

      {/* Banner image upload */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Banner Image
          {featuredChecked && <span className="ml-1 text-red-600">*</span>}
          {!featuredChecked && <span className="ml-1 font-normal text-slate-400">(optional)</span>}
        </label>

        {imagePreview ? (
          <div className="space-y-2">
            {/* Preview */}
            <div className="relative overflow-hidden rounded-xl border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Banner preview"
                className="h-40 w-full object-cover"
              />
            </div>
            {/* Replace / Remove */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-medium text-primary hover:underline"
              >
                Replace image
              </button>
              <span className="text-slate-300">·</span>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="text-xs font-medium text-red-500 hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500 transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
          >
            <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <span>Click to upload a banner image</span>
            <span className="text-xs text-slate-400">JPEG, PNG, WebP or GIF · max 5 MB</span>
          </button>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleImageChange}
        />

        {featuredChecked && !imagePreview && (
          <p className="mt-1.5 text-xs text-red-600">
            A banner image is required when featuring this event on the landing page.
          </p>
        )}
      </div>

      {/* Post-event report */}
      <div>
        <div className="mb-1 flex items-center gap-1.5">
          <label htmlFor="postEventReportUrl" className="text-sm font-medium text-slate-700">
            Post-Event Report (Google Drive link)
          </label>
          <span className="group relative inline-flex">
            <svg className="h-4 w-4 cursor-help text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-64 -translate-x-1/2 rounded-lg bg-slate-800 px-3 py-2 text-xs leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              A Google Drive link to the post-event report — should include a detailed description of the event, attendance records, and lessons learnt.
              <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
            </span>
          </span>
        </div>
        <input
          id="postEventReportUrl" name="postEventReportUrl" type="url" className="input"
          placeholder="https://drive.google.com/…"
          defaultValue={iv?.postEventReportUrl ?? ""}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit" disabled={submitting}
          className="inline-flex min-h-[44px] items-center gap-2 justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary-light disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          {submitting && (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Add event"}
        </button>
        <button
          type="button" onClick={() => router.back()}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
