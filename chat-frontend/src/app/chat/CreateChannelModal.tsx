import { useState } from "react";

export default function createChannelModal ({ onClose, onChannelCreated }: any){
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleCreate = async () => {
        const res = await fetch('http://localhost:3000/channels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description }),
            });

        const data = await res.json();
        onChannelCreated(data)
    };

    return(
        <div className="modal">
            <div className="modal-content">
                <h3>Nuevo Canal</h3>
                <input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)}/>
                <input placeholder="Descripcion" value={description} onChange={(e) => setDescription(e.target.value)} />
                <div className="modal-buttons">
                    <button onClick={handleCreate}>Crear</button>
                    <button onClick={onClose}>Cancelar</button>
                </div>
            </div>
        </div>
    );
}