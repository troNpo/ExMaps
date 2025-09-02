// 🌍 Crear el mapa y definir vista inicial
const map = L.map('map', {
  zoomControl: false
}).setView([37.3886, -5.9953], 13);
// 📐 Escala métrica en el mapa
L.control.scale({
  position: 'bottomleft',
  imperial: false,
  maxWidth: 150
}).addTo(map);


map.on("moveend", () => {
  requestAnimationFrame(() => {
    const config = JSON.parse(localStorage.getItem("configBusquedaAvanzada") || "{}");
    if (!config.busquedaDinamica) return;

    const hayCheckboxActivo = document.querySelectorAll('.poicheck:checked').length > 0;
    if (!hayCheckboxActivo) return;

    const radio = Math.min(config.radio || 5000, 10000);
    const centroActual = map.getCenter();
    const centroAnterior = config.lat && config.lng ? L.latLng(config.lat, config.lng) : null;

    if (!centroAnterior) return;

    const distancia = centroActual.distanceTo(centroAnterior);

    if (distancia > radio) {
      mostrarAvisoToast("🔄 Búsqueda automática por movimiento");
      ejecutarBusqueda(true);
    }
  });
});
let marcadorBusquedaNominatim = null;


// Capa base: OpenStreetMap
const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19
});
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

if (!localStorage.getItem("ultimoMapaUsado")) {
  localStorage.setItem("ultimoMapaUsado", "OpenStreetMap");
}
// 🧠 Aplicar preferencias del usuario
const prefs = JSON.parse(localStorage.getItem("preferenciasUsuario") || "{}");

// 🌍 Ubicación
if (prefs.usarUltimaUbicacion) {
  const ultimaVista = localStorage.getItem("ultimaUbicacionMapa");
  if (ultimaVista) {
    const [lat, lon, zoom] = JSON.parse(ultimaVista);
    map.setView([lat, lon], zoom || 14);
  }
} else if (prefs?.ubicacion?.lat && prefs?.ubicacion?.lon) {
  map.setView([prefs.ubicacion.lat, prefs.ubicacion.lon], 14);
}

// 🖐️ Modo de uso
document.body.classList.toggle("modo-zurdo", prefs.modo === "zurdo");

// 🗺️ Mapa por defecto
if (prefs.mapaDefecto && prefs.mapaDefecto !== "ultimo") {
  const capa = {
    "satellite": esriSat,
    "callejero": osmLayer,
    "topografico": openTopo
  }[prefs.mapaDefecto];

  if (capa) {
    capa.addTo(map);
  }
} else {
  const ultima = localStorage.getItem("ultimoMapaUsado");
  const capa = {
    "OpenStreetMap": osmLayer,
    "OpenTopoMap": openTopo,
    "Satélite (Esri)": esriSat
  }[ultima];

  if (capa) {
    capa.addTo(map);
  } else {
    osmLayer.addTo(map); // Fallback si no hay nada guardado
  }
}

map.whenReady(() => {
  cargarRutaGPXGuardada();
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
map.on("baselayerchange", function(e) {
  localStorage.setItem("ultimoMapaUsado", e.name); // Guarda el nombre de la capa
});
let marcadorCentro = null;

// 🔧 Crear o actualizar el icono central
function actualizarIconoCentro() {
  const mostrar = document.getElementById("mostrarIconoCentro").checked;
  const tamano = parseInt(document.getElementById("sliderTamanoIconoCentro").value, 10);

  if (mostrar) {
    const iconoCentro = L.icon({
      iconUrl: "icons/ui/cur_cen.svg",
      iconSize: [tamano, tamano],
      iconAnchor: [tamano / 2, tamano / 2],
    });

    if (!marcadorCentro) {
      marcadorCentro = L.marker(map.getCenter(), {
        icon: iconoCentro,
        interactive: false,
      }).addTo(map);
    } else {
      marcadorCentro.setIcon(iconoCentro);
    }
  } else {
    if (marcadorCentro) {
      map.removeLayer(marcadorCentro);
      marcadorCentro = null;
    }
  }
}

// 🔁 Mantener el icono centrado al mover el mapa
map.on("move", () => {
  if (marcadorCentro) {
    marcadorCentro.setLatLng(map.getCenter());
  }
});
map.on("moveend", () => {
  const config = JSON.parse(localStorage.getItem("configBusquedaAvanzada") || "{}");
  if (!config.busquedaDinamica) return;

  const radio = Math.min(config.radio || 5000, 10000);
  const centroActual = map.getCenter();
  const centroAnterior = config.lat && config.lng ? L.latLng(config.lat, config.lng) : null;

  if (!centroAnterior) return;

  const distancia = centroActual.distanceTo(centroAnterior);

  if (distancia > radio) {
    mostrarAvisoToast("🔄 Búsqueda automática por movimiento");
    ejecutarBusqueda();
  }
});

// 🎚️ Eventos de los controles
document.getElementById("mostrarIconoCentro").addEventListener("change", actualizarIconoCentro);

document.getElementById("sliderTamanoIconoCentro").addEventListener("input", (e) => {
  const valor = e.target.value;
  document.getElementById("valorTamanoIcono").textContent = valor;
  actualizarIconoCentro();
});

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
          boton.classList.add("botonResultado"); 

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
document.getElementById("btnProcesarEnlaceGeo").onclick = () => {
  const enlace = document.getElementById("inputEnlaceGeo").value.trim();
  if (!enlace) return;

  let lat = null, lon = null;

  // Detectar geo:lat,lon
  const geoMatch = enlace.match(/geo:([-.\d]+),([-.\d]+)/);
  if (geoMatch) {
    lat = parseFloat(geoMatch[1]);
    lon = parseFloat(geoMatch[2]);
  }

  // Detectar @lat,lon en enlaces de Google Maps
  const mapsMatch = enlace.match(/@([-.\d]+),([-.\d]+)/);
  if (mapsMatch) {
    lat = parseFloat(mapsMatch[1]);
    lon = parseFloat(mapsMatch[2]);
  }

  if (lat && lon) {
    const coords = L.latLng(lat, lon);
    marcadorBusquedaNominatim?.remove();

    marcadorBusquedaNominatim = L.marker(coords)
      .addTo(map)
      .bindPopup(`📍 Coordenadas: ${lat}, ${lon}`)
      .openPopup();

    map.setView(coords, 16);
    document.getElementById("panelResultadosNominatim").style.display = "none";
  } else {
    document.getElementById("resultadosNominatim").innerHTML =
      "⚠️ No se detectaron coordenadas en el enlace";
  }
};

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

// Botones "Buscar POIs" dentro de cada panel de categoría y panel 
window.addEventListener("DOMContentLoaded", () => {
  const btnBuscarSeleccionados = document.getElementById("btnBuscarSeleccionados");
  if (btnBuscarSeleccionados) {
    btnBuscarSeleccionados.addEventListener("click", () => {
      ejecutarBusqueda(false);
      sidebar.classList.add("hidden");
      document.querySelectorAll(".subpanel.visible").forEach(panel => panel.classList.remove("visible"));
      actualizarBotones();
    });
  }

  document.querySelectorAll(".btnBuscarPanel").forEach(boton => {
    if (boton.id !== "btnBuscarSeleccionados") {
      boton.addEventListener("click", () => {
        ejecutarBusqueda();
        sidebar.classList.add("hidden");
        document.querySelectorAll(".subpanel.visible").forEach(panel => panel.classList.remove("visible"));
        actualizarBotones();
      });
    }
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

const subtiposPorCategoria = {
  tourism: [
    "apartment", "hostel", "camp_site", "caravan_site", "chalet", "guest_house", "hotel", "motel",
    "wilderness_hut", "alpine_hut", "picnic_site", "viewpoint", "attraction", "artwork", "gallery",
    "museum", "zoo"
  ],
  information: ["guidepost", "board", "terminal"],
  amenity: [
    "bicycle_repair_station", "charging_station", "shelter", "firepit", "drinking_water", "hospital",
    "pharmacy", "doctors", "bar", "biergarten", "library", "cafe", "cinema", "fast_food", "place_of_worship",
    "pub", "public_bookcase", "restaurant", "theatre", "bank", "post_box", "atm", "fuel", "laundry",
    "post_office", "parking_entrance", "bus_station", "ferry_terminal", "parking", "toilets", "bench",
    "public_bath", "fountain", "recycling", "lounger", "police", "fire_station"
  ],
  natural: [
    "tree", "spring", "cave_entrance", "rock", "volcano", "peak", "saddle", "mountain_pass", "beach",
    "cliff"
  ],
  waterway: ["waterfall"],
  boundary: ["protected_area"],
  emergency: ["emergency_phone", "defibrillator", "emergency_access_point"],
  historic: [
    "castle", "ruins", "wayside_shrine", "wayside_cross", "memorial", "monument", "archaeological_site"
  ],
  man_made: ["watermill", "windmill", "survey_point"],
  leisure: ["botanical_garden", "park"],
  aeroway: ["aerodrome", "helipad"],
  railway: ["crossing", "subway_entrance", "station", "level_crossing"],
  aerialway: ["station"],
  highway: ["bus_stop"],
  shop: [
    "travel_agency", "bicycle", "doityourself", "butcher", "books", "bakery", "chemist", "organic",
    "convenience", "sports", "supermarket"
  ]
};

function crearMarcador(el) {
  const nombre = el.tags.name || "POI";

  let subtipo = null;
  let key = null;

  // Buscar subtipo válido usando el objeto subtiposPorCategoria
  for (const [categoria, listaSubtipos] of Object.entries(subtiposPorCategoria)) {
    const valor = el.tags[categoria];
    if (valor && listaSubtipos.includes(valor)) {
      key = categoria;
      subtipo = valor;
      break;
    }
  }

  // Limpiar nombre para ruta de icono
  const limpiarNombre = s => s.replace(/[:\/\\ ]/g, "_").toLowerCase();
  const nombreIcono = subtipo ? limpiarNombre(subtipo) : null;
  const rutaIcono = nombreIcono ? `icons/${nombreIcono}.svg` : null;

  // Mostrar toast informativo
/*
  mostrarToast(
    subtipo
      ? `✅ Subtipo reconocido: ${subtipo} (${key}) → ${rutaIcono}`
      : `⚠️ Subtipo no reconocido. Usando icono por defecto.`,
    subtipo ? "success" : "warning"
  );
*/
  // Crear icono personalizado o usar el por defecto
  const icono = rutaIcono
    ? L.icon({
        iconUrl: rutaIcono,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -25]
      })
    : L.Icon.Default.prototype;

  // Crear marcador
  const marcador = L.marker([el.lat, el.lon], { icon: icono }).addTo(map);

  // Guardar tags en el marcador
  el.tags.lat = el.lat;
  el.tags.lon = el.lon;
  marcador._tags = el.tags;

  // Contenido del popup
  const contenidoPopup = `
    <div style="cursor:pointer;" onclick='mostrarDetallesDesdePopup(${JSON.stringify(el.tags)})'>
      <b>${nombre}</b>
    </div>
  `;
  marcador.bindPopup(contenidoPopup);

  // Evento de clic
  marcador.on("click", () => {
    marcador.openPopup();
    window.tagsPOI = el.tags;

    const panel = document.getElementById("panelPoi");
    const estaAbierto = panel?.classList.contains("visible");

    if (estaAbierto) {
      mostrarDetallesEnPanel(el.tags);
    }
  });

  return marcador;
}
function mostrarToast(mensaje, tipo = "info") {
  const colores = {
    info: "#2196F3",
    error: "#f44336",
    success: "#4CAF50",
    warning: "#FFC107"
  };

  const toast = document.createElement("div");
  toast.textContent = mensaje;
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.right = "20px";
  toast.style.backgroundColor = colores[tipo] || "#333";
  toast.style.color = "white";
  toast.style.padding = "10px 20px";
  toast.style.borderRadius = "5px";
  toast.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
  toast.style.zIndex = "9999";
  toast.style.fontFamily = "sans-serif";
  toast.style.opacity = "0";
  toast.style.transition = "opacity 0.5s ease";

  document.body.appendChild(toast);
  setTimeout(() => (toast.style.opacity = "1"), 100);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}
function ejecutarBusqueda(silenciosa = false) {
  try {
    const seleccionados = Array.from(document.querySelectorAll('.poicheck:checked'))
      .map(input => ({
        categoria: input.dataset.cat,
        subtipo: input.dataset.sub
      }));

    if (seleccionados.length === 0) {
      mostrarAvisoToast("⚠️ Selecciona al menos un tipo de lugar para buscar.");
      return;
    }

    const config = JSON.parse(localStorage.getItem("configBusquedaAvanzada") || "{}");
    const mantener = config.mantenerResultados;
    const radio = Math.min(config.radio || 5000, 10000);

    if (!mantener && window.poisLayer) {
      map.removeLayer(window.poisLayer);
    }

    if (!mantener) {
      window.poisMostrados = new Set();
    } else {
      window.poisMostrados ||= new Set();
    }

    const center = map.getCenter();
    config.lat = center.lat;
    config.lng = center.lng;
    localStorage.setItem("configBusquedaAvanzada", JSON.stringify(config));

    const equivalencias = {
      "historic=castle": ["historic=castle", "castle=yes"],
      "tourism=hotel": ["tourism=hotel"],
      "shop=supermarket": ["shop=supermarket", "amenity=marketplace"],
      "amenity=pharmacy": ["amenity=pharmacy", "healthcare=pharmacy"],
      "tourism=museum": ["tourism=museum", "historic=building"],
      "amenity=restaurant": ["amenity=restaurant"],
      "amenity=cafe": ["amenity=cafe", "shop=coffee"],
      "amenity=bar": ["amenity=bar", "shop=alcohol"],
      "amenity=bank": ["amenity=bank", "office=financial"],
      "amenity=atm": ["amenity=atm"],
      "amenity=parking": ["amenity=parking", "highway=parking"],
      "leisure=park": ["leisure=park", "landuse=recreation_ground"],
      "amenity=school": ["amenity=school", "building=school"],
      "amenity=hospital": ["amenity=hospital", "healthcare=hospital"],
      "tourism=camp_site": ["tourism=camp_site", "leisure=camping"],
      "amenity=library": ["amenity=library", "building=library"],
      "historic=monument": ["historic=monument"],
      "amenity=theatre": ["amenity=theatre", "building=theatre"],
      "amenity=cinema": ["amenity=cinema", "leisure=cinema"],
      "amenity=bus_station": ["amenity=bus_station", "public_transport=station"],
      "railway=station": ["railway=station", "public_transport=station"],
      "waterway=waterfall": ["waterway=waterfall"],
      "natural=spring": ["natural=spring"],
      "aeroway=airport": ["aeroway=airport","aeroway=aerodrome"],
      "aeroway=helipad": ["aeroway=helipad"],
      "amenity=parking_entrance": ["amenity=parking_entrance"],
      "railway=subway_entrance": ["railway=subway_entrance"],
      "railway=level_crossing": ["railway=level_crossing"],
      "railway=crossing": ["railway=crossing"],
      "highway=bus_stop": ["highway=bus_stop"],
      "aerialway=station": ["aerialway=station"],
      "amenity=ferry_terminal": ["amenity=ferry_terminal"],
      "tourism=artwork": ["tourism=artwork"],
      "tourism=gallery": ["tourism=gallery"],
      "tourism=sculpture": ["tourism=sculpture"],
      "historic=memorial": ["historic=memorial"],
      "historic=ruins": ["historic=ruins"],
      "historic=archaeological_site": ["historic=archaeological_site"],
      "tourism=attraction": ["tourism=attraction"],
      "tourism=zoo": ["tourism=zoo"],
      "amenity=fast_food": ["amenity=fast_food"],
      "amenity=pub": ["amenity=pub"],
      "amenity=biergarten": ["amenity=biergarten"],
      "amenity=ice_cream": ["amenity=ice_cream"],
      "amenity=public_bookcase": ["amenity=public_bookcase"],
      "amenity=firepit": ["amenity=bbq"],
      "historic=wayside_shrine": ["historic=wayside_shrine"],
      "historic=wayside_cross": ["historic=wayside_cross"],
      "amenity=place_of_worship":["religion=christian"]
    };

    let consulta = `[out:json][timeout:25];(\n`;
    let tagsUtilizados = [];

    seleccionados.forEach(({ categoria, subtipo }) => {
      const clave = `${categoria}=${subtipo}`;
      const tags = equivalencias[clave] || [clave];

      tags.forEach(tag => {
        const [k, v] = tag.split("=");
        if (!k || !v || v === "*") return;

        tagsUtilizados.push(`${k}=${v}`);
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
      const vistos = new Set();

      elementos.forEach(el => {
        const punto = el.center || { lat: el.lat, lon: el.lon };
        const idUnico = `${el.type}-${el.id}`;

        if (!punto || vistos.has(idUnico) || window.poisMostrados.has(idUnico)) return;

        vistos.add(idUnico);
        window.poisMostrados.add(idUnico);

        el.lat = punto.lat;
        el.lon = punto.lon;

        const marcador = crearMarcador(el);
        grupo.addLayer(marcador);
      });

      if (mantener && window.poisLayer) {
        window.poisLayer.addLayer(grupo);
      } else {
        window.poisLayer = grupo;
        grupo.addTo(map);
      }

      if (grupo.getLayers().length > 0) {
        map.fitBounds(grupo.getBounds(), { padding: [30, 30] });
      } else {
        if (!silenciosa) {
          const ahora = Date.now();
          if (ahora - ultimaBusquedaSinResultados > 5000) { // ⏱️ 5 segundos de margen
            mostrarAvisoToast("⚠️ No se encontraron resultados en esta zona.");
            ultimaBusquedaSinResultados = ahora;
          }
        }
      }
    })
    /*
    .catch(err => {
      console.error("Error en Overpass:", err);
      mostrarAvisoToast("❌ No se pudo conectar con el servidor.");
    });
    */

  } catch (error) {
    console.error("Error en ejecutarBusqueda:", error);
    mostrarAvisoToast("⚠️ Se produjo un error inesperado al ejecutar la búsqueda.");
  }
}

document.getElementById("sliderRadioBusqueda").addEventListener("input", e => {
  document.getElementById("valorRadio").textContent = e.target.value;
});
function guardarConfiguracionBusqueda() {
  const radio = parseInt(document.getElementById("sliderRadioBusqueda").value, 10);
  const mantener = document.getElementById("mantenerResultados").checked;
  const dinamica = document.getElementById("busquedaDinamica").checked;
  const iconoCentralActivo = document.getElementById("mostrarIconoCentro").checked;
  const tamañoIcono = parseInt(document.getElementById("sliderTamanoIconoCentro").value, 10);

  const center = map.getCenter();

  const config = {
    radio,
    mantenerResultados: mantener,
    busquedaDinamica: dinamica,
    iconoCentralActivo,
    tamañoIcono,
    lat: center.lat,
    lng: center.lng
  };

  localStorage.setItem("configBusquedaAvanzada", JSON.stringify(config));
  cerrarConfiguracionAvanzada();
}
function cargarConfiguracionBusqueda() {
  const config = JSON.parse(localStorage.getItem("configBusquedaAvanzada") || "{}");

  if (config.radio) {
    document.getElementById("sliderRadioBusqueda").value = config.radio;
    document.getElementById("valorRadio").textContent = config.radio;
  }

  if (typeof config.mantenerResultados === "boolean") {
    document.getElementById("mantenerResultados").checked = config.mantenerResultados;
  }

  if (typeof config.busquedaDinamica === "boolean") {
    document.getElementById("busquedaDinamica").checked = config.busquedaDinamica;
  }

  if (typeof config.iconoCentralActivo === "boolean") {
    document.getElementById("mostrarIconoCentro").checked = config.iconoCentralActivo;
    actualizarIconoCentro(); // Aplica el estado del icono
  }

  if (config.tamañoIcono) {
    document.getElementById("sliderTamanoIconoCentro").value = config.tamañoIcono;
    document.getElementById("valorTamanoIcono").textContent = config.tamañoIcono;
    actualizarIconoCentro(); // Aplica el tamaño
  }
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
cargarConfiguracionBusqueda();
cargarSeleccionCheckbox();

document.getElementById("btnAjustesMapa")?.addEventListener("click", () => {
  document.getElementById("menuAjustes").style.display = "block";
});

function cerrarAjustes() {
  document.getElementById("menuAjustes").style.display = "none";
}

function limpiarMapa() {
  if (window.poisLayer) {
    map.removeLayer(window.poisLayer);
    window.poisLayer = null;
  }

  if (marcadorBusquedaNominatim) {
    map.removeLayer(marcadorBusquedaNominatim);
    marcadorBusquedaNominatim = null;
  }

  window.poisMostrados?.clear(); // Limpia el conjunto de POIs mostrados

  cerrarAjustes();
}

function detectarSubtipo(tags) {
  const clavesPrioritarias = [
    "emergency", "amenity", "shop", "tourism",
    "leisure", "natural", "highway", "historic", "building"
  ];

  for (const clave of clavesPrioritarias) {
    const valor = tags[clave];
    if (valor && valor !== "yes" && valor !== "true") {
      return valor.replace(/[:\/\\ ]/g, "_"); // Limpia caracteres problemáticos
    }
  }

  return "default";
}

function exportarMapaKML(poisPorCategoria) {
  if (!poisPorCategoria || Object.keys(poisPorCategoria).length === 0) {
    mostrarAvisoToast("⚠️ No hay POIs para exportar");
    return;
  }

  mostrarAvisoToast("⏳ Exportando mapa KML…");

  let nombreArchivo = prompt("📁 Nombre del archivo KML:", "ExMaps_Orux.kml");
  if (!nombreArchivo || !nombreArchivo.endsWith(".kml")) {
    nombreArchivo = "ExMaps_Orux.kml";
  }
  const nombreInterno = nombreArchivo.replace(".kml", "");

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
    contenidoKML += `<Folder>\n<name>${categoria}</name>\n`;

    poisPorCategoria[categoria].forEach(poi => {
      const { nombre, lat, lon, tags = {} } = poi;
      if (typeof lat !== "number" || typeof lon !== "number") return;

      const subtipo = detectarSubtipo(tags);
      const iconoURL = `https://raw.githubusercontent.com/troNpo/ExMaps/main/icons/${subtipo}.svg`;

      const descripcion = `<![CDATA[
  <p><b>Nombre:</b> ${tags.name || nombre}</p>
  <p><b>Tipo:</b> ${categoria}</p>
  ${tags.address ? `<p><b>Dirección:</b> ${tags.address}</p>` : ""}
  ${tags.phone ? `<p><b>Teléfono:</b> ${tags.phone}</p>` : ""}
  ${tags.opening_hours ? `<p><b>Horario:</b> ${tags.opening_hours}</p>` : ""}
${tags.website ? `<p><b>Web:</b> <a href="${tags.website}" target="_blank">${tags.website}</a></p>` : ""}
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

  const todosLosMarcadores = [];

  // Extraer todos los marcadores, incluso si están en subgrupos
  window.poisLayer.eachLayer(layer => {
    if (layer instanceof L.LayerGroup) {
      layer.eachLayer(marcador => todosLosMarcadores.push(marcador));
    } else {
      todosLosMarcadores.push(layer);
    }
  });

  todosLosMarcadores.forEach(marcador => {
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
  const subtipo = detectarSubtipo(tagsPOI);
  const iconoURL = `https://raw.githubusercontent.com/troNpo/ExMaps/main/icons/${subtipo}.svg`;

  const descripcion = `<![CDATA[
<p><b>Nombre:</b> ${nombrePOI}</p>
<p><b>Tipo:</b> ${categoria}</p>
${tagsPOI.address ? `<p><b>Dirección:</b> ${tagsPOI.address}</p>` : ""}
${tagsPOI.phone ? `<p><b>Teléfono:</b> ${tagsPOI.phone}</p>` : ""}
${tagsPOI.opening_hours ? `<p><b>Horario:</b> ${tagsPOI.opening_hours}</p>` : ""}
${tagsPOI.website ? `<p><b>Web:</b> <a href="${tagsPOI.website}" target="_blank">${tagsPOI.website}</a></p>` : ""}
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


function abrirVisorWebDesdePOI(tipo) {
  const tags = window.tagsPOI;
  if (!tags?.lat || !tags?.lon) {
    mostrarAvisoToast("⚠️ Coordenadas no disponibles");
    return;
  }

  const lat = tags.lat.toFixed(7);
  const lon = tags.lon.toFixed(7);
  const ele = tags.ele ? parseFloat(tags.ele).toFixed(1) : 0;

  let url = "";
  let titulo = "";

  switch (tipo) {
    case "streetview":
      url = `https://www.google.com/maps?q=&layer=c&cbll=${lat},${lon}`;
      window.open(url, "_blank");
      return;

    case "mapillary":
      url = `https://www.mapillary.com/app/?lat=${lat}&lng=${lon}&z=17&focus=photo`;
      window.open(url, "_blank");
      return;

    case "peakfinder":
      url = `https://www.peakfinder.org/es?lat=${lat}&lng=${lon}&ele=${ele}&azi=180`;
      titulo = "PeakFinder";
      break;
  }

  // Solo embebemos PeakFinder
  document.getElementById("iframeWeb").src = url;
  document.getElementById("visorTitulo").textContent = titulo;
  document.getElementById("visorWeb").classList.remove("hidden");
}
function cerrarVisorWeb() {
  const visor = document.getElementById("visorWeb");
  const iframe = document.getElementById("iframeWeb");

  if (visor && iframe) {
    iframe.src = ""; // Limpia el contenido
    visor.classList.add("hidden"); // Oculta el visor
  }
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

  guardarFiltros(); // ✅ Actualiza localStorage con estado vacío
  actualizarListadoFiltros(); // ✅ Refresca el panel visual

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

  const prefs = JSON.parse(localStorage.getItem("preferenciasUsuario") || "{}");

  document.getElementById("modoUso").value = prefs.modo || "diestro";
  document.getElementById("mapaDefecto").value = prefs.mapaDefecto || "ultimo";
  document.getElementById("ubicacionDefecto").value = prefs.ubicacion?.nombre || "";
  document.getElementById("usarUltimaUbicacion").checked = !!prefs.usarUltimaUbicacion;
}

function cerrarPerfilUsuario() {
  document.getElementById("menuPerfilUsuario").style.display = "none";
  document.getElementById("menuAjustes").style.display = "flex";
}
function guardarPreferenciasUsuario() {
  const ubicacionTexto = document.getElementById("ubicacionDefecto")?.value.trim();
  const modoUso = document.getElementById("modoUso")?.value;
  const usarUltimaUbicacion = document.getElementById("usarUltimaUbicacion")?.checked;
  const mapaDefecto = document.getElementById("mapaDefecto")?.value;

  if (!ubicacionTexto && !usarUltimaUbicacion) {
    mostrarAvisoToast("⚠️ Escribe una ubicación válida o activa 'usar última ubicación'");
    return;
  }

  const preferencias = {
    modo: modoUso,
    usarUltimaUbicacion,
    mapaDefecto
  };

  if (!usarUltimaUbicacion && ubicacionTexto) {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(ubicacionTexto)}`)
      .then(res => res.json())
      .then(data => {
        if (!data.length) {
          mostrarAvisoToast("❌ Ubicación no encontrada");
          return;
        }

        const lugar = data[0];
        preferencias.ubicacion = {
          nombre: lugar.display_name,
          lat: parseFloat(lugar.lat),
          lon: parseFloat(lugar.lon)
        };

        localStorage.setItem("preferenciasUsuario", JSON.stringify(preferencias));
        mostrarAvisoToast("✅ Preferencias guardadas");
      })
      .catch(() => {
        mostrarAvisoToast("❌ Error al buscar ubicación");
      });
  } else {
    localStorage.setItem("preferenciasUsuario", JSON.stringify(preferencias));
    mostrarAvisoToast("✅ Preferencias guardadas");
  }
}

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
if ('serviceWorker' in navigator && 'SyncManager' in window) {
  navigator.serviceWorker.ready.then(registration => {
    registration.sync.register('sync-new-poi');
  });
}

// Procesar enlace al hacer clic
document.getElementById("btnProcesarEnlaceGeo").onclick = () => {
  const enlace = document.getElementById("inputEnlaceGeo").value.trim();
  if (!enlace) return;

  let lat = null, lon = null;

  // Convertir coordenadas DMS a decimal
  function convertirDMSaDecimal(grados, minutos, segundos, direccion) {
    let decimal = parseFloat(grados) + parseFloat(minutos) / 60 + parseFloat(segundos) / 3600;
    if (direccion === 'S' || direccion === 'W') {
      decimal *= -1;
    }
    return decimal;
  }

  // Patrones para detectar coordenadas
  const patrones = [
    /geo:([-.\d]+),([-.\d]+)/,                                         // geo:lat,lon
    /@([-.\d]+),([-.\d]+)/,                                            // @lat,lon
    /[?&]q=([-.\d]+),([-.\d]+)/,                                       // ?q=lat,lon
    /([-+]?\d{1,3}\.\d+)[,\s]+([-+]?\d{1,3}\.\d+)/,                    // lat,lon o lat lon
    /(\d{1,3})°(\d{1,2})'(\d{1,2})["']?([NS])\s+(\d{1,3})°(\d{1,2})'(\d{1,2})["']?([EW])/ // DMS
  ];

  for (const regex of patrones) {
    const match = enlace.match(regex);
    if (match) {
      if (regex.toString().includes("°")) {
        // Formato DMS
        lat = convertirDMSaDecimal(match[1], match[2], match[3], match[4]);
        lon = convertirDMSaDecimal(match[5], match[6], match[7], match[8]);
      } else {
        lat = parseFloat(match[1]);
        lon = parseFloat(match[2]);
      }
      break;
    }
  }

  if (lat && lon) {
    const coords = L.latLng(lat, lon);
    marcadorBusquedaNominatim?.remove();

    marcadorBusquedaNominatim = L.marker(coords)
      .addTo(map)
      .bindPopup(`📍 Coordenadas: ${lat}, ${lon}`)
      .openPopup();

    map.setView(coords, 16);
    document.getElementById("panelResultadosNominatim").style.display = "none";
  } else {
    document.getElementById("resultadosNominatim").innerHTML =
      "⚠️ No se detectaron coordenadas en el enlace";
  }
};

// Detectar coordenadas desde la URL al cargar la página
function obtenerCoordenadasDesdeURL() {
  const search = new URLSearchParams(window.location.search);
  const lat = parseFloat(search.get("lat"));
  const lon = parseFloat(search.get("lon"));
  const zoom = parseInt(search.get("zoom"));

  if (!isNaN(lat) && !isNaN(lon)) {
    return { lat, lon, zoom: zoom || 15 };
  }

  const hash = window.location.hash;
  const match = hash.match(/ll=([-.\d]+),([-.\d]+).*?z=(\d+)/);
  if (match) {
    return {
      lat: parseFloat(match[1]),
      lon: parseFloat(match[2]),
      zoom: parseInt(match[3])
    };
  }

  return null;
}

// Aplicar coordenadas desde la URL si existen
window.addEventListener("load", () => {
  const coords = obtenerCoordenadasDesdeURL();
  if (coords) {
    const { lat, lon, zoom } = coords;
    const punto = L.latLng(lat, lon);
    marcadorBusquedaNominatim?.remove();
    marcadorBusquedaNominatim = L.marker(punto)
      .addTo(map)
      .bindPopup(`📍 Coordenadas: ${lat}, ${lon}`)
      .openPopup();
    map.setView(punto, zoom);
  }
});


// 🧠 Normaliza texto para búsqueda (sin acentos, minúsculas)
function normalizarTexto(texto) {
  return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// 📚 Genera el diccionario de POIs desde los checkboxes
function generarDiccionarioBusqueda() {
  const diccionario = [];

  document.querySelectorAll(".poicheck").forEach(check => {
    const label = check.closest("label")?.textContent.trim();
    const categoria = check.getAttribute("data-cat");
    const subtipo = check.getAttribute("data-sub");

    if (!label || !categoria || !subtipo) return;

    const panel = check.closest(".subpanel");
    const panelId = panel?.id || null;

    diccionario.push({
      label,
      tags: [`${categoria}=${subtipo}`],
      category: categoria,
      subcategory: subtipo,
      panelId,
      aliases: [],
      normalized: label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    });
  });

  return diccionario;
}

function abrirPanelCategoria(poi) {
  if (!poi.panelId) return;

  // Ocultar todos los subpaneles
  document.querySelectorAll(".subpanel").forEach(p => {
    p.classList.add("hidden");
    p.classList.remove("visible");
  });

  // Mostrar el panel correspondiente
  const panel = document.getElementById(poi.panelId);
  if (panel) {
    panel.classList.remove("hidden");
    panel.classList.add("visible");

    // Activar y enfocar el checkbox
    const selector = `.poicheck[data-cat="${poi.category}"][data-sub="${poi.subcategory}"]`;
    const checkbox = panel.querySelector(selector);
    if (checkbox) {
      checkbox.checked = true;
      checkbox.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
}

function activarBuscadorPOI() {
  const diccionario = generarDiccionarioBusqueda();
  const input = document.getElementById("inputBusquedaPOI");
  const sugerencias = document.getElementById("sugerenciasBusqueda");

  input.addEventListener("input", () => {
    const texto = input.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    sugerencias.innerHTML = "";

    if (texto.length < 2) return;

    const coincidencias = diccionario.filter(poi =>
      poi.normalized.includes(texto) ||
      poi.aliases.some(alias => alias.includes(texto))
    );

    coincidencias.forEach(poi => {
      const item = document.createElement("div");
      item.className = "sugerencia-item";
      item.innerHTML = `
        <span>${poi.label}</span>
        <button data-accion="ver" title="Ir al panel">✅</button>
      `;

      item.querySelector('[data-accion="ver"]').addEventListener("click", () => {
        abrirPanelCategoria(poi);
        input.value = ""; // Limpiar campo
        input.focus();     // Reenfocar campo
        sugerencias.innerHTML = ""; // Cerrar sugerencias
      });

      sugerencias.appendChild(item);
    });
  });
}

// Inicializar buscador al cargar
activarBuscadorPOI();

function abrirConfiguracionAvanzada() {
  const panel = document.getElementById("panelBusquedaAvanzada");
  if (panel) {
    panel.classList.add("visible");
  }
}

function cerrarConfiguracionAvanzada() {
  const panel = document.getElementById("panelBusquedaAvanzada");
  if (panel) {
    panel.classList.remove("visible");
  }
}
function actualizarListadoFiltros() {
  const lista = document.getElementById("listaFiltros");
  const bloque = document.getElementById("filtrosActivos");
  const botonToggle = document.getElementById("btnToggleFiltrosActivos");

  lista.innerHTML = "";

  const seleccionados = Array.from(document.querySelectorAll('.poicheck:checked'));

  if (seleccionados.length === 0) {
    lista.innerHTML = "<li><em>No hay filtros activos</em></li>";
    bloque.classList.add("oculto");
    botonToggle.classList.add("oculto");
    return;
  }

  // Mostrar botón y bloque si hay filtros
  botonToggle.classList.remove("oculto");
  bloque.classList.remove("oculto");
  botonToggle.textContent = "🧭 Ocultar filtros activos";

  seleccionados.forEach(check => {
    const label = check.closest("label")?.textContent.trim() || "POI";
    const categoria = check.dataset.cat;
    const subtipo = check.dataset.sub;
    const tag = `${categoria}=${subtipo}`;

    const item = document.createElement("li");
    item.innerHTML = `
      ${label} <span style="color:gray;">(${tag})</span>
      <button class="btn-quitar">x</button>
    `;

    const btn = item.querySelector(".btn-quitar");
    btn.addEventListener("click", () => {
      check.checked = false;
      guardarFiltros();
      actualizarListadoFiltros();
    });

    lista.appendChild(item);
  });
}

function guardarFiltros() {
  const seleccionados = Array.from(document.querySelectorAll('.poicheck:checked'))
    .map(check => check.id);
  localStorage.setItem("filtrosActivos", JSON.stringify(seleccionados));
}

function restaurarFiltros() {
  const guardados = JSON.parse(localStorage.getItem("filtrosActivos")) || [];
  guardados.forEach(id => {
    const checkbox = document.getElementById(id);
    if (checkbox) checkbox.checked = true;
  });
  actualizarListadoFiltros();
}

window.addEventListener("DOMContentLoaded", () => {
  restaurarFiltros();

  // Evento para el botón toggle
  const botonToggle = document.getElementById("btnToggleFiltrosActivos");
  if (botonToggle) {
    botonToggle.addEventListener("click", () => {
      const bloque = document.getElementById("filtrosActivos");
      bloque.classList.toggle("oculto");

      const visible = !bloque.classList.contains("oculto");
      botonToggle.textContent = visible
        ? "🧭 Ocultar filtros activos"
        : "🧭 Mostrar filtros activos";
    });
  }

  // Eventos para los checkboxes
  document.querySelectorAll('.poicheck').forEach(check => {
    check.addEventListener("change", () => {
      guardarFiltros();
      actualizarListadoFiltros();
    });
  });
});

window.addEventListener("DOMContentLoaded", restaurarFiltros);

document.querySelectorAll('.poicheck').forEach(check => {
  check.addEventListener("change", () => {
    guardarFiltros();
    actualizarListadoFiltros();
  });
});
document.getElementById("btnToggleConfigBusqueda").addEventListener("click", () => {
  const bloque = document.getElementById("bloqueConfigBusqueda");
  bloque.classList.toggle("oculto");

  const visible = !bloque.classList.contains("oculto");
  document.getElementById("btnToggleConfigBusqueda").textContent = visible
    ? "🔽 Ocultar Configuración de búsqueda"
    : "⚙️ Configuración de búsqueda";
});

document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggleBotonera");
  const barraControles = document.getElementById("barraControles");
  const iconoToggle = toggleBtn?.querySelector("img");

  if (!toggleBtn || !barraControles) return;

  // 🔁 Restaurar estado guardado
  const estadoGuardado = localStorage.getItem("estadoBotonera");
  if (estadoGuardado === "oculto") {
    barraControles.classList.add("oculto");
    if (iconoToggle) iconoToggle.src = "icons/ui/fi-sr-brain.svg";
  }

  // 🧠 Toggle al hacer clic
  toggleBtn.addEventListener("click", () => {
    barraControles.classList.toggle("oculto");

    const estaOculta = barraControles.classList.contains("oculto");
    localStorage.setItem("estadoBotonera", estaOculta ? "oculto" : "visible");

    if (iconoToggle) {
      iconoToggle.src = estaOculta
        ? "icons/ui/fi-sr-brain.svg"
        : "icons/ui/fi-sr-brain-circuit.svg";
    }
  });
});


document.getElementById("inputGPX").addEventListener("change", e => {
  const archivo = e.target.files[0];
  if (!archivo || !archivo.name.endsWith(".gpx")) {
    mostrarToast("⚠️ Archivo no válido. Usa formato .gpx", "warning");
    return;
  }

  const lector = new FileReader();
  lector.onload = evento => {
    const contenido = evento.target.result;
    localStorage.setItem("rutaGPX", contenido);

    const capaGPX = new L.GPX(contenido, {
      async: true,
      marker_options: {
        startIcon: false,
        endIcon: false,
        shadowUrl: null
      }
    });

    capaGPX.addTo(map);

    capaGPX.on("loaded", () => {
      map.fitBounds(capaGPX.getBounds());
      mostrarToast("✅ Ruta GPX cargada y guardada", "success");
      colocarMarcadoresInicioFin(capaGPX);
    });

    capaGPX.on("error", () => {
      mostrarToast("❌ Error al procesar el archivo GPX", "error");
    });
  };

  lector.readAsText(archivo);
});

function cargarRutaGPXGuardada() {
  const contenido = localStorage.getItem("rutaGPX");
  if (!contenido) {
    mostrarToast("ℹ️ No hay ruta GPX guardada en memoria", "info");
    return;
  }

  mostrarToast("📦 Cargando ruta GPX desde memoria", "info");

  const capaGPX = new L.GPX(contenido, {
    async: true,
    marker_options: {
      startIcon: false,
      endIcon: false,
      shadowUrl: null
    }
  });

  capaGPX.addTo(map);

  capaGPX.on("loaded", function (e) {
    map.fitBounds(e.target.getBounds());
    mostrarToast("📍 Ruta GPX restaurada y centrada en el mapa", "success");
    colocarMarcadoresInicioFin(e.target);
  });

  capaGPX.on("error", function () {
    mostrarToast("❌ Error al cargar ruta desde memoria", "error");
  });
}

function borrarRutaGPX() {
  localStorage.removeItem("rutaGPX");

  let capasEliminadas = 0;
  map.eachLayer(layer => {
    if (layer instanceof L.GPX || layer instanceof L.Marker) {
      map.removeLayer(layer);
      capasEliminadas++;
    }
  });

  mostrarToast("🗑️ Ruta GPX eliminada. Capas eliminadas: " + capasEliminadas, "info");
}
function toggleMenuCompartir() {
  const menu = document.getElementById("menuCompartir");

  const estaVisible = menu.classList.contains("visible");

  // Ocultar todos los menús emergentes
  document.querySelectorAll(".menu-emergente").forEach(m => {
    m.classList.remove("visible");
    m.classList.add("oculto");
  });

  // Si no estaba visible, lo mostramos
  if (!estaVisible) {
    menu.classList.remove("oculto");
    menu.classList.add("visible");
  }
}
function compartirTextoCentroMapa() {
  const centro = map.getCenter();
  const lat = centro.lat.toFixed(7);
  const lon = centro.lng.toFixed(7);
  const fecha = new Date().toISOString().slice(0, 10);

  const texto = `ExMaps posición actual

📍 Centro del mapa:
- Latitud: ${lat}
- Longitud: ${lon}

geo:${lat},${lon}
https://oruxmaps.com/position?q=${lat},${lon}

🗓️ Generado el ${fecha} con ExMaps`;

  if (navigator.share) {
    navigator.share({ title: "Ubicación actual", text: texto })
      .then(() => mostrarAvisoToast("✅ Texto compartido"))
      .catch(() => mostrarAvisoToast("⚠️ No se pudo compartir directamente"));
  } else {
    navigator.clipboard.writeText(texto)
      .then(() => mostrarAvisoToast("📋 Copiado al portapapeles"))
      .catch(() => mostrarAvisoToast("⚠️ No se pudo copiar"));
  }
}

function compartirPosicionCentroMapa() {
  const centro = map.getCenter();
  const lat = centro.lat.toFixed(7);
  const lon = centro.lng.toFixed(7);
  const geoIntent = `geo:${lat},${lon}?q=${lat},${lon}`;
  window.location.href = geoIntent;
}

function abrirEditorOSMDesdeCentro() {
  const centro = map.getCenter();
  const lat = centro.lat.toFixed(7);
  const lon = centro.lng.toFixed(7);
  const url = `https://www.openstreetmap.org/edit?editor=id#map=18/${lat}/${lon}`;
  window.open(url, '_blank');
}

function añadirNotaOSMDesdeCentro() {
  const centro = map.getCenter();
  const lat = centro.lat.toFixed(7);
  const lon = centro.lng.toFixed(7);
  const textoNota = encodeURIComponent(`Sugerencia para esta ubicación`);
  const url = `https://www.openstreetmap.org/note/new#map=18/${lat}/${lon}&text=${textoNota}`;
  window.open(url, '_blank');
}

function abrirVisorWebDesdeCentro(tipo) {
  const centro = map.getCenter();
  const lat = centro.lat.toFixed(7);
  const lon = centro.lng.toFixed(7);
  const ele = 0;

  let url = "";
  let titulo = "";

  switch (tipo) {
    case "streetview":
      url = `https://www.google.com/maps?q=&layer=c&cbll=${lat},${lon}`;
      window.open(url, "_blank");
      return;

    case "mapillary":
      url = `https://www.mapillary.com/app/?lat=${lat}&lng=${lon}&z=17&focus=photo`;
      window.open(url, "_blank");
      return;

    case "peakfinder":
      url = `https://www.peakfinder.org/es?lat=${lat}&lng=${lon}&ele=${ele}&azi=180`;
      titulo = "PeakFinder";
      break;
  }

  // 🔒 Cerrar menús desplegables
  document.querySelectorAll(".bloque-config.visible").forEach(b => b.classList.remove("visible"));

  const menuAjustes = document.getElementById("menuAjustes");
  if (menuAjustes) menuAjustes.style.display = "none";

  // 📺 Mostrar visor embebido
  const visor = document.getElementById("visorWeb");
  const iframe = document.getElementById("iframeWeb");
  const tituloElemento = document.getElementById("visorTitulo");

  if (visor && iframe && tituloElemento) {
    iframe.src = url;
    tituloElemento.textContent = titulo;
    visor.classList.remove("hidden");
  }
}

// botón exportar
document.addEventListener("DOMContentLoaded", () => {
  const boton = document.getElementById("btnExportar");
  const bloque = document.getElementById("bloqueExportar");

  boton.addEventListener("click", (e) => {
    e.stopPropagation(); // Evita que el clic se propague
    bloque.classList.toggle("visible");
  });

  document.addEventListener("click", (e) => {
    if (!bloque.contains(e.target) && !boton.contains(e.target)) {
      bloque.classList.remove("visible");
    }
  });
});
// ubicación GPS 
let seguimientoActivo = false;
let watchId = null;
let marcadorGPS = null;

function toggleSeguimientoGPSDesdeSwitch(input) {
  if (input.checked) {
    activarSeguimientoGPS();
  } else {
    desactivarSeguimientoGPS();
  }
}

function activarSeguimientoGPS() {
  if (!navigator.geolocation) {
    mostrarAvisoToast("⚠️ Geolocalización no disponible");
    document.getElementById("switchGPS").checked = false;
    return;
  }

  mostrarAvisoToast("📡 Activando seguimiento GPS...");

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const punto = L.latLng(lat, lon);
      map.setView(punto, 16);

      if (!marcadorGPS) {
        marcadorGPS = L.marker(punto)
          .addTo(map)
          .bindPopup("📍 Estás aquí");
      } else {
        marcadorGPS.setLatLng(punto);
      }

      marcadorGPS.openPopup();
      mostrarAvisoToast("📍 Ubicación actualizada");
    },
    (err) => {
      mostrarAvisoToast("❌ Error al obtener ubicación");
      console.error(err);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000
    }
  );

  seguimientoActivo = true;
}

function desactivarSeguimientoGPS() {
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  if (marcadorGPS) {
    map.removeLayer(marcadorGPS);
    marcadorGPS = null;
  }

  seguimientoActivo = false;
  mostrarAvisoToast("🛑 Seguimiento GPS desactivado");
}

function mostrarAvisoToast(mensaje) {
  let toast = document.getElementById("toastAviso");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toastAviso";
    toast.className = "toast oculto";
    document.body.appendChild(toast);
  }

  toast.textContent = mensaje;
  toast.classList.remove("oculto");
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("oculto");
  }, 3000);
}

function obtenerAltitud(lat, lng) {
  const latRedondeada = lat.toFixed(3);
  const lngRedondeada = lng.toFixed(3);
  const claveCache = `altitud_${latRedondeada}_${lngRedondeada}`;
  const estado = document.getElementById("estadoAltitud");

  // Ocultar el estado por defecto
  estado.style.display = "none";

  // Verificar si ya está en caché (solo durante la sesión)
  const altitudGuardada = sessionStorage.getItem(claveCache);
  if (altitudGuardada !== null) {
    document.getElementById("altitudMapa").textContent = `Altitud: ${altitudGuardada} m`;
    return;
  }

  // Si no está en caché, consultar API
  const url = `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.results && data.results[0] && data.results[0].elevation !== null) {
        const altitud = Math.round(data.results[0].elevation);
        document.getElementById("altitudMapa").textContent = `Altitud: ${altitud} m`;

        // Guardar en caché de sesión
        sessionStorage.setItem(claveCache, altitud);
      } else {
        document.getElementById("altitudMapa").textContent = `Altitud: --`;
        mostrarErrorAltitud("⚠️ No se pudo obtener la altitud");
      }
    })
    .catch(error => {
      document.getElementById("altitudMapa").textContent = `Altitud: --`;
      mostrarErrorAltitud(`❌ Error al consultar la API: ${error.message}`);
    });
}

// Función para mostrar el mensaje de error temporalmente
function mostrarErrorAltitud(mensaje) {
  const estado = document.getElementById("estadoAltitud");
  estado.textContent = mensaje;
  estado.style.display = "block";

  setTimeout(() => {
    estado.style.display = "none";
  }, 4000); // Oculta después de 4 segundos
}

function actualizarCabecera() {
  const centro = map.getCenter();
  const zoom = map.getZoom();

  document.getElementById("zoomMapa").textContent = "Zoom " + zoom;
  document.getElementById("coordenadasMapa").textContent =
    centro.lat.toFixed(5) + ", " + centro.lng.toFixed(5);

  obtenerAltitud(centro.lat, centro.lng);
}

map.whenReady(actualizarCabecera);
map.on("moveend zoomend", actualizarCabecera);