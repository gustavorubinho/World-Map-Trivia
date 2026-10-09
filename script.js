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
                    <button class="btn-topico">Curiosidades</button>
                    <button class="btn-topico">Locais Importantes</button>
                </div>
            `)
            .addTo(map);
        document.getElementById('btn-historia').addEventListener('click', () => {
            buscarNaWikipedia(nomeDoLocal);
        });
    }
});

async function buscarNaWikipedia(nomeDoLocal) {
    const painel = document.getElementById('info-panel');
    const tituloPainel = document.getElementById('city-title');
    const textoPainel = document.getElementById('city-info');
    tituloPainel.innerText = nomeDoLocal;
    textoPainel.innerText = "Buscando nos arquivos da Wikipedia... ⏳";
    painel.classList.add('visible'); 

    try {
        const nomeFormatado = nomeDoLocal.replaceAll(' ', '_');
        
        let resposta = await fetch(`https://pt.wikipedia.org/api/rest_v1/page/summary/${nomeFormatado}`);
        
        if (!resposta.ok) {
            resposta = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${nomeFormatado}`);
        }

        const dados = await resposta.json();
        
        if (dados.extract) {
            textoPainel.innerText = dados.extract;
        } else {
            textoPainel.innerText = "Poxa, a Wikipedia não tem um artigo sobre este lugar, nem em inglês!";
        }
    } catch (erro) {
        textoPainel.innerText = "Falha na conexão de internet.";
    }
}

document.getElementById('close-btn').addEventListener('click', () => {
    document.getElementById('info-panel').classList.remove('visible');
});