const { minify } = require("html-minifier-terser");
const { minify: terser } = require("terser");
const { minify: csso } = require("csso");
const { tag, path } = require("./11ty/img");

const pluginTOC = require("eleventy-plugin-toc");

// filters - -
const { irand, frand, angleToV } = require("./11ty/filters.js");

/** @param {import('@11ty/eleventy/src/UserConfig')} config */
module.exports = config => {
  config.addPlugin(pluginTOC);

  // gen design filters
  config.addNunjucksFilter("irand", irand);
  config.addNunjucksFilter("frand", frand);
  config.addNunjucksFilter("angleToV", angleToV);
  
  
  // config.addNunjucksFilter("compareTags", ([worktags])=>{

  // });

  // date
  config.addNunjucksFilter("daatee", d => {
    const _d = new Date(d);
    return _d;
  });

  config.addNunjucksShortcode("image", tag);
  config.addNunjucksFilter("imgPath", path);
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
      compile: async (inputContent, outPutPath) => {
        // ignore /pages/ files
        if (outPutPath.includes("/pages/")) {
          return;
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
      compileOptions: {
        permalink: (contents, inputPath) => {
          if (inputPath.includes("main.css")) {
            return "css/main.css";
          }
          return false;
        },
      },
      compile: async (inputContent, outPutPath) => {
        if (outPutPath.includes("main.css")) {
          let output = csso(inputContent);
          return async () => {
            return output.css;
          };
        } else {
          return;
        }
      },
    });
  } else {
    config.addPassthroughCopy({ "src/style/css/main.css": "css/main.css" });
    config.addPassthroughCopy({ "src/style/css/pages": "css/pages/" });
    config.addPassthroughCopy({ "src/style/css/layouts": "css/layouts/" });
    config.addPassthroughCopy({
      "src/style/css/components": "css/components/",
    });
    // config.addPassthroughCopy({ "./assets/img": "assets/img" });
    config.addPassthroughCopy("src/js/");
    config.addPassthroughCopy("./assets/img");
  }
  // config.addPassthroughCopy({ "./assets/vid": "assets/vid" });
  config.addPassthroughCopy("./assets/vid");
  config.addPassthroughCopy("./assets/touchfiles");
  config.addPassthroughCopy({ "./static/": "assets" });
  return {
    dir: {
      input: "src",
    },
  };
};
