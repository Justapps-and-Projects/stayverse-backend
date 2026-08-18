/** Flutter image_picker / ImageService constraints — shared for picker + tests. */
export const MediaConstraints = {
  profileImageQuality: 85,
  uploadJpegQuality: 80,
  uploadMinEdge: 1440,
  listingMinImages: 2,
  listingMaxImages: 12,
  listingMaxBytes: 5 * 1024 * 1024,
  listingExtensions: ["jpg", "png", "jpeg", "gif"] as const,
} as const;
