import Swal from 'sweetalert2';
import axios from 'axios';

// SERVER PORT
const serverPortBtn = document.querySelector('.changeServerPort-btn');
if(serverPortBtn){
    const inputServerPort = document.getElementById('serverPort');
    const inputServerPortValue = parseInt(inputServerPort.value.trim());

    serverPortBtn.addEventListener('click', async function (e) {
      e.preventDefault();

      if (isNaN(inputServerPortValue)) {
        showError(inputServerPort, 'Porta inválida');
      } else {
        const response = await axios({
          method: 'PUT',
          url: '/admin/configuracoes/definirPorta',
          data: {
            serverPort: inputServerPortValue,
          },
        });

        if (response.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Porta do servidor alterada',
            showConfirmButton: true,
            willClose: () => {
              location.reload();
            },
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Não foi possível alterar a porta do servidor',
            showConfirmButton: true,
          });
        }
      }
    });
}


function showError(element, errorText){
    const parentElement = element.parentNode;

    const error = document.querySelector('.smallWarningText');
    if(!error){
        const errorElement = document.createElement('P');
        errorElement.classList.add('smallWarningText');
        errorElement.classList.add('rowError');
        errorElement.textContent = errorText;

        parentElement.insertBefore(errorElement, element);

        element.classList.add('inputError');
    }
}

// FAKER SWITCH BUTTON
const switchBtn = document.querySelectorAll('.btn-switch');
if(switchBtn){
    switchBtn.forEach((el, i) => {
        el.addEventListener('click', async function(e){
            const otherIndex = (i == 0) ? 1 : 0;
            const selectedClass = ['btn-switch-on--selected', 'btn-switch-off--selected'];

            const query = {
                method: 'PUT',
                url: '/admin/configuracoes/switchFaker'
            };

            if(e.target.classList.contains('btn-switch-on')){
                query.data = { faker: true };
            }

            if(e.target.classList.contains('btn-switch-off')){
                query.data = { faker: false };
            }

            const response = await axios(query);

            if(response.data.success){
                switchBtn[i].classList.add(selectedClass[i]);
                switchBtn[otherIndex].classList.remove(selectedClass[otherIndex]);
            }
        });
    });
}

// SYNC SWITCH BUTTON
const syncSwitchBtn = document.querySelectorAll('.btn-SyncSwitch');
if(syncSwitchBtn){
    syncSwitchBtn.forEach((el, i) => {
        el.addEventListener('click', async function(e){
            const otherIndex = (i == 0) ? 1 : 0;
            const selectedClass = ['btn-SyncSwitch-on--selected', 'btn-SyncSwitch-off--selected'];

            const query = {
                method: 'PUT',
                url: '/admin/configuracoes/switchSync'
            };

            if(e.target.classList.contains('btn-SyncSwitch-on')){
                query.data = { sync: true };
            }

            if(e.target.classList.contains('btn-SyncSwitch-off')){
                query.data = { sync: false };
            }

            const response = await axios(query);

            if(response.data.success){
                syncSwitchBtn[i].classList.add(selectedClass[i]);
                syncSwitchBtn[otherIndex].classList.remove(selectedClass[otherIndex]);
            }
        });
    });
}

// ENDERECO WEB
const enderecoWebBtn = document.querySelector('.changeEnderecoWeb-btn');
if(enderecoWebBtn){
    const enderecoWeb = document.getElementById('enderecoWeb');
    const enderecoWebValue = enderecoWeb.value.trim();
    enderecoWebBtn.addEventListener('click', async function(e){
        e.preventDefault();
        
        if(enderecoWebValue.length == 0 || !enderecoWebValue.startsWith('http://')){
            showError(enderecoWeb, 'Endereço Web inválido');
        } else {
            try {
                const response = await axios({
                    method: 'PUT',
                    url: '/admin/configuracoes/definirEnderecoWeb',
                    data: {
                        enderecoWeb: enderecoWebValue
                    }
                });

                if(response.data.success){
                    Swal.fire({
                      icon: 'success',
                      title: 'Endereço API guardado',
                      showConfirmButton: true,
                      willClose: () => {
                        location.reload();
                      },
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Não foi possível guardar o Endereço API'
                    });
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Não foi possível guardar o Endereço API'
                });
            }
        }
    });
}

const enderecoWebInput = document.getElementById('enderecoWeb');
const testConnectionBtn = document.querySelector('.testConnection__btn');
if(enderecoWebInput && testConnectionBtn){
    enderecoWebInput.addEventListener('keyup', function(){
        const url = enderecoWebInput.value.trim();
        if(url.length >= 10){
            if(url.startsWith('http://') || url.startsWith('https://')){
                testConnectionBtn.classList.add('testConnection__btn-show');
            } else {
                testConnectionBtn.classList.remove('testConnection__btn-show');
            }
        } else {
            // Esconde botão de testar ligação 
            testConnectionBtn.classList.remove('testConnection__btn-show');
        }
    });

    testConnectionBtn.addEventListener('click', async function(){
        let url = enderecoWebInput.value.trim();
        if(!url.endsWith('/')){
            url = url + '/';
        }

        testConnectionBtn.textContent = 'A testar...';

        try{
            
            const response = await axios.get(`${url}checkConnection.php?key=Avrd45h6DbfFfNe4dBBTA34hrb5dfb5eBdbAMR37ff2gd4fD`);
            if(response.data.sucesso){
                Swal.fire({
                  icon: 'success',
                  title: 'Ligação efectuada',
                  showConfirmButton: true,
                  willClose: () => {
                    location.reload();
                  },
                });
            }
        } catch(error) {
            Swal.fire({
                icon: 'error',
                title: 'Não foi possível estabelecer ligação'
            });
        }  
        
        testConnectionBtn.textContent = 'Testar Ligação';
    });
}