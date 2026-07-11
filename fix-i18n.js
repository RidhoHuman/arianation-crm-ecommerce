const fs = require('fs');
const path = require('path');

function processLayout() {
  const filePath = path.join(__dirname, 'frontend/src/components/Layout.jsx');
  let content = fs.readFileSync(filePath, 'utf8');

  // Add import
  if (!content.includes("import { useTranslation }")) {
    content = content.replace("import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';", "import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';\nimport { useTranslation } from 'react-i18next';");
  }

  // Remove manual translations using a more robust regex or split
  const layoutMatch = content.match(/const TRANSLATIONS = \{[\s\S]*?const t = TRANSLATIONS\[language\](?: \|\| TRANSLATIONS\.ID)?;/);
  if (layoutMatch) {
    content = content.replace(layoutMatch[0], "const { t } = useTranslation('translation', { keyPrefix: 'layout' });");
  } else {
    console.log("Could not find TRANSLATIONS block in Layout.jsx");
  }

  // Fix {t.xyz} to {t('xyz')} but ignore template literals like ${t.slug}
  content = content.replace(/(?<!\$)\{t\.([a-zA-Z0-9_]+)\}/g, "{t('$1')}");

  // Fix ternary manual language logic to use useTranslation
  content = content.replace(/\{user\.role === 'ADMIN' \|\| user\.role === 'OWNER' \? 'Admin' \: \(language === 'ID' \? 'Akun' \: 'Account'\)\}/g, "{user.role === 'ADMIN' || user.role === 'OWNER' ? 'Admin' : t('account')}");
  content = content.replace(/\{user\.role === 'ADMIN' \|\| user\.role === 'OWNER' \? 'Admin Panel' \: \(language === 'ID' \? 'Akun Saya' \: 'My Account'\)\}/g, "{user.role === 'ADMIN' || user.role === 'OWNER' ? t('adminPanel') : t('account')}");

  fs.writeFileSync(filePath, content);
  console.log("Updated Layout.jsx");
}

processLayout();
