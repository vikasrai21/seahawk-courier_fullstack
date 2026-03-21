// src/components/seo/LocalBusinessSchema.jsx — JSON-LD structured data for Google
export function LocalBusinessSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Sea Hawk Courier & Cargo',
    description: 'Courier and cargo services in Gurugram and Delhi NCR. Same-day delivery, international shipping, and B2B logistics.',
    url: 'https://seahawk-courierfullstack-production.up.railway.app',
    telephone: '+91-9911565523',
    email: 'info@seahawkcourier.com',
    foundingDate: '2004',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Shop 6 & 7, Rao Lal Singh Market',
      addressLocality: 'Gurugram',
      addressRegion: 'Haryana',
      postalCode: '122015',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '28.4595',
      longitude: '77.0266',
    },
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], opens: '09:00', closes: '20:00' },
    ],
    sameAs: [],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Courier Services',
      itemListElement: [
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Express Delivery', description: 'Same-day and next-day delivery to Delhi NCR and major cities' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'International Courier', description: 'Document and parcel shipping to 220+ countries' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'B2B Logistics', description: 'Custom contracts and dedicated account management for businesses' } },
      ],
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '200',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
