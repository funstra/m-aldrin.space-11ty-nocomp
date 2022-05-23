const { minify } = require("html-minifier-terser");
const { minify: terser } = require("terser");
const { minify: csso } = require("csso");
const image = require("./11ty/img");

// filters - -
const { irand, frand, angleToV } = require("./11ty/filters.js");

/** @param {import('@11ty/eleventy/src/UserConfig')} config */
module.exports = config => {

  // gen design filters 
  config.addNunjucksFilter("irand", irand);
  config.addNunjucksFilter("frand", frand);
  config.addNunjucksFilter("angleToV", angleToV);
  
  config.addNunjucksShortcode("image", image);
  if (process.env.NODE_ENV !== "dev") {
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
      compile: async (inputContent,outPutPath) => {
        // ignore /pages/ files
        if(outPutPath.includes('/pages/')){
          return
        }
        let output = terser(inputContent);
        return async () => {
          return (await output).code;
        };
      },
    });
    config.addTemplateFormats("css");
    config.addExtension("css", {
      outputFileExtension: "css",
      compile: async (inputContent,outPutPath) => {
        // ignore /pages/ files
        if(outPutPath.includes('/pages/')){
          return
        }
        let output = csso(inputContent);
        return async () => {
          return output.css;
        };
      },
    });
  } else {
    config.addPassthroughCopy("src/css");
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
