"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { saveProductAction } from "@/app/admin/actions/products";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, PlusIcon, StarIcon, TrashIcon, UploadIcon } from "@/components/icons";
import { Notice } from "@/components/ui/Notice";
import { fieldErrors } from "@/lib/validation/common";
import { productInput } from "@/lib/validation/product";
import { CLIENT_MAX_UPLOAD_MB, ErrorSummary, SelectField, TextArea, TextField, Toggle, uploadFile } from "./fields";

export interface ImageValue {
  url: string;
  storageKey: string | null;
  provider: "STATIC" | "LOCAL" | "CLOUDINARY";
  alt: string;
  width: number | null;
  height: number | null;
  isPrimary: boolean;
}
export interface GemValue {
  type: string;
  colour: string;
  cut: string;
  shape: string;
  clarity: string;
  caratWeight: string;
  count: string;
  origin: string;
  treatment: string;
}
export interface CertValue {
  issuer: string;
  certificateNumber: string;
  reportDate: string;
  verificationUrl: string;
  fileUrl: string | null;
  fileKey: string | null;
  fileProvider: "STATIC" | "LOCAL" | "CLOUDINARY" | null;
  fileType: string | null;
  notes: string;
}
export interface ProductFormState {
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  availability: "IN_STOCK" | "MADE_TO_ORDER" | "ON_REQUEST" | "SOLD_OUT";
  stockQuantity: string;
  price: string;
  salePrice: string;
  jewelleryType: string;
  material: string;
  metalPurity: string;
  metalColour: string;
  hallmarkDetails: string;
  grossWeightGrams: string;
  netWeightGrams: string;
  dimensions: string;
  size: string;
  otherDetails: string;
  careInstructions: string;
  tags: string[];
  isFeatured: boolean;
  isNewArrival: boolean;
  seoTitle: string;
  seoDescription: string;
  categoryIds: string[];
  images: ImageValue[];
  gemstones: GemValue[];
  certifications: CertValue[];
}

export const EMPTY_PRODUCT: ProductFormState = {
  name: "",
  slug: "",
  sku: "",
  shortDescription: "",
  description: "",
  status: "DRAFT",
  availability: "IN_STOCK",
  stockQuantity: "",
  price: "",
  salePrice: "",
  jewelleryType: "",
  material: "",
  metalPurity: "",
  metalColour: "",
  hallmarkDetails: "",
  grossWeightGrams: "",
  netWeightGrams: "",
  dimensions: "",
  size: "",
  otherDetails: "",
  careInstructions: "",
  tags: [],
  isFeatured: false,
  isNewArrival: true,
  seoTitle: "",
  seoDescription: "",
  categoryIds: [],
  images: [],
  gemstones: [],
  certifications: [],
};

const EMPTY_GEM: GemValue = { type: "", colour: "", cut: "", shape: "", clarity: "", caratWeight: "", count: "", origin: "", treatment: "" };
const EMPTY_CERT: CertValue = { issuer: "", certificateNumber: "", reportDate: "", verificationUrl: "", fileUrl: null, fileKey: null, fileProvider: null, fileType: null, notes: "" };

const SUGGESTIONS = {
  types: ["Fine Jewellery", "Gold Jewellery", "Silver Jewellery", "Diamond Jewellery", "Kundan", "Polki", "Temple Jewellery", "Bridal", "Loose Gemstone"],
  materials: ["Yellow Gold", "White Gold", "Rose Gold", "Platinum", "Sterling Silver", "Gold-plated Silver", "Brass"],
  purities: ["24K", "22K", "18K", "14K", "925 Sterling", "950 Platinum"],
  gems: ["Emerald", "Ruby", "Blue Sapphire", "Yellow Sapphire", "Diamond", "Pearl", "Amethyst", "Citrine", "Tourmaline", "Tanzanite", "Opal", "Garnet", "Topaz", "Aquamarine", "Morganite"],
  cuts: ["Emerald cut", "Oval", "Round brilliant", "Cushion", "Pear", "Cabochon", "Princess", "Marquise", "Heart", "Rose cut"],
};

function move<T>(arr: T[], from: number, to: number) {
  if (to < 0 || to >= arr.length) return arr;
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export function ProductForm({
  productId,
  initial,
  categories,
  isDemo = false,
}: {
  productId: string | null;
  initial: ProductFormState;
  categories: { id: string; name: string; isActive: boolean }[];
  isDemo?: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [tagsText, setTagsText] = useState(initial.tags.join(", "));
  const fileInput = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  };
  const err = (key: string) => errors[key];

  const payload = () => ({
    ...values,
    tags: tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  });

  const submit = (intent: "save" | "preview", statusOverride?: ProductFormState["status"]) => {
    const data = { ...payload(), ...(statusOverride ? { status: statusOverride } : {}) };
    const parsed = productInput.safeParse(data);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      requestAnimationFrame(() => errorRef.current?.querySelector<HTMLElement>("#form-errors")?.focus());
      return;
    }
    setErrors({});
    startTransition(async () => {
      try {
        const res = await saveProductAction(productId, data);
        if (!res.ok) {
          setErrors(res.errors);
          requestAnimationFrame(() => errorRef.current?.querySelector<HTMLElement>("#form-errors")?.focus());
          return;
        }
        if (statusOverride) setValues((v) => ({ ...v, status: statusOverride }));
        setSaved(true);
        if (intent === "preview") router.push(`/admin/products/${res.id}/preview`);
        else if (!productId) router.push(`/admin/products/${res.id}?created=1`);
        else router.refresh();
      } catch {
        setErrors({ _form: "Saving failed. Your session may have expired — please sign in again in a new tab and retry." });
      }
    });
  };

  // ───── Images ─────
  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploadError(null);
    const list = Array.from(files).slice(0, 20 - values.images.length);
    for (const [i, file] of list.entries()) {
      if (file.size > CLIENT_MAX_UPLOAD_MB * 1024 * 1024) {
        setUploadError(`${file.name} is larger than ${CLIENT_MAX_UPLOAD_MB} MB.`);
        continue;
      }
      if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) {
        setUploadError(`${file.name} is not a JPEG, PNG, WebP or AVIF image.`);
        continue;
      }
      setUploading(`Uploading ${i + 1} of ${list.length}…`);
      try {
        const up = await uploadFile(file, "product");
        setValues((v) => ({
          ...v,
          images: [
            ...v.images,
            { url: up.url, storageKey: up.storageKey, provider: up.provider, alt: "", width: up.width ?? null, height: up.height ?? null, isPrimary: v.images.length === 0 },
          ],
        }));
      } catch (e) {
        setUploadError(`${file.name}: ${e instanceof Error ? e.message : "upload failed"}`);
      }
    }
    setUploading(null);
    if (fileInput.current) fileInput.current.value = "";
  };

  const setImages = (images: ImageValue[]) => set("images", images);
  const setPrimary = (index: number) => setImages(values.images.map((img, i) => ({ ...img, isPrimary: i === index })));
  const removeImage = (index: number) => {
    const next = values.images.filter((_, i) => i !== index);
    if (next.length && !next.some((i) => i.isPrimary)) next[0] = { ...next[0], isPrimary: true };
    setImages(next);
  };

  // ───── Gemstones & certificates ─────
  const updateGem = (i: number, patch: Partial<GemValue>) => set("gemstones", values.gemstones.map((g, j) => (j === i ? { ...g, ...patch } : g)));
  const updateCert = (i: number, patch: Partial<CertValue>) => set("certifications", values.certifications.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const onCertFile = async (i: number, file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    if (file.size > CLIENT_MAX_UPLOAD_MB * 1024 * 1024) return setUploadError(`${file.name} is larger than ${CLIENT_MAX_UPLOAD_MB} MB.`);
    setUploading("Uploading certificate…");
    try {
      const up = await uploadFile(file, "certificate");
      updateCert(i, { fileUrl: up.url, fileKey: up.storageKey, fileProvider: up.provider, fileType: up.format === "pdf" ? "pdf" : "image" });
    } catch (e) {
      setUploadError(`${file.name}: ${e instanceof Error ? e.message : "upload failed"}`);
    }
    setUploading(null);
  };

  const imageErrors = Object.entries(errors).filter(([k]) => k === "images" || k.startsWith("images."));

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit("save");
      }}
      className="grid gap-6 xl:grid-cols-[1fr_20rem]"
    >
      <div className="space-y-6">
        <div ref={errorRef} className="space-y-3">
          {errors._form && <Notice tone="error">{errors._form}</Notice>}
          <ErrorSummary errors={Object.fromEntries(Object.entries(errors).filter(([k]) => k !== "_form"))} />
          {saved && !pending && <Notice tone="success">Product saved.</Notice>}
          {isDemo && <Notice tone="warning" title="Demonstration product">This is sample content. Replace its details and images with a real product, or delete it before launch.</Notice>}
        </div>

        <section className="card-surface space-y-5 p-5 sm:p-6" aria-labelledby="basic-title">
          <h2 id="basic-title" className="font-sans text-base font-semibold">Basic information</h2>
          <TextField label="Product name" required value={values.name} onChange={(v) => set("name", v)} maxLength={160} error={err("name")} />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="SKU" required value={values.sku} onChange={(v) => set("sku", v.toUpperCase())} maxLength={64} error={err("sku")} hint="Unique stock code, e.g. VJ-NK-0012" />
            <TextField label="URL slug" value={values.slug} onChange={(v) => set("slug", v.toLowerCase())} maxLength={160} error={err("slug")} hint="Leave blank to generate from the name" />
          </div>
          <TextArea label="Short description" value={values.shortDescription} onChange={(v) => set("shortDescription", v)} rows={2} maxLength={300} error={err("shortDescription")} hint="One or two sentences shown near the price" />
          <TextArea label="Full description" required value={values.description} onChange={(v) => set("description", v)} rows={7} maxLength={10000} error={err("description")} hint="Leave a blank line between paragraphs" />
        </section>

        <section className="card-surface p-5 sm:p-6" aria-labelledby="images-title">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="images-title" className="font-sans text-base font-semibold">Images</h2>
              <p className="text-sm text-muted">JPEG, PNG, WebP or AVIF up to {CLIENT_MAX_UPLOAD_MB} MB. Images are optimised automatically and location metadata is removed. Portrait 4:5 photos work best.</p>
            </div>
            <label className="btn btn-outline btn-sm cursor-pointer">
              <UploadIcon size={16} /> Upload images
              <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" onChange={(e) => onFiles(e.target.files)} disabled={!!uploading || values.images.length >= 20} />
            </label>
          </div>
          {uploading && <p role="status" className="mb-3 text-sm text-emerald-800">{uploading}</p>}
          {uploadError && <Notice tone="error" className="mb-3">{uploadError}</Notice>}
          {imageErrors.map(([k, v]) => <p key={k} className="field-error">{v}</p>)}
          {values.images.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-stone py-10 text-center text-sm text-muted">
              <UploadIcon size={28} className="text-gold-600" />
              <p className="mt-2">No images yet. The first image becomes the primary image.</p>
            </div>
          ) : (
            <ol className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {values.images.map((img, i) => (
                <li key={img.url} className="rounded-sm border border-sand bg-white p-2">
                  <div className="relative aspect-[4/5] overflow-hidden bg-cream">
                    <Image src={img.url} alt={img.alt || `Image ${i + 1}`} fill sizes="200px" className="object-cover" />
                    {img.isPrimary && <span className="absolute top-2 left-2 bg-emerald-900 px-2 py-0.5 text-[0.6rem] font-semibold tracking-wider text-ivory uppercase">Primary</span>}
                  </div>
                  <label className="sr-only" htmlFor={`alt-${i}`}>Alt text for image {i + 1}</label>
                  <input id={`alt-${i}`} value={img.alt} maxLength={200} placeholder="Describe the image (alt text)" onChange={(e) => setImages(values.images.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))} className="field-input mt-2 !min-h-9 text-xs" />
                  <div className="mt-2 flex items-center justify-between gap-1">
                    <div className="flex">
                      <button type="button" onClick={() => setImages(move(values.images, i, i - 1))} disabled={i === 0} className="inline-flex h-9 w-9 items-center justify-center rounded-sm hover:bg-cream disabled:opacity-30">
                        <ChevronLeft size={16} /><span className="sr-only">Move image {i + 1} earlier</span>
                      </button>
                      <button type="button" onClick={() => setImages(move(values.images, i, i + 1))} disabled={i === values.images.length - 1} className="inline-flex h-9 w-9 items-center justify-center rounded-sm hover:bg-cream disabled:opacity-30">
                        <ChevronRight size={16} /><span className="sr-only">Move image {i + 1} later</span>
                      </button>
                    </div>
                    <div className="flex">
                      <button type="button" onClick={() => setPrimary(i)} disabled={img.isPrimary} aria-pressed={img.isPrimary} className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-gold-600 hover:bg-cream disabled:opacity-40">
                        <StarIcon size={16} /><span className="sr-only">Make image {i + 1} the primary image</span>
                      </button>
                      <button type="button" onClick={() => removeImage(i)} className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-ruby-700 hover:bg-ruby-50">
                        <TrashIcon size={16} /><span className="sr-only">Remove image {i + 1}</span>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="card-surface space-y-5 p-5 sm:p-6" aria-labelledby="pricing-title">
          <h2 id="pricing-title" className="font-sans text-base font-semibold">Pricing &amp; availability</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Regular price (₹)" value={values.price} onChange={(v) => set("price", v)} inputMode="decimal" error={err("price")} hint="Leave blank to show “Price on request”" placeholder="e.g. 125000" />
            <TextField label="Sale price (₹)" value={values.salePrice} onChange={(v) => set("salePrice", v)} inputMode="decimal" error={err("salePrice")} hint="Optional discounted price" />
            <SelectField
              label="Availability"
              value={values.availability}
              onChange={(v) => set("availability", v as ProductFormState["availability"])}
              options={[
                { value: "IN_STOCK", label: "In stock" },
                { value: "MADE_TO_ORDER", label: "Made to order" },
                { value: "ON_REQUEST", label: "Available on request" },
                { value: "SOLD_OUT", label: "Sold out" },
              ]}
              error={err("availability")}
            />
            <TextField label="Stock quantity" value={values.stockQuantity} onChange={(v) => set("stockQuantity", v)} inputMode="numeric" error={err("stockQuantity")} hint="Optional — only shown to customers when 3 or fewer remain" />
          </div>
        </section>

        <section className="card-surface space-y-5 p-5 sm:p-6" aria-labelledby="specs-title">
          <div>
            <h2 id="specs-title" className="font-sans text-base font-semibold">Material &amp; specifications</h2>
            <p className="text-sm text-muted">Only fill in details you can verify. Empty fields are hidden on the website.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Jewellery type" value={values.jewelleryType} onChange={(v) => set("jewelleryType", v)} list="dl-types" maxLength={80} error={err("jewelleryType")} />
            <TextField label="Material" value={values.material} onChange={(v) => set("material", v)} list="dl-materials" maxLength={80} error={err("material")} />
            <TextField label="Metal purity" value={values.metalPurity} onChange={(v) => set("metalPurity", v)} list="dl-purities" maxLength={40} error={err("metalPurity")} />
            <TextField label="Metal colour" value={values.metalColour} onChange={(v) => set("metalColour", v)} maxLength={40} error={err("metalColour")} />
            <TextField label="Hallmark details" value={values.hallmarkDetails} onChange={(v) => set("hallmarkDetails", v)} maxLength={200} error={err("hallmarkDetails")} hint="Only if the piece is hallmarked, e.g. BIS hallmark with HUID" className="sm:col-span-2" />
            <TextField label="Gross weight (g)" value={values.grossWeightGrams} onChange={(v) => set("grossWeightGrams", v)} inputMode="decimal" error={err("grossWeightGrams")} />
            <TextField label="Net metal weight (g)" value={values.netWeightGrams} onChange={(v) => set("netWeightGrams", v)} inputMode="decimal" error={err("netWeightGrams")} />
            <TextField label="Size" value={values.size} onChange={(v) => set("size", v)} maxLength={80} error={err("size")} hint="e.g. Ring size 12 (Indian), 2.6 bangle" />
            <TextField label="Dimensions" value={values.dimensions} onChange={(v) => set("dimensions", v)} maxLength={120} error={err("dimensions")} hint="e.g. Pendant 32 × 18 mm" />
          </div>
          <TextArea label="Other details" value={values.otherDetails} onChange={(v) => set("otherDetails", v)} rows={3} maxLength={4000} error={err("otherDetails")} />
          <TextArea label="Care instructions" value={values.careInstructions} onChange={(v) => set("careInstructions", v)} rows={3} maxLength={4000} error={err("careInstructions")} hint="Leave blank to link to the general jewellery care page" />
        </section>

        <section className="card-surface p-5 sm:p-6" aria-labelledby="gems-title">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="gems-title" className="font-sans text-base font-semibold">Gemstones</h2>
              <p className="text-sm text-muted">Never guess origin, treatment or weight — leave unknown fields empty.</p>
            </div>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => set("gemstones", [...values.gemstones, { ...EMPTY_GEM }])} disabled={values.gemstones.length >= 20}>
              <PlusIcon size={16} /> Add gemstone
            </button>
          </div>
          {values.gemstones.length === 0 && <p className="text-sm text-subtle">No gemstones added.</p>}
          <ol className="space-y-4">
            {values.gemstones.map((g, i) => (
              <li key={i} className="rounded-sm border border-sand p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold">Gemstone {i + 1}</p>
                  <div className="flex">
                    <button type="button" onClick={() => set("gemstones", move(values.gemstones, i, i - 1))} disabled={i === 0} className="inline-flex h-9 w-9 items-center justify-center hover:bg-cream disabled:opacity-30"><ArrowUp size={16} /><span className="sr-only">Move up</span></button>
                    <button type="button" onClick={() => set("gemstones", move(values.gemstones, i, i + 1))} disabled={i === values.gemstones.length - 1} className="inline-flex h-9 w-9 items-center justify-center hover:bg-cream disabled:opacity-30"><ArrowDown size={16} /><span className="sr-only">Move down</span></button>
                    <button type="button" onClick={() => set("gemstones", values.gemstones.filter((_, j) => j !== i))} className="inline-flex h-9 w-9 items-center justify-center text-ruby-700 hover:bg-ruby-50"><TrashIcon size={16} /><span className="sr-only">Remove gemstone {i + 1}</span></button>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <TextField label="Type" required value={g.type} onChange={(v) => updateGem(i, { type: v })} list="dl-gems" maxLength={60} error={err(`gemstones.${i}.type`)} />
                  <TextField label="Colour" value={g.colour} onChange={(v) => updateGem(i, { colour: v })} maxLength={60} error={err(`gemstones.${i}.colour`)} />
                  <TextField label="Cut" value={g.cut} onChange={(v) => updateGem(i, { cut: v })} list="dl-cuts" maxLength={60} error={err(`gemstones.${i}.cut`)} />
                  <TextField label="Shape" value={g.shape} onChange={(v) => updateGem(i, { shape: v })} maxLength={60} error={err(`gemstones.${i}.shape`)} />
                  <TextField label="Clarity" value={g.clarity} onChange={(v) => updateGem(i, { clarity: v })} maxLength={60} error={err(`gemstones.${i}.clarity`)} />
                  <TextField label="Weight (carats)" value={g.caratWeight} onChange={(v) => updateGem(i, { caratWeight: v })} inputMode="decimal" error={err(`gemstones.${i}.caratWeight`)} />
                  <TextField label="Number of stones" value={g.count} onChange={(v) => updateGem(i, { count: v })} inputMode="numeric" error={err(`gemstones.${i}.count`)} />
                  <TextField label="Origin" value={g.origin} onChange={(v) => updateGem(i, { origin: v })} maxLength={80} error={err(`gemstones.${i}.origin`)} hint="Only if documented" />
                  <TextField label="Treatment" value={g.treatment} onChange={(v) => updateGem(i, { treatment: v })} maxLength={120} error={err(`gemstones.${i}.treatment`)} hint="As stated on the certificate" />
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="card-surface p-5 sm:p-6" aria-labelledby="certs-title">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="certs-title" className="font-sans text-base font-semibold">Certification</h2>
              <p className="text-sm text-muted">Add only certificates that physically exist for this piece. Upload a scan (PDF or image) if you want customers to view it.</p>
            </div>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => set("certifications", [...values.certifications, { ...EMPTY_CERT }])} disabled={values.certifications.length >= 10}>
              <PlusIcon size={16} /> Add certificate
            </button>
          </div>
          {values.certifications.length === 0 && <p className="text-sm text-subtle">No certificates added.</p>}
          <ol className="space-y-4">
            {values.certifications.map((c, i) => (
              <li key={i} className="rounded-sm border border-sand p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold">Certificate {i + 1}</p>
                  <button type="button" onClick={() => set("certifications", values.certifications.filter((_, j) => j !== i))} className="inline-flex h-9 w-9 items-center justify-center text-ruby-700 hover:bg-ruby-50"><TrashIcon size={16} /><span className="sr-only">Remove certificate {i + 1}</span></button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="Issuing laboratory / authority" required value={c.issuer} onChange={(v) => updateCert(i, { issuer: v })} maxLength={120} error={err(`certifications.${i}.issuer`)} />
                  <TextField label="Certificate number" value={c.certificateNumber} onChange={(v) => updateCert(i, { certificateNumber: v })} maxLength={80} error={err(`certifications.${i}.certificateNumber`)} />
                  <TextField label="Report date" type="date" value={c.reportDate} onChange={(v) => updateCert(i, { reportDate: v })} error={err(`certifications.${i}.reportDate`)} />
                  <TextField label="Online verification link" value={c.verificationUrl} onChange={(v) => updateCert(i, { verificationUrl: v })} placeholder="https://" error={err(`certifications.${i}.verificationUrl`)} />
                  <TextArea label="Notes" value={c.notes} onChange={(v) => updateCert(i, { notes: v })} rows={2} maxLength={500} error={err(`certifications.${i}.notes`)} className="sm:col-span-2" />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  {c.fileUrl ? (
                    <>
                      <a href={c.fileUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-800 underline">View uploaded file</a>
                      <button type="button" className="text-ruby-700 underline" onClick={() => updateCert(i, { fileUrl: null, fileKey: null, fileProvider: null, fileType: null })}>Remove file</button>
                    </>
                  ) : (
                    <label className="btn btn-ghost btn-sm cursor-pointer border border-sand">
                      <UploadIcon size={16} /> Upload certificate file
                      <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => onCertFile(i, e.target.files?.[0])} disabled={!!uploading} />
                    </label>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="card-surface space-y-5 p-5 sm:p-6" aria-labelledby="seo-title">
          <h2 id="seo-title" className="font-sans text-base font-semibold">Search &amp; sharing (optional)</h2>
          <TextField label="SEO title" value={values.seoTitle} onChange={(v) => set("seoTitle", v)} maxLength={70} error={err("seoTitle")} hint={`${values.seoTitle.length}/70 — defaults to the product name`} />
          <TextArea label="SEO description" value={values.seoDescription} onChange={(v) => set("seoDescription", v)} rows={2} maxLength={160} error={err("seoDescription")} hint={`${values.seoDescription.length}/160 — defaults to the short description`} />
        </section>
      </div>

      {/* ───── Sidebar ───── */}
      <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <section className="card-surface space-y-4 p-5" aria-labelledby="publish-title">
          <h2 id="publish-title" className="font-sans text-base font-semibold">Publishing</h2>
          <SelectField
            label="Status"
            value={values.status}
            onChange={(v) => set("status", v as ProductFormState["status"])}
            options={[
              { value: "DRAFT", label: "Draft — hidden from the website" },
              { value: "PUBLISHED", label: "Published — visible to customers" },
              { value: "ARCHIVED", label: "Archived — hidden" },
            ]}
          />
          <Toggle label="Featured" checked={values.isFeatured} onChange={(v) => set("isFeatured", v)} hint="Shown in “Featured pieces” on the home page" />
          <Toggle label="New arrival" checked={values.isNewArrival} onChange={(v) => set("isNewArrival", v)} hint="Shown in “New arrivals”" />
          <div className="flex flex-col gap-2 pt-2">
            <button type="submit" className="btn btn-primary" disabled={pending || !!uploading}>
              {pending ? "Saving…" : "Save"}
            </button>
            <button type="button" className="btn btn-outline" disabled={pending || !!uploading} onClick={() => submit("preview")}>
              Save &amp; preview
            </button>
            {values.status !== "PUBLISHED" && (
              <button type="button" className="btn btn-gold" disabled={pending || !!uploading} onClick={() => submit("save", "PUBLISHED")}>
                Save &amp; publish
              </button>
            )}
            {productId && (
              <Link href={`/admin/products/${productId}/preview`} className="text-center text-sm text-emerald-800 underline underline-offset-4">
                Open preview
              </Link>
            )}
          </div>
        </section>

        <section className="card-surface p-5" aria-labelledby="cats-title">
          <h2 id="cats-title" className="font-sans text-base font-semibold">Categories</h2>
          {categories.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No categories yet. <Link href="/admin/categories" className="text-emerald-800 underline">Create categories</Link>.</p>
          ) : (
            <fieldset className="mt-3">
              <legend className="sr-only">Categories</legend>
              <ul className="max-h-72 space-y-1 overflow-y-auto">
                {categories.map((c) => (
                  <li key={c.id}>
                    <label className="flex min-h-9 items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-emerald-800"
                        checked={values.categoryIds.includes(c.id)}
                        onChange={(e) => set("categoryIds", e.target.checked ? [...values.categoryIds, c.id] : values.categoryIds.filter((id) => id !== c.id))}
                      />
                      {c.name} {!c.isActive && <span className="text-xs text-subtle">(inactive)</span>}
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          )}
        </section>

        <section className="card-surface p-5" aria-labelledby="tags-title">
          <h2 id="tags-title" className="sr-only">Tags</h2>
          <TextField label="Tags" value={tagsText} onChange={(v) => { setTagsText(v); setSaved(false); }} hint="Comma-separated keywords used by search, e.g. bridal, emerald, gift" error={err("tags")} />
        </section>
      </div>

      <datalist id="dl-types">{SUGGESTIONS.types.map((s) => <option key={s} value={s} />)}</datalist>
      <datalist id="dl-materials">{SUGGESTIONS.materials.map((s) => <option key={s} value={s} />)}</datalist>
      <datalist id="dl-purities">{SUGGESTIONS.purities.map((s) => <option key={s} value={s} />)}</datalist>
      <datalist id="dl-gems">{SUGGESTIONS.gems.map((s) => <option key={s} value={s} />)}</datalist>
      <datalist id="dl-cuts">{SUGGESTIONS.cuts.map((s) => <option key={s} value={s} />)}</datalist>
    </form>
  );
}
