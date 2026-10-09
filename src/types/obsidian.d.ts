declare module "virtual:mizuki-published-images" {
  import type { ImageMetadata } from "astro";
  const images: Record<string, () => Promise<ImageMetadata>>;
  export default images;
}
