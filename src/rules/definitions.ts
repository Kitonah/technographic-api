import { TechnologySignature } from './types';

export const PRODUCTION_SIGNATURES: TechnologySignature[] = [
  // ==========================================
  // Cloud & Edge Infrastructure
  // ==========================================
  {
    id: 'aws',
    name: 'Amazon Web Services',
    category: 'Cloud & Edge Infrastructure',
    cpeVendor: 'amazon',
    cpeProduct: 'aws',
    matchers: [
      {
        surface: 'dns',
        subTarget: 'cname',
        regex: '\\.(?:cloudfront\\.net|s3(?:-[a-z0-9-]+)?\\.amazonaws\\.com|[a-z0-9-]+\\.elb\\.amazonaws\\.com)\\.?$',
        baseConfidence: 0.95
      },
      {
        surface: 'tls',
        regex: '^Amazon RSA 2048 M0[1-9]$|^Amazon$',
        baseConfidence: 0.90
      },
      {
        surface: 'http_header',
        subTarget: 'server',
        regex: '^(?:AmazonS3|CloudFront|awselb/2\\.0)$',
        baseConfidence: 0.90,
        versionGroup: 1
      },
      {
        surface: 'http_header',
        subTarget: 'x-amz-cf-id',
        regex: '^[A-Za-z0-9_-]{50,60}==$',
        baseConfidence: 0.95
      },
      {
        surface: 'cookie',
        regex: '^AWSALB(?:CORS)?=',
        baseConfidence: 0.85
      },
      {
        surface: 'html_script',
        regex: 's3\\.[a-z0-9-]+\\.amazonaws\\.com',
        baseConfidence: 0.45
      }
    ]
  },
  {
    id: 'vercel',
    name: 'Vercel',
    category: 'Cloud & Edge Infrastructure',
    cpeVendor: 'vercel',
    cpeProduct: 'vercel',
    matchers: [
      {
        surface: 'dns',
        subTarget: 'cname',
        regex: '^cname(?:-[a-z0-9]+)?\\.vercel-dns\\.com\\.?$',
        baseConfidence: 0.90
      },
      {
        surface: 'dns',
        subTarget: 'a',
        regex: '^76\\.76\\.21\\.(?:21|22|61|93|98|123|142|164)$',
        baseConfidence: 0.90
      },
      {
        surface: 'dns',
        subTarget: 'txt',
        regex: '^_vercel=vc-domain-verify=',
        baseConfidence: 0.95
      },
      {
        surface: 'http_header',
        subTarget: 'server',
        regex: '^Vercel$',
        baseConfidence: 0.90
      },
      {
        surface: 'http_header',
        subTarget: 'x-vercel-id',
        regex: '^[a-z]{3}[0-9]::',
        baseConfidence: 0.95
      },
      {
        surface: 'html_script',
        regex: '/_vercel/insights/script\\.js\\?v=([0-9.]+)',
        baseConfidence: 0.85,
        versionGroup: 1
      }
    ],
    disambiguation: [
      {
        type: 'ATTENUATES_SUBSTRATE',
        targetTechId: 'aws',
        attenuationMultiplier: 0.25,
        overrideDnsPattern: '\\.cloudfront\\.net\\.?$'
      }
    ]
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    category: 'Cloud & Edge Infrastructure',
    cpeVendor: 'cloudflare',
    cpeProduct: 'cloudflare',
    matchers: [
      {
        surface: 'dns',
        subTarget: 'cname',
        regex: '\\.cdn\\.cloudflare\\.net\\.?$',
        baseConfidence: 0.95
      },
      {
        surface: 'tls',
        regex: '^Cloudflare,\\s*Inc\\.?$',
        baseConfidence: 0.90
      },
      {
        surface: 'http_header',
        subTarget: 'server',
        regex: '^cloudflare(?:-nginx)?$',
        baseConfidence: 0.85
      },
      {
        surface: 'http_header',
        subTarget: 'cf-ray',
        regex: '^[0-9a-f]{16}-[A-Z]{3}$',
        baseConfidence: 0.90
      }
    ]
  },
  {
    id: 'fastly',
    name: 'Fastly',
    category: 'Cloud & Edge Infrastructure',
    cpeVendor: 'fastly',
    cpeProduct: 'fastly',
    matchers: [
      {
        surface: 'dns',
        subTarget: 'cname',
        regex: '\\.(?:fastly\\.net|fastlylb\\.net)\\.?$',
        baseConfidence: 0.95
      },
      {
        surface: 'dns',
        subTarget: 'a',
        regex: '^151\\.101\\.(?:[0-9]{1,3})\\.(?:[0-9]{1,3})$',
        baseConfidence: 0.95
      },
      {
        surface: 'http_header',
        subTarget: 'x-served-by',
        regex: 'cache-[a-z0-9-]+-[A-Z]{3}',
        baseConfidence: 0.95
      },
      {
        surface: 'http_header',
        subTarget: 'x-timer',
        regex: '^S[0-9]{10}\\.[0-9]{6},VS0,VE[0-9]+$',
        baseConfidence: 0.90
      },
      {
        surface: 'http_header',
        subTarget: 'x-fastly-request-id',
        regex: '^[a-f0-9]+$',
        baseConfidence: 0.95
      },
      {
        surface: 'http_header',
        subTarget: 'via',
        regex: '1\\.1\\s+varnish(?:\\s+\\(Varnish/([0-9.]+)\\))?',
        baseConfidence: 0.85,
        versionGroup: 1
      }
    ]
  },
  {
    id: 'akamai',
    name: 'Akamai',
    category: 'Cloud & Edge Infrastructure',
    cpeVendor: 'akamai',
    cpeProduct: 'akamai',
    matchers: [
      {
        surface: 'dns',
        subTarget: 'cname',
        regex: '\\.(?:edgekey\\.net|edgesuite\\.net|akamaiedge\\.net|akamaized\\.net|akadns\\.net)\\.?$',
        baseConfidence: 0.95
      },
      {
        surface: 'http_header',
        subTarget: 'server',
        regex: '^(?:AkamaiGHost|AkamaiNetStorage)$',
        baseConfidence: 0.90
      },
      {
        surface: 'http_header',
        subTarget: 'x-akamai-request-id',
        regex: '^[a-f0-9]+$',
        baseConfidence: 0.95
      },
      {
        surface: 'http_header',
        subTarget: 'x-check-cacheable',
        regex: '^(?:YES|NO)$',
        baseConfidence: 0.95
      },
      {
        surface: 'http_header',
        subTarget: 'x-true-cache-key',
        regex: '.*',
        baseConfidence: 0.95
      },
      {
        surface: 'http_header',
        subTarget: 'x-cache-key',
        regex: '.*',
        baseConfidence: 0.95
      },
      {
        surface: 'http_header',
        subTarget: 'x-cache',
        regex: 'akamaitechnologies\\.com|TCP_(?:HIT|MISS|MEM_HIT)',
        baseConfidence: 0.90
      },
      {
        surface: 'http_header',
        subTarget: 'content-security-policy',
        regex: '(?:akamaized\\.net|edgekey\\.net)',
        baseConfidence: 0.75
      },
      {
        surface: 'cookie',
        regex: '^(?:ak_bmsc|bm_sv|bm_sz)=',
        baseConfidence: 0.90
      }
    ]
  },

  // ==========================================
  // Web Frameworks
  // ==========================================
  {
    id: 'nextjs',
    name: 'Next.js',
    category: 'Web Frameworks',
    cpeVendor: 'vercel',
    cpeProduct: 'next.js',
    matchers: [
      {
        surface: 'http_header',
        subTarget: 'x-powered-by',
        regex: '^Next\\.js$',
        baseConfidence: 0.85
      },
      {
        surface: 'html_script',
        regex: 'data-next-head|__NEXT_DATA__|/_next/static/',
        baseConfidence: 0.85
      },
      {
        surface: 'html_script',
        regex: 'window\\.next\\s*=\\s*\\{\\s*version:\\s*"([^"]+)"',
        baseConfidence: 0.95,
        versionGroup: 1
      }
    ]
  },

  // ==========================================
  // Commerce & Billing
  // ==========================================
  {
    id: 'shopify',
    name: 'Shopify',
    category: 'Commerce & Billing',
    cpeVendor: 'shopify',
    cpeProduct: 'shopify',
    matchers: [
      {
        surface: 'dns',
        subTarget: 'cname',
        regex: '^shops\\.myshopify\\.com\\.?$',
        baseConfidence: 0.95
      },
      {
        surface: 'dns',
        subTarget: 'a',
        regex: '^23\\.227\\.38\\.(?:32|65|74)$',
        baseConfidence: 0.90
      },
      {
        surface: 'http_header',
        subTarget: 'x-shopid',
        regex: '^[0-9]+$',
        baseConfidence: 0.95
      },
      {
        surface: 'http_header',
        subTarget: 'powered-by',
        regex: '^Shopify$',
        baseConfidence: 0.90
      },
      {
        surface: 'cookie',
        regex: '^_shopify_y=',
        baseConfidence: 0.90
      },
      {
        surface: 'html_script',
        regex: 'cdn\\.shopify\\.com',
        baseConfidence: 0.80
      }
    ],
    disambiguation: [
      {
        type: 'ATTENUATES_SUBSTRATE',
        targetTechId: 'cloudflare',
        attenuationMultiplier: 0.35,
        overrideDnsPattern: '\\.cdn\\.cloudflare\\.net\\.?$'
      }
    ]
  },
  {
    id: 'shopify-plus',
    name: 'Shopify Plus',
    category: 'Commerce & Billing',
    cpeVendor: 'shopify',
    cpeProduct: 'shopify_plus',
    matchers: [
      {
        surface: 'http_header',
        subTarget: 'x-shopid',
        regex: '^[0-9]+$',
        baseConfidence: 0.50
      },
      {
        surface: 'http_header',
        subTarget: 'powered-by',
        regex: '^Shopify$',
        baseConfidence: 0.50
      },
      {
        surface: 'html_script',
        regex: 'Shopify\\.features\\s*=\\s*\\{[^}]*"plus"\\s*:\\s*true',
        baseConfidence: 0.95
      },
      {
        surface: 'html_script',
        regex: 'Shopify\\.theme\\s*=\\s*\\{[^}]*"schema_version"\\s*:\\s*"([0-9.]+)"',
        baseConfidence: 0.85,
        versionGroup: 1
      },
      {
        surface: 'html_script',
        regex: 'custom-checkout-extensibility\\.css',
        baseConfidence: 0.90
      },
      {
        surface: 'html_script',
        regex: 'analytics\\.subscribe\\("checkout_completed"',
        baseConfidence: 0.75
      }
    ],
    disambiguation: [
      {
        type: 'EXCLUDES_LOWER_TIER',
        targetTechId: 'shopify'
      },
      {
        type: 'ATTENUATES_SUBSTRATE',
        targetTechId: 'cloudflare',
        attenuationMultiplier: 0.35,
        overrideDnsPattern: '\\.cdn\\.cloudflare\\.net\\.?$'
      }
    ]
  },
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'Commerce & Billing',
    cpeVendor: 'stripe',
    cpeProduct: 'stripe',
    matchers: [
      {
        surface: 'dns',
        subTarget: 'txt',
        regex: '^stripe-verification=[a-f0-9]{40,64}$',
        baseConfidence: 0.95
      },
      {
        surface: 'http_header',
        subTarget: 'content-security-policy',
        regex: 'js\\.stripe\\.com',
        baseConfidence: 0.85
      },
      {
        surface: 'cookie',
        regex: '^__stripe_mid=',
        baseConfidence: 0.90
      },
      {
        surface: 'html_script',
        regex: 'js\\.stripe\\.com/(v[23](?:\\.[0-9]+)?)/',
        baseConfidence: 0.95,
        versionGroup: 1
      }
    ]
  },
  {
    id: 'chargebee',
    name: 'Chargebee',
    category: 'Commerce & Billing',
    cpeVendor: 'chargebee',
    cpeProduct: 'chargebee',
    matchers: [
      {
        surface: 'dns',
        subTarget: 'cname',
        regex: '\\.[a-z0-9-]+\\.chargebee\\.com\\.?$',
        baseConfidence: 0.95
      },
      {
        surface: 'http_header',
        subTarget: 'content-security-policy',
        regex: 'js\\.chargebee\\.com',
        baseConfidence: 0.85
      },
      {
        surface: 'html_script',
        regex: 'js\\.chargebee\\.com/v([0-9]+(?:\\.[0-9]+)?)/chargebee\\.js',
        baseConfidence: 0.95,
        versionGroup: 1
      }
    ]
  },

  // ==========================================
  // MarTech & CRM
  // ==========================================
  {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'MarTech & CRM',
    cpeVendor: 'hubspot',
    cpeProduct: 'hubspot',
    matchers: [
      {
        surface: 'dns',
        subTarget: 'txt',
        regex: 'hubspot-developer-verification=',
        baseConfidence: 0.95
      },
      {
        surface: 'dns',
        subTarget: 'txt',
        regex: 'hubspotemail\\.net',
        baseConfidence: 0.90
      },
      {
        surface: 'cookie',
        regex: '^__hstc=',
        baseConfidence: 0.85
      },
      {
        surface: 'html_script',
        regex: '//js\\.hs-scripts\\.com/[0-9]+\\.js',
        baseConfidence: 0.90
      }
    ]
  },
  {
    id: 'salesforce-pardot',
    name: 'Salesforce Pardot',
    category: 'MarTech & CRM',
    cpeVendor: 'salesforce',
    cpeProduct: 'pardot',
    matchers: [
      {
        surface: 'dns',
        subTarget: 'txt',
        regex: 'pardot_?[0-9]+[=_][a-f0-9]{32,64}',
        baseConfidence: 0.95
      },
      {
        surface: 'cookie',
        regex: '^visitor_id[0-9]{4,10}=',
        baseConfidence: 0.90
      },
      {
        surface: 'html_script',
        regex: 'pi\\.pardot\\.com/pd\\.js|piAId\\s*=\\s*[\'"][0-9]+[\'"]',
        baseConfidence: 0.90
      }
    ]
  },
  {
    id: 'klaviyo',
    name: 'Klaviyo',
    category: 'MarTech & CRM',
    cpeVendor: 'klaviyo',
    cpeProduct: 'klaviyo',
    matchers: [
      {
        surface: 'dns',
        subTarget: 'txt',
        regex: 'klaviyo-site-verification=',
        baseConfidence: 0.95
      },
      {
        surface: 'dns',
        subTarget: 'txt',
        regex: 'include:spf\\.klaviyo\\.com',
        baseConfidence: 0.90
      },
      {
        surface: 'html_script',
        regex: 'static\\.klaviyo\\.com/onsite/js/klaviyo\\.js',
        baseConfidence: 0.90
      }
    ]
  },

  // ==========================================
  // Product Analytics & Observability
  // ==========================================
  {
    id: 'segment',
    name: 'Segment',
    category: 'Product Analytics & Observability',
    cpeVendor: 'twilio',
    cpeProduct: 'segment',
    matchers: [
      {
        surface: 'http_header',
        subTarget: 'content-security-policy',
        regex: 'cdn\\.segment\\.com',
        baseConfidence: 0.80
      },
      {
        surface: 'cookie',
        regex: '^ajs_anonymous_id=',
        baseConfidence: 0.85
      },
      {
        surface: 'html_script',
        regex: 'analytics\\.SNIPPET_VERSION\\s*=\\s*"([0-9.]+)"',
        baseConfidence: 0.95,
        versionGroup: 1
      }
    ]
  },
  {
    id: 'datadog',
    name: 'Datadog',
    category: 'Product Analytics & Observability',
    cpeVendor: 'datadoghq',
    cpeProduct: 'datadog_rum',
    matchers: [
      {
        surface: 'http_header',
        subTarget: 'x-datadog-trace-id',
        regex: '^[0-9]+$',
        baseConfidence: 0.95
      },
      {
        surface: 'http_header',
        subTarget: 'content-security-policy',
        regex: 'browser-intake-datadoghq\\.com',
        baseConfidence: 0.85
      },
      {
        surface: 'cookie',
        regex: '^_dd_s=rum=',
        baseConfidence: 0.90
      },
      {
        surface: 'html_script',
        regex: 'datadoghq-browser-agent\\.com/(?:[a-z0-9]+/)?v([0-9]+)/datadog-rum\\.js',
        baseConfidence: 0.90,
        versionGroup: 1
      },
      {
        surface: 'html_script',
        regex: 'version:\\s*\'([0-9.]+)\'',
        baseConfidence: 0.85,
        versionGroup: 1
      }
    ]
  },
  {
    id: 'sentry',
    name: 'Sentry',
    category: 'Product Analytics & Observability',
    cpeVendor: 'sentry',
    cpeProduct: 'sentry',
    matchers: [
      {
        surface: 'http_header',
        subTarget: 'content-security-policy',
        regex: 'ingest\\.us\\.sentry\\.io',
        baseConfidence: 0.85
      },
      {
        surface: 'html_script',
        regex: '<meta\\s+name="sentry"\\s+content="(eyJ[A-Za-z0-9+/=]+)"',
        baseConfidence: 0.95,
        versionGroup: 1,
        decodeBase64JsonKey: 'release'
      }
    ]
  },
  {
    id: 'google-analytics-4',
    name: 'Google Analytics 4',
    category: 'Product Analytics & Observability',
    cpeVendor: 'google',
    cpeProduct: 'analytics',
    matchers: [
      {
        surface: 'cookie',
        regex: '^_ga_[A-Z0-9]{8,12}=GS[12]\\.',
        baseConfidence: 0.95
      },
      {
        surface: 'html_script',
        regex: 'googletagmanager\\.com/gtag/js\\?id=(G-[A-Z0-9]{8,12})',
        baseConfidence: 0.95,
        versionGroup: 1
      }
    ]
  },
  {
    id: 'posthog',
    name: 'PostHog',
    category: 'Product Analytics & Observability',
    cpeVendor: 'posthog',
    cpeProduct: 'posthog',
    matchers: [
      {
        surface: 'cookie',
        regex: '^ph_phc_[a-zA-Z0-9]{38,48}_posthog=',
        baseConfidence: 0.95
      },
      {
        surface: 'html_script',
        regex: 'posthog\\.init\\(\\s*["\'](phc_[a-zA-Z0-9]{38,48})["\']',
        baseConfidence: 0.95
      }
    ]
  },

  // ==========================================
  // Enterprise Productivity & Security
  // ==========================================
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    category: 'Enterprise Productivity',
    cpeVendor: 'google',
    cpeProduct: 'workspace',
    matchers: [
      {
        surface: 'dns',
        subTarget: 'mx',
        regex: 'aspmx\\.l\\.google\\.com\\.?$',
        baseConfidence: 0.95
      },
      {
        surface: 'dns',
        subTarget: 'txt',
        regex: 'include:_spf\\.google\\.com',
        baseConfidence: 0.85
      }
    ]
  },
  {
    id: 'microsoft-365',
    name: 'Microsoft 365',
    category: 'Enterprise Productivity',
    cpeVendor: 'microsoft',
    cpeProduct: '365',
    matchers: [
      {
        surface: 'dns',
        subTarget: 'mx',
        regex: '\\.mail\\.protection\\.outlook\\.com\\.?$',
        baseConfidence: 0.95
      },
      {
        surface: 'dns',
        subTarget: 'txt',
        regex: 'include:spf\\.protection\\.outlook\\.com',
        baseConfidence: 0.90
      }
    ]
  },
  {
    id: 'onetrust',
    name: 'OneTrust',
    category: 'Enterprise Security & Compliance',
    cpeVendor: 'onetrust',
    cpeProduct: 'onetrust',
    matchers: [
      {
        surface: 'http_header',
        subTarget: 'content-security-policy',
        regex: 'cdn\\.cookielaw\\.org',
        baseConfidence: 0.85
      },
      {
        surface: 'cookie',
        regex: 'OptanonConsent=.*version=([0-9.]+)',
        baseConfidence: 0.90,
        versionGroup: 1
      },
      {
        surface: 'html_script',
        regex: 'cdn\\.cookielaw\\.org/scripttemplates/([0-9.]+)/otBannerSdk\\.js',
        baseConfidence: 0.95,
        versionGroup: 1
      }
    ]
  },
  {
    id: 'proofpoint',
    name: 'Proofpoint',
    category: 'Enterprise Security & Compliance',
    cpeVendor: 'proofpoint',
    cpeProduct: 'enterprise_protection',
    matchers: [
      {
        surface: 'dns',
        subTarget: 'mx',
        regex: '\\bmx[0-9a-z-]*\\.(?:[a-z0-9-]+\\.)?pphosted\\.com\\.?$',
        baseConfidence: 0.95
      },
      {
        surface: 'dns',
        subTarget: 'txt',
        regex: 'include:spf\\.[a-z0-9.-]*pphosted\\.com',
        baseConfidence: 0.90
      }
    ]
  },
  {
    id: 'cloudflare-bot-management',
    name: 'Cloudflare Bot Management',
    category: 'Enterprise Security & Compliance',
    cpeVendor: 'cloudflare',
    cpeProduct: 'bot_management',
    matchers: [
      {
        surface: 'cookie',
        regex: '^__cf_bm=[A-Za-z0-9_\\-\\.=]+;.*domain=',
        baseConfidence: 0.95
      }
    ]
  }
];

// Export alias to maintain backwards compatibility across detectors and tests
export const SIGNATURE_REGISTRY = PRODUCTION_SIGNATURES;