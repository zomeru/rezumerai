import type { JSX } from "react";

/**
 * Represents metadata for a statically imported image.
 * Contains source URL, dimensions, and optional blur placeholder data.
 *
 * @property src - Image source URL or path
 * @property height - Image height in pixels
 * @property width - Image width in pixels
 * @property blurDataURL - Optional base64-encoded blur placeholder
 * @property blurWidth - Optional width for blur placeholder
 * @property blurHeight - Optional height for blur placeholder
 *
 * @example
 * ```ts
 * const imageData: StaticImageData = {
 *   src: "/images/hero.jpg",
 *   width: 1920,
 *   height: 1080,
 *   blurDataURL: "data:image/jpeg;base64,..."
 * };
 * ```
 */
export interface StaticImageData {
  src: string;
  height: number;
  width: number;
  blurDataURL?: string;
  blurWidth?: number;
  blurHeight?: number;
}

/**
 * Wrapper for statically required/imported images.
 * Used when images are imported via require() or import statements.
 *
 * @property default - The static image data containing metadata and source
 *
 * @example
 * ```ts
 * import heroImage from './hero.jpg';
 * // heroImage conforms to StaticRequire: { default: StaticImageData }
 * ```
 */
export interface StaticRequire {
  default: StaticImageData;
}

/**
 * Configuration props passed to image loader functions.
 * Used to transform image URLs with width and quality parameters.
 *
 * @property src - Original image source URL
 * @property width - Desired image width in pixels
 * @property quality - Optional quality setting (1-100)
 *
 * @example
 * ```ts
 * const props: ImageLoaderProps = {
 *   src: "/images/photo.jpg",
 *   width: 800,
 *   quality: 85
 * };
 * ```
 */
export type ImageLoaderProps = {
  src: string;
  width: number;
  quality?: number;
};

/**
 * Function type for custom image URL transformation.
 * Takes loader props and returns an optimized image URL.
 *
 * @param p - Image loader configuration props
 * @returns Transformed image URL with optimizations applied
 *
 * @example
 * ```ts
 * const cloudinaryLoader: ImageLoader = ({ src, width, quality }) => {
 *   return `https://res.cloudinary.com/demo/image/upload/w_${width},q_${quality || 75}${src}`;
 * };
 * ```
 */
export type ImageLoader = (p: ImageLoaderProps) => string;

/**
 * Union type for statically imported images.
 * Can be either a require wrapper or direct image data.
 *
 * @example
 * ```ts
 * import logoImage from './logo.png'; // StaticRequire
 * const imageData: StaticImport = logoImage;
 *
 * const directData: StaticImport = {
 *   src: "/direct.jpg",
 *   width: 500,
 *   height: 300
 * };
 * ```
 */
export type StaticImport = StaticRequire | StaticImageData;

/**
 * Callback function invoked when an image finishes loading.
 * Receives the loaded image element for inspection or manipulation.
 *
 * @param img - The loaded HTMLImageElement
 * @deprecated Use `onLoad` prop instead
 *
 * @example
 * ```ts
 * const handleLoadComplete: OnLoadingComplete = (img) => {
 *   console.log(`Image loaded: ${img.naturalWidth}x${img.naturalHeight}`);
 * };
 * ```
 */
export type OnLoadingComplete = (img: HTMLImageElement) => void;

/**
 * Props for Next.js-style Image component with optimization features.
 * Extends standard HTML img attributes with custom image loading, lazy loading,
 * blur placeholders, and responsive sizing capabilities.
 *
 * @property src - Image source (string URL or static import)
 * @property alt - Alt text for accessibility (required)
 * @property width - Image width in pixels or string format
 * @property height - Image height in pixels or string format
 * @property fill - Whether image should fill parent container
 * @property loader - Custom image URL transformer function
 * @property quality - Image quality (1-100)
 * @property preload - Whether to preload the image
 * @property priority - (Deprecated) Use preload instead
 * @property loading - Native loading behavior ("lazy" | "eager")
 * @property placeholder - Placeholder strategy during loading
 * @property blurDataURL - Base64 blur placeholder data URL
 * @property unoptimized - Skip image optimization
 * @property overrideSrc - Override computed src attribute
 * @property onLoadingComplete - (Deprecated) Use onLoad instead
 * @property layout - (Deprecated) Use fill prop instead
 * @property objectFit - (Deprecated) Use style prop instead
 * @property objectPosition - (Deprecated) Use style prop instead
 * @property lazyBoundary - (Deprecated) No longer functional
 * @property lazyRoot - (Deprecated) No longer functional
 *
 * @example
 * ```tsx
 * <Image
 *   src="/hero.jpg"
 *   alt="Hero image"
 *   width={1200}
 *   height={600}
 *   quality={90}
 *   placeholder="blur"
 * />
 * ```
 */
export type NextImageProps = Omit<
  JSX.IntrinsicElements["img"],
  "src" | "srcSet" | "ref" | "alt" | "width" | "height" | "loading"
> & {
  src: string | StaticImport;
  alt: string;
  width?: number | `${number}`;
  height?: number | `${number}`;
  fill?: boolean;
  loader?: ImageLoader;
  quality?: number | `${number}`;
  preload?: boolean;
  /**
   * @deprecated Use `preload` prop instead.
   * See https://nextjs.org/docs/app/api-reference/components/image#preload
   */
  priority?: boolean;
  loading?: "lazy" | "eager" | undefined;
  placeholder?: "blur" | "empty" | `data:image/${string}`;
  blurDataURL?: string;
  unoptimized?: boolean;
  overrideSrc?: string;
  /**
   * @deprecated Use `onLoad` instead.
   * @see https://nextjs.org/docs/app/api-reference/components/image#onload
   */
  onLoadingComplete?: OnLoadingComplete;
  /**
   * @deprecated Use `fill` prop instead of `layout="fill"` or change import to `next/legacy/image`.
   * @see https://nextjs.org/docs/api-reference/next/legacy/image
   */
  layout?: string;
  /**
   * @deprecated Use `style` prop instead.
   */
  objectFit?: string;
  /**
   * @deprecated Use `style` prop instead.
   */
  objectPosition?: string;
  /**
   * @deprecated This prop does not do anything.
   */
  lazyBoundary?: string;
  /**
   * @deprecated This prop does not do anything.
   */
  lazyRoot?: string;
};
