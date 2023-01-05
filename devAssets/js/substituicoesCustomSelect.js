import Swal from 'sweetalert2';
import axios from 'axios';

function closeAllCheckboxes(selectBoxesDropList, selectBoxes) {
  for (let i = 0; i < selectBoxesDropList.length; i++) {
    selectBoxes[i].classList.remove('customSelect__header-open');
    selectBoxesDropList[i].classList.remove('customSelect__list-open');
  }
}

function unSelectAll(listItems) {
  listItems.forEach((listItem) => {
    listItem.classList.remove('customSelect__links-selected');
  });
}

function createLoading() {
  const loadingWrapper = document.createElement('DIV');
  loadingWrapper.classList.add('loading__wrapper');

  const loadingDiv = document.createElement('DIV');
  loadingDiv.classList.add('loading');

  const bounce1Div = document.createElement('DIV');
  bounce1Div.classList.add('bounce1');
  const bounce2Div = document.createElement('DIV');
  bounce2Div.classList.add('bounce2');
  const bounce3Div = document.createElement('DIV');
  bounce3Div.classList.add('bounce3');

  loadingWrapper.appendChild(loadingDiv);

  loadingDiv.appendChild(bounce1Div);
  loadingDiv.appendChild(bounce2Div);
  loadingDiv.appendChild(bounce3Div);

  return loadingWrapper;
}

function generateEquipa(equipa, escalaoId) {
  const equipaWrapper = document.createElement('DIV');
  equipaWrapper.classList.add('substituicao__equipa');
  equipaWrapper.setAttribute('data-equipaid', equipa.equipaId);
  equipaWrapper.setAttribute('data-escalaoid', escalaoId);
  equipaWrapper.setAttribute('data-jogoid', equipa.jogoId);


  const equipaID = document.createElement('DIV');
  equipaID.classList.add('substituicao__equipa__id');
  equipaID.textContent = equipa.equipaId;

  const elementosWrapper = document.createElement('DIV');
  elementosWrapper.classList.add('substituicao__equipa_elementos');

  const primeiroElmento = document.createElement('DIV');
  primeiroElmento.classList.add('substituicao_equipa__elemento');
  primeiroElmento.textContent = equipa.primeiroElemento;

  const segundoElemento = document.createElement('DIV');
  segundoElemento.classList.add('substituicao_equipa__elemento');
  segundoElemento.textContent = equipa.segundoElemento;

  elementosWrapper.appendChild(primeiroElmento);
  elementosWrapper.appendChild(segundoElemento);

  const equipaLocalidade = document.createElement('DIV');
  equipaLocalidade.classList.add('substituicao__equipa__localidade');
  equipaLocalidade.textContent = equipa.localidade;

  equipaWrapper.appendChild(equipaID);
  equipaWrapper.appendChild(elementosWrapper);
  equipaWrapper.appendChild(equipaLocalidade);

  return equipaWrapper;
}

// SELECTBOXES
const selectBoxes = document.querySelectorAll('.customSelect__header');
const selectBoxesDropList = document.querySelectorAll('.customSelect__list');
const equipasSubstituirBox = document.querySelector('.lista__equipas__substituir');
const equipasColocarBox = document.querySelector('.lista__equipas__colocar');
selectBoxes.forEach((selectBox, index) => {
  selectBox.addEventListener('click', function (e) {
    e.stopPropagation();

    if (selectBoxesDropList[index].classList.contains('customSelect__list-open')) {
      this.classList.remove('customSelect__header-open');
      selectBoxesDropList[index].classList.remove('customSelect__list-open');
    } else {
      closeAllCheckboxes(selectBoxesDropList, selectBoxes);
      this.classList.add('customSelect__header-open');
      const windowHeight = window.innerHeight;
      selectBoxesDropList[index].classList.add('customSelect__list-open');
      const listSelectDimensions =
        selectBoxesDropList[index].getBoundingClientRect();

      if (windowHeight - listSelectDimensions.top < listSelectDimensions.height) {
        selectBoxesDropList[index].style.top =
          (listSelectDimensions.height + 7) * -1 + 'px';
      }
    }
  });

  const listItems = selectBoxesDropList[index].querySelectorAll('.customSelect__links');
  const substituicaoFase = document.querySelector('.substituicao__fase');

  if (listItems && listItems.length > 0) {
    console.log("Aqui");
    listItems.forEach((listItem) => {
      const designacao = listItem.dataset.designacao;
      const sexo = listItem.dataset.sexo;
      const escalaoId = listItem.dataset.escalaoid;
      const fase = listItem.dataset.fase;

      listItem.addEventListener('click', async function (e) {
        e.preventDefault();
        unSelectAll(listItems);
        this.classList.add('customSelect__links-selected');
        selectBox.innerHTML = `<strong>${designacao}</strong> <small>(${sexo})</small>`;
        selectBox.classList.add('customSelect__header-selected');

        if (substituicaoFase) {
          const faseText = (fase != 100) ? `${fase}ª Fase` : 'Fase Final';
          substituicaoFase.textContent = faseText;
        }

        equipasSubstituirBox.innerHTML = "";
        equipasSubstituirBox.appendChild(createLoading());
        equipasColocarBox.innerHTML = "";
        equipasColocarBox.appendChild(createLoading());

        const response = await axios.get(`/admin/torneios/getAllEquipas/escalao/${escalaoId}/fase/${fase}`);

        if (response.data.success) {
          equipasSubstituirBox.innerHTML = '';
          response.data.equipasASubstituir.forEach((equipa) => {
            equipasSubstituirBox.appendChild(generateEquipa(equipa, escalaoId));
          });

          equipasColocarBox.innerHTML = '';
          response.data.equipasAColocar.forEach((equipa) => {
            equipasColocarBox.appendChild(generateEquipa(equipa, escalaoId));
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Não foi possível obter as equipas',
          });
        }
      });
    });
  }
});

function clearAllSelectedEquipas(listaEquipas) {
  listaEquipas.forEach((equipa) => {
    equipa.classList.remove('substituicao__equipa--selected');
  });
}

function selectEquipa(equipa, topParent) {
  const parent = equipa.closest('.substituicao__equipa');
  if (parent) {
    parent.classList.add('substituicao__equipa--selected');
  }

  const equipaId = parent.dataset.equipaid;
  const escalaoId = parent.dataset.escalaoid;
  const jogoId = parent.dataset.jogoid;

  topParent.setAttribute('data-equipaid', equipaId);
  topParent.setAttribute('data-escalaoid', escalaoId);
  topParent.setAttribute('data-jogoid', jogoId);
}

const listaEquipasSubstituirParent = document.querySelector('.lista__equipas__substituir');
if (listaEquipasSubstituirParent) {

  listaEquipasSubstituirParent.addEventListener('click', function (e) {
    const listaEquipas = listaEquipasSubstituirParent.querySelectorAll('.substituicao__equipa');
    if (listaEquipas && listaEquipas.length > 0) {
      clearAllSelectedEquipas(listaEquipas);
      selectEquipa(e.target, listaEquipasSubstituirParent);
    }
  });
}

const listaEquipasColocarParent = document.querySelector('.lista__equipas__colocar');
if (listaEquipasColocarParent) {

  listaEquipasColocarParent.addEventListener('click', function (e) {
    const listaEquipas = listaEquipasColocarParent.querySelectorAll('.substituicao__equipa');
    if (listaEquipas && listaEquipas.length > 0) {
      clearAllSelectedEquipas(listaEquipas);
      selectEquipa(e.target, listaEquipasColocarParent);
    }
  });
}

const substituirBtn = document.querySelector('.substituirBtn');
if (substituirBtn) {
  substituirBtn.addEventListener('click', async function (e) {
    e.preventDefault();
    const _listaEquipasSubstituirParent = document.querySelector('.lista__equipas__substituir');
    const jogoId = _listaEquipasSubstituirParent.dataset.jogoid;
    const equipaIdSubstituir = _listaEquipasSubstituirParent.dataset.equipaid;
    const escalaoId = _listaEquipasSubstituirParent.dataset.escalaoid;

    const _listaEquipasColocarParent = document.querySelector('.lista__equipas__colocar');
    const equipaIdColocar = _listaEquipasColocarParent.dataset.equipaid;

    if (!jogoId || !equipaIdSubstituir || !escalaoId) {
      Swal.fire({
        icon: 'info',
        title: 'Deve selecionar a equipa a substituir',
      });
    } else if (!equipaIdColocar) {
      Swal.fire({
        icon: 'info',
        title: 'Deve selecionar a equipa a colocar',
      });
    } else {
      const response = await axios.post('/admin/torneios/substituirEquipas', {
        jogoId: jogoId,
        equipaIdSubstituir: equipaIdSubstituir,
        equipaIdColocar: equipaIdColocar,
        escalaoId: escalaoId
      });

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Equipas Substituídas',
          showConfirmButton: false,
          timer: 1500,
          willClose: () => {
            location.reload();
          },
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Não foi possível substituir as equipas',
        });
      }
    }
  });
}

document.addEventListener('click', function () {
  closeAllCheckboxes(selectBoxesDropList, selectBoxes);
});
