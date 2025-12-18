import theme from "./theme.js";

document.addEventListener("DOMContentLoaded", () => {
  theme(".theme__switcher .theme__icon");

  const $searchPC = document.getElementById("cp-search");
  const $searchPlace = document.getElementById("place-search");
  const $InputPC = document.getElementById("postal-code");
  const $inputPlace = document.getElementById("input-place");
  const $result = document.querySelector(".results");

  let controller = null;

  /* ===== BUSCAR POR CP ===== */
  $searchPC.addEventListener("click", async () => {
    const $region = document.getElementById("region").value;

    if (!/^\d{5}$/.test($InputPC.value)) {
      return validateInput($InputPC, "El código postal debe tener 5 números");
    }

    const { signal, clear } = abortController();

    $searchPC.disabled = true;
    $result.innerHTML = `<p class="loader">Buscando...<i class="ri-loader-line"></i></p>`;

    try {
      const url = `http://api.zippopotam.us/${$region}/${encodeURIComponent($InputPC.value)}`;
      const res = await fetch(url, { signal });
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
        input: $InputPC,
        type: "postal",
      });
    } finally {
      $searchPC.disabled = false;
      clear();
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

  const cleanInput = (input) => {
    input.classList.remove("invalid");
    input.setCustomValidity("");
  };

  $InputPC.addEventListener("input", () => {
    cleanInput($InputPC);
  });

  /* ===== BUSCAR POR LUGAR ===== */
  $searchPlace.addEventListener("click", async () => {
    if (!$inputPlace.value) {
      return validateInput($inputPlace, "No puedes buscar un campo vacío");
    }

    const { signal, clear } = abortController();

    $searchPlace.disabled = true;
    $result.innerHTML = `<p class="loader">Buscando...<i class="ri-loader-line"></i></p>`;

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&q=${encodeURIComponent(
        $inputPlace.value.trim()
      )}&accept-language=es`;

      const res = await fetch(url, {
        signal,
        headers: { Accept: "application/json" },
      });

      if (!res.ok) throw new Error("HTTP_ERROR");

      const data = await res.json();

      if (!data.length) throw new Error("NOT_FOUND");

      const places = data[0];
      console.log(places);
      const fields = [
        { name: "Código postal", key: "postcode" },
        { name: "Calle", key: "road" },
        { name: "Colonia", key: "quarter" },
        { name: "Ciudad", key: "city" },
        { name: "Pueblo", key: "town" },
        { name: "Municipio", key: "county" },
        { name: "Estado", key: "state" },
        { name: "País", key: "country" },
      ];

      const fieldStructure = fields
        .map(({ name, key }) => {
          const value = places.address?.[key];
          if (!value) return "";
          return `
          <div class="info">${name}: <span>${value}</span></div>
          `;
        })
        .join("");

      $result.innerHTML = `
        <div class="place-search__results">
          <div class="grid-section place">
            <div class="info">Nombre Completo: <span>${places?.display_name ?? "N/A"}</span></div>
            ${fieldStructure}
          </div>
        </div>`;
    } catch (err) {
      handleErrors(err, {
        $result,
        input: $inputPlace,
        type: "place",
      });
    } finally {
      $searchPlace.disabled = false;
      clear();
    }
  });

  $inputPlace.addEventListener("keydown", (e) => {
    if (e.key.toLocaleLowerCase() === "enter") {
      $searchPlace.click();
    }
  });

  $inputPlace.addEventListener("input", () => {
    cleanInput($inputPlace);
  });

  /* ===== ABORT CONTROLLER ===== */
  const abortController = () => {
    controller?.abort();
    controller = new AbortController();

    const timeController = setTimeout(() => controller.abort(), 8000);

    return {
      signal: controller.signal,
      clear: () => clearTimeout(timeController),
    };
  };

  /* ===== MANEJO DE ERRORES ===== */
  const ERROR_MESSAGES = {
    postal: {
      NOT_FOUND: (value) =>
        `<p class="error">No se encontró lugar para el código postal <span>${value}</span>, verifique que los datos sean correctos...</p>`,
    },
    place: {
      NOT_FOUND: (value) =>
        `<p class="error">No se encontró código postal para <span>${value}</span>, verifique que los datos sean correctos...</p>`,
    },
    common: {
      HTTP_ERROR: () =>
        `<p class="error">El servidor respondió con un error, intentalo más tarde...</p>`,
    },
  };

  const handleErrors = (err, { $result, input, type }) => {
    if (err.name === "AbortError") {
      $result.innerHTML = `<p class="error">El servidor  tardó demasiado en responder... <i class="ri-time-line"></i></p>`;
      return;
    }

    if (ERROR_MESSAGES[type]?.[err.message]) {
      $result.innerHTML = ERROR_MESSAGES[type][err.message](input?.value ?? "");
      return;
    }

    if (ERROR_MESSAGES.common?.[err.message]) {
      $result.innerHTML = ERROR_MESSAGES.common[err.message]();
      return;
    }

    if (err instanceof TypeError) {
      $result.innerHTML = navigator.onLine
        ? `<p class="error">Ha fallado la conexión con el servidor... <i class="ri-cloud-off-line"></i></p>`
        : `<p class="error">Vaya!, parece que no estás conectado a internet... <i class="ri-wifi-off-line"></i></p>`;
      return;
    }

    $result.innerHTML = `<p class="error"><span>Error de conexión: </span>${err.message}...</p>`;
  };
});
