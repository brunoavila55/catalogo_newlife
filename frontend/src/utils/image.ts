export const getImageUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `http://localhost:8080${url}`;
};

export const getThumbUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `http://localhost:8080${url.replace('.jpg', '_thumb.jpg')}`;
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
