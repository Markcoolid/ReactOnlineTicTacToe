import React, { useState, useEffect } from "react";
import Peer from "peerjs";

const generateShortId = () => {
  return Math.floor(Math.random() * 1000).toString();
};

function Square({ value, onClick }) {
  return (
    <button className="square" onClick={onClick}>
      {value}
    </button>
  );
}

function Board({ squares, onClick }) {
  return (
    <div className="board">
      {[0, 1, 2].map((row) => (
        <div key={row} className="board-row">
          {[0, 1, 2].map((col) => {
            const index = row * 3 + col;
            return (
              <Square
                key={index}
                value={squares[index]}
                onClick={() => onClick(index)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Game() {
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  const [peerId, setPeerId] = useState("");
  const [conn, setConn] = useState(null);
  const [peer, setPeer] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isPlayerX, setIsPlayerX] = useState(true); 
  const [myTurn, setMyTurn] = useState(false); 

  useEffect(() => {
    const peer = new Peer(generateShortId());

    peer.on("open", (id) => {
      console.log("My short peer ID is: " + id);
      setPeer(peer);
    });

    peer.on("connection", (connection) => {
      connection.on("open", () => {
        console.log("Connected to peer");
        setIsConnected(true);
        setConn(connection);
        setMyTurn(true); 

 
        connection.send({ history: history, currentMove: currentMove });
      });

      connection.on("data", ({ history, currentMove }) => {
        setHistory(history);
        setCurrentMove(currentMove);
        setIsPlayerX(currentMove % 2 === 0); 

     
        setMyTurn(true); 
      });

      connection.on("close", () => {
        console.log("Connection closed");
        setIsConnected(false);
        setConn(null);
      });

      connection.on("error", (err) => {
        console.error("Connection error:", err);
        setIsConnected(false);
        setConn(null);
      });

    
      setConn(connection);
    });

    return () => {
      
      if (peer) {
        peer.destroy();
      }
    };
  }, []); // Putting conditions here breaks stuff, don't do it, I beg of you, PELASE

  const handlePlay = (index) => {
    if (
      calculateWinner(history[currentMove]) ||
      history[currentMove][index] ||
      !myTurn
    ) {
      return;
    }

    const nextSquares = history[currentMove].slice();
    nextSquares[index] = isPlayerX ? "X" : "O";

    const nextHistory = history.slice(0, currentMove + 1);
    setHistory([...nextHistory, nextSquares]);
    setCurrentMove(nextHistory.length);
    setMyTurn(false); 

    if (conn && isConnected) {
      conn.send({
        history: [...nextHistory, nextSquares],
        currentMove: nextHistory.length,
      });
    }
  };

  const connectToPeer = () => {
    if (!peer || !peerId) return;

    const connection = peer.connect(peerId);

    connection.on("open", () => {
      console.log("Connected to peer");
      setIsConnected(true);
      setConn(connection);
      setMyTurn(false);

    
      connection.send({ history: history, currentMove: currentMove });
    });

    connection.on("data", ({ history, currentMove }) => {
      setHistory(history);
      setCurrentMove(currentMove);
      setIsPlayerX(currentMove % 2 === 0); 

 
      setMyTurn(true); 
    });

    connection.on("close", () => {
      console.log("Connection closed");
      setIsConnected(false);
      setConn(null);
    });

    connection.on("error", (err) => {
      console.error("Connection error:", err);
      setIsConnected(false);
      setConn(null);
    });

    
    setConn(connection);
  };

  const currentSquares = history[currentMove];
  const winner = calculateWinner(currentSquares);
  const status = winner
    ? `${winner}`
    : `You are: ${isPlayerX ? "X" : "O"}`;

  return (
    <div className="game">
      <div className="game-board">
        <Board squares={currentSquares} onClick={handlePlay} />
      </div>
      <div className="game-info">
        <div>
          <h2>Peer ID: {peerId}</h2>
          <input
            type="text"
            value={peerId}
            onChange={(e) => setPeerId(e.target.value)}
            placeholder="Enter Peer ID"
          />
          <button onClick={connectToPeer}>Connect</button>
        </div>
        <div>{status}</div>
      </div>
    </div>
  );
}

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return 'Winner:' +squares[a];
    }
  }

  if (squares.every((square) => square)) return "Cat";

  return null;
}

export default Game;
