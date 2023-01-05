import Swal from 'sweetalert2';
import axios from 'axios';

const checkConnection = async () => {
    const connection = await axios.get('/checkConnection');
    if(connection.data.success){
        const conectionStatus = document.querySelector('.connectionStatus');
        const connectionStatusText = document.querySelector('.connectionStatus--text');
        if(conectionStatus && connectionStatusText){
            conectionStatus.classList.remove('noConnection');
            conectionStatus.classList.add('connection');
            connectionStatusText.textContent = 'Ligação activa';
        }
        return true;
    }

    return false;
}

const sync = document.querySelector('.syncData');
if(sync){
    (async () => {
        // Verifica a Ligação
        const connectionAlive = await checkConnection();
        
        if(connectionAlive) {
            Swal.fire({
                title: 'Sincronizar',
                text: 'A sincronizar dados com a plataforma Web. Aguarde!',
                imageUrl: '/imagens/loader.gif',
                imageWidth: 120,
                imageHeight: 120,
                imageAlt: 'Custom image',
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
            });

            const syncResponse = await axios.get('/syncData');
            if(syncResponse.data.success){
                Swal.fire({
                    icon: 'success',
                    title: 'Sincronização efectuada',
                    showConfirmButton: false,
                    timer: 1500
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Não foi possível efectuar a sincronização',
                });
            }
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Não existe conexão activa',
            });
        }
    })();
} else {
    (async () => {
        // Verifica a Ligação
        await checkConnection();
    })();
}