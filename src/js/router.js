import zip from "./zip.js";

/*
  TODO abstract this, use [router:] attributes, example -> router:route="base/section" ( this is the layout ), 
  router:part="work" ( this could be part of a page that uses the same layout as another )
 */

// Fetch html string and return a new html document
/**
 * @param {string} href
 * @returns {Promise<{page: Document,title: string}>}
 */
const getHTML = async href => {
  const res = await fetch(href);
  const page = new DOMParser().parseFromString(await res.text(), "text/html");
  return { page, title: page.querySelector("title").innerHTML };
};

// Query [router:page] elements
/**
 * @param {Document} doc
 * @returns {{elm:HTMLElement,val:String}[]}
 */
const routerAttr = doc => {
  return Array.from(doc.querySelectorAll("[router\\:page]")).map(elm => ({
    elm,
    val: elm.getAttribute("router:page"),
  }));
};

// Get the diff between destination/source page
/**
 *  @param {Document} destination
 * @returns {Promise<[{elm:HTMLElement,val:String},{elm:HTMLElement,val:String}]>}
 */
const diffPage = async destination => {
  const [destrouters, srcrouters] = [destination, document].map(routerAttr);
  const zipedrouters = zip(destrouters, srcrouters);
  for (const [dest, src] of zipedrouters) {
    if (dest.val !== src.val) {
      return [dest, src];
    }
  }
  return [null, null];
};
/** @param {Document} destination */
const diffResource = async destination => {
  const resource = destination.page.querySelector(
    `[router\\:resource='/${destination.title}/']`
  );
  const currentResource = document.querySelector(
    `[router\\:resource='/${destination.title}/']`
  );
  if (currentResource === null && resource !== null) {
    document.head.appendChild(resource);
  }
};

/**
 * @param {{elm:HTMLElement,val:String}} dest
 * @param {{elm:HTMLElement,val:String}} src
 */
const diffParts = (dest, src) => {
  const [destParts, srcParts] = [dest, src].map(doc => {
    return Array.from(doc.elm.querySelectorAll("[router\\:part]"));
  });
  return [destParts, srcParts];
};

// sets the page
/**
 * @param {object} o
 * @param {string} o.pathname
 * @param {string} o.href
 */
const setPage = async (target, outside = false, scrollTop = 0, push = true) => {
  const { pathname, href } = target;

  document.querySelector("main").classList.add("fetching");

  const destinationDocument = await getHTML(href);
  let [dest, src] = await diffPage(destinationDocument.page);
  diffResource(destinationDocument);

  if (push) {
    // set scrollTop position on current position at history stack
    history.replaceState(
      { scrollTop: src.elm.scrollTop },
      null,
      location.pathname
    );
    // push destination path to history stack
    history.pushState(null, null, pathname);
  } else {
    // TODO, Keep track of scrollTop onpostate
  }

  // prepend destination document to source parent

  src.elm.parentElement.insertBefore(dest.elm, src.elm.nextSibling);
  // src.elm.parentElement.append(dest.elm);
  // dest.elm.style.translate = "0 100%";

  setTimeout(() => {
    // Transition - -
    src.elm.classList.add("slideOut");
    dest.elm.style.translate = "";
    dest.elm.classList.add("slideIn");

    const pageTransitionDuration = parseFloat(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--page-transition-duration")
        .replace("ms", "")
    );

    setTimeout(() => {
      src.elm.remove();
      setTimeout(() => {
        dest.elm.classList.remove("slideIn");
        document.documentElement.setAttribute("router:current-page", pathname);
      }, pageTransitionDuration);
    }, pageTransitionDuration);

    document.querySelector("title").innerHTML = destinationDocument.title;
    document.querySelector("site-nav").setAttribute("current-route", dest.val);
    // document.querySelector("f-nav").setAttribute("route", dest.val);
  }, 1);
};

// handle click and f-nav events
const handle = async e => {
  let { target } = e;
  if (
    target.tagName === "A" &&
    target.origin === location.origin &&
    target.pathname !== location.pathname
  ) {
    e.preventDefault();
    setPage(target, true);
  }
};

// listen for anchor clicks
document.addEventListener("click", handle);

// handle history change
onpopstate = e => {
  setPage(location, true, e.state?.scrollTop || 0, false);
};
