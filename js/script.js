import theme from "./theme.js";

document.addEventListener("DOMContentLoaded", () => {
  theme(".theme__switcher .theme__icon");

  const $searchPC = document.getElementById("cp-search");
  const $InputPC = document.getElementById("postal-code");
  const $result = document.querySelector(".results");

  $searchPC.addEventListener("click", async () => {
    const $region = document.getElementById("region").value;

    if (!/^\d{5}$/.test($InputPC.value)) {
      return validateInput($InputPC, "El código postal debe tener 5 números");
    }

    $searchPC.disabled = true;
    $result.innerHTML = `<p class="loader">Buscando...<i class="ri-loader-line"></i></p>`;

    try {
      const controller = new AbortController();
      const abortTimeout = setTimeout(() => controller.abort(), 2000);

      const url = `http://ap.zippopotam.us/${$region}/${encodeURIComponent(
        $InputPC.value.trim()
      )}`;
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
      if (err.name === "AbortError") {
        return ($result.innerHTML = `<p class="error">La petición tardó demasiado en responder...</p>`);
      } else if (err.message === "NOT_FOUND") {
        return ($result.innerHTML = `<p class="error">No se encontró lugar para el código postal <span>${$InputPC.value.trim()}</span>, verifique que los datos sean correctos...</p>`);
      } else if (err instanceof TypeError) {
        return ($result.innerHTML = navigator.onLine
          ? `<p class="error">El servidor no responde...</p>`
          : `<p class="error">Parece que no estás conectado a internet... <i class="ri-wifi-off-line"></i></p>`);
      } else {
        return ($result.innerHTML = `<p class="error"><span>Error de conexión: </span>${err.message.toLowerCase()}...</p>`);
      }
    } finally {
      $searchPC.disabled = false;
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
});
