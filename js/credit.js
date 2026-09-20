export function initCredit() {
  const rail = document.querySelector(".right-rail");
  const card = document.getElementById("credit-card");
  const btn = document.getElementById("open-credit");

  function isOpen() {
    return rail.classList.contains("is-open");
  }

  function open() {
    rail.classList.add("is-open");
    btn.setAttribute("aria-expanded", "true");
    btn.setAttribute("aria-label", "Close");
    btn.title = "Close";
    card.setAttribute("aria-hidden", "false");
  }

  function close() {
    rail.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "About");
    btn.title = "About";
    card.setAttribute("aria-hidden", "true");
  }

  function toggle() {
    if (isOpen()) {
      close();
      return;
    }
    open();
  }

  btn.addEventListener("click", (event) => {
    event.stopPropagation();
    toggle();
  });

  document.addEventListener("click", (event) => {
    if (!isOpen()) {
      return;
    }
    if (event.target instanceof Node && (card.contains(event.target) || btn.contains(event.target))) {
      return;
    }
    close();
  });

  return { open, close, toggle, isOpen };
}
