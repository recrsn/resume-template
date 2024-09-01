import colors from "tailwindcss/colors.js";

export default {
  source: "./resume.json",
  font: "Roboto",
  fallbackFont: "sans-serif",
  colors: {
    accent: colors.blue,
    neutral: colors.neutral,
  },
  pdf: {
    dest: "./out/resume.pdf",
    options: {
      format: "A4",
      margin: {
        top: "1cm",
        right: "1cm",
        bottom: "1cm",
        left: "1cm",
      },
      displayHeaderFooter: false,
      printBackground: true,
    },
  },
};
