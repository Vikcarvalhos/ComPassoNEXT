import '../css/home.css';
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function Home() {
  const [mapURL, setMapURL] = useState(''); // URL do mapa inicial
  const [interestIds, setInterestIds] = useState([]); // Lista de IDs de interesse
  const [currentInterest, setCurrentInterest] = useState(null); // Ponto de interesse atual
  const [showModal, setShowModal] = useState(false); // Controle de visibilidade do modal
  const location = useLocation();
  const navigate = useNavigate();
  const cacheExpirationHours = 24; // Tempo de cache em horas

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Localização obtida:", position);
          // Atualize o mapa com a localização do usuário, por exemplo.
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            console.warn("O usuário negou a permissão de geolocalização.");
          } else {
            console.warn("Erro ao obter localização:", error.message);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      console.warn("Geolocalização não está disponível no navegador.");
    }
  }, []);  

  useEffect(() => {
    // Tentar obter a lista de IDs de interesse do localStorage
    const storedInterestIds = localStorage.getItem('interestIds');
    const storedTimestamp = localStorage.getItem('interestIdsTimestamp');

    const isCacheValid =
      storedTimestamp &&
      Date.now() - storedTimestamp < cacheExpirationHours * 60 * 60 * 1000;

    if (storedInterestIds && isCacheValid) {
      setInterestIds(JSON.parse(storedInterestIds));
    } else {
      fetch('https://compasso-6f13bfde1903.herokuapp.com/get_interest_ids')
        .then((response) => response.json())
        .then((data) => {
          setInterestIds(data);
          localStorage.setItem('interestIds', JSON.stringify(data));
          localStorage.setItem('interestIdsTimestamp', Date.now());
        })
        .catch((error) => console.error('Erro ao carregar IDs de interesse:', error));
    }

    // Define o URL inicial do mapa sem parâmetros
    setMapURL(`https://compasso-6f13bfde1903.herokuapp.com/map`);

    // Captura os parâmetros da URL (ex: ?control_id=1&interest_id=2)
    const params = new URLSearchParams(location.search);
    const controlParam = params.get('control_id');
    const interestParam = params.get('interest_id');

    // Se os parâmetros existirem, faz a chamada para buscar a rota
    if (controlParam && interestParam) {
      handleSearchRoute(controlParam, interestParam);
      loadInterestDetails(interestParam);
    }
  }, [location.search]); // O useEffect executa quando os parâmetros da URL mudam

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Localização obtida:', position);
        },
        (error) => {
          console.warn('Erro ao obter localização:', error.message);
        }
      );
    } else {
      console.warn('Geolocalização não está disponível no navegador.');
    }
  }, []);

  // Função para buscar a rota específica no back-end
  const handleSearchRoute = (controlIdParam, interestIdParam) => {
    const cacheKey = `route_${controlIdParam}_${interestIdParam}`;
    const cachedRoute = localStorage.getItem(cacheKey);

    if (cachedRoute) {
      const mapFrame = document.getElementById('mapFrame');
      mapFrame.srcdoc = cachedRoute;
    } else {
      const url = `https://compasso-6f13bfde1903.herokuapp.com/get_route_map?control_id=${controlIdParam}&interest_id=${interestIdParam}`;
      fetch(url, { method: 'GET' })
        .then((response) => response.text())
        .then((mapHTML) => {
          const mapFrame = document.getElementById('mapFrame');
          mapFrame.srcdoc = mapHTML;
          localStorage.setItem(cacheKey, mapHTML); // Armazenar o HTML da rota no cache
        })
        .catch((error) => console.error('Erro ao buscar rota:', error));
    }
  };

  // Função para carregar detalhes do ponto de interesse selecionado
  const loadInterestDetails = (interestId) => {
    const cachedInterest = localStorage.getItem(`interest_${interestId}`);

    if (cachedInterest) {
      setCurrentInterest(JSON.parse(cachedInterest));
    } else {
      fetch(`https://compasso-6f13bfde1903.herokuapp.com/get_interest_details?id=${interestId}`)
        .then((response) => response.json())
        .then((data) => {
          setCurrentInterest(data);
          localStorage.setItem(`interest_${interestId}`, JSON.stringify(data)); // Cachear detalhes do interesse
        })
        .catch((error) => console.error('Erro ao carregar detalhes do interesse:', error));
    }
  };

  // Função para incrementar ou decrementar o interest_id de forma cíclica
  const handleChangeInterestId = (direction) => {
    if (interestIds.length === 0) return;

    const params = new URLSearchParams(location.search);
    const controlId = params.get('control_id') || '1';
    const currentIndex = interestIds.indexOf(params.get('interest_id'));

    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % interestIds.length;
    } else if (direction === 'prev') {
      newIndex = (currentIndex - 1 + interestIds.length) % interestIds.length;
    }

    const newInterestId = interestIds[newIndex];
    navigate(`/?control_id=${controlId}&interest_id=${newInterestId}`);
  };

  // Função para abrir o modal
  const handleOpenModal = () => {
    setShowModal(true);
  };

  // Função para fechar o modal
  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <div>
      {showModal && currentInterest && (
        <div className="modal">
          <div className="modal-content">
            <h2>{currentInterest.name}</h2>
            <p>{currentInterest.description}</p>
            <button onClick={handleCloseModal}>Fechar</button>
          </div>
        </div>
      )}
      <iframe id="mapFrame" src={mapURL} title="Mapa com AntPath"></iframe>

      <div className="buttons-container">
        <div>
          <div className="navigator-buttons">
            <button onClick={() => handleChangeInterestId('prev')}>&lt;</button>
            <button onClick={() => handleChangeInterestId('next')}>&gt;</button>
          </div>
          <button className="description-button" onClick={handleOpenModal}>Descrição</button>
        </div>
      </div>
    </div>
  );
}

export default Home;
