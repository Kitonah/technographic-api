import { ProbeSnapshotFixture } from './types';

export const ENTERPRISE_SAAS_VERCEL_FIXTURE: ProbeSnapshotFixture = {
  fixtureId: 'fixture-01-enterprise-saas-vercel',
  description: 'Enterprise SaaS running Next.js on Vercel with HubSpot, Segment, Sentry, and Google Workspace',
  targetDomain: 'acme-cloud-ai.com',
  capturedAt: '2026-10-22T09:00:00Z',
  dns: {
    a: ['76.76.21.21', '76.76.21.98'],
    cname: ['cname.vercel-dns.com.'],
    mx: [
      { priority: 1, exchange: 'aspmx.l.google.com.' },
      { priority: 5, exchange: 'alt1.aspmx.l.google.com.' }
    ],
    txt: [
      'v=spf1 include:_spf.google.com include:2481920.spf04.hubspotemail.net ~all',
      'google-site-verification=rXOxyZounnZasA8Z7oaD3c14JdjS9aKSW',
      'hubspot-developer-verification=Njg0M2I1YzAtZDc0MS00M2E1LTk5YjItODg1M2Q1ZjY3YThh',
      '_vercel=vc-domain-verify=acme-cloud-ai.com,9a8b7c6d5e4f3a2b1c0d'
    ]
  },
  tls: {
    protocol: 'TLSv1.3',
    issuerCn: 'E5',
    issuerOrg: "Let's Encrypt",
    subjectCn: 'acme-cloud-ai.com',
    sans: ['acme-cloud-ai.com', '*.acme-cloud-ai.com'],
    validFrom: '2026-09-15T00:00:00Z',
    validTo: '2026-12-14T23:59:59Z'
  },
  http: {
    status: 200,
    headers: {
      'server': 'Vercel',
      'x-vercel-id': 'iad1::sfo1::k9m2p-1761123600123-8f9e0d1c2b3a',
      'x-vercel-cache': 'HIT',
      'x-powered-by': 'Next.js',
      'content-security-policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.segment.com https://js.hs-scripts.com https://js.hs-analytics.net https://browser.sentry-cdn.com; connect-src 'self' https://api.segment.io https://o45049210.ingest.us.sentry.io https://s3.us-east-1.amazonaws.com;",
      'content-type': 'text/html; charset=utf-8'
    },
    setCookies: [
      '__hstc=182938475.8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d3c.1761123600000.1761123600000.1761123600000.1; Path=/; Domain=.acme-cloud-ai.com; Max-Age=15552000; SameSite=Lax',
      'hubspotutk=8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d3c; Path=/; Domain=.acme-cloud-ai.com; Max-Age=15552000; SameSite=Lax',
      'ajs_anonymous_id=%227f8e9d0c-1b2a-4c3d-8e9f-0a1b2c3d4e5f%22; Path=/; Domain=.acme-cloud-ai.com; Max-Age=31536000; SameSite=Lax'
    ],
    bodySnippet50Kb: `<!DOCTYPE html><html lang="en"><head>
      <meta charSet="utf-8"/>
      <meta name="sentry" content="eyJkc24iOiJodHRwczovLzRhNWI2YzdkOGU5ZjBhMWIyYzNkNGU1ZjZhN2I4YzlkQG80NTA0OTIxMC5pbmdlc3QudXMuc2VudHJ5LmlvLzQ1MDQ5MjExIiwicmVsZWFzZSI6ImFjbWUtd2ViQHYxNC4yLjUtYmV0YS4yIn0="/>
      <link rel="preload" href="/_next/static/chunks/main-app-9f8e7d6c5b4a3f2e.js" as="script"/>
      <script>window.next = { version: "v14.2.5" }; self.__next_f = self.__next_f || [];</script>
      <script>!function(){var analytics=window.analytics=window.analytics||[];if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.error("Segment snippet included twice.");else{analytics.invoked=!0;analytics.SNIPPET_VERSION="4.15.3";analytics.load("wR9pL2mK8nJ4vX7bQ1zC5tY3hF6gD0sA");}}();</script>
      <script type="text/javascript" id="hs-script-loader" async defer src="//js.hs-scripts.com/2481920.js"></script>
      <img src="https://s3.us-east-1.amazonaws.com/acme-public-brand/logo.svg" alt="Acme" />
    </head><body><div id="__next">Enterprise AI Platform</div></body></html>`,
    bytesRead: 4820,
    streamAbortedAtCeiling: false
  }
};

export const HIGH_VOLUME_ECOMMERCE_SHOPIFY_PLUS_FIXTURE: ProbeSnapshotFixture = {
  fixtureId: 'fixture-02-ecommerce-shopify-plus',
  description: 'High-Volume E-Commerce brand running Shopify Plus with Cloudflare Bot Management, Klaviyo, and OneTrust',
  targetDomain: 'solis-athletics.com',
  capturedAt: '2026-10-22T09:05:00Z',
  dns: {
    a: ['23.227.38.65'],
    cname: ['shops.myshopify.com.'],
    mx: [{ priority: 10, exchange: 'mxa-00491201.gslb.pphosted.com.' }],
    txt: [
      'v=spf1 include:shops.shopify.com include:spf.klaviyo.com ~all',
      'klaviyo-site-verification=KLV-994827162534'
    ]
  },
  tls: {
    protocol: 'TLSv1.3',
    issuerCn: 'WE1',
    issuerOrg: 'Google Trust Services',
    subjectCn: 'solis-athletics.com',
    sans: ['solis-athletics.com', 'www.solis-athletics.com'],
    validFrom: '2026-09-01T00:00:00Z',
    validTo: '2026-11-30T23:59:59Z'
  },
  http: {
    status: 200,
    headers: {
      'server': 'cloudflare',
      'cf-ray': '8d6812948a9b1c2d-IAD',
      'cf-cache-status': 'DYNAMIC',
      'x-shopid': '68492019482',
      'x-shardid': '214',
      'powered-by': 'Shopify',
      'content-security-policy': "script-src 'self' 'unsafe-inline' https://cdn.shopify.com https://cdn.cookielaw.org https://static.klaviyo.com; connect-src 'self' https://geolocation.onetrust.com https://a.klaviyo.com;",
      'content-type': 'text/html; charset=utf-8'
    },
    setCookies: [
      '_shopify_y=9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d; Path=/; Expires=Fri, 22 Oct 2027 09:05:00 GMT; SameSite=Lax',
      '__cf_bm=mN9pL2kR8vX4zQ1wC5tY3hF6gD0sA7jB2nM4pQ6rS8uV0xZ-1761123900-1.0.1.1-8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d3c; path=/; expires=Thu, 22-Oct-26 09:35:00 GMT; domain=.solis-athletics.com; HttpOnly; Secure; SameSite=None',
      'OptanonConsent=isGpcEnabled=0&datestamp=Thu+Oct+22+2026+09%3A05%3A00+GMT%2B0000&version=2026.08.1.0&browserGpcFlag=0&isIABGlobal=false; Path=/; Max-Age=31536000; SameSite=Lax'
    ],
    bodySnippet50Kb: `<!DOCTYPE html><html lang="en"><head>
      <script src="https://cdn.cookielaw.org/scripttemplates/2026.08.1.0/otBannerSdk.js" async type="text/javascript"></script>
      <script src="https://cdn.cookielaw.org/scripttemplates/otSDKStub.js" type="text/javascript" charset="UTF-8" data-domain-script="018f9a2b-3c4d-7e8f-9a0b-1c2d3e4f5a6b"></script>
      <link rel="stylesheet" href="https://cdn.shopify.com/s/files/1/0684/9201/9482/t/14/assets/custom-checkout-extensibility.css?v=1761100000" />
      <script>
        window.Shopify = window.Shopify || {};
        Shopify.shop = "solis-athletics.myshopify.com";
        Shopify.theme = {"name":"Solis Enterprise OS","id":140928374,"schema_version":"15.2.0"};
        Shopify.features = {"plus":true,"b2b":true};
        analytics.subscribe("checkout_completed", (event) => { const checkout = event.data.checkout; });
      </script>
      <script async type="text/javascript" src="https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=R8pL2m"></script>
    </head><body></body></html>`,
    bytesRead: 51200,
    streamAbortedAtCeiling: true
  }
};

export const LEGACY_ENTERPRISE_AWS_M365_FIXTURE: ProbeSnapshotFixture = {
  fixtureId: 'fixture-03-legacy-enterprise-aws-m365',
  description: 'Legacy Enterprise running Microsoft 365, AWS CloudFront, and Datadog RUM',
  targetDomain: 'global-industrial-corp.com',
  capturedAt: '2026-10-22T09:10:00Z',
  dns: {
    a: ['18.160.41.92', '18.160.41.105'],
    cname: ['d29a8b7c6d5e4f.cloudfront.net.'],
    mx: [{ priority: 0, exchange: 'globalindustrialcorp-com01i.mail.protection.outlook.com.' }],
    txt: ['v=spf1 include:spf.protection.outlook.com -all', 'MS=ms84729104']
  },
  tls: {
    protocol: 'TLSv1.3',
    issuerCn: 'Amazon RSA 2048 M03',
    issuerOrg: 'Amazon',
    subjectCn: 'global-industrial-corp.com',
    sans: ['global-industrial-corp.com', '*.global-industrial-corp.com'],
    validFrom: '2026-04-01T00:00:00Z',
    validTo: '2027-04-30T23:59:59Z'
  },
  http: {
    status: 200,
    headers: {
      'server': 'CloudFront',
      'via': '1.1 4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d.cloudfront.net (CloudFront)',
      'x-amz-cf-pop': 'IAD89-P2',
      'x-amz-cf-id': 'k9m2pL8nJ4vX7bQ1zC5tY3hF6gD0sA9a8b7c6d5e4f3a2b1c0d9e8f==',
      'x-datadog-trace-id': '7849201928374659102',
      'content-security-policy': "default-src 'self'; connect-src 'self' https://rum.browser-intake-datadoghq.com;",
      'content-type': 'text/html; charset=utf-8'
    },
    setCookies: [
      '_dd_s=rum=1&id=3f4e5d6c-7b8a-9c0d-1e2f-3a4b5c6d7e8f&created=1761124200000&expire=1761125100000; Path=/; SameSite=Strict',
      'AWSALBCORS=T9pL2mK8nJ4vX7bQ1zC5tY3hF6gD0sA; Expires=Thu, 29 Oct 2026 09:10:00 GMT; Path=/; SameSite=None; Secure'
    ],
    bodySnippet50Kb: `<!DOCTYPE html><html lang="en"><head>
      <title>Global Industrial Corporation</title>
      <script src="https://www.datadoghq-browser-agent.com/us1/v5/datadog-rum.js" type="text/javascript"></script>
      <script>
        window.DD_RUM && window.DD_RUM.init({
          clientToken: 'pub8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d3c',
          applicationId: '3f4e5d6c-7b8a-9c0d-1e2f-3a4b5c6d7e8f',
          site: 'datadoghq.com',
          service: 'global-corp-portal',
          version: '5.28.1'
        });
      </script>
    </head><body><h1>Global Industrial Portal</h1></body></html>`,
    bytesRead: 2150,
    streamAbortedAtCeiling: false
  }
};