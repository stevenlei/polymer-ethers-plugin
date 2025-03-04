// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",

  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",
};

// ASCII Art
const banner = `
  ${colors.cyan}${colors.bright}
   ██████╗  ██████╗ ██╗  ██╗   ██╗███╗   ███╗███████╗██████╗ 
   ██╔══██╗██╔═══██╗██║  ╚██╗ ██╔╝████╗ ████║██╔════╝██╔══██╗
   ██████╔╝██║   ██║██║   ╚████╔╝ ██╔████╔██║█████╗  ██████╔╝
   ██╔═══╝ ██║   ██║██║    ╚██╔╝  ██║╚██╔╝██║██╔══╝  ██╔══██╗
   ██║     ╚██████╔╝███████╗██║   ██║ ╚═╝ ██║███████╗██║  ██║
   ╚═╝      ╚═════╝ ╚══════╝╚═╝   ╚═╝     ╚═╝╚══════╝╚═╝  ╚═╝
                                                             
   ███████╗████████╗██╗  ██╗███████╗██████╗ ███████╗         
   ██╔════╝╚══██╔══╝██║  ██║██╔════╝██╔══██╗██╔════╝         
   █████╗     ██║   ███████║█████╗  ██████╔╝███████╗         
   ██╔══╝     ██║   ██╔══██║██╔══╝  ██╔══██╗╚════██║         
   ███████╗   ██║   ██║  ██║███████╗██║  ██║███████║         
   ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝         
  ${colors.reset}`;

// Helper functions for pretty output
function printHeader(text) {
  const line = "═".repeat(text.length + 2);
  console.log(`\n${colors.yellow}╔${line}╗${colors.reset}`);
  console.log(
    `${colors.yellow}║${colors.reset} ${colors.bright}${colors.white}${text}${colors.reset} ${colors.yellow}║${colors.reset}`
  );
  console.log(`${colors.yellow}╚${line}╝${colors.reset}\n`);
}

function printSuccess(text) {
  console.log(`${colors.green}✓ ${text}${colors.reset}`);
}

function printInfo(text) {
  console.log(`${colors.cyan}ℹ ${text}${colors.reset}`);
}

function printWarning(text) {
  console.log(`${colors.yellow}⚠ ${text}${colors.reset}`);
}

function printError(text) {
  console.log(`${colors.red}✗ ${text}${colors.reset}`);
}

function printJson(json, maxLength = 200) {
  const formattedJson = JSON.stringify(json, null, 2);
  if (formattedJson.length > maxLength) {
    console.log(
      `${colors.dim}${formattedJson.substring(0, maxLength)}...${colors.reset}`
    );
    console.log(
      `${colors.dim}(${formattedJson.length - maxLength} more characters)${
        colors.reset
      }`
    );
  } else {
    console.log(`${colors.dim}${formattedJson}${colors.reset}`);
  }
}

module.exports = {
  banner,
  colors,
  printHeader,
  printSuccess,
  printInfo,
  printWarning,
  printError,
  printJson,
};
