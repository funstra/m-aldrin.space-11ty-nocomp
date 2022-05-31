{
  const init = () => {
    let form, works;
    let listening = false;
    form = document.querySelector('[router\\:page="/work/"] #work-filter');
    works = document.querySelectorAll(
      '[router\\:page="/work/"] [data-worktags]'
    );

    if (!listening) {
      const cleanUp = () => {
        form.removeEventListener("change", handleChange);
      };
      window.addEventListener("navigating:starting", cleanUp, { once: true });
      listening = true;
      const handleChange = e => {
        const filterBy = e.target.value;
        works.forEach(work => {
          const workTags = work.dataset.worktags;
          if (filterBy === "all") {
            work.classList.remove("filtered");
          } else {
            if (!workTags.includes(filterBy)) {
              work.classList.add("filtered");
            } else {
              work.classList.remove("filtered");
            }
          }
        });
      };
      form?.addEventListener("change", handleChange);
    }
  };
  window.addEventListener("navigating:ending", init, { once: true });
  if (
    !document.documentElement.classList.contains("navigating") &&
    location.pathname == "/work/"
  ) {
    init();
  }
}
