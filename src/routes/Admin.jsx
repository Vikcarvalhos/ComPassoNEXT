import '../css/admin.css';
import React, { useState, useEffect } from 'react';

function Admin() {
  const [mapURL, setMapURL] = useState('');
  const [points, setPoints] = useState([]);  // Estado para armazenar os pontos carregados
  const [selectedInterest, setSelectedInterest] = useState('');  // Ponto de interesse selecionado
  const [selectedControl, setSelectedControl] = useState('');  // Ponto de controle selecionado
  const [auxPoints, setAuxPoints] = useState([]);  // Pontos auxiliares
  const [showModal, setShowModal] = useState(false);  // Estado para controlar o modal de adicionar ponto
  const [newPoint, setNewPoint] = useState({
    lat: '',
    lon: '',
    name: '',
    description: '',
    type: 'interest',
  });  // Estado para armazenar os dados do novo ponto
  const [showAuxModal, setShowAuxModal] = useState(false);  // Modal para pontos auxiliares
  const [auxPoint, setAuxPoint] = useState({ lat: '', lon: '' });  // Novo ponto auxiliar

  useEffect(() => {
    setMapURL(`https://compasso-6f13bfde1903.herokuapp.com/map`);

    // Carregar os pontos do servidor
    fetch('https://compasso-6f13bfde1903.herokuapp.com/get_points')
      .then((response) => response.json())
      .then((data) => {
        setPoints(data.features || []);
      })
      .catch((error) => {
        console.error("Erro ao carregar pontos:", error);
      });
  }, []);

  // Função para desenhar linha entre pontos selecionados
  const handleDrawLine = () => {
    if (selectedInterest && selectedControl) {
      const data = {
        interest: selectedInterest,
        control: selectedControl,
        auxPoints: auxPoints  // Adicionar pontos auxiliares
      };

      fetch('https://compasso-6f13bfde1903.herokuapp.com/draw_line', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
        .then((res) => res.json())
        .then((response) => {
          alert(response.status); // Exibir mensagem de sucesso ou erro
          setMapURL(`https://compasso-6f13bfde1903.herokuapp.com/map?timestamp=${new Date().getTime()}`); // Atualizar o mapa para refletir a linha
          setAuxPoints([]);  // Limpar os pontos auxiliares após traçar a rota
        });
    } else {
      alert('Por favor, selecione um ponto de interesse e um ponto de controle.');
    }
  };

  // Função para adicionar ponto auxiliar
  const handleAddAuxPoint = () => {
    setAuxPoints([...auxPoints, { lat: parseFloat(auxPoint.lat), lon: parseFloat(auxPoint.lon) }]);
    setAuxPoint({ lat: '', lon: '' });  // Limpar os campos de ponto auxiliar
    setShowAuxModal(false);  // Fechar o modal
  };

  // Função para abrir o modal de adição de ponto
  const handleAddPoint = () => {
    setShowModal(true);
  };

  // Função para fechar o modal de adicionar ponto
  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Função para salvar o novo ponto no backend
  const handleSavePoint = () => {
    const pointData = {
      ...newPoint,
      lat: parseFloat(newPoint.lat),  // Converter lat para float
      lon: parseFloat(newPoint.lon),  // Converter lon para float
    };
  
    fetch('https://compasso-6f13bfde1903.herokuapp.com/add_point', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pointData),
    })
      .then((res) => res.json())
      .then((response) => {
        alert(response.status); // Mensagem de sucesso ou erro
        setShowModal(false); // Fechar o modal
        setMapURL(`https://compasso-6f13bfde1903.herokuapp.com/map?timestamp=${new Date().getTime()}`); // Atualizar o mapa com o novo ponto
      })
      .catch((error) => console.error('Erro ao adicionar ponto:', error));
  };

  return (
    <div className='admin-panel'>
      <h1>Painel de Administração</h1>

      <div>
        <label>Ponto de Interesse:</label>
        <select onChange={(e) => setSelectedInterest(e.target.value)}>
          <option value="">Selecione um ponto de interesse</option>
          {points.length > 0 && points
            .filter((point) => point.properties.type === 'interest')  // Filtrar pontos de interesse
            .map((point) => (
              <option key={point.properties.id} value={point.properties.id}>
                {point.properties.name}
              </option>
            ))}
        </select>
      </div>

      <div>
        <label>Ponto de Controle:</label>
        <select onChange={(e) => setSelectedControl(e.target.value)}>
          <option value="">Selecione um ponto de controle</option>
          {points.length > 0 && points
            .filter((point) => point.properties.type === 'control')  // Filtrar pontos de controle
            .map((point) => (
              <option key={point.properties.id} value={point.properties.id}>
                {point.properties.name}
              </option>
            ))}
        </select>
      </div>

      <button onClick={handleDrawLine}>Traçar Rota</button>
      <button onClick={() => setShowAuxModal(true)}>Adicionar Ponto Auxiliar</button>
      <button onClick={handleAddPoint}>Adicionar Ponto</button>

      {/* Mostrar pontos auxiliares adicionados */}
      <div>
        <h3>Pontos Auxiliares Adicionados:</h3>
        {auxPoints.map((point, index) => (
          <div key={index}>
            Ponto {index + 1}: Latitude {point.lat}, Longitude {point.lon}
          </div>
        ))}
      </div>

      {/* Modal de Adicionar Ponto Auxiliar */}
      {showAuxModal && (
        <div className="modal-content">
          <h3>Adicionar Ponto Auxiliar</h3>
          <label>Latitude:</label>
          <input
            type="text"
            value={auxPoint.lat}
            onChange={(e) => setAuxPoint({ ...auxPoint, lat: e.target.value })}
          />
          <br />
          <label>Longitude:</label>
          <input
            type="text"
            value={auxPoint.lon}
            onChange={(e) => setAuxPoint({ ...auxPoint, lon: e.target.value })}
          />
          <br />
          <button onClick={handleAddAuxPoint}>Salvar Ponto Auxiliar</button>
          <button onClick={() => setShowAuxModal(false)}>Cancelar</button>
        </div>
      )}

      {/* Modal de Adicionar Ponto */}
      {showModal && (
        <div className="modal-content">
          <h3>Adicionar Ponto</h3>
          <label>Latitude:</label>
          <input
            type="text"
            value={newPoint.lat}
            onChange={(e) => setNewPoint({ ...newPoint, lat: e.target.value })}
          />
          <br />
          <label>Longitude:</label>
          <input
            type="text"
            value={newPoint.lon}
            onChange={(e) => setNewPoint({ ...newPoint, lon: e.target.value })}
          />
          <br />
          <label>Nome:</label>
          <input
            type="text"
            value={newPoint.name}
            onChange={(e) => setNewPoint({ ...newPoint, name: e.target.value })}
          />
          <br />
          <label>Descrição:</label>
          <input
            type="text"
            value={newPoint.description}
            onChange={(e) => setNewPoint({ ...newPoint, description: e.target.value })}
          />
          <br />
          <label>Tipo:</label>
          <select
            value={newPoint.type}
            onChange={(e) => setNewPoint({ ...newPoint, type: e.target.value })}
          >
            <option value="interest">Ponto de Interesse</option>
            <option value="control">Ponto de Controle</option>
          </select>
          <br />
          <button onClick={handleSavePoint}>Salvar Ponto</button>
          <button onClick={handleCloseModal}>Cancelar</button>
        </div>
      )}

      <iframe
        id="mapFrame"
        src={mapURL}
        style={{ width: '50%', height: '600px', border: 'none' }}
        title="Mapa com AntPath"
      ></iframe>
    </div>
  );
}

export default Admin;
