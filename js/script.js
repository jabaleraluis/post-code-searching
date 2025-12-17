import theme from "./theme.js";

document.addEventListener("DOMContentLoaded", () => {
  theme(".theme__switcher .theme__icon");

  const $searchPC = document.getElementById("cp-search");
  const $searchPlace = document.getElementById("place-search");
  const $InputPC = document.getElementById("postal-code");
  const $result = document.querySelector(".results");

  /* ===== BUSCAR POR CP ===== */
  $searchPC.addEventListener("click", async () => {
    const $region = document.getElementById("region").value;

    if (!/^\d{5}$/.test($InputPC.value)) {
      return validateInput($InputPC, "El código postal debe tener 5 números");
    }

    $searchPC.disabled = true;
    $result.innerHTML = `<p class="loader">Buscando...<i class="ri-loader-line"></i></p>`;

    try {
      const controller = new AbortController();
      const abortTimeout = setTimeout(() => controller.abort(), 5000);

      const url = `http://api.zippopotam.us/${$region}/${encodeURIComponent($InputPC.value)}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(abortTimeout);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("NOT_FOUND");
        } else {
          throw new Error("HTTP_ERROR");
        }
      }
      const data = await res.json();

      const places = data.places
        .map((p) => `<li class="info">${p["place name"]}, ${p.state}</li>`)
        .join("");

      $result.innerHTML = `
        <div class="post-code__results">
          <div class="grid-section line">
            <div class="info">País: <span>${data.country}</span></div>
            <div class="info">Código Postal: <span>${data["post code"]}</span></div>
          </div>
          <h2>Lugares:</h2>
          <ul class="grid-section">
            ${places}
          </ul>
        </div>`;
    } catch (err) {
      handleErrors(err, {
        $result,
        $InputPC,
      });
    } finally {
      $searchPC.disabled = false;
    }
  });

  $InputPC.addEventListener("keydown", (e) => {
    if (e.key.toLocaleLowerCase() === "enter") {
      $searchPC.click();
    }
  });

  /* ===== VALIDAR INPUT DE CÓDIGO POSTAL ===== */
  const validateInput = (input, msg) => {
    input.classList.remove("invalid");
    void input.offsetWidth;
    input.classList.add("invalid");
    input.setCustomValidity(msg);
    input.reportValidity();
  };

  const cleanInputPC = (input) => {
    input.classList.remove("invalid");
    input.setCustomValidity("");
  };

  $InputPC.addEventListener("input", () => {
    cleanInputPC($InputPC);
  });

  /* ===== BUSCAR POR LUGAR ===== */

  /* ===== MANEJO DE ERRORES ===== */
  const ERROR_MESSAGES = {
    NOT_FOUND: (pc) =>
      `<p class="error">No se encontró lugar para el código postal <span>${pc}</span>, verifique que los datos sean correctos...</p>`,
    HTTP_ERROR: () =>
      `<p class="error">El servidor respondió con un error, intentalo más tarde...</p>`,
  };

  const handleErrors = (err, { $result, $InputPC }) => {
    if (err.name === "AbortError") {
      $result.innerHTML = `<p class="error">La petición tardó demasiado en responder...</p>`;
      return;
    }

    if (ERROR_MESSAGES[err.message]) {
      $result.innerHTML = ERROR_MESSAGES[err.message]($InputPC.value.trim());
      return;
    }

    if (err instanceof TypeError) {
      $result.innerHTML = navigator.onLine
        ? `<p class="error">Ha fallado la conexión con el servidor... <i class="ri-cloud-off-line"></i></p>`
        : `<p class="error">Vaya!, parece que no estás conectado a internet... <i class="ri-wifi-off-line"></i></p>`;
      return;
    }

    $result.innerHTML = `<p class="error"><span>Error de conexión: </span>${err.message.toLowerCase()}...</p>`;
  };
});
