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
  
  useEffect(() => {
    // Carrega a lista de IDs de interesse do backend ao montar o componente
    fetch('http://localhost:5000/get_interest_ids')
      .then((response) => response.json())
      .then((data) => setInterestIds(data))
      .catch((error) => console.error('Erro ao carregar IDs de interesse:', error));

    // Define o URL inicial do mapa sem parâmetros
    setMapURL(`http://localhost:5000/map`);

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

  // Função para buscar a rota específica no back-end
  const handleSearchRoute = (controlIdParam, interestIdParam) => {
    const url = `http://localhost:5000/get_route_map?control_id=${controlIdParam}&interest_id=${interestIdParam}`;
    
    fetch(url, {
      method: 'GET',
    })
      .then((response) => response.text())
      .then((mapHTML) => {
        const mapFrame = document.getElementById('mapFrame');
        mapFrame.srcdoc = mapHTML; // Atualiza o iframe com o mapa e a rota sem recarregar a página
      })
      .catch((error) => {
        console.error('Erro ao buscar rota:', error);
      });
  };

  // Função para carregar detalhes do ponto de interesse selecionado
  const loadInterestDetails = (interestId) => {
    fetch(`http://localhost:5000/get_interest_details?id=${interestId}`)
      .then((response) => response.json())
      .then((data) => setCurrentInterest(data))
      .catch((error) => console.error('Erro ao carregar detalhes do interesse:', error));
  };

  // Função para incrementar ou decrementar o interest_id de forma cíclica
  const handleChangeInterestId = (direction) => {
    if (interestIds.length === 0) return; // Se não carregou ainda, não faz nada

    const params = new URLSearchParams(location.search);
    const controlId = params.get('control_id') || '1'; // Valor padrão
    const currentIndex = interestIds.indexOf(params.get('interest_id'));

    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % interestIds.length;
    } else if (direction === 'prev') {
      newIndex = (currentIndex - 1 + interestIds.length) % interestIds.length;
    }

    const newInterestId = interestIds[newIndex];

    // Atualiza a URL com o novo interest_id
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
      {/* Modal */}
      {showModal && currentInterest && (
        <div className="modal">
          <div className="modal-content">
            <h2>{currentInterest.name}</h2>
            <p>{currentInterest.description}</p>
            <button onClick={handleCloseModal}>Fechar</button>
          </div>
        </div>
      )}
      <iframe
        id="mapFrame"
        src={mapURL}
        title="Mapa com AntPath"
      ></iframe>

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