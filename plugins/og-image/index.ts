import { CustomOgImages, type SocialImageOptions } from "@quartz-community/og-image"
import { customOgImageStructure } from "./imageStructure.ts"

export const OgImage = (userOpts?: Partial<Omit<SocialImageOptions, "imageStructure">>) =>
  CustomOgImages({ ...userOpts, imageStructure: customOgImageStructure })
