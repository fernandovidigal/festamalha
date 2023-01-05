import Swal from 'sweetalert2';
import axios from 'axios';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { docDefinition, makeHeaderOnlyTorneioInfo, makeEquipasContent, makeFooter } from './printFunctions';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

async function showDeleteMessage(equipa) {
  const result = await Swal.fire({
    title: 'Deseja eliminar a equipa?',
    html: `
            <div class="deleteTeam">
                <p>${equipa.equipaId}</p>
                <div class="deleteTeam__elementos">
                    <p>${equipa.primeiroElemento}</p>
                    <p>${equipa.segundoElemento}</p>
                </div>
                <p>${equipa.localidade}</p>
                <p>${equipa.escalao}<br><small>(${equipa.sexo == 1 ? 'Masculino' : 'Feminino'})</small></p>
            </div>`,
    icon: 'question',
    customClass: 'swal-wide',
    showCancelButton: true,
    confirmButtonText: 'Sim, eliminar!',
    confirmButtonColor: '#d9534f',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
  });

  if (result.value) {
    try {
      const response = await axios({
        method: 'DELETE',
        url: '/equipas/eliminarEquipa',
        data: {
          torneioId: equipa.torneioId,
          equipaId: equipa.equipaId,
          escalaoId: equipa.escalaoId,
        },
      });

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Equipa eliminada',
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
        title: 'Não foi possível eliminar a equipa',
      });
    }
  }
}

async function imprimeListaEquipas(localidade, escalao) {
  try {
    const response = await axios(`/equipas/listagem/${localidade}/${escalao}`);
    const data = response.data;

    docDefinition.content = [];
    delete docDefinition.pageBreakBefore;
    docDefinition.pageMargins = [15, 80, 15, 25];

    if (data.success) {
      makeHeaderOnlyTorneioInfo(docDefinition, data.torneio);
      makeEquipasContent(docDefinition, data);
      makeFooter(docDefinition, `Lista de Equipas${data.hasOwnProperty('localidade') ? ' - ' + data.localidade.nome : ''}${data.hasOwnProperty('escalao') ? ' - ' + data.escalao.designacao + ' (' + (data.escalao.sexo == 1 ? 'Masculino' : 'Feminino') + ')' : ''}`);
      pdfMake.createPdf(docDefinition).print();
    } else {
      Swal.fire({
        icon: data.errType,
        title: data.errMsg,
      });
    }
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Não foi possível obter dados da equipa',
    });
  }
}

// Delete Buttons
const deleteBtns = document.querySelectorAll('.btn-delete');
if (deleteBtns) {
  deleteBtns.forEach((deleteBtn) => {
    const equipaId = deleteBtn.dataset.equipa;
    const escalaoId = deleteBtn.dataset.escalao;
    deleteBtn.addEventListener('click', async function (e) {
      e.preventDefault();
      try {
        const response = await axios({
          method: 'GET',
          url: `/equipas/eliminarEquipa/${equipaId}/${escalaoId}`,
        });

        const equipa = response.data.equipa;
        showDeleteMessage(equipa);
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Não foi possível eliminar a equipa',
        });
      }
    });
  });
}

// Print Button
const printBtn = document.querySelector('.btn-print');
if (printBtn) {
  printBtn.addEventListener('click', function (e) {
    e.preventDefault();
    try {
      const path = window.location.pathname;
      const pathComponents = path.split('/');

      let localidadeIndex = pathComponents.indexOf('localidade');
      let escalaoIndex = pathComponents.indexOf('escalao');
      localidadeIndex = localidadeIndex != -1 ? pathComponents[localidadeIndex + 1] : 0;
      escalaoIndex = escalaoIndex != -1 ? pathComponents[escalaoIndex + 1] : 0;

      imprimeListaEquipas(localidadeIndex, escalaoIndex);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Não foi possível gerar PDF',
      });
    }
  });
}

// TAB CONTROLLER
function closeAllTabs(tabItems, tabContainers) {
  tabItems.forEach((item, index) => {
    item.classList.remove('tabbedMenu__item-selected');
    tabContainers[index].classList.remove('tabbedContainer-open');
  });
}
const tabItems = document.querySelectorAll('.tabbedMenu__item');
const tabContainers = document.querySelectorAll('.tabbedContainer');
const actionBtnsBar = document.querySelector('.inputBtnBar');
if (tabItems && tabContainers) {
  tabItems.forEach((item, index) => {
    item.addEventListener('click', function () {
      closeAllTabs(tabItems, tabContainers);
      item.classList.add('tabbedMenu__item-selected');
      tabContainers[index].classList.add('tabbedContainer-open');
      if (index == 1) {
        actionBtnsBar.classList.add('inputBtnBar--hide');
      } else {
        actionBtnsBar.classList.remove('inputBtnBar--hide');
      }
    });
  });
}

// LOCALIDADES DROP BOX
const listaLocalidades = document.querySelectorAll('.adicionarEquipaLocalidadesSelect__list > a');
const localidadeInput = document.getElementsByName('localidade');
const localidadesSelectHeader = document.querySelector('.adicionarEquipaLocalidadesSelect__header');
if (listaLocalidades && localidadeInput && localidadesSelectHeader) {
  listaLocalidades.forEach((localidade) => {
    localidade.addEventListener('click', function (e) {
      const localidadeId = parseInt(localidade.dataset.localidade);
      const nomeLocalidade = localidade.textContent;
      localidadeInput[0].value = localidadeId;
      localidadesSelectHeader.textContent = nomeLocalidade;
    });
  });
}

// SHOW OVERLAY
const eyeBtn = document.querySelectorAll('.loginForm__showPassword--btn');
const percursoJogos = document.querySelectorAll('.percursoJogos');

const overlay = document.querySelector('.overlay');
const overlayWrapper = document.querySelector('.overlayContainer__wrapper');
const overlayContent = document.querySelector('.overlayContent');
const overlayCloseBtn = document.querySelector('.overlayContainer__close');
if (eyeBtn && percursoJogos && overlayContent && overlay) {
  eyeBtn.forEach((el, index) => {
    el.addEventListener('click', function (e) {
      const content = percursoJogos[index].innerHTML;
      overlayContent.innerHTML = '';
      overlayContent.innerHTML = content;
      overlay.classList.toggle('overlay-show');
    });
  });
}

if (overlayWrapper) {
  overlayWrapper.addEventListener('click', function (e) {
    e.stopPropagation();
  });
}

function closeOverlay() {
  overlay.classList.remove('overlay-show');
}

if (overlay) {
  overlay.addEventListener('click', closeOverlay);
}

if (overlayCloseBtn) {
  overlayCloseBtn.addEventListener('click', closeOverlay);
}

const fakeGenerator = document.querySelector('.btn-fakerGenerator');
if (fakeGenerator) {
  fakeGenerator.addEventListener('click', async function (e) {
    const response = await axios.get('/equipas/escaloes');
    let escalaoMasculinos = '<p class="inputSectionTitle">Masculinos</p>';
    let escalaoFemininos = '<p class="inputSectionTitle">Femininos</p>';
    for (const escalao of response.data.escaloes) {
      if (escalao.sexo == 1) {
        escalaoMasculinos += `<label><input type="radio" name="escalao" id="swal-input2" value="${escalao.escalaoId}" class="swal2-radio">${escalao.designacao}</label>`;
      } else {
        escalaoFemininos += `<label><input type="radio" name="escalao" id="swal-input2" value="${escalao.escalaoId}" class="swal2-radio">${escalao.designacao}</label>`;
      }
    }

    const { value: formValues } = await Swal.fire({
      title: 'Gerar Equipas Aleatóriamente',
      html:
        '<div class="formInput__wrapper swal__inputWrapper">' +
        '<label for="swal-input" class="inputLabel">Número de Equipas</label><input type="number" name="numEquipas" id="swal-input" value="0">' +
        '</div>' +
        '<div class="formInput__wrapper">' +
        '<label for="swal-input1" class="inputLabel">Escalão</label>' +
        (response.data.todos ? '<label><input type="radio" name="escalao" id="swal-input2" value="0" class="swal2-radio" checked>Todos os escalões</label>' : '') +
        '<div class="swal__two-cols">' +
        '<div class="swal__col">' +
        escalaoMasculinos +
        '</div>' +
        '<div class="swal__col">' +
        escalaoFemininos +
        '</div>' +
        '</div>' +
        '</div>',

      showCancelButton: true,
      confirmButtonText: 'Gerar Equipas',
      confirmButtonColor: '#d9534f',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      preConfirm: () => {
        const equipas = document.getElementById('swal-input').value;
        const escalao = document.querySelector('input[name=escalao]:checked').value;
        if (!equipas || equipas == '' || equipas <= '0') Swal.showValidationMessage('Número de equipas inválido');

        return {
          equipas,
          escalao,
        };
      },
    });
    if (formValues) {
      let url = `/equipas/faker/${formValues.equipas}`;
      if (formValues.escalao && formValues.escalao != '0') {
        url += `/${formValues.escalao}`;
      }

      Swal.fire({
        title: 'A gerar equipas',
        allowEscapeKey: false,
        allowOutsideClick: false,
        showCancelButton: false,
        showConfirmButton: false,
        showCancelButton: false,
        willOpen: () => {
          Swal.showLoading();
        },
        allowOutsideClick: () => !Swal.isLoading(),
      });

      await axios.post(url);
      location.reload();
    }
  });
}
