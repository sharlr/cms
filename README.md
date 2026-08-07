# Multi-Language Implementation (FR, EN, AR)

## Files Included

### New Files (Copy to your repo):
- src/i18n/config.ts
- src/i18n/utils.ts
- src/i18n/index.ts
- src/i18n/LanguageContext.tsx
- src/i18n/translations/fr.json
- src/i18n/translations/en.json
- src/i18n/translations/ar.json
- src/components/LanguageSwitcher.tsx
- src/components/HomeContent.tsx
- src/components/SiteFooter.tsx

### Modified Files (Replace in your repo):
- src/app/layout.tsx
- src/components/NavBar.tsx
- src/components/AppShell.tsx
- src/app/accueil/page.tsx

## Installation Steps

1. Extract this zip file into your project root
2. Copy all files to your local `cms` repository
3. Run: `npm install`
4. Commit the changes
5. Push to GitHub:
   ```bash
   git add .
   git commit -m "Add multi-language support (FR, EN, AR)"
   git push -u origin claude/multi-language-support-3gla9k
   ```

## Features

✓ 3 languages: French, English, Arabic
✓ Language switcher in navbar (FR | EN | AR)
✓ Persistent language preference (localStorage)
✓ RTL support for Arabic
✓ Dynamic text replacement ({name}, {count})
✓ Zero dependencies (React Context only)

## Testing Locally

After installation:
```bash
DATABASE_URL="postgresql://cms:test@localhost:5432/cms" npm run dev
```

Then click the language buttons in the navbar to switch languages!
