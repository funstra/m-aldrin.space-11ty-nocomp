if (!window._initPath) {
  window._initPath = () => {
    const doc = document.querySelector('main[router\\:page="/about/"]');
    const hello = doc.querySelector(".hello").parentElement;
    const pathIllu = doc.querySelector(".path-illu");
    const faceIllu = doc.querySelector(".face-illu");
    const path = pathIllu.querySelector("path");
    const endPoint = faceIllu.querySelector("circle");
    const getCoord = e => {
      const endPointRect = endPoint.getBBox();
      path.setAttribute(
        "d",
        `
          M${hello.offsetLeft + 20}, ${hello.offsetTop} 
          m0,-8
          m-3,-4
          Q${endPointRect.x * 0.75} ${endPointRect.y * 1} ${endPointRect.x} ${
          endPointRect.y
        }
    `
      );
    };
    getCoord();
    window.addEventListener("resize", getCoord);
  };
}
