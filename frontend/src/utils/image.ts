// Normaliza URLs antigas (/uploads/) para o novo caminho (/api/v1/uploads/)
const normalizeUploadUrl = (url: string): string => {
  if (url.startsWith('/uploads/')) {
    return '/api/v1' + url;
  }
  return url;
};

export const getImageUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const normalized = normalizeUploadUrl(url);
  return import.meta.env.PROD ? normalized : `http://localhost:8080${normalized}`;
};

export const getThumbUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const normalized = normalizeUploadUrl(url);
  const thumbPath = normalized.replace('.jpg', '_thumb.jpg');
  return import.meta.env.PROD ? thumbPath : `http://localhost:8080${thumbPath}`;
};

export const getProductMainImage = (product: any): string => {
  if (product.images_json && product.images_json.length > 0) {
    return getImageUrl(product.images_json[0]);
  }
  return getImageUrl(product.image_url);
};

export const getProductSecondImage = (product: any): string => {
  if (product.images_json && product.images_json.length > 1) {
    return getImageUrl(product.images_json[1]);
  }
  return '';
};

export const getProductThumbImage = (product: any): string => {
  if (product.images_json && product.images_json.length > 0) {
    return getThumbUrl(product.images_json[0]);
  }
  return getThumbUrl(product.image_url);
};
