import React, { useEffect, useState } from 'react';
import { sceneState } from './scene/SceneState';

export default function Subtitles() {
  const [logs, setLogs] = useState([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let fadeTimeout;

    const handleUpdate = () => {
      // Get the latest logs
      const recentLogs = sceneState.chatLog.slice(-2);
      if (recentLogs.length > 0) {
        setLogs(recentLogs);
        setVisible(true);
        
        // Reset fade timeout
        clearTimeout(fadeTimeout);
        fadeTimeout = setTimeout(() => {
          setVisible(false);
        }, 10000); // Fade out after 10 seconds of silence
      }
    };

    const unsubscribe = sceneState.subscribe(handleUpdate);
    return () => {
      unsubscribe();
      clearTimeout(fadeTimeout);
    };
  }, []);

  if (logs.length === 0) return null;

  return (
    <div className={`subtitles-container ${visible ? 'visible' : 'hidden'}`}>
      <div className="subtitles-content">
        {logs.map((log, index) => (
          <div key={index} className={`subtitle-line ${log.role}`}>
            <span className="subtitle-speaker">{log.role === 'user' ? 'YOU:' : 'AEGIS:'}</span>
            <span className="subtitle-text">{log.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
