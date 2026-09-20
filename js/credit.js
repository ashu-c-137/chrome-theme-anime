export function initCredit() {
  const card = document.getElementById("credit-card");
  const btn = document.getElementById("open-credit");

  function isOpen() {
    return !card.classList.contains("hidden");
  }

  function open() {
    card.classList.remove("hidden");
    btn.setAttribute("aria-expanded", "true");
  }

  function close() {
    card.classList.add("hidden");
    btn.setAttribute("aria-expanded", "false");
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
