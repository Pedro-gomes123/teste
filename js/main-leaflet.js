let mapa;

function initMap() {
  mapa = L.map("map").setView([-8.0476, -34.877], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "Map data © OpenStreetMap contributors",
  }).addTo(mapa);

  carregarPostos();
}

let postos = [];

function carregarPostos() {
  fetch("data/postos_saude_recife_completo.json")
    .then(res => res.json())
    .then(data => {
      postos = data;
      preencherFiltros();
    });
}

function preencherFiltros() {
  const distritos = [...new Set(postos.map(p => p.distrito_sanitario))].sort();
  const bairros = [...new Set(postos.map(p => p.bairro))].sort();
  const especialidades = [...new Set(postos.flatMap(p => p.especialidades))].sort();

  const selDistrito = document.getElementById("filtro-distrito");
  const selBairro = document.getElementById("filtro-bairro");
  const selEspecialidade = document.getElementById("filtro-especialidade");

  selDistrito.innerHTML = '<option value="">Nenhum</option>';
  selBairro.innerHTML = '<option value="">Nenhum</option>';
  selEspecialidade.innerHTML = '<option value="">Nenhum</option>';

  distritos.forEach(d => selDistrito.innerHTML += `<option value="${d}">${d}</option>`);
  bairros.forEach(b => selBairro.innerHTML += `<option value="${b}">${b}</option>`);
  especialidades.forEach(e => selEspecialidade.innerHTML += `<option value="${e}">${e}</option>`);
}

document.getElementById("btn-pesquisar").addEventListener("click", aplicarFiltros);

function aplicarFiltros() {
  const d = document.getElementById("filtro-distrito").value;
  const b = document.getElementById("filtro-bairro").value;
  const e = document.getElementById("filtro-especialidade").value;

  const filtrados = postos.filter(p =>
    (d === "" || p.distrito_sanitario === d) &&
    (b === "" || p.bairro === b) &&
    (e === "" || p.especialidades.includes(e))
  );

  exibirPostos(filtrados);
}

function exibirPostos(lista) {
  const container = document.getElementById("postos-container");
  container.innerHTML = "";

  if (lista.length === 0) {
    container.innerHTML = "<p>Nenhum posto encontrado com os filtros aplicados.</p>";
    return;
  }

  lista.forEach(p => {
    L.marker([p.latitude, p.longitude])
      .addTo(mapa)
      .bindPopup(`<strong>${p.nome_unidade}</strong><br>${p.endereco}`);

    const especialidades = p.especialidades.join(", ");
    const card = document.createElement("div");
    card.classList.add("posto");

    card.innerHTML = `
      <h3>${p.nome_unidade}</h3>
      <p><strong>Endereço:</strong> ${p.endereco}</p>
      <p><strong>Bairro:</strong> ${p.bairro}</p>
      <p><strong>Distrito:</strong> ${p.distrito_sanitario}</p>
      <p><strong>Especialidades:</strong> ${especialidades}</p>
      <p><strong>Horário:</strong> ${p.horario_funcionamento}</p>
    `;

    container.appendChild(card);
  });
}

document.getElementById("btn-mais-proximo").addEventListener("click", () => {
  localizarUsuario();
});

function localizarUsuario() {
  if (!navigator.geolocation) {
    alert("Geolocalização não é suportada.");
    return;
  }

  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    mapa.setView([lat, lng], 15);

    L.marker([lat, lng])
      .addTo(mapa)
      .bindPopup("<strong>Você está aqui</strong>")
      .openPopup();

    const status = document.getElementById("map-status");
    if (status) {
      status.innerHTML = `
        <div class="localizacao-obtida">
          <strong>Localização obtida</strong><br/>
          Encontraremos os postos mais próximos de você.
        </div>
      `;
    }

    buscarMaisProximo(lat, lng);
  });
}

function buscarMaisProximo(userLat, userLng) {
  if (!postos.length) return;

  let maisProximo = postos[0];
  let menorDist = distancia(userLat, userLng, maisProximo.latitude, maisProximo.longitude);

  for (let i = 1; i < postos.length; i++) {
    const dist = distancia(userLat, userLng, postos[i].latitude, postos[i].longitude);
    if (dist < menorDist) {
      menorDist = dist;
      maisProximo = postos[i];
    }
  }

  mapa.setView([maisProximo.latitude, maisProximo.longitude], 15);

  L.marker([maisProximo.latitude, maisProximo.longitude])
    .addTo(mapa)
    .bindPopup(`<strong>${maisProximo.nome_unidade}</strong><br>${maisProximo.endereco}`)
    .openPopup();

  const container = document.getElementById("posto-mais-proximo");
  const especialidades = maisProximo.especialidades.join(", ");
  container.innerHTML = `
    <h2>Posto mais próximo</h2>
    <div class="posto">
      <h3>${maisProximo.nome_unidade}</h3>
      <p><strong>Endereço:</strong> ${maisProximo.endereco}</p>
      <p><strong>Bairro:</strong> ${maisProximo.bairro}</p>
      <p><strong>Distrito:</strong> ${maisProximo.distrito_sanitario}</p>
      <p><strong>Especialidades:</strong> ${especialidades}</p>
      <p><strong>Horário:</strong> ${maisProximo.horario_funcionamento}</p>
    </div>
  `;
}

function distancia(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

document.addEventListener("DOMContentLoaded", initMap);



