export function buildInquiryText(item) {
  return `Hi! I'm interested in: ${item.name} by ${item.brand}. Can you tell me more about its availability and condition?`;
}

export function appendTextParam(baseUrl, item) {
  if (!baseUrl) return '';
  const url = String(baseUrl).trim();
  if (!url) return '';
  const encoded = encodeURIComponent(buildInquiryText(item));
  return url.includes('?') ? `${url}&text=${encoded}` : `${url}?text=${encoded}`;
}

export function getViberHref(baseUrl, item) {
  if (!baseUrl) return '';
  const encoded = encodeURIComponent(buildInquiryText(item));
  return `viber://forward?text=${encoded}`;
}
