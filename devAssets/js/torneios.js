import Swal from 'sweetalert2';
import axios from 'axios';

// Delete Buttons
const deleteBtns = document.querySelectorAll('.btn-delete');
if(deleteBtns){
    deleteBtns.forEach((deleteBtn) => {
      const torneioId = deleteBtn.dataset.torneio;
      const row = deleteBtn.closest('tr');
      const designacao = row.querySelector('.torneio_designacao').textContent;
      const localidade = row.querySelector('.torneio_localidade').textContent;
      deleteBtn.addEventListener('click', async function (e) {
        e.preventDefault();

        const result = await Swal.fire({
          title: 'Tem a certeza?',
          html:
            'O <strong>' +
            designacao +
            ' (' +
            localidade +
            ")</strong> será eliminado!<br><p class='swal-apart'>Todas as Equipas, Jogos e Resultados serão eliminados!</p><p class='smallWarningText'>Esta acção não é reversível.</p>",
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Sim, eliminar!',
          confirmButtonColor: '#d9534f',
          cancelButtonText: 'Cancelar',
          reverseButtons: true,
        });

        if (result.value) {
          try {
            const response = await axios({
              method: 'DELETE',
              url: '/admin/torneios/deleteTorneio',
              data: {
                id: torneioId,
              },
            });

            if (response.data.success) {
              Swal.fire({
                icon: 'success',
                title: 'Torneio eliminado',
                showConfirmButton: false,
                timer: 1500,
                willClose: () => {
                  location.reload();
                },
              });
            } else {
              throw new Error();
            }
          } catch (err) {
            Swal.fire({
              icon: 'error',
              title: 'Não foi possível eliminar o torneio',
            });
          }
        }
      });
    });
}


// RESET BUTTONS
const resetButtons = document.querySelectorAll('.btn-faseReset');
if(resetButtons){
    resetButtons.forEach((btn) => {
      const escalaoId = parseInt(btn.dataset.escalao);
      const fase = parseInt(btn.dataset.fase);
      const designacao = btn.dataset.designacao;
      const torneioId = btn.dataset.torneio;
      btn.addEventListener('click', async function (e) {
        e.preventDefault();

        const result = await Swal.fire({
          title: 'Tem a certeza?',
          html:
            'A <strong>Fase ' +
            (fase != 100 ? fase : 'Final') +
            '</strong> do escalão <strong>' +
            designacao +
            '</strong> será eliminada!',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Sim, eliminar!',
          confirmButtonColor: '#d9534f',
          cancelButtonText: 'Cancelar',
          reverseButtons: true,
        });

        if (result.value) {
          try {
            const response = await axios({
              method: 'DELETE',
              url: '/admin/torneios/deleteFase',
              data: {
                torneioId,
                escalaoId,
                fase,
              },
            });

            if (response.data.success) {
              Swal.fire({
                icon: 'success',
                html: `<strong>Fase ${
                  response.data.fase != 100 ? response.data.fase : 'Final'
                }</strong> do escalão <strong>${designacao}</strong> eliminada`,
                showConfirmButton: false,
                timer: 1500,
                willClose: () => {
                  const url = `${window.location.protocol}//${window.location.hostname}:${window.location.port}/admin/torneios/editarTorneio/${torneioId}/3`;
                  window.location.assign(url);
                },
              });
            } else {
              throw new Error();
            }
          } catch (err) {
            Swal.fire({
              icon: 'error',
              title: 'Não foi possível eliminar a fase selecionada',
            });
          }
        }
      });
    });
}


// TAB CONTROLLER
function closeAllTabs(tabItems, tabContainers){
    tabItems.forEach((item, index) => {
        item.classList.remove('tabbedMenu__item-selected');
        tabContainers[index].classList.remove('tabbedContainer-open');
    });
}
const tabItems = document.querySelectorAll('.tabbedMenu__item');
const tabContainers = document.querySelectorAll('.tabbedContainer');
const actionBtnsBar = document.querySelector('.inputBtnBar');

tabItems.forEach((item, index) => {
    item.addEventListener('click', function(){
        closeAllTabs(tabItems, tabContainers);
        item.classList.add('tabbedMenu__item-selected');
        tabContainers[index].classList.add('tabbedContainer-open');
        if(index > 1){
            actionBtnsBar.classList.add('inputBtnBar--hide');
        } else {
            actionBtnsBar.classList.remove('inputBtnBar--hide');
        }
    });
});

// REINICIALIZAR TORNEIO
const resetBtn = document.querySelector('.ResetTorneio-btn');
if(resetBtn){
    resetBtn.addEventListener('click', async function(e){
        const torneioId = resetBtn.dataset.torneio;

        const result = await Swal.fire({
            title: 'Reinicializar o Torneio',
            html: "<strong>Tem a certeza?</strong><br><p class='swal-apart'>Todos os Jogos, Fases, Resultados e Distribuição de Equipas será elimiado</p><p class='smallWarningText'>Esta acção não é reversível.</p>",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sim, eliminar!',
            confirmButtonColor: '#d9534f',
            cancelButtonText: 'Cancelar',
            reverseButtons: true
        });

        if(result.value){
            try {
                const response = await axios({
                    method: 'DELETE',
                    url: '/admin/torneios/resetTorneio',
                    data: {
                        torneioId
                    }
                });

                if(response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Torneio reinicializado'
                    });
                } else {
                    throw new Error();
                }
                
            } catch(err) {
                console.log(err);
                Swal.fire({
                    icon: 'error',
                    title: 'Não foi possível reinicializar o torneio',
                });
            }
        }
    });
}

const deleteEquipasBtn = document.querySelector('.DeleteEquipasTorneio-btn');
if(deleteEquipasBtn){
    deleteEquipasBtn.addEventListener('click', async function(e){
        const torneioId = deleteEquipasBtn.dataset.torneio;

        const result = await Swal.fire({
            icon: 'question',
            title: 'Eliminar Equipas',
            html: "<strong>Tem a certeza?</strong><br><p class='swal-apart'>Todos as Equipas serão eliminadas</p><p class='smallWarningText'>Esta acção não é reversível.</p>",
            showCancelButton: true,
            confirmButtonText: 'Sim, eliminar!',
            confirmButtonColor: '#d9534f',
            cancelButtonText: 'Cancelar',
            reverseButtons: true
        });

        if(result.value){
            try {
                const response = await axios({
                    method: 'DELETE',
                    url: '/admin/torneios/deleteEquipas',
                    data: {
                        torneioId
                    }
                });

                if(response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Equipas Eliminadas'
                    });
                } else {
                    throw new Error();
                }
                
            } catch(err) {
                console.log(err);
                Swal.fire({
                    icon: 'error',
                    title: 'Não foi possível eliminar as equipas',
                });
            }
        }
    });
}