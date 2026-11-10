import type { ProductInfo } from '@personaclick/rn-sdk'

/**
 * Price and picture of the product page, by the rules the kit's cards follow:
 * - price: `price_formatted`, otherwise "price currency";
 * - old price: `oldprice_formatted`, only when `oldprice` is greater than the price;
 * - discount badge: only next to a shown old price and only for a positive `discount`
 *   (otherwise `discount_percent`); text `discount_formatted`, otherwise "N%", with one "-".
 *
 * Numbers sometimes arrive as strings (`products/get`), so they are compared through Number.
 */

/** What the product page prints: strings come out formatted. */
export type PriceLabels = {
  price: string
  oldPrice?: string
  discount?: string
}

type PriceFields = {
  price: unknown
  priceFormatted: unknown
  currency: unknown
  oldPrice: unknown
  oldPriceFormatted: unknown
  discount: unknown
  discountFormatted: unknown
  discountPercent: unknown
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

/** A positive number, or a number in a string; `false`, `true`, zero and garbage mean "none". */
function positive(value: unknown): number | undefined {
  if (typeof value !== 'number' && typeof value !== 'string') {
    return undefined
  }
  if (typeof value === 'string' && !value.trim()) {
    return undefined
  }
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : undefined
}

function badge(formatted: string | undefined, value: number): string {
  return `-${(formatted ?? `${value}%`).replace(/^-+\s*/, '')}`
}

export function priceLabels(fields: PriceFields): PriceLabels {
  const price = Number(fields.price) || 0
  const oldPriceText = text(fields.oldPriceFormatted)
  const hasOldPrice =
    (Number(fields.oldPrice) || 0) > price && oldPriceText !== undefined
  // `discount_formatted` is the text of `discount`; it says nothing about `discount_percent`.
  const fromDiscount = positive(fields.discount)
  const fromPercent =
    fromDiscount === undefined ? positive(fields.discountPercent) : undefined
  let discount: string | undefined
  if (hasOldPrice && fromDiscount !== undefined) {
    discount = badge(text(fields.discountFormatted), fromDiscount)
  } else if (hasOldPrice && fromPercent !== undefined) {
    discount = badge(undefined, fromPercent)
  }
  return {
    price:
      text(fields.priceFormatted) ??
      `${price} ${text(fields.currency) ?? ''}`.trim(),
    oldPrice: hasOldPrice ? oldPriceText : undefined,
    discount,
  }
}

/** Price labels of `getProductInfo`: the SDK has already parsed it into camelCase. */
export function productInfoLabels(info: ProductInfo): PriceLabels {
  return priceLabels({
    price: info.price,
    priceFormatted: info.priceFormatted,
    currency: info.currency,
    oldPrice: info.oldPrice,
    oldPriceFormatted: info.oldPriceFormatted,
    discount: info.discount,
    discountFormatted: info.discountFormatted,
    discountPercent: info.discountPercent,
  })
}

/**
 * Picture of the product page: the original, big enough for the hero, otherwise the largest
 * resized copy. An https address first: iOS (App Transport Security) and Android release builds
 * load no plain-http pictures, and this catalog serves its originals over http, its resized
 * copies over https.
 */
export function productInfoPicture(info: ProductInfo): string | undefined {
  const resized = Object.entries(info.resizedImages ?? {})
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([, url]) => text(url))
  const candidates = [
    text(info.imageUrl),
    ...resized,
    text(info.picture),
    text(info.resizedImageUrl),
  ].filter((url): url is string => url !== undefined)
  return candidates.find(url => url.startsWith('https:')) ?? candidates[0]
}
