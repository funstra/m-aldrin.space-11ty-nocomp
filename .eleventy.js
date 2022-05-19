const { minify } = require("html-minifier-terser");
const { minify: terser } = require("terser");
const { minify: csso } = require("csso");
const image = require("./11ty/img");

/** @param {import('@11ty/eleventy/src/UserConfig')} config */
module.exports = config => {
  config.addNunjucksShortcode("image", image);
  if (process.env.NODE_ENV === "production") {
    config.addTransform("htmlmin", async function (content, outputPath) {
      if (outputPath && outputPath.endsWith(".html")) {
        let minified = await minify(content, {
          useShortDoctype: true,
          removeComments: true,
          collapseWhitespace: true,
          minifyJS: true,
          minifyCSS: true,
          customAttrCollapse: /d/,
        });
        return minified;
      }

      return content;
    });

    config.addTemplateFormats("js");
    config.addExtension("js", {
      outputFileExtension: "js",
      compile: async inputContent => {
        // Replace any instances of cloud with butt
        let output = terser(inputContent);
        return async () => {
          return (await output).code;
        };
      },
    });
    config.addTemplateFormats("css");
    config.addExtension("css", {
      outputFileExtension: "css",
      compile: async inputContent => {
        // Replace any instances of cloud with butt
        let output = csso(inputContent);
        return async () => {
          return output.css;
        };
      },
    });
  } else {
    config.addPassthroughCopy("src/style.css");
    config.addPassthroughCopy("src/js/");
    config.addPassthroughCopy({ "./assets/img": "assets/img" });
  }
  config.addPassthroughCopy({ "./static/": "assets" });
  return {
    dir: {
      input: "src",
    },
  };
};
