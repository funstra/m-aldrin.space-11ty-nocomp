// import zip from "./zip.js";
const zip = (...arrs) => {
  const _ = arrs.reduce((prev, curr) => {
    if (curr.length > prev.length) {
      return curr;
    }
    return prev;
  });
  return _.map((_, i) => arrs.map(arr => arr[Math.min(i, arr.length - 1)]));
};

// Fetch document string and return a new DOM
/**
 * @param {string} href
 * @returns {Promise<{document: Document,title: string}>}
 */
const fetchDocument = async href => {
  const res = await fetch(href);
  const document = new DOMParser().parseFromString(
    await res.text(),
    "text/html"
  );
  return { document, title: document.querySelector("title").innerHTML };
};

// Query all [router:document] elements
/**
 * @param {Document} doc
 * @returns {{elm:HTMLElement,document:String}[]}
 */
const queryPage = doc => {
  // @ts-ignore
  return Array.from(doc.querySelectorAll("[router\\:page]")).map(elm => ({
    elm,
    document: elm.getAttribute("router:page"),
    layout: elm.getAttribute("router:layout"),
  }));
};

// Diff the destination and source document, return the first mismatch( the outermost element that the destionation document is depedent on )
/**
 *  @param {Document} destination
 * @returns {Promise<[{elm:HTMLElement,document:String},{elm:HTMLElement,document:String}]>}
 */
const diffDocument = async destination => {
  const [destrouters, srcrouters] = [destination, document].map(queryPage);
  const zipedrouters = zip(destrouters, srcrouters);
  for (const [dest, src] of zipedrouters) {
    if (dest.document !== src.document) {
      return [dest, src];
    }
  }
  return [null, null];
};

// Diff document resources(css and js)
/**
 *  @param {{document:Document,title:String}} destination
 *  @returns {Promise<()=>void>} cleanup function
 */
const diffResource = async destination => {
  const route = destination.document
    .querySelector("[router\\:page]")
    .getAttribute("router:page");
  const layout = destination.document
    .querySelector("[router\\:layout]")
    .getAttribute("router:layout");

  const selectorString = `:is([router\\:resource='${route}'],[router\\:resource='${layout}'])`;

  const resource = destination.document.querySelectorAll(selectorString);

  const currentResource = document.querySelectorAll("[router\\:resource]");

  resource.forEach(r => {
    if (r.tagName === "STYLE") {
      document.head.appendChild(r);
    }
    if (r.tagName === "SCRIPT") {
      const s = document.createElement("script");
      s.setAttribute("router:resource", r.getAttribute("router:resource"));
      s.textContent = r.textContent;
      document.body.appendChild(s);
    }
  });
  // Return cleanup function
  return () => currentResource.forEach(resource => resource.remove());
};

/**
 * @param {HTMLElement} dest
 * @param {HTMLElement} src
 */
const getRouterOrder = (dest, src) => {
  const srcDir = parseInt(src.getAttribute("router:order"));
  const destDir = parseInt(dest.getAttribute("router:order"));

  let outDir = "0%,0%";
  let inDir = "0%,0%";
  if (isNaN(destDir)) {
  } else {
    if (srcDir - destDir < 0) {
      outDir = "1%";
    } else {
      outDir = "-1%";
    }
  }
  if (isNaN(srcDir)) {
  } else {
    if (srcDir - destDir < 0) {
      inDir = "-1%";
    } else {
      inDir = "1%";
    }
  }
  const srcDirection = src.getAttribute("router:direction");
  if (srcDirection === "vertical") {
    outDir = `0 , ${outDir}`;
  }
  const destDirection = dest.getAttribute("router:direction");
  if (destDirection === "vertical") {
    inDir = `0 , ${inDir}`;
  }
  dest.style.setProperty("--in-dir", inDir);
  src.style.setProperty("--out-dir", outDir);
};

// Keep track of previous scrollTop
let prevScrollTop = 0;

// set attributes and dispatch events in the routers lifecycle
const lifeCycleEvents = {
  /** @param {"starting" | "ending"} s */
  navigating: s => {
    dispatchEvent(new Event(`navigating:${s}`));
    document.documentElement.classList[s == "starting" ? "add" : "remove"](
      "navigating"
    );
  },
  /** @param {"starting" | "ending"} s */
  transitioning: s => {
    dispatchEvent(new Event(`transitioning:${s}`));
    document.documentElement.classList[s == "starting" ? "add" : "remove"](
      "transitioning"
    );
  },
};

const observerer = new MutationObserver(() => (list, obs) => {
  list.forEach(mutation => {
    console.log(mutation.addedNodes[0]);
  });
});

// sets the document
/**
 * @param {HTMLAnchorElement | Location} target
 * @param {boolean} push
 * @param {boolean} scroll
 */
const setPage = async ({ pathname, href }, push = true, scroll = false) => {
  lifeCycleEvents.navigating("starting");

  const destinationDocument = await fetchDocument(href);
  let [dest, src] = await diffDocument(destinationDocument.document);
  const cleanUpStyles = diffResource(destinationDocument);

  if (push) {
    // push destination path to history stack
    history.pushState(null, null, pathname);
  }

  // Set css custom props dependent on order and router:direction
  getRouterOrder(dest.elm, src.elm);

  // What for changes on the body
  // observerer.observe(document.body, {
  //   childList: true,
  // });

  // Insert dest elm before src
  src.elm.parentElement.insertBefore(dest.elm, src.elm.nextSibling);

  // add animation classes
  src.elm.classList.add("slideOut");
  dest.elm.classList.add("slideIn");

  //
  setTimeout(() => {
    // wait for the document to be inserted before scroll

    if (scroll) dest.elm.scrollTo({ top: prevScrollTop });
    prevScrollTop = src.elm.scrollTop;
    // dispatchEvent(new Event("navigating:finish"));
    lifeCycleEvents.navigating("ending");

    const pageTransitionDuration = parseFloat(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--page-transition-duration")
        .replace("ms", "")
    );

    lifeCycleEvents.transitioning("starting");
    setTimeout(() => {
      src.elm.remove();
      setTimeout(() => {
        document.documentElement.focus();

        dest.elm.style.removeProperty("--in-dir");
        src.elm.style.removeProperty("--out-dir");

        dest.elm.classList.remove("slideIn");
        document.documentElement.setAttribute("router:current-page", pathname);
        document.documentElement.setAttribute(
          "router:current-layout",
          dest.elm.getAttribute("router:layout")
        );
        lifeCycleEvents.transitioning("ending");
        cleanUpStyles.then(cb => cb());
      }, pageTransitionDuration);
    }, pageTransitionDuration);

    document.querySelector("title").innerHTML = destinationDocument.title;
    document
      .querySelector("site-nav")
      .setAttribute("current-route", dest.document);
    document.querySelector("site-nav").setAttribute("state", "close");
  }, 1);
};

// handle click
const handle = async e => {
  let { target } = e;
  // If it's a download anchor return
  if (target.download) {
    return;
  }
  // If it's a hash anchor, just scroll href intoView
  if (target.hash) {
    e.preventDefault();
    document.querySelector(target.hash).scrollIntoView({
      block: "start",
    });
    return;
  } else {
    // If path points to current path add .err and return
    if (target.pathname === location.pathname) {
      e.preventDefault();
      target.classList.add("err");
      setTimeout(() => {
        target.classList.remove("err");
      }, 100);
      return;
    }
    // If it's an Anchor and it's the same origin
    if (target.tagName === "A" && target.origin === location.origin) {
      e.preventDefault();
      setPage(target);
    }
  }
};

// listen for anchor clicks
document.addEventListener("click", handle);

// handle history change
// Dont push history onpopstate
onpopstate = e => {
  setPage(location, false, true);
};
