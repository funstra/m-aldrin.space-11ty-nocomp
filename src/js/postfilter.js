const form = document.querySelector('[router\\:page="/work/"] #work-filter');
const works = document.querySelectorAll(
  '[router\\:page="/work/"] [data-worktags]'
);
form?.addEventListener("change", e => {
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
});
