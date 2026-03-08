const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'style.css');
let css = fs.readFileSync(cssPath, 'utf8');

const oldHeader = `/* Header: Sistema IRIS (sin logo, texto legible azul corporativo) */
.login-header {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  padding: 24px 40px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(31, 63, 131, 0.12);
}

.login-header-brand {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.login-header-title {
  font-size: 22px;
  font-weight: 700;
  color: #1f3f83;
  letter-spacing: 0.2px;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.9);
}

.login-header-sub {
  font-size: 14px;
  font-weight: 600;
  color: #1f3f83;
  letter-spacing: 0.15px;
  opacity: 0.95;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.9);
}`;

const newHeader = `/* Header: Sistema IRIS (transparente, Times New Roman, 24pt, derecha) */
.login-header {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 24px 48px 24px 40px;
  background: transparent;
}

.login-header-brand {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 2px;
  text-align: right;
}

.login-header-title {
  font-family: "Times New Roman", Times, serif;
  font-size: 24pt;
  font-weight: 700;
  color: #1f3f83;
  letter-spacing: 0.2px;
  text-shadow: 0 1px 3px rgba(255, 255, 255, 0.95), 0 0 1px rgba(0, 0, 0, 0.1);
}

.login-header-sub {
  font-family: "Times New Roman", Times, serif;
  font-size: 16pt;
  font-weight: 600;
  color: #1f3f83;
  letter-spacing: 0.15px;
  opacity: 0.95;
  text-shadow: 0 1px 3px rgba(255, 255, 255, 0.95), 0 0 1px rgba(0, 0, 0, 0.1);
}`;

if (css.includes(oldHeader)) {
  css = css.replace(oldHeader, newHeader);
  fs.writeFileSync(cssPath, css);
  console.log('Header CSS updated successfully');
} else {
  console.log('Pattern not found, trying alternative...');
  const alt = css.match(/\.login-header \{[^}]+\}/s);
  if (alt) console.log('Found login-header block');
}
