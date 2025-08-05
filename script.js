// 🌍 Crear el mapa y definir vista inicial
const map = L.map('map', {
  zoomControl: false
}).setView([37.3886, -5.9953], 13);
let marcadorBusquedaNominatim = null;


// Capa base: OpenStreetMap
const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19
}).addTo(map); // Se añade por defecto

// Capa base: OpenTopoMap
const openTopo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenTopoMap & contributors',
  maxZoom: 17
});

// Capa base: Satélite Esri World Imagery
const esriSat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: '© Esri & contributors',
  maxZoom: 18
});

// Selector de capas base
const baseMaps = {
  "OpenStreetMap": osmLayer,
  "OpenTopoMap": openTopo,
  "Satélite (Esri)": esriSat
};

// 🥾 Senderismo
const hikingOverlay = L.tileLayer('https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png', {
  attribution: '© Waymarked Trails',
  opacity: 0.7
});

// 🚴 Ciclismo
const cyclingOverlay = L.tileLayer('https://tile.waymarkedtrails.org/cycling/{z}/{x}/{y}.png', {
  attribution: '© Waymarked Trails',
  opacity: 0.7
});

// 🎿 Esquí
const skiingOverlay = L.tileLayer('https://tile.waymarkedtrails.org/skiing/{z}/{x}/{y}.png', {
  attribution: '© Waymarked Trails',
  opacity: 0.7
});

const overlayMaps = {
  "🥾 Senderismo": hikingOverlay,
  "🚴 Ciclismo": cyclingOverlay,
  "🎿 Esquí": skiingOverlay
};
L.control.layers(baseMaps, overlayMaps).addTo(map);
// Buscar dirección con Nominatim
document.getElementById("btnBuscarLugar").addEventListener("click", () => {
  const panel = document.getElementById("panelResultadosNominatim");
  panel.style.display = "block"; // mostrar panel ya existente

  document.getElementById("inputDireccion").value = "";
  document.getElementById("resultadosNominatim").innerHTML = "";

  // Evitar a�adir m�ltiples listeners
  document.getElementById("btnBuscarDireccion").onclick = () => {
    const direccion = document.getElementById("inputDireccion").value.trim();
    if (!direccion) return;

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccion)}`)
      .then(res => res.json())
      .then(data => {
        const contenedor = document.getElementById("resultadosNominatim");
        contenedor.innerHTML = "";

        if (!data.length) {
          contenedor.innerHTML = `? No se encontr� la direcci�n <b>${direccion}</b>`;
          return;
        }

        data.forEach(lugar => {
          const boton = document.createElement("button");
          boton.textContent = lugar.display_name;
          boton.classList.add("botonResultado"); // puedes estilizar con CSS

          boton.onclick = () => {
            const coords = L.latLng(lugar.lat, lugar.lon);
            marcadorBusquedaNominatim?.remove();

            marcadorBusquedaNominatim = L.marker(coords)
              .addTo(map)
              .bindPopup(lugar.display_name)
              .openPopup();

            map.setView(coords, 16);
            panel.style.display = "none";
          };

          contenedor.appendChild(boton);
        });
      })
      .catch(() => {
        document.getElementById("resultadosNominatim").innerHTML =
          "? Error de conexi�n con Nominatim";
      });
  };
});
function cerrarPanelResultados() {
  const panel = document.getElementById("panelResultadosNominatim");
  if (panel) panel.style.display = "none";
}

// ➕ Zoom In
document.getElementById("btnZoomIn").addEventListener("click", () => map.zoomIn());

// ➖ Zoom Out
document.getElementById("btnZoomOut").addEventListener("click", () => map.zoomOut());


const sidebar = document.getElementById('sidebar');
const menuBtn = document.getElementById('menuBtn');
const closeBtn = document.querySelector('.btnVolverPanel'); // Botón de volver en el panel de categorías

function actualizarBotones() {
  const sidebarActivo = !sidebar.classList.contains("hidden");
  const subpanelActivo = !!document.querySelector(".subpanel.visible");
  const panelPoi = document.getElementById("panelPoi");
  const panelPoiActivo = panelPoi && panelPoi.classList.contains("visible");

  // 💡 Solo ocultar el botón si está abierto el sidebar o un subpanel (dejamos que esté el panel POI)
  const hayPanelLateralAbierto = sidebarActivo || subpanelActivo;

  menuBtn.style.display = hayPanelLateralAbierto ? "none" : "block";
  menuBtn.style.pointerEvents = hayPanelLateralAbierto ? "none" : "auto";

  closeBtn.style.display = sidebarActivo ? "block" : "none";
}

function abrirSidebar() {
  sidebar.classList.remove('hidden');

  const panelCategorias = document.getElementById("panelCategorias");
  if (panelCategorias) {
    panelCategorias.classList.remove("hidden");
    panelCategorias.style.display = "flex";
    panelCategorias.style.flexDirection = "column";
  }

  actualizarBotones();
}

function mostrarCategoria(nombre) {
  // Oculta todos los paneles individuales
  document.querySelectorAll(".subpanel").forEach(panel => {
    panel.classList.remove("visible");
  });

  // Oculta el panel de categorías principal
  document.getElementById("panelCategorias").style.display = "none";

  // Muestra el panel activo
  const panelActivo = document.getElementById(`panel${nombre}`);
  if (panelActivo) {
    panelActivo.classList.add("visible");
  }
}

function volverCategorias() {
  // Oculta todos los paneles individuales
  document.querySelectorAll(".subpanel").forEach(panel => {
    panel.classList.remove("visible");
  });

  // Muestra el panel de categorías otra vez
  const panel = document.getElementById("panelCategorias");
  panel.style.display = "flex";
  panel.style.flexDirection = "column";
}

function cerrarPanelCategorias() {
  const panelCategorias = document.getElementById("panelCategorias");
  if (panelCategorias) {
    panelCategorias.style.display = "none";
    panelCategorias.classList.remove("visible");
  }

  sidebar.classList.add("hidden");
  actualizarBotones();
}

// Abrir menú lateral al pulsar icono
menuBtn.addEventListener('click', abrirSidebar);

// Botones "Buscar POIs" dentro de cada panel de categoría
document.querySelectorAll(".btnBuscarPanel").forEach(boton => {
  boton.addEventListener("click", () => {
    ejecutarBusqueda(); // 🔍 Llama a Overpass
    sidebar.classList.add("hidden"); // Oculta panel lateral
    document.querySelectorAll(".subpanel.visible").forEach(panel => panel.classList.remove("visible")); // Oculta subpanel
    actualizarBotones(); // Refresca visibilidad de botones
  });
});

// Botón de cerrar general (por si usas uno en layout)
document.getElementById("cerrarPanel")?.addEventListener("click", () => {
  sidebar.classList.add("hidden");

  const panelDetalles = document.getElementById("panelDetalles");
  if (panelDetalles && !panelDetalles.classList.contains("hidden")) {
    panelDetalles.classList.add("hidden");
  }

  document.querySelectorAll(".subpanel.visible").forEach(panel => {
    panel.classList.remove("visible");
  });

  actualizarBotones();
});

function obtenerPOIsSeleccionados() {
  const checks = document.querySelectorAll('.poicheck:checked');
  const seleccionados = [];

  checks.forEach(check => {
    const categoria = check.getAttribute('data-cat');
    const subtipo = check.getAttribute('data-sub');
    seleccionados.push({ categoria, subtipo });
  });

  return seleccionados;
}

// 🧭 Diccionario de colores oficiales OSM (simplificado y ampliable)
const colorPorSubtipo = {
  // 🛠️ Servicios — tonos azules
  "shop=supermarket": "#225577",
  "shop=bakery": "#3377aa",
  "shop=organic": "#4488cc",
  "shop=butcher": "#5599dd",
  "shop=bicycle": "#66aaff",
  "shop=travel_agency": "#77bbff",

  // 💸 Finanzas — tonos grises
  "amenity=atm": "#666666",
  "amenity=bank": "#777777",
  "amenity=post_office": "#888888",
  "amenity=post_box": "#999999",

  // 🚨 Emergencias — tonos rojos
  "amenity=hospital": "#cc0000",
  "amenity=pharmacy": "#dd3333",
  "amenity=doctors": "#ee5555",
  "emergency=emergency_phone": "#ff7777",
  "emergency=defibrillator": "#ff9999",
  "amenity=fire_station": "#ff3333",
  "amenity=police": "#0033cc",

  // 🛏️ Alojamiento — tonos lilas
  "tourism=hostel": "#9966cc",
  "tourism=hotel": "#aa77dd",
  "tourism=chalet": "#bb88ee",
  "tourism=guest_house": "#cc99ff",
  "tourism=camp_site": "#b377e8",

  // 🚉 Transporte — tonos azulados
  "highway=bus_stop": "#226699",
  "amenity=bus_station": "#3388bb",
  "railway=train_station": "#4499cc",
  "railway=station": "#55aadd",
  "aeroway=airport": "#66bbff",
  "aeroway=helipad": "#77ccff",

  // 🚿 Comodidades — tonos verdes
  "amenity=drinking_water": "#228822",
  "amenity=toilets": "#339933",
  "amenity=recycling": "#44aa44",
  "amenity=shelter": "#55bb55",
  "amenity=bench": "#66cc66",

  // 🌿 Naturaleza — tonos bosque
  "natural=tree": "#336633",
  "natural=peak": "#447744",
  "natural=spring": "#558855",
  "natural=rock": "#669966",
  "natural=beach": "#77aa77",
  "natural=waterfall": "#88bb88",

  // 🎭 Ocio y turismo — tonos púrpura
  "tourism=museum": "#660066",
  "amenity=cinema": "#772277",
  "amenity=theatre": "#883388",
  "historic=castle": "#994499",
  "tourism=zoo": "#aa55aa",
  "tourism=artwork": "#bb66bb",

  // 🍽️ Gastronomía — tonos vino
  "amenity=restaurant": "#880000",
  "amenity=fast_food": "#993333",
  "amenity=cafe": "#aa5555",
  "amenity=bar": "#bb7777",
  "amenity=pub": "#cc9999",
  "amenity=ice_cream": "#ddbbbb"
};

function crearMarcador(el) {
  const nombre = el.tags.name || "POI";

  let subtipo = "marker";
  for (const key of ["amenity", "shop", "tourism", "leisure", "natural", "emergency", "highway"]) {
    if (el.tags[key]) {
      subtipo = `${key}=${el.tags[key]}`;
      break;
    }
  }

  const color = colorPorSubtipo[subtipo] || "#999999";

  const marcador = L.circleMarker([el.lat, el.lon], {
    radius: 8,
    color,
    fillColor: color,
    fillOpacity: 0.8
  }).addTo(map);

  el.tags.lat = el.lat;
  el.tags.lon = el.lon;
  marcador._tags = el.tags;

  const contenidoPopup = `
    <div style="cursor:pointer;" onclick='mostrarDetallesDesdePopup(${JSON.stringify(el.tags)})'>
      <b>${nombre}</b>
    </div>
  `;
  marcador.bindPopup(contenidoPopup);

  marcador.on("click", () => {
    marcador.openPopup();
    window.tagsPOI = el.tags;

    const panel = document.getElementById("panelPoi");
    const estaAbierto = panel?.classList.contains("visible");

    if (estaAbierto) {
      mostrarDetallesEnPanel(el.tags);
    }
  });

  return marcador; // ✅ cierre clave que estaba faltando
}
function ejecutarBusqueda() {
  const seleccionados = obtenerPOIsSeleccionados();
  if (seleccionados.length === 0) {
    alert("Selecciona al menos un tipo de lugar para buscar.");
    return;
  }

  if (window.poisLayer) {
    map.removeLayer(window.poisLayer);
  }

  const center = map.getCenter();
  const zoom = map.getZoom();
  const radio = Math.round(100 * Math.pow(2, 19 - zoom)); // Escalado dinámico

  // 🧬 Diccionario de equivalencias por categoría + subtipo
  const equivalencias = {
    "historic=castle": ["historic=castle", "castle=yes", "tourism=attraction"],
    "tourism=hotel": ["tourism=hotel", "amenity=hotel"],
    "shop=supermarket": ["shop=supermarket", "amenity=marketplace"],
    "amenity=pharmacy": ["amenity=pharmacy", "healthcare=pharmacy", "shop=health"],
    "tourism=museum": ["tourism=museum", "amenity=museum", "historic=building"],
    // ⚠️ Puedes seguir ampliando aquí según tus necesidades
  };

  let consulta = `[out:json][timeout:25];(\n`;

  seleccionados.forEach(({ categoria, subtipo }) => {
    const clave = `${categoria}=${subtipo}`;
    const opciones = equivalencias[clave] || [clave];

    opciones.forEach(tag => {
      const [k, v] = tag.split("=");
      consulta += `node["${k}"="${v}"](around:${radio},${center.lat},${center.lng});\n`;
      consulta += `way["${k}"="${v}"](around:${radio},${center.lat},${center.lng});\n`;
      consulta += `relation["${k}"="${v}"](around:${radio},${center.lat},${center.lng});\n`;
    });
  });

  consulta += `);out center;`;

  fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: consulta
  })
  .then(res => res.json())
  .then(data => {
    const grupo = L.layerGroup();
    const elementos = data.elements;

    elementos.forEach(el => {
      const punto = el.center || { lat: el.lat, lon: el.lon };
      if (!punto) return;

      el.lat = punto.lat;
      el.lon = punto.lon;

      const marcador = crearMarcador(el);
      grupo.addLayer(marcador);
    });

    window.poisLayer = grupo;
    grupo.addTo(map);

    if (elementos.length > 0) {
      map.fitBounds(grupo.getBounds(), { padding: [30, 30] });
    } else {
      alert("No se encontraron resultados en esta zona.");
    }
  })
  .catch(err => {
    console.error("Error en Overpass:", err);
  //  alert("❌ No se pudo conectar con el servidor. Intenta más tarde.");//
  });
}
const emojiTags = {
  // 🎯 Claves generales
  "tourism": "🧳",
  "addr:city": "🏘️",
  "source": "📡",
  "wheelchair": "♿",
  "natural": "🌿",
  "amenity": "🏢",
  "leisure": "🎯",
  "shop": "🛍️",
  "man_made": "🏗️",
  "historic": "🏰",
  "craft": "🔧",

  // 🌟 Claves con valor específico
  "natural=tree": "🌳",
  "natural=peak": "⛰️",
  "natural=beach": "🏖️",
  "natural=waterfall": "💦",
  "natural=spring": "🚰",
  "natural=rock": "🪨",
  "natural=wood": "🌲",
  "amenity=restaurant": "🍽️",
  "amenity=bar": "🍻",
  "amenity=school": "🏫",
  "amenity=hospital": "🏥",
  "leisure=park": "🌳",
  "shop=supermarket": "🧃",
  "shop=bakery": "🥖",
  "shop=bicycle": "🚴",
  "shop=butcher": "🔪",
  "shop=clothes": "👕",
  "shop=travel_agency": "🧳",
  "craft=shoemaker": "👞",
  "historic=castle": "🏰",
  "man_made=tower": "🗼",
  "amenity=cafe": "☕",
  "amenity=fast_food": "🍔",
  "amenity=pub": "🍺",
  "amenity=ice_cream": "🍨",
  "amenity=pharmacy": "💊",
  "amenity=doctors": "👩‍⚕️",
  "emergency=defibrillator": "❤️",
  "amenity=fire_station": "🚒",
  "amenity=police": "🚓",
  "emergency=phone": "📞",
  "amenity=bank": "🏦",
  "amenity=atm": "🏧",
  "amenity=post_office": "📮",
  "amenity=university": "🎓",
  "amenity=library": "📖",
  "amenity=kindergarten": "🧸",
  "amenity=place_of_worship": "⛪",
  "tourism=hotel": "🏨",
  "tourism=hostel": "🛏️",
  "tourism=camp_site": "⛺",
  "tourism=museum": "🏛️",
  "tourism=artwork": "🎨",
  "tourism=zoo": "🦁",
  "leisure=playground": "🛝",
  "room": "🛏️",
  "stars": "⭐",
  "beds": "🛌",
  "toilets": "🚽",
  "shower": "🚿",
  "highway": "🛣️",
  "highway=bus_stop": "🚌",
  "railway=station": "🚉",
  "aeroway=airport": "✈️",
  "aeroway=helipad": "🚁",
  "amenity=parking": "🅿️",
  "amenity=charging_station": "🔌",
  "amenity=recycling": "♻️",
  "amenity=bench": "🪑",
  "amenity=drinking_water": "🚰",
  "amenity=shelter": "🏚️",
  "amenity=cinema": "🎬",
  "amenity=theatre": "🎭",
  "amenity=nightclub": "💃",

  // 🧭 Identidad y contacto
  "name": "📌",
  "operator": "👤",
  "brand": "🏷️",
  "description": "📝",
  "note": "🧾",
  "id": "🆔",
  "wikidata": "📖",
  "wikipedia": "📚",
  "alt_name": "🗣️",

  // 📞 Contacto
  "contact:phone": "📞",
  "phone": "📱",
  "email": "✉️",
  "contact:email": "📬",
  "website": "🌐",
  "contact:website": "🖥️",
  "fax": "📠",
  "contact:facebook": "📘",
  "contact:twitter": "🐦",

  // 🕒 Horario y disponibilidad
  "opening_hours": "🕒",
  "start_date": "📅",
  "check_date": "✅",
  "access": "🚪",
  "internet_access": "📶",
  "wifi": "📡",

  // 📍 Dirección
  "addr:street": "🏙️",
  "addr:housenumber": "🔢",
  "addr:postcode": "🏷️",
  "addr:country": "🌍",
  "addr:state": "🗺️",

  // 🏢 Edificios
  "building": "🏨",
  "building:levels": "🏗️",
  "building:material": "🧱",
  "building:use": "📦",

  // 🔬 Fuente de datos
  "source:name": "📚",
  "source:date": "📅",

  // 🧭 Otros
  "wheelchair:description": "📝",
  "staff_count": "👥",
  "employees": "🧑‍💼",
  "layer": "📚",
  "ele": "⛰️",
  "height": "📏",
  "level": "⬆️",

  // 📷 Medios y vista
  "image": "🖼️",
  "mapillary": "📷",
  "camera": "📸",
  
  "type": "📦",
"type=node": "📍",
"type=way": "🛣️",
"type=relation": "🔗"
   
};





function mostrarDetallesEnPanel(tags) {
  const panel = document.getElementById("panelPoi");
  const contenedor = document.getElementById("poiDatos");
  const nombre = document.getElementById("poiNombre");
  const btnExpandir = document.getElementById("btnExpandirPanel");
  const btnOpciones = document.getElementById("btnOpcionesToggle");
  const opciones = document.getElementById("opcionesBloque");

  // ? Guardar el POI globalmente
  window.tagsPOI = tags;

  nombre.textContent = tags.name || "POI";
  contenedor.innerHTML = "";

  Object.entries(tags).forEach(([clave, valor]) => {
    if (valor && clave !== "name" && clave !== "lat" && clave !== "lon") {
      const emoji = emojiTags[clave] || "?";
      let contenido = `${emoji} <strong>${clave}:</strong> `;

      if (clave === "website") {
        contenido += `<a href="${valor}" target="_blank" rel="noopener noreferrer">${valor}</a>`;
      } else if (clave === "email") {
        contenido += `<a href="mailto:${valor}">${valor}</a>`;
      } else if (clave === "contact:phone" || clave === "phone") {
        contenido += `<a href="tel:${valor}">${valor}</a>`;
      } else {
        contenido += valor;
      }

      contenedor.innerHTML += `<p>${contenido}</p>`;
    }
  });

  // Añadir selector personalizado
  const wrapper = document.createElement("div");
  wrapper.style.marginTop = "12px";
  wrapper.style.borderTop = "1px solid #ccc";
  wrapper.style.paddingTop = "8px";

  const check = document.createElement("input");
  check.type = "checkbox";
  check.id = "checkPersonalizada";
  check.checked = tags.seleccionado || false;

  const label = document.createElement("label");
  label.htmlFor = "checkPersonalizada";
  label.textContent = "Añadir a capa personalizada";
  label.style.marginLeft = "6px";

  check.addEventListener("change", (e) => {
    tags.seleccionado = e.target.checked;
    window.poisSeleccionados ||= [];

    const index = window.poisSeleccionados.findIndex(p =>
      p.lat === tags.lat && p.lon === tags.lon
    );

    if (e.target.checked && index === -1) {
      window.poisSeleccionados.push(tags);
    } else if (!e.target.checked && index !== -1) {
      window.poisSeleccionados.splice(index, 1);
    }
  });

  wrapper.appendChild(check);
  wrapper.appendChild(label);
  contenedor.appendChild(wrapper);

  // ? Mostrar panel
  panel.classList.remove("hidden", "expandido");
  panel.classList.add("visible");

  // ? Expandir si hay contenido largo
  if (contenedor.scrollHeight > 300) {
    panel.classList.add("expandido");
    btnOpciones.style.display = "block";
    const icono = btnExpandir.querySelector("img");
    if (icono) icono.src = "icons/ui/fi-sr-compress.svg";
  } else {
    panel.classList.remove("expandido");
    btnOpciones.style.display = "none";
    const icono = btnExpandir.querySelector("img");
    if (icono) icono.src = "icons/ui/fi-sr-expand.svg";
  }

  // ? Centrar mapa en el POI
  if (tags.lat && tags.lon) {
    const punto = L.latLng(tags.lat, tags.lon);
    const alturaMapa = map.getSize().y;
    const desplazamientoPx = alturaMapa * 0.25;
    const puntoDesplazado = map.project(punto).add([0, desplazamientoPx]);
    const puntoFinal = map.unproject(puntoDesplazado);
    map.panTo(puntoFinal, { animate: true });
  }

  actualizarBotones();
}
function mostrarDetallesDesdePopup(tagsData) {
  const tags = typeof tagsData === "string" ? JSON.parse(tagsData) : tagsData;

  const panel = document.getElementById("panelPoi");
  const yaVisible = panel.classList.contains("visible");

  // ✅ Si el panel ya está abierto, solo actualizamos contenido
  if (yaVisible) {
    mostrarDetallesEnPanel(tags);
    return;
  }

  // 📌 Si no estaba abierto, se abre normalmente
  mostrarDetallesEnPanel(tags);
}

// 🔼 Expandir o contraer el panel inferior
document.getElementById("btnExpandirPanel")?.addEventListener("click", () => {
  const panel = document.getElementById("panelPoi");
  const btnExpandir = document.getElementById("btnExpandirPanel");
  const icono = btnExpandir.querySelector("img");
  const opciones = document.getElementById("opcionesBloque");
  const btnOpciones = document.getElementById("btnOpcionesToggle");

  const expandido = panel.classList.toggle("expandido");

  if (expandido) {
    icono.src = "icons/ui/fi-sr-compress.svg";
    btnOpciones.style.display = "block";
  } else {
    icono.src = "icons/ui/fi-sr-expand.svg";
    btnOpciones.style.display = "none";
    opciones.classList.remove("visible");
    opciones.classList.add("oculto");
    btnOpciones.textContent = "⚙️ Opciones";
  }
});

// 🔘 Cerrar panel inferior desde botón
document.getElementById("cerrarPanelPoi")?.addEventListener("click", () => {
  const panel = document.getElementById("panelPoi");
  const opciones = document.getElementById("opcionesBloque");
  const btnOpciones = document.getElementById("btnOpcionesToggle");
  const btnExpandir = document.getElementById("btnExpandirPanel");

  panel.classList.remove("visible", "expandido");
  panel.classList.add("hidden");

  opciones.classList.remove("visible");
  opciones.classList.add("oculto");

  btnOpciones.textContent = "⚙️ Opciones";
  btnOpciones.style.display = "none";

  const icono = btnExpandir.querySelector("img");
  if (icono) icono.src = "icons/ui/fi-sr-expand.svg";
});

// ⚙️ Mostrar/ocultar bloque de opciones
document.getElementById("btnOpcionesToggle")?.addEventListener("click", () => {
  const opciones = document.getElementById("opcionesBloque");
  const btnOpciones = document.getElementById("btnOpcionesToggle");

  const visible = opciones.classList.toggle("visible");
  opciones.classList.toggle("oculto", !visible);

  btnOpciones.textContent = visible
    ? "🔽 Ocultar opciones"
    : "⚙️ Opciones";
});

document.addEventListener("DOMContentLoaded", () => {
  const acciones = [
    { boton: "btnCompartir", menu: "menuCompartir" },
    { boton: "btnExportar", menu: "menuExportar" },
    { boton: "btnNavegar", menu: "menuNavegar" },
    { boton: "btnAdjuntar", menu: "menuAdjuntar" }
  ];

  acciones.forEach(({ boton, menu }) => {
    const btn = document.getElementById(boton);
    const submenu = document.getElementById(menu);

    btn?.addEventListener("click", () => {
      document.querySelectorAll(".menu-emergente").forEach(m => {
        if (m !== submenu) m.classList.remove("visible");
      });
      submenu?.classList.toggle("visible");
    });
  });

  // 🔐 Cerrar submenús si se hace clic fuera
  document.addEventListener("click", e => {
    const esAccion = e.target.closest(".accion-btn");
    const esSubmenu = e.target.closest(".menu-emergente");

    if (!esAccion && !esSubmenu) {
      document.querySelectorAll(".menu-emergente").forEach(menu => {
        menu.classList.remove("visible");
      });
    }
  });
});

document.getElementById("btnAjustesMapa")?.addEventListener("click", () => {
  document.getElementById("menuAjustes").style.display = "block";
});

function cerrarAjustes() {
  document.getElementById("menuAjustes").style.display = "none";
}

// Ejemplo de funciones (puedes conectar con tus métodos reales)
function limpiarMapa() {
  if (window.poisLayer) {
    map.removeLayer(window.poisLayer);
    window.poisLayer = null;
  }

  if (marcadorBusquedaNominatim) {
    map.removeLayer(marcadorBusquedaNominatim);
    marcadorBusquedaNominatim = null;
  }

  cerrarAjustes();
}

function exportarMapaKML(poisPorCategoria) {
  if (!poisPorCategoria || Object.keys(poisPorCategoria).length === 0) {
    mostrarAvisoToast("⚠️ No hay POIs para exportar");
    return;
  }

  mostrarAvisoToast("⏳ Exportando mapa KML…");

  // 📝 Solicita nombre del archivo
  let nombreArchivo = prompt("📁 Nombre del archivo KML:", "ExMaps_Orux.kml");
  if (!nombreArchivo || !nombreArchivo.endsWith(".kml")) {
    nombreArchivo = "ExMaps_Orux.kml";
  }
  const nombreInterno = nombreArchivo.replace(".kml", "");

  // 🧭 Encabezado con nombre personalizado y autoría
  const kmlHeader = `<?xml version="1.0" encoding="UTF-8" ?>
<kml xmlns="http://www.opengis.net/kml/2.2"
     xmlns:om="http://www.oruxmaps.com/oruxmapsextensions/1/0"
     xmlns:gx="http://www.google.com/kml/ext/2.2">
<Document>
<name><![CDATA[${nombreInterno}]]></name>
<description><![CDATA[Generado por ExMaps para OruxMaps GP]]></description>
`;

  const kmlFooter = `</Document>\n</kml>`;
  let contenidoKML = "";

  for (const categoria in poisPorCategoria) {
    const iconoURL = obtenerIconoCompatibleOrux(categoria);
    contenidoKML += `<Folder>\n<name>${categoria}</name>\n`;

    poisPorCategoria[categoria].forEach(poi => {
      const { nombre, lat, lon, tags = {} } = poi;
      if (typeof lat !== "number" || typeof lon !== "number") return;

      const descripcion = `<![CDATA[
  <p><b>Nombre:</b> ${tags.name || nombre}</p>
  <p><b>Tipo:</b> ${categoria}</p>
  ${tags.address ? `<p><b>Dirección:</b> ${tags.address}</p>` : ""}
  ${tags.phone ? `<p><b>Teléfono:</b> ${tags.phone}</p>` : ""}
  ${tags.opening_hours ? `<p><b>Horario:</b> ${tags.opening_hours}</p>` : ""}
  ${tags.website ? `<p><b>Web:</b> ${tags.website}</p>` : ""}
  ${tags.ele ? `<p><b>Altitud:</b> ${tags.ele} m</p>` : ""}
      ]]>`;

      contenidoKML += `
<Placemark>
  <name><![CDATA[${nombre}]]></name>
  <description>${descripcion}</description>
  <Style>
    <IconStyle>
      <scale>1.0</scale>
      <Icon><href>${iconoURL}</href></Icon>
    </IconStyle>
  </Style>
  <Point>
    <altitudeMode>absolute</altitudeMode>
    <coordinates>${lon},${lat},0.0</coordinates>
  </Point>
</Placemark>
`;
    });

    contenidoKML += `</Folder>\n`;
  }

  const kmlCompleto = kmlHeader + contenidoKML + kmlFooter;
  const blob = new Blob([kmlCompleto], {
    type: "application/vnd.google-earth.kml+xml"
  });
  const url = URL.createObjectURL(blob);

  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.style.display = "none";
  document.body.appendChild(enlace);

  try {
    enlace.click();
    mostrarAvisoToast(`✅ Archivo KML “${nombreArchivo}” descargado`);
  } catch (e) {
    mostrarAvisoToast("❌ Error en descarga KML");
    console.error(e);
  }

  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
function obtenerIconoCompatibleOrux(categoria) {
  const baseURL = "https://oruxmaps.com/map_icons4/";
  const iconos = {
    naturaleza: `${baseURL}natural/24124.svg`,
    servicios: `${baseURL}general/20622.svg`,
    transporte: `${baseURL}transport/20444.svg`,
    ocio: `${baseURL}sports/23977.svg`,
    emergencia: `${baseURL}health/23078.svg`,
    otros: `${baseURL}general/20000.svg`
  };
  return iconos[categoria] || iconos["otros"];
}
function mostrarAvisoToast(mensaje) {
  const aviso = document.createElement("div");
  aviso.textContent = mensaje;
  aviso.style.position = "fixed";
  aviso.style.bottom = "20px";
  aviso.style.left = "50%";
  aviso.style.transform = "translateX(-50%)";
  aviso.style.backgroundColor = "#333";
  aviso.style.color = "#fff";
  aviso.style.padding = "10px 20px";
  aviso.style.borderRadius = "8px";
  aviso.style.fontSize = "16px";
  aviso.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
  aviso.style.zIndex = "9999";
  document.body.appendChild(aviso);
  setTimeout(() => {
    document.body.removeChild(aviso);
  }, 3000);
}

function obtenerIconoKML(categoria) {
  const baseURL = "https://tuservidor.com/icons/";
  const iconos = {
    naturaleza: `${baseURL}naturaleza.png`,
    servicios: `${baseURL}servicios.png`,
    transporte: `${baseURL}transporte.png`,
    ocio: `${baseURL}ocio.png`,
    emergencia: `${baseURL}emergencia.png`
  };
  return iconos[categoria] || `${baseURL}default.png`;
}
function detectarCategoria(tags) {
  if (!tags) return "otros";
  if (tags.amenity) return "servicios";
  if (tags.shop) return "tiendas";
  if (tags.tourism) return "turismo";
  if (tags.leisure) return "ocio";
  if (tags.natural) return "naturaleza";
  if (tags.emergency) return "emergencia";
  if (tags.highway) return "transporte";
  return "otros";
}   
function construirPoisPorCategoria() {
  const agrupados = {};

  if (!window.poisLayer) return agrupados;

  window.poisLayer.eachLayer(marcador => {
    const tags = marcador._tags;
    if (!tags || typeof tags.lat !== "number" || typeof tags.lon !== "number") return;

    const categoria = detectarCategoria(tags);
    const nombre = tags.name || "POI";
    const lat = tags.lat;
    const lon = tags.lon;

    agrupados[categoria] ||= [];
    agrupados[categoria].push({ nombre, lat, lon, tags });
  });

  return agrupados;
}

function exportarPOIIndividual(tagsPOI) {
  if (!tagsPOI || typeof tagsPOI.lat !== "number" || typeof tagsPOI.lon !== "number") {
    mostrarAvisoToast("⚠️ El POI no tiene coordenadas válidas");
    return;
  }

  let nombrePOI = tagsPOI.name && tagsPOI.name.trim() !== ""
    ? tagsPOI.name.trim()
    : prompt("📍 Escribe un nombre para este POI", "POI_sin_nombre");

  if (!nombrePOI || nombrePOI.trim() === "") {
    mostrarAvisoToast("⚠️ Exportación cancelada por falta de nombre");
    return;
  }

  const nombreArchivo = `${nombrePOI.replace(/\s+/g, "_")}.kml`;
  const nombreInterno = nombreArchivo.replace(".kml", "");
  const categoria = detectarCategoria(tagsPOI);
  const iconoURL = obtenerIconoCompatibleOrux(categoria);

  const descripcion = `<![CDATA[
<p><b>Nombre:</b> ${nombrePOI}</p>
<p><b>Tipo:</b> ${categoria}</p>
${tagsPOI.address ? `<p><b>Dirección:</b> ${tagsPOI.address}</p>` : ""}
${tagsPOI.phone ? `<p><b>Teléfono:</b> ${tagsPOI.phone}</p>` : ""}
${tagsPOI.opening_hours ? `<p><b>Horario:</b> ${tagsPOI.opening_hours}</p>` : ""}
${tagsPOI.website ? `<p><b>Web:</b> ${tagsPOI.website}</p>` : ""}
${tagsPOI.ele ? `<p><b>Altitud:</b> ${tagsPOI.ele} m</p>` : ""}
  ]]>`;

  const kml = `<?xml version="1.0" encoding="UTF-8" ?>
<kml xmlns="http://www.opengis.net/kml/2.2"
     xmlns:om="http://www.oruxmaps.com/oruxmapsextensions/1/0"
     xmlns:gx="http://www.google.com/kml/ext/2.2">
<Document>
<name><![CDATA[${nombreInterno}]]></name>
<description><![CDATA[Generado por ExMaps para OruxMaps GP]]></description>
<Folder>
<name>${categoria}</name>
<Placemark>
  <name><![CDATA[${nombrePOI}]]></name>
  <description>${descripcion}</description>
  <Style>
    <IconStyle>
      <scale>1.0</scale>
      <Icon><href>${iconoURL}</href></Icon>
    </IconStyle>
  </Style>
  <Point>
    <altitudeMode>absolute</altitudeMode>
    <coordinates>${tagsPOI.lon},${tagsPOI.lat},0.0</coordinates>
  </Point>
</Placemark>
</Folder>
</Document>
</kml>`;

  const blob = new Blob([kml], { type: "application/vnd.google-earth.kml+xml" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.style.display = "none";
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);

  mostrarAvisoToast(`✅ POI exportado como “${nombreArchivo}”`);
}


function compartirTextoPOI() {
  const tags = window.tagsPOI;
  if (!tags || !tags.lat || !tags.lon) {
    mostrarAvisoToast("⚠️ No hay datos del punto de interés disponibles");
    return;
  }

  const nombre = tags.name || "POI";
  const tipo = tags.natural || tags.amenity || tags.shop || tags.tourism || tags.leisure || "desconocido";
  const altitud = tags.ele || tags.elevation || null;
  const localidad = tags.village || tags.town || tags.city || "sin especificar";
  const provincia = tags.province || tags.state || "desconocida";
  const comunidad = tags["ISO3166-2-lvl4"] || "ES";

  const lat = tags.lat.toFixed(7);
  const lon = tags.lon.toFixed(7);
  const alt = altitud ? parseFloat(altitud).toFixed(2) : "0";

  const fecha = new Date().toISOString().slice(0, 10); // formato AAAA-MM-DD

  const texto =
`ExMaps posición compartida

Nombre del punto de interés: ${nombre}
Descripción del punto de interés:
- Tipo: ${tipo}
${altitud ? `- Altitud: ${alt} m` : ""}
- Provincia: ${provincia}
- Comunidad: ${comunidad}
- Localidad: ${localidad}

geo:${lat},${lon},${alt}
https://oruxmaps.com/position?q=${lat},${lon}

🗓️ Generado el ${fecha} con ExMaps`;

  if (navigator.share) {
    navigator.share({
      title: `POI: ${nombre}`,
      text: texto
    }).then(() => {
      mostrarAvisoToast("✅ Texto compartido");
    }).catch(() => {
      mostrarAvisoToast("⚠️ No se pudo compartir directamente");
    });
  } else {
    navigator.clipboard.writeText(texto).then(() => {
      mostrarAvisoToast("📋 Copiado al portapapeles");
    }).catch(() => {
      mostrarAvisoToast("⚠️ No se pudo copiar");
    });
  }
}

function compartirCapturaMapaConMarca() {
  const mapa = document.getElementById("map");
  if (!mapa) {
    mostrarAvisoToast("❌ No se encontró el mapa para capturar");
    return;
  }

  const zoomActual = map.getZoom();
  const zoomMinimoPermitido = 15; // 🔎 Zoom mínimo recomendado para escala ~500 m

  if (zoomActual < zoomMinimoPermitido) {
    mostrarAvisoToast(
      "📏 La escala actual del mapa es demasiado amplia\n\nPara garantizar la precisión visual de los iconos, acerca el mapa hasta una escala de 500 m o menos."
    );
    return;
  }

  html2canvas(map.getContainer(), {
    backgroundColor: null,
    useCORS: true,
    scale: 2
  }).then(canvas => {
    const ctx = canvas.getContext("2d");

    // ✏️ Firma ExMaps
    ctx.font = "bold 24px 'Segoe UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#000";
    ctx.fillText("ExMaps", 22, 32);
    ctx.fillStyle = "#66ccff";
    ctx.fillText("ExMaps", 20, 30);

    canvas.toBlob(blob => {
      const archivo = new File([blob], "captura_exmaps.png", { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
        navigator.share({
          title: "Vista de mapa",
          files: [archivo]
        })
        .then(() => mostrarAvisoToast("✅ Captura compartida con precisión de escala"))
        .catch(() => mostrarAvisoToast("⚠️ No se pudo compartir"));
      } else {
        const enlace = document.createElement("a");
        enlace.href = URL.createObjectURL(blob);
        enlace.download = "captura_exmaps.png";
        enlace.click();
        URL.revokeObjectURL(enlace.href);
        mostrarAvisoToast("📁 Captura descargada localmente");
      }
    });
  });
}

function compartirPosicionPOI() {
  const lat = window.tagsPOI?.lat;
  const lon = window.tagsPOI?.lon;

  if (!lat || !lon) {
    alert("No se puede compartir esta ubicación.");
    return;
  }

  const geoIntent = `geo:${lat},${lon}?q=${lat},${lon}`;
  window.location.href = geoIntent;
}

document.getElementById("btnContribuirPOI").addEventListener("click", () => {
  const menu = document.getElementById("menuContribuir");
  menu.classList.add("visible");
});

document.querySelector('.cerrarMenuContribuir')?.addEventListener('click', () => {
  document.getElementById('menuContribuir').classList.remove('visible');
});

function abrirEditorOSM() {
  const lat = window.tagsPOI?.lat;
  const lon = window.tagsPOI?.lon;

  if (!lat || !lon) {
    alert("No se puede abrir el editor sin coordenadas del POI.");
    return;
  }

  const editorURL = `https://www.openstreetmap.org/edit?editor=id#map=18/${lat}/${lon}`;
  window.open(editorURL, '_blank');
}

function añadirNotaOSM() {
  const lat = window.tagsPOI?.lat;
  const lon = window.tagsPOI?.lon;
  const nombre = window.tagsPOI?.name || "POI sin nombre";

  if (!lat || !lon) {
    alert("No se puede crear la nota: falta ubicación.");
    return;
  }

  const textoNota = encodeURIComponent(`Sugerencia para este lugar: ${nombre}`);
  const notaURL = `https://www.openstreetmap.org/note/new#map=18/${lat}/${lon}&text=${textoNota}`;
  window.open(notaURL, '_blank');
}

document.getElementById("btnVisualizarPOI")?.addEventListener("click", () => {
  const menu = document.getElementById("menuVer");
  document.querySelectorAll(".menu-emergente").forEach(m => {
    if (m !== menu) m.classList.remove("visible");
  });
  menu?.classList.toggle("visible");
});
function abrirStreetViewDesdePOI() {
  const tags = window.tagsPOI;
  if (!tags?.lat || !tags?.lon) {
    mostrarAvisoToast("⚠️ Coordenadas no disponibles");
    return;
  }

  const lat = tags.lat.toFixed(7);
  const lon = tags.lon.toFixed(7);

  const streetViewURL = `https://www.google.com/maps?q=&layer=c&cbll=${lat},${lon}`;
  window.open(streetViewURL, "_blank");

  cerrarMenuVer();
}

function abrirMapillaryDesdePOI() {
  const tags = window.tagsPOI;
  if (!tags?.lat || !tags?.lon) {
    mostrarAvisoToast("⚠️ Coordenadas no disponibles");
    return;
  }

  const lat = tags.lat.toFixed(7);
  const lon = tags.lon.toFixed(7);

  const mapillaryURL = `https://www.mapillary.com/app/?lat=${lat}&lng=${lon}&z=17&focus=photo`;
  window.open(mapillaryURL, "_blank");

  cerrarMenuVer();
}

function cerrarMenuVer() {
  document.getElementById("menuVer")?.classList.remove("visible");
}

// 🧠 Guardar automáticamente selección de POIs cada vez que cambie
document.querySelectorAll(".poicheck").forEach(check => {
  check.addEventListener("change", () => {
    const seleccionados = obtenerPOIsSeleccionados();
    localStorage.setItem("checkboxPOI", JSON.stringify(seleccionados));
  });
});
function cargarSeleccionCheckbox() {
  const guardados = JSON.parse(localStorage.getItem("checkboxPOI") || "[]");

  guardados.forEach(({ categoria, subtipo }) => {
    const selector = `.poicheck[data-cat="${categoria}"][data-sub="${subtipo}"]`;
    const checkbox = document.querySelector(selector);
    if (checkbox) checkbox.checked = true;
  });
}

document.getElementById("btnBusquedaFlotante")?.addEventListener("click", () => {
  const guardados = JSON.parse(localStorage.getItem("checkboxPOI") || "[]");

  if (guardados.length === 0) {
    mostrarAvisoToast("⚠️ No hay tipos seleccionados");
    return;
  }

  // Desmarcar todo primero
  document.querySelectorAll(".poicheck").forEach(check => {
    check.checked = false;
  });

  // Marcar los guardados
  guardados.forEach(({ categoria, subtipo }) => {
    const selector = `.poicheck[data-cat="${categoria}"][data-sub="${subtipo}"]`;
    const checkbox = document.querySelector(selector);
    if (checkbox) checkbox.checked = true;
  });

  // Ejecutar búsqueda
  ejecutarBusqueda();

  // Opcional: cerrar ajustes si lo deseas
  cerrarAjustes();
});

document.getElementById("btnBusquedaDirecta")?.addEventListener("click", () => {
  const guardados = JSON.parse(localStorage.getItem("checkboxPOI") || "[]");

  if (guardados.length === 0) {
    mostrarAvisoToast("⚠️ No hay selección de POIs guardada");
    return;
  }

  // Desmarcar todos los checkbox
  document.querySelectorAll(".poicheck").forEach(check => {
    check.checked = false;
  });

  // Marcar los que estaban guardados
  guardados.forEach(({ categoria, subtipo }) => {
    const check = document.querySelector(`.poicheck[data-cat="${categoria}"][data-sub="${subtipo}"]`);
    if (check) check.checked = true;
  });

  ejecutarBusqueda(); // 🔍 Lanza búsqueda con filtros restaurados
  mostrarAvisoToast("✅ Búsqueda ejecutada desde mapa");
});

document.getElementById("btnLimpiarSeleccion")?.addEventListener("click", () => {
  document.querySelectorAll(".poicheck").forEach(check => {
    check.checked = false;
  });

  localStorage.removeItem("checkboxPOI"); // 🔁 Limpia también la selección guardada

  mostrarAvisoToast("🧼 Selección de filtros limpiada");
});

function abrirMenuAjustes() {
  document.getElementById("menuAjustes").style.display = "flex";
}

function cerrarMenuAjustes() {
  document.getElementById("menuAjustes").style.display = "none";
}

function abrirPerfilUsuario() {
  document.getElementById("menuAjustes").style.display = "none";
  document.getElementById("menuPerfilUsuario").style.display = "flex";
}

function cerrarPerfilUsuario() {
  document.getElementById("menuPerfilUsuario").style.display = "none";
  document.getElementById("menuAjustes").style.display = "flex";
}
function guardarPreferenciasUsuario() {
  const ubicacionTexto = document.getElementById("ubicacionDefecto")?.value.trim();
  const modoUso = document.getElementById("modoUso")?.value;

  if (!ubicacionTexto) {
    mostrarAvisoToast("⚠️ Escribe una ubicación válida");
    return;
  }

  // 🌍 Buscar ubicación vía Nominatim
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(ubicacionTexto)}`)
    .then(res => res.json())
    .then(data => {
      if (!data.length) {
        mostrarAvisoToast("❌ Ubicación no encontrada");
        return;
      }

      const lugar = data[0];
      const preferencias = {
        ubicacion: {
          nombre: lugar.display_name,
          lat: parseFloat(lugar.lat),
          lon: parseFloat(lugar.lon)
        },
        modo: modoUso
      };

      localStorage.setItem("preferenciasUsuario", JSON.stringify(preferencias));
      mostrarAvisoToast("✅ Preferencias guardadas");
    })
    .catch(() => {
      mostrarAvisoToast("❌ Error al buscar ubicación");
    });
}
const prefs = JSON.parse(localStorage.getItem("preferenciasUsuario") || "{}");

if (prefs?.ubicacion?.lat && prefs?.ubicacion?.lon) {
  map.setView([prefs.ubicacion.lat, prefs.ubicacion.lon], 14);
}

if (prefs?.modo === "zurdo") {
  document.body.classList.add("modo-zurdo");
} else {
  document.body.classList.remove("modo-zurdo");
}

document.getElementById("toggleBotonera")?.addEventListener("click", () => {
  const barra = document.querySelector(".barra-lateral");
  if (!barra) return;

  const estaActiva = barra.classList.contains("activa");

  barra.classList.toggle("activa", !estaActiva);
  barra.classList.toggle("oculta", estaActiva);
});

function abrirAyuda() {
  window.open("https://tronpoonpo.blogspot.com/p/exmapsapp.html", "_blank");
}
function exportarPOIsSeleccionados() {
  const seleccionados = window.poisSeleccionados || [];

  if (seleccionados.length === 0) {
    mostrarAvisoToast("?? No hay POIs seleccionados en la capa personalizada");
    return;
  }

  const poisPorCategoria = {};

  seleccionados.forEach(tags => {
    const categoria = detectarCategoria(tags);
    const nombre = tags.name || "POI";
    const { lat, lon } = tags;

    poisPorCategoria[categoria] ||= [];
    poisPorCategoria[categoria].push({ nombre, lat, lon, tags });
  });

  exportarMapaKML(poisPorCategoria);
}
document.getElementById("btnPanelCapas")?.addEventListener("click", () => {
  const wrapper = document.querySelector(".leaflet-control-layers");
  if (wrapper) {
    const yaExpandido = wrapper.classList.contains("leaflet-control-layers-expanded");

    // Si ya está abierto, lo cerramos
    if (yaExpandido) {
      wrapper.classList.remove("leaflet-control-layers-expanded");
    } else {
      wrapper.classList.add("leaflet-control-layers-expanded");
    }
  }
});

document.getElementById("archivoRuta")?.addEventListener("change", (event) => {
  const archivo = event.target.files[0];
  if (!archivo) return;

  const lector = new FileReader();

  lector.onload = function(e) {
    const contenido = e.target.result;
    const extension = archivo.name.split(".").pop().toLowerCase();

    const estiloVisible = L.geoJson(null, {
      style: {
        color: "#00ff00", // Verde neón
        weight: 4,
        opacity: 0.9
      }
    });

    let capaRuta;
    if (extension === "gpx") {
      capaRuta = omnivore.gpx.parse(contenido, null, estiloVisible);
    } else if (extension === "kml") {
      capaRuta = omnivore.kml.parse(contenido, null, estiloVisible);
    } else {
      alert("❌ Archivo no compatible. Usa GPX o KML");
      return;
    }

    capaRuta.on("ready", () => {
      capaRuta.addTo(map);

      const bounds = capaRuta.getBounds();
      const centro = map.getCenter();

      // Solo centramos el mapa si la ruta está fuera de la vista actual
      if (!bounds.contains(centro)) {
        map.fitBounds(bounds);
      }
    });

    capaRuta.on("error", () => {
      alert("❌ No se pudo cargar la ruta");
    });
  };

  lector.readAsText(archivo);
});
self.addEventListener('install', event => {
  self.skipWaiting(); // Fuerza la activación inmediata
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim(); // Toma control sin esperar
});
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request).catch(() => caches.match('./offline.html')))
  );
});
