# A resume builder

This is a simple resume builder template that takes a JSON file and generates a resume in HTML and PDF format.

## Usage

### Quick start
1. [Click here](https://github.com/new?template_name=resume-template&template_owner=recrsn) to create a new repository using this as a template. _I strongly recommend you to **keep the repository private.**_
   This avoids exposing your personal information to the wider internet.
2. Clone the repository to your local machine.
3. Edit `resume.json` with your data.
4. In `resume.config.js`, update the values as per your requirement.
5. Preview the resume in HTML format by running the following command.
   ```
   npm run watch
   ```
   This will start a live server and print the URL in the console. Open the URL in your browser to preview the resume.
6. Run the following command to generate the resume in HTML and PDF format.
   ```
   npm run build
   ```

### Customizing the resume

#### Changing the color scheme

You can change the theme of the resume by updating the `colors` object in `resume.config.js`.
The `colors` are borrowed from the [Tailwind CSS](https://tailwindcss.com/docs/customizing-colors) color palette.

#### Changing the font

You can update the font by changing the font family in the `resume.config.js` file. If you use a non-system font,
download the font files and placing them in the `fonts` directory. Add an entry in `fonts/manifest.json` to generate
appropriate CSS to load your custom font.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
