const colors = require('tailwindcss/colors');
const path = require("node:path");
const fs = require("node:fs");

module.exports = {
    source: path.join(__dirname, 'resume.json'),
    colors: {
        accent: colors.blue,
        neutral: colors.neutral,
    },
    pdf: {
        dest: path.join(__dirname, 'out/resume.pdf'),
        options: {
            format: 'A4',
            margin: {
                top: '1cm',
                right: '1cm',
                bottom: '1cm',
                left: '1cm'
            },
            displayHeaderFooter: false,
            printBackground: true
        }
    }
}