/**
 * Mapeo de producto ID a imagen generada por IA.
 * Las imágenes están en /images/products/
 */
export const PRODUCT_IMAGES: Record<string, string> = {
  "1": "/images/products/product-1-compresor.png",
  "2": "/images/products/product-2-evaporador.png",
  "3": "/images/products/product-3-termostato.png",
  "9": "/images/products/product-9-motor-licuadora.png",
  "10": "/images/products/product-10-cuchilla-licuadora.png",
  "11": "/images/products/product-11-vaso-licuadora.png",
  "14": "/images/products/product-14-base-licuadora.png",
  "15": "/images/products/product-15-bomba-agua.png",
  "22": "/images/products/product-22-magnetron.png",
  "27": "/images/products/product-27-quemador.png",
  "32": "/images/products/product-32-condensador.png",
  "38": "/images/products/product-38-electrodo.png",
  "43": "/images/products/product-43-valvula.png",
  "44": "/images/products/product-44-evaporador-ind.png",
  "45": "/images/products/product-45-presostato.png",
  "46": "/images/products/product-46-capacitor.png",
  "47": "/images/products/product-47-rele.png",
  "48": "/images/products/product-48-contactor.png",
  "49": "/images/products/product-49-manometro.png",
  "50": "/images/products/product-50-bomba-vacio.png",
};

export function getProductImageUrl(productId: string): string | undefined {
  return PRODUCT_IMAGES[productId];
}
