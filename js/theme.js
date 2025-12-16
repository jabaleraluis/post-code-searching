export default function themeSwitcher(icon) {
  const d = document,
    $icons = d.querySelectorAll(icon),
    darkIcon = d.querySelector('[data-theme="dark"]'),
    lightIcon = d.querySelector('[data-theme="light"]');

  function setTheme(theme) {
    d.body.classList.remove("dark");
    $icons.forEach((icon) => icon.classList.remove("active"));

    if (theme === "dark") {
      d.body.classList.add("dark");
      if (darkIcon) darkIcon.classList.add("active");
    } else {
      if (lightIcon) lightIcon.classList.add("active");
    }

    localStorage.setItem("theme", theme);
  }

  const savedTheme = localStorage.getItem("theme") || "light";
  setTheme(savedTheme);

  $icons.forEach((icon) => {
    icon.addEventListener("click", () => {
      const theme = icon.dataset.theme;
      setTheme(theme);
    });
  });
}
