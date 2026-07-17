const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

const themeRegex = /@theme\s*\{([\s\S]*?)\}/;
const match = css.match(themeRegex);

if (match) {
  let themeBody = match[1];
  let rootVars = '';
  
  let newThemeBody = themeBody.replace(/--color-([a-zA-Z0-9-]+):\s*(#[a-zA-Z0-9]+);/g, (m, name, hex) => {
    rootVars += `    --theme-${name}: ${hex};\n`;
    return `--color-${name}: var(--theme-${name});`;
  });
  
  newThemeBody = newThemeBody.replace(/--color-secondary-rgb:\s*([^;]+);/g, (m, val) => {
    rootVars += `    --theme-secondary-rgb: ${val};\n`;
    return `--color-secondary-rgb: var(--theme-secondary-rgb);`;
  });

  css = css.replace(themeRegex, '@theme {' + newThemeBody + '}');
  
  const baseLayer = '\n@layer base {\n  :root {\n' + rootVars + '  }\n}\n';
  css = css.replace('@theme {', baseLayer + '@theme {');
  
  css = css.replace(/\.light\s*\{([\s\S]*?)\}/, (m, lightBody) => {
    let newLight = lightBody.replace(/--color-([a-zA-Z0-9-]+):\s*(#[a-zA-Z0-9]+);/g, (m, name, hex) => {
      return `--theme-${name}: ${hex};`;
    });
    newLight = newLight.replace(/--color-secondary-rgb:\s*([^;]+);/g, (m, val) => {
      return `--theme-secondary-rgb: ${val};`;
    });
    return '.light {' + newLight + '}';
  });
  
  fs.writeFileSync('src/index.css', css);
  console.log('Successfully rewrote index.css to use CSS variables for theme colors!');
} else {
  console.log('Could not find @theme block.');
}
