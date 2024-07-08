import { useState, useRef, useEffect } from "react";
import Client from "../components/Client";
import Editor from "../components/Editor";
import { initSocket } from "../socket";
import ACTIONS from "../Actions";
import { useLocation, useNavigate, Navigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

const EditorPage = () => {

    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const location = useLocation();
    const reactNavigator = useNavigate();
    const {roomId} = useParams();


    useEffect(() => {
        const init = async () => {
            socketRef.current = await initSocket();
            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));

            function handleErrors(e){
                console.log('socket error', e);
                toast.error('Socket connection failed, try again later.');
                reactNavigator('/');
            }

            socketRef.current.emit(ACTIONS.JOIN, {
                roomId, 
                username: location.state?.username,
            });

            //Listening for joined event
            socketRef.current.on(ACTIONS.JOINED, ({clients, username, socketId}) => {
                if (username !== location.state?.username){
                    toast.success(`${username} joined the room.`);
                }

                setClients(clients);
                socketRef.current.emit(ACTIONS.SYNC_CODE, {
                    code : codeRef.current,
                    socketId,
                });
            });

            //Listening for disconnected
            socketRef.current.on(ACTIONS.DISCONNECTED, ({socketId, username}) => {
                toast.success(`${username} left the room.`);
                setClients((prev) => {
                    return prev.filter(client => client.socketId !== socketId)
                });
            });
        }
        init();

        // if we return a function from inside of useEffect() in react, it is a cleaning function which is then run when the component unmounts!
        return () => {
            socketRef.current.off(ACTIONS.JOINED);
            socketRef.current.off(ACTIONS.DISCONNECTED);
            socketRef.current.disconnect(); // disconnet the socket connection in the end
        }
    }, []);


    const [clients, setClients] = useState([]);

    if(!location.state){
        return <Navigate to = "/"/>
    }

    async function copyRoomId(){
        try{
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID copied to the clipboard');
        }
        catch(err){
            toast.error('Could not copy ROOM ID');
        }
    }

    function leaveRoom() {
        reactNavigator('/');
    }

    return (  
        <div className="mainWrap">
            <div className="aside">
                <div className="asideInner">
                    <div className="logo">
                        <img className = "logoImage" src="/code-sync.png" alt="logo" />
                    </div>
                    <h3>Connected</h3>
                    <div className="clientsList">
                        {
                            clients.map(client => (<Client key = {client.socketId} username={client.username}/>))
                        }
                    </div>
                </div>
                <button className="btn copyBtn" onClick={copyRoomId}>Copy ROOM ID</button>
                <button className="btn leaveBtn" onClick={leaveRoom}>Leave</button>
            </div>
            <div className="editorWrap">
                <Editor socketRef = {socketRef} roomId = {roomId} onCodeChange = {(code) => codeRef.current = code}/>
            </div>
        </div>
    );
}
 
export default EditorPage;