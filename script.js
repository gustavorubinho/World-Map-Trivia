mapboxgl.accessToken = 'pk.eyJ1IjoiZ3VzdHRydWJpbm8iLCJhIjoiY212MTUzMjNnMDE2MTM0b2oxaHRwYWY3YiJ9.FHK5znKZf_QKlbJI-nynmA';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/satellite-streets-v12',
    center: [-51.9253, -14.2350],
    zoom: 2,
    projection: 'globe'
});

map.on('style.load', () => {
    map.setFog({
        'color': 'rgb(186, 210, 235)',
        'high-color': 'rgb(36, 92, 223)',
        'space-color': 'rgb(11, 11, 25)',
        'star-intensity': 0.6
    });
});

map.on('mousemove', (e) => {
    const coisasNoMouse = map.queryRenderedFeatures(e.point);
    const ehLugarValido = coisasNoMouse.some(item => 

        item.layer.id === 'country-label' ||
        item.layer.id === 'state-label' ||
        item.layer.id === 'settlement-major-label' || 
        item.layer.id === 'settlement-minor-label'
    );
    
    map.getCanvas().style.cursor = ehLugarValido ? 'pointer' : '';
});

map.on('click', (e) => {
    const coisasNoMouse = map.queryRenderedFeatures(e.point);
    const lugarClicado = coisasNoMouse.find(item => 
    
        item.layer.id === 'country-label' ||
        item.layer.id === 'state-label' ||
        item.layer.id === 'settlement-major-label' || 
        item.layer.id === 'settlement-minor-label'
    );
    
    if (lugarClicado) {
        const nomeDoLocal = lugarClicado.properties.name;
        
        map.flyTo({ center: e.lngLat, zoom: 12, essential: true });
        const janela = new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
                <h3 class="cidade-titulo">${nomeDoLocal}</h3>
                <div class="botoes-container">
                    <button class="btn-topico" id="btn-historia">História</button>
                    <button class="btn-topico" id="btn-curiosidades">Curiosidades</button>
                    <button class="btn-topico" id="btn-locais">Locais Importantes</button>
                </div>
            `)
            .addTo(map);
            
        document.getElementById('btn-historia').addEventListener('click', () => {
            buscarHistoria(nomeDoLocal);
        });
        document.getElementById('btn-curiosidades').addEventListener('click', () => {
            buscarCuriosidades(nomeDoLocal);
        });
        document.getElementById('btn-locais').addEventListener('click', () => {
            buscarLocais(e.lngLat.lat, e.lngLat.lng);
        });
    }
});

async function buscarHistoria(nomeDoLocal) {
    const painel = document.getElementById('info-panel');
    const textoPainel = document.getElementById('city-info');
    document.getElementById('city-title').innerText = nomeDoLocal;
    textoPainel.innerText = "Buscando os arquivos historicos...";
    painel.classList.add('visible'); 

    try {
        const nomeForm = nomeDoLocal.replaceAll(' ', '_');
        let resposta = await fetch(`https://pt.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=false&explaintext=true&redirects=1&titles=${nomeForm}&format=json&origin=*`);
        let dados = await resposta.json();
        let idPagina = Object.keys(dados.query.pages)[0]; 
        
        let textoExtraido = "";
        if (idPagina !== "-1" && dados.query.pages[idPagina].extract) {
            textoExtraido = dados.query.pages[idPagina].extract.trim();
        }
        
        if (textoExtraido.length < 15) {
            resposta = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=false&explaintext=true&redirects=1&titles=${nomeForm}&format=json&origin=*`);
            dados = await resposta.json();
            idPagina = Object.keys(dados.query.pages)[0]; 
            if (idPagina !== "-1" && dados.query.pages[idPagina].extract) {
                textoExtraido = dados.query.pages[idPagina].extract.trim();
            }
        }

        if (textoExtraido.length >= 15) {
            let textoResumido = textoExtraido;
            if (textoResumido.length > 1800) {
                textoResumido = textoResumido.substring(0, 1800) + "...";
            }
            textoResumido += "\n\n(Fonte: Wikipedia)";
            textoPainel.innerHTML = `<div class="texto-historia">${textoResumido}</div>`;
        } else {
            textoPainel.innerText = "A Wikipedia nao encontrou uma historia detalhada deste lugar especifico.";
        }
    } catch (e) { textoPainel.innerText = "Falha na conexao."; }
}

async function buscarLocais(lat, lng) {
    const painel = document.getElementById('info-panel');
    const textoPainel = document.getElementById('city-info');
    document.getElementById('city-title').innerText = "Pontos Turisticos";
    textoPainel.innerText = "Escaneando locais num raio de 10km...";
    painel.classList.add('visible'); 

    try {
        const resposta = await fetch(`https://pt.wikipedia.org/w/api.php?action=query&generator=geosearch&ggscoord=${lat}|${lng}&ggsradius=10000&ggslimit=5&prop=extracts&exintro=true&explaintext=true&format=json&origin=*`);
        const dados = await resposta.json();
        
        if (dados.query && dados.query.pages) {
            const locais = Object.values(dados.query.pages);
            let htmlLista = "Encontramos estes lugares registrados na Wikipedia perto do seu clique:<br><br><ul class='lista-resultados'>";
            
            locais.forEach(l => { 
                const resumoCortado = l.extract ? l.extract.substring(0, 150) + "..." : "Sem descricao disponivel.";
                htmlLista += `<li class="item-resultado"><strong>${l.title}</strong><br><span class="resumo-resultado">${resumoCortado}</span></li>`; 
            });
            textoPainel.innerHTML = htmlLista + "</ul>";
        } else {
            textoPainel.innerText = "Nao encontramos monumentos famosos registrados perto deste clique.";
        }
    } catch (e) { textoPainel.innerText = "Falha no radar da Wikipedia."; }
}

async function buscarCuriosidades(nomeDoLocal) {
    const painel = document.getElementById('info-panel');
    const textoPainel = document.getElementById('city-info');
    document.getElementById('city-title').innerText = "Curiosidades";
    textoPainel.innerText = "Buscando paginas relacionadas...";
    painel.classList.add('visible'); 

    try {
        const resposta = await fetch(`https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${nomeDoLocal}&utf8=&format=json&origin=*`);
        const dados = await resposta.json();
        
        if (dados.query && dados.query.search.length > 1) {
            const coisasRelacionadas = dados.query.search.slice(1, 5);
            let htmlLista = "A Wikipedia relaciona fortemente este lugar aos seguintes assuntos:<br><br><ul class='lista-resultados'>";
            coisasRelacionadas.forEach(item => {
                htmlLista += `<li class="item-resultado"><strong>${item.title}</strong><br><span class="resumo-resultado">${item.snippet}...</span></li>`;
            });
            textoPainel.innerHTML = htmlLista + "</ul>";
        } else {
            textoPainel.innerText = "Nao encontramos assuntos curiosos relacionados a este local.";
        }
    } catch (e) { textoPainel.innerText = "Falha na busca de curiosidades."; }
}

document.getElementById('close-btn').addEventListener('click', () => {
    document.getElementById('info-panel').classList.remove('visible');
});