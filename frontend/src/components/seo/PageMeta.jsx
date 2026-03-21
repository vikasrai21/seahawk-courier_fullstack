// src/components/seo/PageMeta.jsx — SEO meta tags using react-helmet-async
// Install: npm i react-helmet-async
import { Helmet } from 'react-helmet-async';

const SITE_NAME  = 'Sea Hawk Courier & Cargo';
const SITE_URL   = 'https://seahawk-courierfullstack-production.up.railway.app';
const SITE_IMAGE = `${SITE_URL}/images/og-image.jpg`;

export function PageMeta({
  title,
  description = 'Sea Hawk Courier & Cargo — India\'s trusted courier service since 2004. Same-day Delhi NCR delivery, international shipping to 220+ countries, real-time tracking.',
  canonical,
  noIndex = false,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const url = canonical ? `${SITE_URL}${canonical}` : SITE_URL;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type"        content="website" />
      <meta property="og:url"         content={url} />
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image"       content={SITE_IMAGE} />
      <meta property="og:site_name"   content={SITE_NAME} />

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={SITE_IMAGE} />
    </Helmet>
  );
}
