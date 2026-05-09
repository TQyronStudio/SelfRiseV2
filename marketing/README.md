# SelfRise V2 Marketing Assets

Production workspace for App Store and Google Play screenshots.

## Core Workflow

1. Put raw app screenshots into `raw/`.
2. Create premium AI-composed store visuals in `generated/`.
3. Export final store-ready files with exact platform dimensions into `final/`.

The current visual benchmark is:

`reference/style/selfrise-premium-home-reference.png`

All generated screenshots should follow that direction unless we explicitly decide on a new art direction.

## Folder Structure

```txt
marketing/
├── raw/
│   ├── phone/
│   │   ├── ios/
│   │   │   ├── en/
│   │   │   ├── de/
│   │   │   └── es/
│   │   └── android/
│   │       ├── en/
│   │       ├── de/
│   │       └── es/
│   └── tablet/
│       ├── ios/
│       │   ├── en/
│       │   ├── de/
│       │   └── es/
│       └── android/
│           ├── en/
│           ├── de/
│           └── es/
├── generated/
│   ├── phone/
│   │   ├── ios/
│   │   │   ├── en/
│   │   │   ├── de/
│   │   │   └── es/
│   │   └── android/
│   │       ├── en/
│   │       ├── de/
│   │       └── es/
│   └── tablet/
│       ├── ios/
│       │   ├── en/
│       │   ├── de/
│       │   └── es/
│       └── android/
│           ├── en/
│           ├── de/
│           └── es/
├── final/
│   ├── phone/
│   │   ├── ios/
│   │   │   ├── en/app-store/
│   │   │   ├── de/app-store/
│   │   │   └── es/app-store/
│   │   └── android/
│   │       ├── en/google-play/
│   │       ├── de/google-play/
│   │       └── es/google-play/
│   └── tablet/
│       ├── ios/
│       │   ├── en/app-store/
│       │   ├── de/app-store/
│       │   └── es/app-store/
│       └── android/
│           ├── en/google-play/
│           ├── de/google-play/
│           └── es/google-play/
├── reference/
│   ├── style/
│   └── prompts/
└── archive/
    └── generator-tests/
```

## Raw Inputs

You provide raw screenshots here:

```txt
raw/{device}/{platform}/{locale}/{screen-name}-raw.png
```

Examples:

```txt
raw/phone/ios/en/01-home-level-raw.png
raw/phone/android/de/01-home-level-raw.png
raw/tablet/ios/en/01-home-level-raw.png
raw/tablet/android/es/01-home-level-raw.png
```

Supported devices:

- `phone`
- `tablet`

Supported platforms:

- `ios`
- `android`

Supported locales:

- `en`
- `de`
- `es`

## Generated AI Compositions

Premium generated visuals go here:

```txt
generated/{device}/{platform}/{locale}/{slide-number}-{screen-name}.png
```

Examples:

```txt
generated/phone/ios/en/01-home.png
generated/phone/android/en/01-home.png
generated/tablet/ios/es/01-home.png
```

This layer is for the polished creative output before exact store resizing.
The platform segment is required because iOS and Android use different device frames.

## Final Store Exports

Final upload-ready files go here:

```txt
final/{device}/{platform}/{locale}/{store}/{slide-number}-{screen-name}-{size}.png
```

Examples:

```txt
final/phone/ios/en/app-store/01-home-1290x2796.png
final/phone/android/en/google-play/01-home-1080x1920.png
final/tablet/ios/en/app-store/01-home-2048x2732.png
```

## Target Sizes

### App Store

Primary phone export:

- `1290x2796` for iPhone 6.9" / 6.7" class

Optional phone exports:

- `1320x2868`
- `1284x2778`

Tablet exports:

- `2048x2732`
- `2064x2752`

### Google Play

Phone:

- `1080x1920`

Feature graphic:

- `1024x500`

Tablet:

- `1200x1920` for 7" portrait
- `1600x2560` for 10" portrait

## Quality Rules

- No visible notification/status clutter unless intentionally standardized.
- No ad banners.
- No test labels.
- No watermarks.
- Text must be clean, readable, and localized.
- The first three screenshots should clearly show actual app UI inside the marketing composition.
- Keep the visual style close to `reference/style/selfrise-premium-home-reference.png`.

## Current Seed Asset

The first raw phone screenshot is stored at:

```txt
raw/phone/en/home-raw.png
```

The earlier deterministic generator drafts are preserved in:

```txt
archive/generator-tests/
```
