import React, { useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { $players, addPlayer } from '../store/gameStore';

/**
 * Handles one-time application initialization logic.
 * This pattern prevents duplicate initialization when components remount
 * and keeps the main UI components focused on presentation.
 */
const AppInitializer: React.FC = () => {
    const players = useStore($players);
    const initialized = useRef(false);

    useEffect(() => {
        // Prevent double-initialization in React.StrictMode
        if (initialized.current) return;
        
        // Init dev state if empty
        if (players.length === 0) {
            initialized.current = true;
            addPlayer('Alex');
            addPlayer('Sam');
            addPlayer('Jordan');
            addPlayer('Taylor');
        }
    }, [players.length]);

    return null; // This component renders nothing
};

export default AppInitializer;
